const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['technical', 'hr', 'scenario', 'behavioral'], default: 'technical' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  expectedAnswer: { type: String, default: '' },
  userAnswer: { type: String, default: '' },
  aiEvaluation: {
    score: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    strengths: { type: [String], default: [] },
    improvements: { type: [String], default: [] },
  },
  timeSpent: { type: Number, default: 0 }, // in seconds
});

const interviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      required: true,
      trim: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    interviewType: {
      type: String,
      enum: ['technical', 'hr', 'mixed', 'voice'],
      default: 'mixed',
    },
    questions: [questionSchema],
    overallScore: {
      type: Number,
      default: 0,
    },
    technicalScore: {
      type: Number,
      default: 0,
    },
    communicationScore: {
      type: Number,
      default: 0,
    },
    confidenceScore: {
      type: Number,
      default: 0,
    },
    aiFeedback: {
      summary: { type: String, default: '' },
      strengths: { type: [String], default: [] },
      improvements: { type: [String], default: [] },
      recommendedTopics: { type: [String], default: [] },
    },
    duration: {
      type: Number, // in minutes
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    completedAt: Date,
    // ── Adaptive difficulty engine ────────────────────────────────────────────
    isAdaptive: { type: Boolean, default: false },
    currentDifficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    difficultyHistory: [{
      questionIndex: Number,
      difficulty:    String,
      score:         Number,
      _id: false,
    }],
  },
  { timestamps: true }
);

// Indexes for all userId-scoped queries (most frequent access pattern)
interviewSchema.index({ userId: 1, createdAt: -1 });          // history list, sorted
interviewSchema.index({ userId: 1, status: 1 });               // completed-only queries
interviewSchema.index({ userId: 1, status: 1, createdAt: -1 }); // analytics + sorting

module.exports = mongoose.model('Interview', interviewSchema);
