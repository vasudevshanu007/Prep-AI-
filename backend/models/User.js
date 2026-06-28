const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: {
      type: String,
      enum: ['student', 'admin'],
      default: 'student',
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    avatar: {
      type: String,
      default: '',
    },
    googleId: {
      type: String,
      default: '',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: String,
    emailVerificationExpire: Date,
    resetPasswordToken: String,
    resetPasswordExpire: Date,
    skills: {
      type: [String],
      default: [],
    },
    targetRole: {
      type: String,
      default: '',
    },
    resumeUrl: {
      type: String,
      default: '',
    },
    resumePublicId: {
      type: String,
      default: '',
    },
    stats: {
      totalInterviews:  { type: Number, default: 0 },
      averageScore:     { type: Number, default: 0 },
      totalCodingTests: { type: Number, default: 0 },
      resumeScore:      { type: Number, default: 0 },
      streak:           { type: Number, default: 0 },
      xp:               { type: Number, default: 0 },
      badges:           { type: [String], default: [] },
      lastActiveDate:   { type: Date, default: Date.now },
      aiCallsToday:     { type: Number, default: 0 },
      aiCallsDate:      { type: Date },
    },
    loginHistory: {
      type: [
        {
          ip:        { type: String, default: '' },
          userAgent: { type: String, default: '' },
          createdAt: { type: Date, default: Date.now },
          _id: false,
        },
      ],
      default: [],
    },
    weakTopics: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
