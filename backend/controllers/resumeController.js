const User = require('../models/User');
const aiService = require('../services/aiService');
const cloudinary = require('../config/cloudinary');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const isCloudinaryConfigured = () =>
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_CLOUD_NAME !== 'placeholder' &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

// Safely remove a temp file without throwing
const cleanupFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (_) {}
  }
};

// @route POST /api/resume/upload
const uploadResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    if (!isCloudinaryConfigured()) {
      cleanupFile(req.file.path);
      return res.status(503).json({
        success: false,
        message: 'Resume cloud storage not configured. Add Cloudinary keys to backend/.env.',
      });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'prepai/resumes',
      resource_type: 'raw',
      public_id: `resume_${req.user._id}_${Date.now()}`,
    });

    cleanupFile(req.file.path);

    // Delete old resume from Cloudinary if one existed
    const existing = await User.findById(req.user._id).select('resumePublicId');
    if (existing?.resumePublicId) {
      cloudinary.uploader
        .destroy(existing.resumePublicId, { resource_type: 'raw' })
        .catch((err) => console.error('Cloudinary cleanup error:', err.message));
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { resumeUrl: result.secure_url, resumePublicId: result.public_id },
      { new: true }
    );

    res.json({ success: true, message: 'Resume uploaded successfully.', resumeUrl: result.secure_url, user });
  } catch (error) {
    cleanupFile(req.file?.path);
    next(error);
  }
};

// @route POST /api/resume/analyze
const analyzeResume = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a PDF file.' });
    }

    // Async read — does not block the event loop
    const pdfBuffer = await fs.promises.readFile(req.file.path);
    const pdfData = await pdfParse(pdfBuffer);
    const resumeText = pdfData.text;

    cleanupFile(req.file.path);

    if (!resumeText || resumeText.trim().length < 50) {
      return res.status(400).json({
        success: false,
        message: 'Could not extract text from PDF. Please ensure the file is not a scanned image.',
      });
    }

    const analysis = await aiService.analyzeResume(resumeText);

    await User.findByIdAndUpdate(req.user._id, { 'stats.resumeScore': analysis.overallScore });

    res.json({ success: true, analysis });
  } catch (error) {
    cleanupFile(req.file?.path);
    next(error);
  }
};

// @route DELETE /api/resume
const deleteResume = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

    if (user.resumePublicId && isCloudinaryConfigured()) {
      await cloudinary.uploader.destroy(user.resumePublicId, { resource_type: 'raw' });
    }

    user.resumeUrl = '';
    user.resumePublicId = '';
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Resume deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadResume, analyzeResume, deleteResume };
