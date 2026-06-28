require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xssClean = require('xss-clean');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const logger = require('./utils/logger');
const aiQuota = require('./middleware/aiQuota');

// Route imports
const authRoutes = require('./routes/authRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const codingRoutes = require('./routes/codingRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const atsRoutes = require('./routes/atsRoutes');
const companyRoutes = require('./routes/companyRoutes');
const reportRoutes = require('./routes/reportRoutes');
const dsaRoutes    = require('./routes/dsaRoutes');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

// Connect to MongoDB and seed default coding problems
connectDB().then(async () => {
  try {
    const CodingProblem = require('./models/CodingProblem');
    const count = await CodingProblem.countDocuments();
    if (count === 0) {
      await CodingProblem.insertMany([
        { slug: 'two-sum', title: 'Two Sum', difficulty: 'easy', topic: 'Arrays', topics: ['Arrays', 'Hash Map'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'], roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 10, source: 'internal', platform: 'leetcode', platformId: '1', externalUrl: 'https://leetcode.com/problems/two-sum/', description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nInput format: Line 1 is the array as JSON, Line 2 is the target.\nOutput format: Array of two indices as JSON.\n\nExample:\nInput: [2,7,11,15]\\n9\nOutput: [0,1]', hints: ['Use a hash map to store visited numbers', 'For each number, check if (target - number) exists in the map'], testCases: [{ input: '[2,7,11,15]\n9', expectedOutput: '[0,1]' }, { input: '[3,2,4]\n6', expectedOutput: '[1,2]' }, { input: '[3,3]\n6', expectedOutput: '[0,1]' }] },
        { slug: 'valid-parentheses', title: 'Valid Parentheses', difficulty: 'easy', topic: 'Stack', topics: ['Stack', 'String'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'], roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 9, source: 'internal', platform: 'leetcode', platformId: '20', externalUrl: 'https://leetcode.com/problems/valid-parentheses/', description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n\nInput format: A JSON string.\nOutput format: true or false.\n\nExample:\nInput: \"()[]{}\"\nOutput: true", hints: ['Use a stack data structure', 'Push opening brackets, pop and check for closing brackets'], testCases: [{ input: '"()[]{}"', expectedOutput: 'true' }, { input: '"(]"', expectedOutput: 'false' }, { input: '"([])"', expectedOutput: 'true' }] },
        { slug: 'reverse-linked-list', title: 'Reverse Linked List', difficulty: 'easy', topic: 'Linked List', topics: ['Linked List', 'Recursion'], companies: ['Amazon', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'], roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 9, source: 'internal', platform: 'leetcode', platformId: '206', externalUrl: 'https://leetcode.com/problems/reverse-linked-list/', description: 'Given the head of a singly linked list as a JSON array, reverse the list and return it as a JSON array.\n\nInput format: JSON array of integers.\nOutput format: JSON array of integers reversed.\n\nExample:\nInput: [1,2,3,4,5]\nOutput: [5,4,3,2,1]', hints: ['Use two pointers: prev and curr', 'Iterative: track previous, current, and next'], testCases: [{ input: '[1,2,3,4,5]', expectedOutput: '[5,4,3,2,1]' }, { input: '[1,2]', expectedOutput: '[2,1]' }, { input: '[1]', expectedOutput: '[1]' }] },
        { slug: 'longest-common-subsequence', title: 'Longest Common Subsequence', difficulty: 'medium', topic: 'Dynamic Programming', topics: ['Dynamic Programming', 'String'], companies: ['Google', 'Amazon', 'Microsoft', 'Atlassian'], sheetTags: ['neetcode-150', 'blind-75', 'striver-sde', 'love-babbar'], roadmapTags: ['intermediate', 'faang'], frequencyScore: 8, source: 'internal', platform: 'leetcode', platformId: '1143', externalUrl: 'https://leetcode.com/problems/longest-common-subsequence/', description: 'Given two strings text1 and text2, return the length of their longest common subsequence. If there is no common subsequence, return 0.\n\nInput format: Line 1 is text1 (JSON string), Line 2 is text2 (JSON string).\nOutput format: Integer length.\n\nExample:\nInput: "abcde"\\n"ace"\nOutput: 3', hints: ['Use a 2D DP table', 'dp[i][j] = LCS of first i chars of text1 and first j chars of text2'], testCases: [{ input: '"abcde"\n"ace"', expectedOutput: '3' }, { input: '"abc"\n"abc"', expectedOutput: '3' }, { input: '"abc"\n"def"', expectedOutput: '0' }] },
        { slug: 'binary-search', title: 'Binary Search', difficulty: 'easy', topic: 'Binary Search', topics: ['Binary Search', 'Array'], companies: ['Amazon', 'Google', 'Microsoft', 'Adobe'], sheetTags: ['neetcode-150', 'grind-75', 'striver-sde', 'love-babbar'], roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 8, source: 'internal', platform: 'leetcode', platformId: '704', externalUrl: 'https://leetcode.com/problems/binary-search/', description: 'Given a sorted array of integers nums and an integer target, return the index of target if it is in nums, or -1 if it is not.\nYou must write an algorithm with O(log n) runtime complexity.\n\nInput format: Line 1 is the sorted array as JSON, Line 2 is the target.\nOutput format: Integer index.\n\nExample:\nInput: [-1,0,3,5,9,12]\\n9\nOutput: 4', hints: ['Maintain left and right pointers', 'Check the middle element each iteration'], testCases: [{ input: '[-1,0,3,5,9,12]\n9', expectedOutput: '4' }, { input: '[-1,0,3,5,9,12]\n2', expectedOutput: '-1' }, { input: '[5]\n5', expectedOutput: '0' }] },
        { slug: 'maximum-subarray', title: 'Maximum Subarray', difficulty: 'medium', topic: 'Dynamic Programming', topics: ['Array', 'Dynamic Programming', 'Divide and Conquer'], companies: ['Amazon', 'Google', 'Microsoft', 'Meta', 'Adobe'], sheetTags: ['neetcode-150', 'blind-75', 'grind-75', 'striver-sde', 'love-babbar'], roadmapTags: ['beginner', 'intermediate', 'faang'], frequencyScore: 9, source: 'internal', platform: 'leetcode', platformId: '53', externalUrl: 'https://leetcode.com/problems/maximum-subarray/', description: "Given an integer array nums, find the subarray with the largest sum, and return its sum. This is also known as Kadane's Algorithm.\n\nInput format: JSON array of integers.\nOutput format: Integer sum.\n\nExample:\nInput: [-2,1,-3,4,-1,2,1,-5,4]\nOutput: 6\nExplanation: The subarray [4,-1,2,1] has the largest sum 6.", hints: ["Kadane's: keep a running sum, reset to 0 if it goes negative", 'Track the maximum sum seen so far'], testCases: [{ input: '[-2,1,-3,4,-1,2,1,-5,4]', expectedOutput: '6' }, { input: '[1]', expectedOutput: '1' }, { input: '[5,4,-1,7,8]', expectedOutput: '23' }] },
      ]);
      logger.info('Seeded default coding problems');
    }
  } catch (err) {
    logger.error('Coding problem seed failed', { error: err.message });
  }
});

// ─── Security middleware ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com', 'https://lh3.googleusercontent.com'],
        connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:5173'],
      },
    },
    crossOriginEmbedderPolicy: false, // keep off — needed for PDF viewer
  })
);

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Parse signed cookies — required for httpOnly refresh token cookie
app.use(cookieParser());

// Prevent NoSQL injection (strips keys starting with $ or containing .)
app.use(mongoSanitize());

// Strip HTML/script tags from req.body / req.query / req.params
app.use(xssClean());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// HTTP request logging — pipes Morgan's output into Winston so it goes to the log files
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    { stream: { write: (msg) => logger.info(msg.trim()) } }
  ));
}

// ─── Rate limiting ────────────────────────────────────────────────────────────
// General API limiter — applies to every /api/* route
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

// Strict limiter for auth routes — 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many authentication attempts, please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // successful logins don't count against the limit
});

// Strict limiter for AI-heavy routes — cap spend per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Please try again in an hour.' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
// IP-based rate limits (DoS protection)
app.use('/api/interview/generate', aiLimiter);
app.use('/api/resume/analyze', aiLimiter);
app.use('/api/ats/analyze', aiLimiter);
app.use('/api/companies', aiLimiter);
app.use('/api/coding/mentor', aiLimiter);

// Per-user plan-based AI quota (applied after protect middleware runs)
// These stack on top of the IP limiter above — both must pass
app.use('/api/interview/generate', aiQuota);
app.use('/api/resume/analyze',     aiQuota);
app.use('/api/ats/analyze',        aiQuota);
app.use('/api/coding/mentor',      aiQuota);

// ─── Health check ─────────────────────────────────────────────────────────────
// In production, require X-Health-Token header to prevent info leakage.
// Add HEALTH_TOKEN=<secret> to backend/.env
app.get('/api/health', (req, res) => {
  if (process.env.NODE_ENV === 'production' && process.env.HEALTH_TOKEN) {
    const provided = req.headers['x-health-token'];
    if (!provided || provided !== process.env.HEALTH_TOKEN) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  }
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const mem = process.memoryUsage();
  res.json({
    status: dbStatus === 'connected' ? 'OK' : 'DEGRADED',
    uptime: Math.floor(process.uptime()),
    database: dbStatus,
    memory: {
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
    },
    timestamp: new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ats', atsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dsa',     dsaRoutes);

// ─── Socket.IO JWT authentication ────────────────────────────────────────────
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];

    if (!token) return next(new Error('Authentication required'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lazy-load User to avoid circular-require issues at startup
    const User = require('./models/User');
    const user = await User.findById(decoded.id).select('_id role isActive');
    if (!user || !user.isActive) return next(new Error('Account not found or inactive'));

    socket.user = user; // attach to socket for use in handlers
    next();
  } catch {
    next(new Error('Invalid or expired token'));
  }
});

io.on('connection', (socket) => {
  logger.info('Socket connected', { socketId: socket.id, userId: socket.user._id });

  // Users may only join their own room (keyed by their user ID)
  socket.on('join_room', (roomId) => {
    const ownRoom = socket.user._id.toString();
    if (roomId !== ownRoom) {
      socket.emit('error', { message: 'Unauthorized room access' });
      return;
    }
    socket.join(roomId);
    console.log(`User ${ownRoom} joined room ${roomId}`);
  });

  socket.on('interview_message', (data) => {
    if (!data?.roomId) return;
    // Only broadcast to the user's own room
    if (data.roomId !== socket.user._id.toString()) return;
    io.to(data.roomId).emit('receive_message', data);
  });

  socket.on('code_update', (data) => {
    if (!data?.roomId) return;
    if (data.roomId !== socket.user._id.toString()) return;
    socket.to(data.roomId).emit('code_changed', data);
  });

  socket.on('typing', (data) => {
    if (!data?.roomId) return;
    if (data.roomId !== socket.user._id.toString()) return;
    socket.to(data.roomId).emit('user_typing', data);
  });

  socket.on('disconnect', () => {
    logger.info('Socket disconnected', { socketId: socket.id });
  });
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

// ─── Start server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`PrepAI Server running on port ${PORT}`, {
    env: process.env.NODE_ENV || 'development',
    port: PORT,
  });
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Handles SIGTERM (Docker stop, Kubernetes pod eviction) and SIGINT (Ctrl+C).
// Stops accepting new connections, waits for in-flight requests to finish,
// then closes the DB connection before exiting.
const shutdown = (signal) => {
  logger.info(`${signal} received — shutting down gracefully`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      logger.info('MongoDB connection closed');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown', { error: err.message });
      process.exit(1);
    }
  });

  // Force exit after 10 s if graceful close hangs
  setTimeout(() => {
    logger.error('Graceful shutdown timed out — forcing exit');
    process.exit(1);
  }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled promise rejections so the process doesn't silently die
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

module.exports = { app, server }; // exported for testing
