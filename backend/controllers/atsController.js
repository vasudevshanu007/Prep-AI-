const ATSAnalysis = require('../models/ATSAnalysis');
const { analyzeATS } = require('../services/ATSService');
const pdfParse = require('pdf-parse');
const multer = require('multer');

// multer — memory storage, PDF only, 5 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
});

// @route POST /api/ats/analyze
const analyze = async (req, res, next) => {
  try {
    const { jobDescription, jobTitle, resumeText } = req.body;

    if (!jobDescription || jobDescription.trim().length < 50) {
      return res.status(400).json({ success: false, message: 'Job description must be at least 50 characters.' });
    }

    let finalResumeText = resumeText || '';

    // If a PDF was uploaded extract its text
    if (req.file) {
      const data = await pdfParse(req.file.buffer);
      finalResumeText = data.text || '';
    }

    if (!finalResumeText || finalResumeText.trim().length < 100) {
      return res.status(400).json({ success: false, message: 'Please upload a resume PDF or paste resume text (min 100 characters).' });
    }

    const analysis = await analyzeATS(finalResumeText, jobDescription, jobTitle || '');

    const saved = await ATSAnalysis.create({
      userId: req.user._id,
      jobTitle: jobTitle || '',
      jobDescription,
      resumeText: finalResumeText,
      ...analysis,
    });

    res.json({ success: true, analysis: saved });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/ats/history
const getHistory = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [analyses, total] = await Promise.all([
      ATSAnalysis.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-resumeText -jobDescription -improvedSummary'),
      ATSAnalysis.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ success: true, analyses, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/ats/:id
const getById = async (req, res, next) => {
  try {
    const analysis = await ATSAnalysis.findOne({ _id: req.params.id, userId: req.user._id });
    if (!analysis) return res.status(404).json({ success: false, message: 'Analysis not found.' });
    res.json({ success: true, analysis });
  } catch (error) {
    next(error);
  }
};

module.exports = { upload, analyze, getHistory, getById };
