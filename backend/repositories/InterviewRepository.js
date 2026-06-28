const Interview = require('../models/Interview');
const mongoose = require('mongoose');

class InterviewRepository {
  create(data) {
    return Interview.create(data);
  }

  findByIdAndOwner(id, userId) {
    return Interview.findOne({ _id: id, userId });
  }

  findById(id) {
    return Interview.findById(id);
  }

  findPaginatedByUser(userId, { skip, limit }) {
    return Promise.all([
      Interview.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-questions.expectedAnswer'),
      Interview.countDocuments({ userId }),
    ]);
  }

  save(doc, opts = {}) {
    return doc.save(opts);
  }

  // Returns { avg, total } for completed interviews of a user
  async averageScoreAgg(userId) {
    const result = await Interview.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$overallScore' }, total: { $sum: 1 } } },
    ]);
    return { avg: result[0]?.avg || 0, total: result[0]?.total || 0 };
  }

  skillPerformanceAgg(userId) {
    return Interview.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $unwind: '$skills' },
      { $group: { _id: '$skills', avgScore: { $avg: '$overallScore' }, count: { $sum: 1 } } },
      { $sort: { avgScore: -1 } },
      { $limit: 10 },
      { $project: { skill: '$_id', avgScore: { $round: ['$avgScore', 1] }, count: 1, _id: 0 } },
    ]);
  }

  difficultyDistributionAgg(userId) {
    return Interview.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
    ]);
  }

  typeBreakdownAgg(userId) {
    return Interview.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      { $group: { _id: '$interviewType', count: { $sum: 1 } } },
    ]);
  }

  monthlyTrendAgg(userId) {
    return Interview.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), status: 'completed' } },
      {
        $group: {
          _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          count: { $sum: 1 },
          avgScore: { $avg: '$overallScore' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);
  }

  recentCompleted(userId, limit = 5) {
    return Interview.find({ userId, status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('role overallScore createdAt');
  }

  countCompleted() {
    return Interview.countDocuments({ status: 'completed' });
  }
}

module.exports = new InterviewRepository();
