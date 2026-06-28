const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  generateQuestions, submitAnswer, completeInterview,
  getInterviewHistory, getInterviewById, chatWithAI,
} = require('../controllers/interviewController');
const {
  handleValidation,
  generateInterviewRules,
  submitAnswerRules,
  chatRules,
  mongoIdRules,
} = require('../middleware/validate');

router.use(protect);

router.post('/generate', generateInterviewRules, handleValidation, generateQuestions);
router.post('/chat', chatRules, handleValidation, chatWithAI);
router.get('/history', getInterviewHistory);
router.get('/:id', mongoIdRules('id'), handleValidation, getInterviewById);
router.post('/:id/submit-answer', mongoIdRules('id'), submitAnswerRules, handleValidation, submitAnswer);
router.post('/:id/complete', mongoIdRules('id'), handleValidation, completeInterview);

module.exports = router;
