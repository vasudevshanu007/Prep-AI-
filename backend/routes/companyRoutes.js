const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { getCompanies, getCompanyById, generateCompanyInterview, getReadinessScore } = require('../controllers/companyController');

router.get('/',                    protect, getCompanies);
router.get('/:id',                 protect, getCompanyById);
router.post('/:id/generate',       protect, generateCompanyInterview);
router.get('/:id/readiness',       protect, getReadinessScore);

module.exports = router;
