const mongoose = require('mongoose');

const skillGapSchema = new mongoose.Schema({
  skill: String,
  importance: { type: String, enum: ['critical', 'high', 'medium', 'low'], default: 'medium' },
  suggestion: String,
}, { _id: false });

const atsAnalysisSchema = new mongoose.Schema({
  userId:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle:         { type: String, default: '' },
  jobDescription:   { type: String, required: true },
  resumeText:       { type: String, required: true },
  atsScore:         { type: Number, min: 0, max: 100, default: 0 },
  matchPercentage:  { type: Number, min: 0, max: 100, default: 0 },
  matchedKeywords:  { type: [String], default: [] },
  missingKeywords:  { type: [String], default: [] },
  skillGaps:        { type: [skillGapSchema], default: [] },
  suggestions:      { type: [String], default: [] },
  strengths:        { type: [String], default: [] },
  weaknesses:       { type: [String], default: [] },
  improvedSummary:  { type: String, default: '' },
  sectionScores: {
    skills:      { type: Number, default: 0 },
    experience:  { type: Number, default: 0 },
    education:   { type: Number, default: 0 },
    formatting:  { type: Number, default: 0 },
  },
}, { timestamps: true });

atsAnalysisSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('ATSAnalysis', atsAnalysisSchema);
