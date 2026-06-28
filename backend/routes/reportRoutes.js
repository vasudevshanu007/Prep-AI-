const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { downloadReport } = require('../controllers/reportController');

router.get('/:interviewId', protect, downloadReport);

module.exports = router;
