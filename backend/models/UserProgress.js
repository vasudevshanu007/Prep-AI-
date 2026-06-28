const mongoose = require('mongoose');

const userProgressSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',          required: true },
    problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem', required: true },
    status:    { type: String, enum: ['unsolved', 'attempted', 'solved'], default: 'unsolved' },
    bookmarked:       { type: Boolean, default: false },
    notes:            { type: String,  default: '' },
    lastAttemptedAt:  { type: Date },
    solvedAt:         { type: Date },
    bestScore:        { type: Number, default: 0 },
    bestLanguage:     { type: String, default: '' },
    totalAttempts:    { type: Number, default: 0 },
    lastCodingTestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CodingTest' },
  },
  { timestamps: true }
);

userProgressSchema.index({ userId: 1, problemId: 1 }, { unique: true });
userProgressSchema.index({ userId: 1, status: 1 });
userProgressSchema.index({ userId: 1, bookmarked: 1 });

module.exports = mongoose.model('UserProgress', userProgressSchema);
