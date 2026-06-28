const express = require('express');
const router  = express.Router();
const { protect, adminOnly } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');
const { handleValidation, adminUserQueryRules, mongoIdRules } = require('../middleware/validate');
const { body } = require('express-validator');

router.use(protect, adminOnly);

// ── Stats & analytics
router.get('/stats',     getAdminStats);
router.get('/analytics', getPlatformAnalytics);

// ── User management
router.get('/users',    adminUserQueryRules, handleValidation, getAllUsers);
router.patch('/users/:id/toggle-active', mongoIdRules('id'), handleValidation, toggleUserActive);
router.delete('/users/:id', mongoIdRules('id'), handleValidation, deleteUser);
router.patch(
  '/users/:id/role',
  [...mongoIdRules('id'), body('role').isIn(['student', 'admin']).withMessage('Invalid role')],
  handleValidation,
  changeUserRole
);
router.patch(
  '/users/:id/plan',
  [...mongoIdRules('id'), body('plan').isIn(['free', 'pro', 'enterprise']).withMessage('Invalid plan')],
  handleValidation,
  changeUserPlan
);

// ── Interview management
router.get('/interviews', getAllInterviews);
router.delete('/interviews/:id', mongoIdRules('id'), handleValidation, deleteInterview);

// ── Audit logs
router.get('/audit-logs', getAuditLogs);

// ── Coding problems CRUD
router.get('/coding-problems',    getCodingProblems);
router.post('/coding-problems',   createCodingProblem);
router.put('/coding-problems/:id',  mongoIdRules('id'), handleValidation, updateCodingProblem);
router.delete('/coding-problems/:id', mongoIdRules('id'), handleValidation, deleteCodingProblem);

module.exports = router;
