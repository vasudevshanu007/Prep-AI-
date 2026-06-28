const express = require('express');
const router  = express.Router();
const { protect, optionalAuth } = require('../middleware/authMiddleware');
const {
  getProblems, getProblemById,
  runCode, submitCode,
  getCodingHistory, getMentorFeedback,
} = require('../controllers/codingController');
const { handleValidation, runCodeRules, submitCodeRules } = require('../middleware/validate');

// Problems browsing — optional auth injects user progress
router.get('/problems',     optionalAuth, getProblems);
router.get('/problems/:id', optionalAuth, getProblemById);

// Execution and history require auth
router.use(protect);
router.post('/run',            runCodeRules,    handleValidation, runCode);
router.post('/submit',         submitCodeRules, handleValidation, submitCode);
router.get('/history',         getCodingHistory);
router.post('/mentor/:testId', getMentorFeedback);

module.exports = router;
