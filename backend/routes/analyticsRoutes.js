const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getDashboardStats, getInterviewAnalysis } = require('../controllers/analyticsController');

router.use(protect);
router.get('/dashboard', getDashboardStats);
router.get('/interview-analysis', getInterviewAnalysis);

module.exports = router;
