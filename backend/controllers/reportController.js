const Interview = require('../models/Interview');
const User = require('../models/User');
const { generateInterviewReport } = require('../services/PDFService');

// @route GET /api/reports/:interviewId
// Generate and stream a PDF report for a completed interview
const downloadReport = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({
      _id: req.params.interviewId,
      userId: req.user._id,
      status: 'completed',
    });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Completed interview not found.' });
    }

    const user = await User.findById(req.user._id).select('name email');
    const pdfBuffer = await generateInterviewReport(interview, user);

    const filename = `PrepAI_Report_${interview.role.replace(/\s+/g, '_')}_${interview._id}.pdf`;
    res.set({
      'Content-Type':        'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length':      pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

module.exports = { downloadReport };
