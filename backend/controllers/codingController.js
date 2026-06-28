const CodingTest    = require('../models/CodingTest');
const CodingProblem = require('../models/CodingProblem');
const UserProgress  = require('../models/UserProgress');
const User          = require('../models/User');
const aiService     = require('../services/aiService');
const axios         = require('axios');

const PISTON_URL = 'https://emkc.org/api/v2/piston/execute';

const PISTON_LANGUAGES = {
  javascript: { lang: 'javascript', version: '*', filename: 'main.js' },
  python:     { lang: 'python',     version: '*', filename: 'main.py' },
  java:       { lang: 'java',       version: '*', filename: 'Main.java' },
  cpp:        { lang: 'c++',        version: '*', filename: 'main.cpp' },
  c:          { lang: 'c',          version: '*', filename: 'main.c' },
  typescript: { lang: 'typescript', version: '*', filename: 'main.ts' },
};

const runTestCase = async (code, language, tc) => {
  try {
    const { lang, version, filename } = PISTON_LANGUAGES[language];
    const response = await axios.post(
      PISTON_URL,
      { language: lang, version, files: [{ name: filename, content: code }], stdin: tc.input },
      { timeout: 15000 }
    );
    const run = response.data.run;
    const actualOutput  = run.stdout?.trim() || '';
    const expectedOutput = tc.expectedOutput?.trim() || '';
    const passed = run.code === 0 && actualOutput === expectedOutput;
    return {
      input:          tc.isHidden ? '[hidden]' : tc.input,
      expectedOutput: tc.isHidden ? '[hidden]' : expectedOutput,
      actualOutput:   tc.isHidden ? (passed ? '[correct]' : '[incorrect]') : actualOutput,
      passed,
      executionTime: 0,
      stderr: run.stderr || '',
    };
  } catch {
    return { input: tc.input, expectedOutput: tc.expectedOutput, actualOutput: 'Execution error', passed: false, executionTime: 0 };
  }
};

// GET /api/coding/problems
const getProblems = async (req, res, next) => {
  try {
    const { difficulty, topic, company, sheet, source, q, page = 1, limit = 100 } = req.query;
    const filter = { isActive: true };
    if (difficulty) filter.difficulty = difficulty;
    if (topic)   filter.topic = { $regex: topic, $options: 'i' };
    if (company) filter.companies = company;
    if (sheet)   filter.sheetTags = sheet;
    if (source)  filter.source = source;
    if (q) filter.$or = [
      { title:       { $regex: q, $options: 'i' } },
      { topic:       { $regex: q, $options: 'i' } },
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [problems, total] = await Promise.all([
      CodingProblem.find(filter)
        .sort({ order: 1, frequencyScore: -1, createdAt: 1 })
        .skip(skip).limit(parseInt(limit))
        .select('slug title difficulty topic topics companies sheetTags source externalUrl frequencyScore solveCount attemptCount hints')
        .lean(),
      CodingProblem.countDocuments(filter),
    ]);

    let progressMap = {};
    if (req.user?._id) {
      const ids = problems.map(p => p._id);
      const prs = await UserProgress.find({ userId: req.user._id, problemId: { $in: ids } })
        .select('problemId status bookmarked bestScore').lean();
      prs.forEach(pr => { progressMap[pr.problemId.toString()] = pr; });
    }

    const enriched = problems.map(p => ({
      ...p,
      status:     progressMap[p._id.toString()]?.status     || 'unsolved',
      bookmarked: progressMap[p._id.toString()]?.bookmarked || false,
      bestScore:  progressMap[p._id.toString()]?.bestScore  || 0,
    }));

    res.json({ success: true, problems: enriched, total, page: parseInt(page) });
  } catch (err) { next(err); }
};

// GET /api/coding/problems/:id
const getProblemById = async (req, res, next) => {
  try {
    const problem = await CodingProblem.findOne({
      $or: [{ _id: req.params.id.match(/^[a-f\d]{24}$/i) ? req.params.id : null }, { slug: req.params.id }],
      isActive: true,
    }).lean();
    if (!problem) return res.status(404).json({ success: false, message: 'Problem not found.' });

    let userProgress = null;
    if (req.user?._id) {
      userProgress = await UserProgress.findOne({ userId: req.user._id, problemId: problem._id })
        .select('status bookmarked notes bestScore totalAttempts solvedAt').lean();
    }

    // Hide hidden test cases from client
    const safeTestCases = (problem.testCases || []).filter(tc => !tc.isHidden);
    res.json({ success: true, problem: { ...problem, testCases: safeTestCases, userProgress } });
  } catch (err) { next(err); }
};

// POST /api/coding/run
const runCode = async (req, res, next) => {
  try {
    const { code, language, input } = req.body;
    if (!PISTON_LANGUAGES[language]) {
      return res.status(400).json({ success: false, message: 'Unsupported language.' });
    }
    const { lang, version, filename } = PISTON_LANGUAGES[language];
    const response = await axios.post(
      PISTON_URL,
      { language: lang, version, files: [{ name: filename, content: code }], stdin: input || '' },
      { timeout: 15000 }
    );
    const { run, compile } = response.data;
    res.json({
      success: true,
      output:        run.stdout   || '',
      stderr:        run.stderr   || '',
      compileOutput: compile?.stderr || compile?.stdout || '',
      status: run.code === 0 ? 'Accepted' : 'Runtime Error',
    });
  } catch (error) {
    if (error.code === 'ECONNABORTED') {
      return res.status(503).json({ success: false, message: 'Code execution timed out.' });
    }
    next(error);
  }
};

// POST /api/coding/submit
const submitCode = async (req, res, next) => {
  try {
    const { code, language, problemId, timeTaken } = req.body;

    const problem = await CodingProblem.findOne({ _id: problemId, isActive: true });
    if (!problem) return res.status(400).json({ success: false, message: 'Problem not found.' });
    if (!PISTON_LANGUAGES[language]) return res.status(400).json({ success: false, message: 'Unsupported language.' });
    if (!problem.testCases?.length) return res.status(400).json({ success: false, message: 'No test cases for this problem.' });

    const testResults = await Promise.all(problem.testCases.map(tc => runTestCase(code, language, tc)));
    const passedCount = testResults.filter(r => r.passed).length;
    const score       = Math.round((passedCount / problem.testCases.length) * 100); // 0–100
    const allPassed   = passedCount === problem.testCases.length;

    const aiReview = await aiService.reviewCode({
      problem:     problem.title,
      code,
      language,
      testResults: { passed: passedCount, total: problem.testCases.length },
    });

    const codingTest = await CodingTest.create({
      userId:             req.user._id,
      problemId:          problem._id,
      problemTitle:       problem.title,
      problemDescription: problem.description,
      difficulty:         problem.difficulty,
      topic:              problem.topic,
      language,
      code,
      testCases:          testResults,
      score,
      passedTestCases:    passedCount,
      totalTestCases:     problem.testCases.length,
      aiReview,
      timeTaken:          timeTaken || 0,
      status:             allPassed ? 'completed' : 'attempted',
    });

    // Update UserProgress
    const existingPr = await UserProgress.findOne({ userId: req.user._id, problemId: problem._id });
    const newStatus  = allPassed ? 'solved' : (existingPr?.status === 'solved' ? 'solved' : 'attempted');
    const isBetter   = score > (existingPr?.bestScore || 0);

    await UserProgress.findOneAndUpdate(
      { userId: req.user._id, problemId: problem._id },
      {
        $set: {
          status:          newStatus,
          lastAttemptedAt: new Date(),
          lastCodingTestId:codingTest._id,
          ...(isBetter ? { bestScore: score, bestLanguage: language } : {}),
          ...(allPassed && !existingPr?.solvedAt ? { solvedAt: new Date() } : {}),
        },
        $inc: { totalAttempts: 1 },
      },
      { upsert: true }
    );

    // Aggregate counters on problem
    await CodingProblem.findByIdAndUpdate(problem._id, {
      $inc: { attemptCount: 1, ...(allPassed ? { solveCount: 1 } : {}) },
    });

    // XP update
    await User.findByIdAndUpdate(req.user._id, {
      $inc: { 'stats.totalCodingTests': 1, 'stats.xp': Math.round(score / 10) },
    });

    res.json({
      success: true,
      codingTest,
      testResults,
      passedCount,
      totalTestCases: problem.testCases.length,
      score,
      allPassed,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/coding/history
const getCodingHistory = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip  = (page - 1) * limit;

    const [tests, total] = await Promise.all([
      CodingTest.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip).limit(limit)
        .select('-code -testCases'),
      CodingTest.countDocuments({ userId: req.user._id }),
    ]);

    res.json({ success: true, tests, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) { next(error); }
};

// POST /api/coding/mentor/:testId
const getMentorFeedback = async (req, res, next) => {
  try {
    const codingTest = await CodingTest.findOne({ _id: req.params.testId, userId: req.user._id });
    if (!codingTest) return res.status(404).json({ success: false, message: 'Coding test not found.' });

    if (codingTest.mentorFeedback?.analysis) {
      return res.json({ success: true, mentorFeedback: codingTest.mentorFeedback });
    }

    const mentor = await aiService.generateCodingMentor({
      problem:     codingTest.problemTitle,
      code:        codingTest.code,
      language:    codingTest.language,
      score:       codingTest.score,
      testResults: { passed: codingTest.passedTestCases, total: codingTest.totalTestCases },
    });

    codingTest.mentorFeedback = { ...mentor, generatedAt: new Date() };
    await codingTest.save();
    res.json({ success: true, mentorFeedback: codingTest.mentorFeedback });
  } catch (error) { next(error); }
};

module.exports = { getProblems, getProblemById, runCode, submitCode, getCodingHistory, getMentorFeedback };
