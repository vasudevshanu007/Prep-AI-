const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema({
  input: String,
  expectedOutput: String,
  actualOutput: { type: String, default: '' },
  passed: { type: Boolean, default: false },
  executionTime: { type: Number, default: 0 },
});

const codingTestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CodingProblem',
    },
    problemTitle: {
      type: String,
      required: true,
    },
    problemDescription: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    topic: {
      type: String,
      default: 'General',
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'java', 'cpp', 'c', 'typescript'],
      default: 'javascript',
    },
    code: {
      type: String,
      default: '',
    },
    testCases: [testCaseSchema],
    score: {
      type: Number,
      default: 0,
    },
    passedTestCases: {
      type: Number,
      default: 0,
    },
    totalTestCases: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number, // ms
      default: 0,
    },
    aiReview: {
      score: { type: Number, default: 0 },
      feedback: { type: String, default: '' },
      timeComplexity: { type: String, default: '' },
      spaceComplexity: { type: String, default: '' },
      improvements: { type: [String], default: [] },
    },
    timeTaken: {
      type: Number, // seconds
      default: 0,
    },
    status: {
      type: String,
      enum: ['attempted', 'completed', 'timeout'],
      default: 'attempted',
    },
    // ── AI Coding Mentor (Feature 13) ─────────────────────────────────────────
    mentorFeedback: {
      analysis:            { type: String, default: '' },
      optimizations:       { type: [String], default: [] },
      alternativeApproach: { type: String, default: '' },
      bestPractices:       { type: [String], default: [] },
      learningPath:        { type: [String], default: [] },
      generatedAt:         { type: Date },
    },
  },
  { timestamps: true }
);

// Indexes for userId-scoped queries
codingTestSchema.index({ userId: 1, createdAt: -1 }); // history list, sorted
codingTestSchema.index({ userId: 1, language: 1 });   // language analytics grouping

module.exports = mongoose.model('CodingTest', codingTestSchema);
