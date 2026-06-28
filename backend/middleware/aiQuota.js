const User = require('../models/User');

const DAILY_QUOTAS = { free: 20, pro: 100, enterprise: Infinity };

const aiQuota = async (req, res, next) => {
  // If protect middleware hasn't run yet (unauthenticated request), skip — protect will reject it
  if (!req.user?._id) return next();
  try {
    const user = await User.findById(req.user._id).select('plan stats.aiCallsToday stats.aiCallsDate');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });

    const plan  = user.plan || 'free';
    const quota = DAILY_QUOTAS[plan] ?? DAILY_QUOTAS.free;
    if (quota === Infinity) return next(); // enterprise — unlimited

    const today    = new Date().toDateString();
    const callDate = user.stats?.aiCallsDate ? new Date(user.stats.aiCallsDate).toDateString() : null;

    // New day — reset counter
    if (callDate !== today) {
      await User.findByIdAndUpdate(req.user._id, {
        'stats.aiCallsToday': 1,
        'stats.aiCallsDate':  new Date(),
      });
      return next();
    }

    const used = user.stats?.aiCallsToday || 0;
    if (used >= quota) {
      return res.status(429).json({
        success: false,
        message: `Daily AI limit reached (${quota} calls/day on ${plan} plan). Upgrade to Pro for more.`,
        quota,
        used,
        plan,
      });
    }

    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.aiCallsToday': 1 },
      'stats.aiCallsDate': new Date(),
    });

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = aiQuota;
