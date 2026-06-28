const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name:         { type: String, required: true },
    description:  { type: String, default: '' },
    order:        { type: Number, default: 0 },
    problemSlugs: [{ type: String }],
  },
  { _id: true }
);

const dsaSheetSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, trim: true },
    slug:        { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    author:      { type: String, default: '' },
    icon:        { type: String, default: '' },
    color:       { type: String, default: '#6366f1' },
    difficulty:  { type: String, enum: ['beginner', 'intermediate', 'advanced', 'mixed'], default: 'mixed' },
    totalProblems: { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
    categories:  [categorySchema],
  },
  { timestamps: true }
);

dsaSheetSchema.index({ isActive: 1 });

module.exports = mongoose.model('DSASheet', dsaSheetSchema);
