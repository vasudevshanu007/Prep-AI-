const Interview = require('../models/Interview');
const CodingTest = require('../models/CodingTest');
const User = require('../models/User');
const mongoose = require('mongoose');

// @route GET /api/analytics/dashboard
const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const [user, scoreTrend, skillAgg, langAgg, diffAgg, recentInterviews, recentCoding] =
      await Promise.all([
        User.findById(userId).select('stats weakTopics'),

        // Score trend — last 7 completed interviews
        Interview.find({ userId, status: 'completed' })
          .sort({ createdAt: -1 })
          .limit(7)
          .select('overallScore role createdAt'),

        // Skill performance via aggregation
        Interview.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
          { $unwind: '$skills' },
          {
            $group: {
              _id: '$skills',
              avgScore: { $avg: '$overallScore' },
              count: { $sum: 1 },
            },
          },
          { $sort: { avgScore: -1 } },
          { $limit: 10 },
          { $project: { skill: '$_id', avgScore: { $round: ['$avgScore', 1] }, count: 1, _id: 0 } },
        ]),

        // Coding language stats via aggregation
        CodingTest.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          {
            $group: {
              _id: '$language',
              count: { $sum: 1 },
              avgScore: { $avg: '$score' },
            },
          },
          { $project: { language: '$_id', count: 1, avgScore: { $round: ['$avgScore', 1] }, _id: 0 } },
        ]),

        // Difficulty distribution via aggregation
        Interview.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
          { $group: { _id: '$difficulty', count: { $sum: 1 } } },
        ]),

        // Recent interview activity
        Interview.find({ userId, status: 'completed' })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('role overallScore createdAt'),

        // Recent coding activity
        CodingTest.find({ userId })
          .sort({ createdAt: -1 })
          .limit(5)
          .select('problemTitle score createdAt'),
      ]);

    const difficultyDist = { easy: 0, medium: 0, hard: 0 };
    diffAgg.forEach(({ _id, count }) => {
      if (_id in difficultyDist) difficultyDist[_id] = count;
    });

    const recentActivity = [
      ...recentInterviews.map((i) => ({ type: 'interview', title: `${i.role} Interview`, score: i.overallScore, date: i.createdAt })),
      ...recentCoding.map((c) => ({ type: 'coding', title: c.problemTitle, score: c.score, date: c.createdAt })),
    ]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);

    res.json({
      success: true,
      stats: {
        totalInterviews: user.stats.totalInterviews,
        averageScore: user.stats.averageScore,
        totalCodingTests: user.stats.totalCodingTests,
        resumeScore: user.stats.resumeScore,
        streak: user.stats.streak,
        xp: user.stats.xp,
        badges: user.stats.badges,
        weakTopics: user.weakTopics,
      },
      scoreTrend: scoreTrend.reverse().map((i) => ({
        date: i.createdAt.toLocaleDateString(),
        score: i.overallScore,
        role: i.role,
      })),
      skillData: skillAgg,
      languageData: langAgg,
      difficultyDist,
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/analytics/interview-analysis
const getInterviewAnalysis = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user._id);

    const [typeBreakdownAgg, monthlyAgg] = await Promise.all([
      Interview.aggregate([
        { $match: { userId, status: 'completed' } },
        { $group: { _id: '$interviewType', count: { $sum: 1 } } },
      ]),

      Interview.aggregate([
        { $match: { userId, status: 'completed' } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
            avgScore: { $avg: '$overallScore' },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
        { $limit: 12 },
      ]),
    ]);

    const typeBreakdown = { technical: 0, hr: 0, mixed: 0, voice: 0 };
    typeBreakdownAgg.forEach(({ _id, count }) => {
      if (_id in typeBreakdown) typeBreakdown[_id] = count;
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrend = monthlyAgg.map(({ _id, count, avgScore }) => ({
      month: `${monthNames[_id.month - 1]} ${_id.year}`,
      count,
      avgScore: Math.round(avgScore * 10) / 10,
    }));

    res.json({ success: true, typeBreakdown, monthlyTrend });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats, getInterviewAnalysis };
