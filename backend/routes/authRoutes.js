const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  register, login, googleAuth,
  refresh, logout,
  verifyEmail, forgotPassword, resetPassword,
  getMe, updateProfile,
} = require('../controllers/authController');
const {
  handleValidation,
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  updateProfileRules,
} = require('../middleware/validate');

// Public
router.post('/register',        registerRules,       handleValidation, register);
router.post('/login',           loginRules,          handleValidation, login);
router.post('/google',          googleAuth);
router.get('/verify-email/:token', verifyEmail);
router.post('/forgot-password', forgotPasswordRules, handleValidation, forgotPassword);
router.post('/reset-password/:token', resetPasswordRules, handleValidation, resetPassword);

// Session management (no auth header needed — uses httpOnly cookie)
router.post('/refresh', refresh);
router.post('/logout',  logout);

// Protected
router.get('/me',             protect, getMe);
router.put('/update-profile', protect, updateProfileRules, handleValidation, updateProfile);

module.exports = router;
