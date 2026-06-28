const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Short-lived access token — 15 minutes
const generateAccessToken = (id) =>
  jwt.sign({ id, type: 'access' }, process.env.JWT_SECRET, { expiresIn: '15m' });

// Long-lived refresh token — 7 days
// Uses a separate secret so a compromised access-token secret cannot forge refresh tokens
const getRefreshSecret = () =>
  process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + '_refresh';

const generateRefreshToken = (id) =>
  jwt.sign({ id, type: 'refresh' }, getRefreshSecret(), { expiresIn: '7d' });

const verifyRefreshToken = (token) =>
  jwt.verify(token, getRefreshSecret());

// Legacy alias — kept so any code still calling generateToken() continues to work
const generateToken = generateAccessToken;

const generateRandomToken = () => crypto.randomBytes(32).toString('hex');

const calculateAverageScore = (scores) => {
  if (!scores.length) return 0;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / scores.length) * 10) / 10;
};

const getScoreGrade = (score) => {
  if (score >= 9) return { grade: 'A+', label: 'Excellent', color: '#22c55e' };
  if (score >= 8) return { grade: 'A', label: 'Great', color: '#84cc16' };
  if (score >= 7) return { grade: 'B+', label: 'Good', color: '#eab308' };
  if (score >= 6) return { grade: 'B', label: 'Average', color: '#f97316' };
  if (score >= 5) return { grade: 'C', label: 'Below Average', color: '#ef4444' };
  return { grade: 'D', label: 'Needs Improvement', color: '#dc2626' };
};

const paginateResults = (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  return { skip, limit: parseInt(limit) };
};

module.exports = {
  generateToken,          // legacy alias
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateRandomToken,
  calculateAverageScore,
  getScoreGrade,
  paginateResults,
};
