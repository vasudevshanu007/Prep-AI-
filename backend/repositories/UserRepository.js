const User = require('../models/User');

/**
 * UserRepository — all Mongoose calls for the User collection live here.
 * Controllers call this instead of touching the model directly.
 */
class UserRepository {
  findById(id, projection = '-password') {
    return User.findById(id).select(projection);
  }

  findByEmail(email, includePassword = false) {
    const q = User.findOne({ email });
    return includePassword ? q.select('+password') : q;
  }

  findByGoogleIdOrEmail(googleId, email) {
    return User.findOne({ $or: [{ email }, { googleId }] });
  }

  findByVerificationToken(hashedToken) {
    return User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });
  }

  findByResetToken(hashedToken) {
    return User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });
  }

  create(data) {
    return User.create(data);
  }

  updateById(id, update, options = { new: true, runValidators: true }) {
    return User.findByIdAndUpdate(id, update, options);
  }

  save(userDocument, opts = {}) {
    return userDocument.save(opts);
  }

  // Admin queries
  countStudents() {
    return User.countDocuments({ role: 'student' });
  }

  countActiveStudents(sinceMs = 7 * 24 * 60 * 60 * 1000) {
    return User.countDocuments({
      role: 'student',
      'stats.lastActiveDate': { $gte: new Date(Date.now() - sinceMs) },
    });
  }

  findStudentsPaginated({ skip, limit, searchQuery = {} }) {
    const query = { role: 'student', ...searchQuery };
    return Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-password'),
      User.countDocuments(query),
    ]);
  }

  monthlyRegistrationsAggregation() {
    return User.aggregate([
      { $group: { _id: { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 },
    ]);
  }

  topStudents(limit = 10) {
    return User.find({ role: 'student' })
      .sort({ 'stats.averageScore': -1 })
      .limit(limit)
      .select('name email stats.averageScore stats.totalInterviews stats.xp');
  }
}

module.exports = new UserRepository();
