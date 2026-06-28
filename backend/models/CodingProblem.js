const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    input:          { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden:       { type: Boolean, default: false },
  },
  { _id: false }
);

const exampleSchema = new mongoose.Schema(
  {
    input:       { type: String, default: '' },
    output:      { type: String, default: '' },
    explanation: { type: String, default: '' },
  },
  { _id: false }
);

const codingProblemSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    difficulty:  { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    topic:       { type: String, required: true, trim: true },
    topics:      [{ type: String, trim: true }],

    companies:   [{ type: String, trim: true }],
    sheetTags:   [{ type: String, trim: true }],
    roadmapTags: [{ type: String, trim: true }],

    hints:       [{ type: String }],
    constraints: { type: String, default: '' },
    examples:    [exampleSchema],
    testCases:   [testCaseSchema],

    frequencyScore: { type: Number, min: 1, max: 10, default: 5 },
    source:      { type: String, enum: ['internal', 'external'], default: 'internal' },
    externalUrl: { type: String, default: '' },
    platform:    { type: String, enum: ['leetcode', 'gfg', 'codechef', 'custom'], default: 'custom' },
    platformId:  { type: String, default: '' },
    isPremium:   { type: Boolean, default: false },

    solveCount:   { type: Number, default: 0 },
    attemptCount: { type: Number, default: 0 },

    order:     { type: Number, default: 0 },
    isActive:  { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

codingProblemSchema.index({ difficulty: 1, topic: 1 });
codingProblemSchema.index({ isActive: 1, difficulty: 1 });
codingProblemSchema.index({ companies: 1 });
codingProblemSchema.index({ sheetTags: 1 });
codingProblemSchema.index({ title: 'text', description: 'text' });

module.exports = mongoose.model('CodingProblem', codingProblemSchema);
