const { body, query, param, validationResult } = require('express-validator');

// ─── Result checker ──────────────────────────────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .matches(/^[a-zA-Z\s''-]+$/).withMessage('Name may only contain letters, spaces, hyphens, and apostrophes'),

  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 254 }).withMessage('Email is too long'),

  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .isLength({ max: 128 }).withMessage('Password cannot exceed 128 characters'),

  body('skills')
    .optional()
    .isArray({ max: 20 }).withMessage('Skills must be an array with at most 20 items'),

  body('skills.*')
    .optional()
    .isString().withMessage('Each skill must be a string')
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Each skill must be 1–50 characters')
    .escape(),

  body('targetRole')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Target role cannot exceed 100 characters')
    .escape(),
];

const loginRules = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ max: 128 }).withMessage('Invalid credentials'),
];

const forgotPasswordRules = [
  body('email')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),
];

const resetPasswordRules = [
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .isLength({ max: 128 }).withMessage('Password cannot exceed 128 characters'),
];

const updateProfileRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
    .matches(/^[a-zA-Z\s''-]+$/).withMessage('Name may only contain letters, spaces, hyphens, and apostrophes'),

  body('skills')
    .optional()
    .isArray({ max: 20 }).withMessage('Skills must be an array with at most 20 items'),

  body('skills.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Each skill must be 1–50 characters')
    .escape(),

  body('targetRole')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Target role cannot exceed 100 characters')
    .escape(),
];

// ─── Interview ────────────────────────────────────────────────────────────────
const generateInterviewRules = [
  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isLength({ min: 2, max: 100 }).withMessage('Role must be 2–100 characters')
    .matches(/^[a-zA-Z0-9\s/().,&+'#-]+$/).withMessage('Role contains invalid characters'),

  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard']).withMessage('Difficulty must be easy, medium, or hard'),

  body('count')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Question count must be between 1 and 20'),

  body('interviewType')
    .optional()
    .isIn(['technical', 'hr', 'mixed', 'voice']).withMessage('Invalid interview type'),

  body('skills')
    .optional()
    .isArray({ max: 10 }).withMessage('Skills must be an array with at most 10 items'),

  body('skills.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 1, max: 50 }).withMessage('Each skill must be 1–50 characters')
    .escape(),
];

const submitAnswerRules = [
  body('questionIndex')
    .isInt({ min: 0 }).withMessage('Question index must be a non-negative integer'),

  body('userAnswer')
    .trim()
    .notEmpty().withMessage('Answer is required')
    .isLength({ max: 5000 }).withMessage('Answer cannot exceed 5000 characters'),

  body('timeSpent')
    .optional()
    .isInt({ min: 0, max: 3600 }).withMessage('Time spent must be between 0 and 3600 seconds'),
];

const chatRules = [
  body('userMessage')
    .trim()
    .notEmpty().withMessage('Message is required')
    .isLength({ max: 1000 }).withMessage('Message cannot exceed 1000 characters'),

  body('role')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Role cannot exceed 100 characters'),

  body('conversationHistory')
    .optional()
    .isArray({ max: 20 }).withMessage('Conversation history cannot exceed 20 messages'),

  body('questionIndex')
    .optional()
    .isInt({ min: 0 }).withMessage('Question index must be a non-negative integer'),
];

// ─── Coding ───────────────────────────────────────────────────────────────────
const runCodeRules = [
  body('code')
    .notEmpty().withMessage('Code is required')
    .isLength({ max: 50000 }).withMessage('Code cannot exceed 50 000 characters'),

  body('language')
    .notEmpty().withMessage('Language is required')
    .isIn(['javascript', 'python', 'java', 'cpp', 'c', 'typescript'])
    .withMessage('Unsupported language'),

  body('input')
    .optional()
    .isLength({ max: 10000 }).withMessage('Input cannot exceed 10 000 characters'),
];

const submitCodeRules = [
  body('code')
    .notEmpty().withMessage('Code is required')
    .isLength({ max: 50000 }).withMessage('Code cannot exceed 50 000 characters'),

  body('language')
    .notEmpty().withMessage('Language is required')
    .isIn(['javascript', 'python', 'java', 'cpp', 'c', 'typescript'])
    .withMessage('Unsupported language'),

  body('problemId')
    .isMongoId().withMessage('Invalid problem ID'),

  body('timeTaken')
    .optional()
    .isInt({ min: 0 }).withMessage('Time taken must be a non-negative integer'),
];

// ─── Admin ────────────────────────────────────────────────────────────────────
const adminUserQueryRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Search query cannot exceed 100 characters'),
  query('status').optional().isIn(['active', 'inactive', '']).withMessage('Invalid status filter'),
  query('plan').optional().isIn(['free', 'pro', 'enterprise', '']).withMessage('Invalid plan filter'),
  query('role').optional().isIn(['student', 'admin', '']).withMessage('Invalid role filter'),
];

// ─── Shared ───────────────────────────────────────────────────────────────────
const mongoIdRules = (paramName = 'id') => [
  param(paramName).isMongoId().withMessage(`Invalid ${paramName}`),
];

module.exports = {
  handleValidation,
  // Auth
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  updateProfileRules,
  // Interview
  generateInterviewRules,
  submitAnswerRules,
  chatRules,
  // Coding
  runCodeRules,
  submitCodeRules,
  // Admin
  adminUserQueryRules,
  // Shared
  mongoIdRules,
};
