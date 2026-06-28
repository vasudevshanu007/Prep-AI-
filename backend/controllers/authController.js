const User = require('../models/User');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
} = require('../utils/helpers');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { OAuth2Client } = require('google-auth-library');
const crypto = require('crypto');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── Cookie helpers ───────────────────────────────────────────────────────────

const REFRESH_COOKIE = 'prepai_refresh';

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE, token, {
    httpOnly: true,                                        // not readable by JS
    secure: process.env.NODE_ENV === 'production',         // HTTPS-only in prod
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,                      // 7 days
    path: '/',                                             // accessible on all paths
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  });
};

// Build the user object sent to the client (never includes password)
const buildUserPayload = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  plan: user.plan,
  isEmailVerified: user.isEmailVerified,
  avatar: user.avatar,
  skills: user.skills,
  targetRole: user.targetRole,
  resumeUrl: user.resumeUrl,
  stats: user.stats,
  weakTopics: user.weakTopics,
});

// ─── Register ─────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const { name, email, password, skills, targetRole } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered.' });
    }

    const rawToken = generateRandomToken();
    const hashedVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    const user = await User.create({
      name, email, password,
      skills: skills || [],
      targetRole: targetRole || '',
      emailVerificationToken: hashedVerificationToken,
      emailVerificationExpire: Date.now() + 24 * 60 * 60 * 1000,
    });

    sendVerificationEmail(email, name, rawToken).catch((err) =>
      console.error('Verification email failed:', err.message)
    );

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please verify your email.',
      accessToken,
      user: buildUserPayload(user),
    });
  } catch (error) {
    next(error);
  }
};

// ─── Login ────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user || !user.password) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
    }

    // ── Streak calculation ──────────────────────────────────────────────────────
    const today    = new Date(); today.setHours(0, 0, 0, 0);
    const lastDate = user.stats.lastActiveDate ? new Date(user.stats.lastActiveDate) : null;
    if (lastDate) {
      const lastDay = new Date(lastDate); lastDay.setHours(0, 0, 0, 0);
      const diffDays = Math.round((today - lastDay) / 86400000);
      if (diffDays === 1)     user.stats.streak = (user.stats.streak || 0) + 1;
      else if (diffDays > 1)  user.stats.streak = 1;
      // diffDays === 0 → same day login, no streak change
    } else {
      user.stats.streak = 1;
    }
    user.stats.lastActiveDate = Date.now();

    // ── Login history (last 5) ─────────────────────────────────────────────────
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
    const ua = (req.headers['user-agent'] || '').substring(0, 200);
    user.loginHistory = [{ ip, userAgent: ua, createdAt: new Date() }, ...(user.loginHistory || [])].slice(0, 5);

    await user.save({ validateBeforeSave: false });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({ success: true, accessToken, user: buildUserPayload(user) });
  } catch (error) {
    next(error);
  }
};

// ─── Google OAuth ─────────────────────────────────────────────────────────────
const googleAuth = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: 'Google credential is required.' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { name, email, picture, sub: googleId } = ticket.getPayload();

    let user = await User.findOne({ $or: [{ email }, { googleId }] });

    if (!user) {
      user = await User.create({ name, email, googleId, avatar: picture, isEmailVerified: true });
    } else {
      user.googleId = googleId;
      user.avatar = picture || user.avatar;
      user.isEmailVerified = true;

      // Streak
      const today    = new Date(); today.setHours(0, 0, 0, 0);
      const lastDate = user.stats.lastActiveDate ? new Date(user.stats.lastActiveDate) : null;
      if (lastDate) {
        const lastDay = new Date(lastDate); lastDay.setHours(0, 0, 0, 0);
        const diffDays = Math.round((today - lastDay) / 86400000);
        if (diffDays === 1)    user.stats.streak = (user.stats.streak || 0) + 1;
        else if (diffDays > 1) user.stats.streak = 1;
      } else {
        user.stats.streak = 1;
      }
      user.stats.lastActiveDate = Date.now();

      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || '';
      const ua = (req.headers['user-agent'] || '').substring(0, 200);
      user.loginHistory = [{ ip, userAgent: ua, createdAt: new Date() }, ...(user.loginHistory || [])].slice(0, 5);

      await user.save({ validateBeforeSave: false });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({ success: true, accessToken, user: buildUserPayload(user) });
  } catch (error) {
    next(error);
  }
};

// ─── Refresh access token ─────────────────────────────────────────────────────
// Called automatically by the frontend when an access token expires.
// The httpOnly cookie carries the refresh token — no body needed.
const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      return res.status(401).json({ success: false, message: 'No refresh token.' });
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(token);
    } catch {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Invalid or expired session. Please log in again.' });
    }

    if (decoded.type !== 'refresh') {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Invalid token type.' });
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      clearRefreshCookie(res);
      return res.status(401).json({ success: false, message: 'Account not found or inactive.' });
    }

    // Rotate: issue a new refresh token on every use (prevents token replay)
    const newAccessToken = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, newRefreshToken);

    res.json({ success: true, accessToken: newAccessToken, user: buildUserPayload(user) });
  } catch (error) {
    next(error);
  }
};

// ─── Logout ───────────────────────────────────────────────────────────────────
const logout = (req, res) => {
  clearRefreshCookie(res);
  res.json({ success: true, message: 'Logged out successfully.' });
};

// ─── Email verification ───────────────────────────────────────────────────────
const verifyEmail = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    next(error);
  }
};

// ─── Forgot password ──────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    }

    const resetToken = generateRandomToken();
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 60 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await sendPasswordResetEmail(user.email, user.name, resetToken);
      res.json({ success: true, message: 'If that email is registered, a reset link has been sent.' });
    } catch (emailError) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      const err = new Error('Email could not be sent');
      err.status = 500;
      next(err);
    }
  } catch (error) {
    next(error);
  }
};

// ─── Reset password ───────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token.' });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log the user in immediately after reset
    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    setRefreshCookie(res, refreshToken);

    res.json({ success: true, message: 'Password reset successful.', accessToken });
  } catch (error) {
    next(error);
  }
};

// ─── Get current user ─────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// ─── Update profile ───────────────────────────────────────────────────────────
const updateProfile = async (req, res, next) => {
  try {
    const { name, skills, targetRole } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, skills, targetRole },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register, login, googleAuth,
  refresh, logout,
  verifyEmail, forgotPassword, resetPassword,
  getMe, updateProfile,
};
