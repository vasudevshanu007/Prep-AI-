const CodingTest = require('../models/CodingTest');
const mongoose = require('mongoose');

class CodingRepository {
  create(data) {
    return CodingTest.create(data);
  }

  findPaginatedByUser(userId, { skip, limit }) {
    return Promise.all([
      CodingTest.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-code -testCases'),
      CodingTest.countDocuments({ userId }),
    ]);
  }

  recentByUser(userId, limit = 5) {
    return CodingTest.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('problemTitle score createdAt');
  }

  languageStatsAgg(userId) {
    return CodingTest.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$language', count: { $sum: 1 }, avgScore: { $avg: '$score' } } },
      { $project: { language: '$_id', count: 1, avgScore: { $round: ['$avgScore', 1] }, _id: 0 } },
    ]);
  }

  count() {
    return CodingTest.countDocuments();
  }
}

module.exports = new CodingRepository();
