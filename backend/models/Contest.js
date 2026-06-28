const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    problemId:   { type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' },
    score:       { type: Number, default: 0 },
    language:    { type: String },
    submittedAt: { type: Date },
    attempts:    { type: Number, default: 1 },
  },
  { _id: false }
);

const participantSchema = new mongoose.Schema(
  {
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    score:         { type: Number, default: 0 },
    rank:          { type: Number },
    problemsSolved:{ type: Number, default: 0 },
    finishedAt:    { type: Date },
    submissions:   [submissionSchema],
  },
  { _id: false }
);

const contestSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    type:        { type: String, enum: ['weekly', 'monthly', 'mock-oa', 'company-oa'], default: 'weekly' },
    company:     { type: String, default: '' },
    startTime:   { type: Date, required: true },
    endTime:     { type: Date, required: true },
    duration:    { type: Number, default: 90 }, // minutes
    problems:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'CodingProblem' }],
    isActive:    { type: Boolean, default: true },
    isPublished: { type: Boolean, default: false },
    participants:[participantSchema],
    leaderboard: [
      {
        userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        name:          String,
        avatar:        String,
        rank:          Number,
        score:         Number,
        problemsSolved:Number,
        finishedAt:    Date,
      },
    ],
    maxParticipants:      { type: Number, default: 0 },
    registrationDeadline: { type: Date },
  },
  { timestamps: true }
);

contestSchema.index({ slug: 1 });
contestSchema.index({ startTime: 1 });
contestSchema.index({ type: 1, isPublished: 1 });

module.exports = mongoose.model('Contest', contestSchema);
