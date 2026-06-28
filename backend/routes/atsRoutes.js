const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { upload, analyze, getHistory, getById } = require('../controllers/atsController');

router.post('/analyze', protect, upload.single('resume'), analyze);
router.get('/history',  protect, getHistory);
router.get('/:id',      protect, getById);

module.exports = router;
