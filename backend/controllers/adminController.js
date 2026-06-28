const User = require('../models/User');
const Interview = require('../models/Interview');
const CodingTest = require('../models/CodingTest');
const AuditLog = require('../models/AuditLog');
const CodingProblem = require('../models/CodingProblem');
const mongoose = require('mongoose');
const logAudit = require('../utils/logAudit');

// ── Platform Stats ─────────────────────────────────────────────────────────────
// @route GET /api/admin/stats
const getAdminStats = async (req, res, next) => {
  try {
    const [totalUsers, activeUsers, totalInterviews, totalCodingTests, totalAdmins] =
      await Promise.all([
        User.countDocuments({ role: 'student' }),
        User.countDocuments({
          role: 'student',
          'stats.lastActiveDate': { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        }),
        Interview.countDocuments({ status: 'completed' }),
        CodingTest.countDocuments(),
        User.countDocuments({ role: 'admin' }),
      ]);

    const planDist = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);

    const monthlyRegs = await User.aggregate([
      { $match: { createdAt: { $gte: new Date(Date.now() - 365 * 86400000) } } },
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);

    const topStudents = await User.find({ role: 'student' })
      .sort({ 'stats.averageScore': -1 })
      .limit(10)
      .select('name email stats.averageScore stats.totalInterviews stats.xp plan');

    const plans = { free: 0, pro: 0, enterprise: 0 };
    planDist.forEach(({ _id, count }) => { if (_id in plans) plans[_id] = count; });

    res.json({
      success: true,
      stats: { totalUsers, activeUsers, totalInterviews, totalCodingTests, totalAdmins },
      planDistribution: plans,
      monthlyRegs,
      topStudents,
    });
  } catch (error) {
    next(error);
  }
};

// ── User List ──────────────────────────────────────────────────────────────────
// @route GET /api/admin/users?page&limit&search&status&plan&role
const getAllUsers = async (req, res, next) => {
  try {
    const page   = Math.max(1, parseInt(req.query.page) || 1);
    const limit  = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip   = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || '';  // 'active' | 'inactive' | ''
    const plan   = req.query.plan   || '';  // 'free' | 'pro' | 'enterprise' | ''
    const role   = req.query.role   || 'student'; // default: students only

    const query = {};
    if (role) query.role = role;
    if (status === 'active')   query.isActive = true;
    if (status === 'inactive') query.isActive = false;
    if (plan && ['free', 'pro', 'enterprise'].includes(plan)) query.plan = plan;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -resetPasswordToken -resetPasswordExpire -emailVerificationToken -emailVerificationExpire'),
      User.countDocuments(query),
    ]);

    res.json({
      success: true,
      users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ── Toggle Active ──────────────────────────────────────────────────────────────
// @route PATCH /api/admin/users/:id/toggle-active
const toggleUserActive = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot deactivate admin accounts.' });
    }

    const wasActive = user.isActive;
    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    await logAudit({
      req,
      action: wasActive ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
      targetId: user._id,
      targetModel: 'User',
      details: { name: user.name, email: user.email, isActive: user.isActive },
    });

    res.json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'}.`,
      user: { _id: user._id, isActive: user.isActive },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete User ────────────────────────────────────────────────────────────────
// @route DELETE /api/admin/users/:id
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.role === 'admin') {
      return res.status(403).json({ success: false, message: 'Cannot delete admin accounts.' });
    }
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot delete your own account.' });
    }

    // Cascade-delete user's interviews and coding tests
    await Promise.all([
      Interview.deleteMany({ userId: user._id }),
      CodingTest.deleteMany({ userId: user._id }),
      user.deleteOne(),
    ]);

    await logAudit({
      req,
      action: 'USER_DELETED',
      targetId: user._id,
      targetModel: 'User',
      details: { name: user.name, email: user.email },
    });

    res.json({ success: true, message: `User "${user.name}" and all their data deleted.` });
  } catch (error) {
    next(error);
  }
};

// ── Change User Role ───────────────────────────────────────────────────────────
// @route PATCH /api/admin/users/:id/role
const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role. Must be "student" or "admin".' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot change your own role.' });
    }

    const previousRole = user.role;
    user.role = role;
    await user.save({ validateBeforeSave: false });

    await logAudit({
      req,
      action: 'ROLE_CHANGED',
      targetId: user._id,
      targetModel: 'User',
      details: { name: user.name, email: user.email, from: previousRole, to: role },
    });

    res.json({ success: true, message: `Role changed to "${role}".`, user: { _id: user._id, role: user.role } });
  } catch (error) {
    next(error);
  }
};

// ── Change User Plan ───────────────────────────────────────────────────────────
// @route PATCH /api/admin/users/:id/plan
const changeUserPlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan. Must be free, pro, or enterprise.' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    const previousPlan = user.plan;
    user.plan = plan;
    await user.save({ validateBeforeSave: false });

    await logAudit({
      req,
      action: 'PLAN_CHANGED',
      targetId: user._id,
      targetModel: 'User',
      details: { name: user.name, email: user.email, from: previousPlan, to: plan },
    });

    res.json({ success: true, message: `Plan changed to "${plan}".`, user: { _id: user._id, plan: user.plan } });
  } catch (error) {
    next(error);
  }
};

// ── All Interviews (Admin) ─────────────────────────────────────────────────────
// @route GET /api/admin/interviews?page&limit&userId
const getAllInterviews = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const query = {};
    if (req.query.userId && mongoose.isValidObjectId(req.query.userId)) {
      query.userId = req.query.userId;
    }
    if (req.query.status) query.status = req.query.status;

    const [interviews, total] = await Promise.all([
      Interview.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-questions.expectedAnswer -questions.userAnswer -aiFeedback')
        .populate('userId', 'name email'),
      Interview.countDocuments(query),
    ]);

    res.json({
      success: true,
      interviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ── Delete Interview ───────────────────────────────────────────────────────────
// @route DELETE /api/admin/interviews/:id
const deleteInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findById(req.params.id);
    if (!interview) return res.status(404).json({ success: false, message: 'Interview not found.' });

    await interview.deleteOne();

    await logAudit({
      req,
      action: 'INTERVIEW_DELETED',
      targetId: interview._id,
      targetModel: 'Interview',
      details: { role: interview.role, userId: interview.userId },
    });

    res.json({ success: true, message: 'Interview deleted.' });
  } catch (error) {
    next(error);
  }
};

// ── Audit Logs ────────────────────────────────────────────────────────────────
// @route GET /api/admin/audit-logs?page&limit&action&adminId
const getAuditLogs = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
    const skip  = (page - 1) * limit;

    const query = {};
    if (req.query.action) query.action = req.query.action;
    if (req.query.adminId && mongoose.isValidObjectId(req.query.adminId)) {
      query.adminId = req.query.adminId;
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      AuditLog.countDocuments(query),
    ]);

    res.json({
      success: true,
      logs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// ── Platform Analytics ────────────────────────────────────────────────────────
// @route GET /api/admin/analytics
const getPlatformAnalytics = async (req, res, next) => {
  try {
    const days = Math.min(90, parseInt(req.query.days) || 30);
    const since = new Date(Date.now() - days * 86400000);

    const [
      dauData,
      interviewTrend,
      codingTrend,
      topWeakTopics,
      langDist,
      planDist,
      completionRate,
    ] = await Promise.all([
      // Daily active users
      User.aggregate([
        { $match: { 'stats.lastActiveDate': { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$stats.lastActiveDate' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
        { $limit: 90 },
      ]),

      // Interview creation trend
      Interview.aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            created: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ]),

      // Coding submissions trend
      CodingTest.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),

      // Top weak topics across all users
      User.aggregate([
        { $match: { role: 'student', weakTopics: { $ne: [] } } },
        { $unwind: '$weakTopics' },
        { $group: { _id: '$weakTopics', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),

      // Coding language distribution
      CodingTest.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
        { $sort: { count: -1 } },
      ]),

      // Plan distribution
      User.aggregate([
        { $match: { role: 'student' } },
        { $group: { _id: '$plan', count: { $sum: 1 } } },
      ]),

      // Interview completion rate
      Interview.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    const completionMap = {};
    completionRate.forEach(({ _id, count }) => { completionMap[_id] = count; });
    const totalInterviews = Object.values(completionMap).reduce((a, b) => a + b, 0);
    const completedCount  = completionMap.completed || 0;

    res.json({
      success: true,
      period: `${days} days`,
      dau: dauData,
      interviewTrend,
      codingTrend,
      topWeakTopics,
      languageDistribution: langDist,
      planDistribution: planDist,
      completionRate: totalInterviews > 0 ? Math.round((completedCount / totalInterviews) * 100) : 0,
    });
  } catch (error) {
    next(error);
  }
};

// ── Coding Problem CRUD ────────────────────────────────────────────────────────

// @route GET /api/admin/coding-problems
const getCodingProblems = async (req, res, next) => {
  try {
    const problems = await CodingProblem.find()
      .sort({ difficulty: 1, createdAt: -1 })
      .populate('createdBy', 'name email');
    res.json({ success: true, problems });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/admin/coding-problems
const createCodingProblem = async (req, res, next) => {
  try {
    const { title, description, difficulty, topic, testCases } = req.body;
    const problem = await CodingProblem.create({
      title, description, difficulty, topic, testCases,
      createdBy: req.user._id,
    });

    await logAudit({
      req,
      action: 'CODING_PROBLEM_CREATED',
      targetId: problem._id,
      targetModel: 'CodingProblem',
      details: { title, difficulty, topic },
    });

    res.status(201).json({ success: true, problem });
  } catch (error) {
    next(error);
  }
};

// @route PUT /api/admin/coding-problems/:id
const updateCodingProblem = async (req, res, next) => {
  try {
    const { title, description, difficulty, topic, testCases, isActive } = req.body;
    const problem = await CodingProblem.findByIdAndUpdate(
      req.params.id,
      { title, description, difficulty, topic, testCases, isActive },
      { new: true, runValidators: true }
    );
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

    await logAudit({
      req,
      action: 'CODING_PROBLEM_UPDATED',
      targetId: problem._id,
      targetModel: 'CodingProblem',
      details: { title: problem.title },
    });

    res.json({ success: true, problem });
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/admin/coding-problems/:id
const deleteCodingProblem = async (req, res, next) => {
  try {
    const problem = await CodingProblem.findById(req.params.id);
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

    await problem.deleteOne();

    await logAudit({
      req,
      action: 'CODING_PROBLEM_DELETED',
      targetId: problem._id,
      targetModel: 'CodingProblem',
      details: { title: problem.title },
    });

    res.json({ success: true, message: 'Problem deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdminStats,
  getAllUsers,
  toggleUserActive,
  deleteUser,
  changeUserRole,
  changeUserPlan,
  getAllInterviews,
  deleteInterview,
  getAuditLogs,
  getPlatformAnalytics,
  getCodingProblems,
  createCodingProblem,
  updateCodingProblem,
  deleteCodingProblem,
};
