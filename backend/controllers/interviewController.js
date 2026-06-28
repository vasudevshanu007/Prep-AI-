const Interview = require('../models/Interview');
const User = require('../models/User');
const aiService = require('../services/aiService');
const { calculateAverageScore } = require('../utils/helpers');

const DIFFICULTY_UP   = { easy: 'medium', medium: 'hard',   hard: 'hard'   };
const DIFFICULTY_DOWN = { easy: 'easy',   medium: 'easy',   hard: 'medium' };

const nextDifficulty = (current, score) => {
  if (score >= 7) return DIFFICULTY_UP[current]   || 'hard';
  if (score <= 3) return DIFFICULTY_DOWN[current] || 'easy';
  return current;
};
const { sanitizeInput, sanitizeRole, sanitizeSkills, sanitizeConversationHistory } = require('../utils/promptSanitizer');

// @route POST /api/interview/generate
const generateQuestions = async (req, res, next) => {
  try {
    const { role, skills, difficulty, count, interviewType } = req.body;

    // Sanitize before passing to AI
    const safeRole = sanitizeRole(role);
    const safeSkills = sanitizeSkills(skills);

    const questions = await aiService.generateInterviewQuestions({
      role: safeRole,
      skills: safeSkills,
      difficulty: difficulty || 'medium',
      count: count || 10,
    });

    const isAdaptive = req.body.isAdaptive === true || req.body.isAdaptive === 'true';
    const startDiff  = difficulty || 'medium';

    const interview = await Interview.create({
      userId: req.user._id,
      role: safeRole,
      skills: safeSkills,
      difficulty: startDiff,
      interviewType: interviewType || 'mixed',
      isAdaptive,
      currentDifficulty: startDiff,
      questions: questions.map((q) => ({
        question: q.question,
        type: q.type,
        difficulty: q.difficulty,
        expectedAnswer: q.expectedAnswer,
      })),
    });

    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/interview/:id/submit-answer
const submitAnswer = async (req, res, next) => {
  try {
    const { questionIndex, userAnswer, timeSpent } = req.body;
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const question = interview.questions[questionIndex];
    if (!question) {
      return res.status(400).json({ success: false, message: 'Question not found.' });
    }

    // Sanitize user answer before AI evaluation
    const safeAnswer = sanitizeInput(userAnswer, 3000);

    const evaluation = await aiService.evaluateAnswer({
      question: question.question,
      userAnswer: safeAnswer,
      expectedAnswer: question.expectedAnswer,
      role: interview.role,
    });

    interview.questions[questionIndex].userAnswer    = safeAnswer;
    interview.questions[questionIndex].timeSpent     = timeSpent || 0;
    interview.questions[questionIndex].aiEvaluation  = evaluation;

    // ── Adaptive difficulty engine ────────────────────────────────────────────
    let nextAdaptiveQuestion = null;
    if (interview.isAdaptive) {
      const currentDiff = interview.currentDifficulty || interview.difficulty;
      const newDiff     = nextDifficulty(currentDiff, evaluation.score);

      interview.difficultyHistory.push({
        questionIndex,
        difficulty: currentDiff,
        score: evaluation.score,
      });
      interview.currentDifficulty = newDiff;

      // Generate next adaptive question if there are more questions to answer
      const answeredCount  = interview.questions.filter((q) => q.userAnswer).length;
      const remainingCount = interview.questions.length - answeredCount;

      if (remainingCount > 0) {
        const prevQuestions = interview.questions.map((q) => q.question);
        nextAdaptiveQuestion = await aiService.generateAdaptiveQuestion({
          role:              interview.role,
          skills:            interview.skills,
          difficulty:        newDiff,
          previousQuestions: prevQuestions,
        });
        // Replace the next unanswered question with the adaptive one
        const nextIdx = interview.questions.findIndex((q) => !q.userAnswer && q !== interview.questions[questionIndex]);
        if (nextIdx !== -1) {
          interview.questions[nextIdx].question       = nextAdaptiveQuestion.question;
          interview.questions[nextIdx].type           = nextAdaptiveQuestion.type;
          interview.questions[nextIdx].difficulty     = nextAdaptiveQuestion.difficulty;
          interview.questions[nextIdx].expectedAnswer = nextAdaptiveQuestion.expectedAnswer;
        }
      }
    }

    await interview.save();

    res.json({
      success: true,
      evaluation,
      question: interview.questions[questionIndex],
      nextDifficulty: interview.currentDifficulty,
      adaptiveQuestion: nextAdaptiveQuestion,
    });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/interview/:id/complete
const completeInterview = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });

    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }

    const answeredQuestions = interview.questions.filter((q) => q.aiEvaluation?.score > 0);
    const scores = answeredQuestions.map((q) => q.aiEvaluation.score);
    const overallScore = calculateAverageScore(scores);

    const techQuestions = answeredQuestions.filter((q) => q.type === 'technical');
    const techScore = calculateAverageScore(techQuestions.map((q) => q.aiEvaluation.score));

    const aiFeedback = await aiService.generateInterviewFeedback({
      role: interview.role,
      questions: interview.questions,
      overallScore,
    });

    interview.overallScore = overallScore;
    interview.technicalScore = techScore;
    interview.communicationScore = overallScore;
    interview.aiFeedback = aiFeedback;
    interview.status = 'completed';
    interview.completedAt = new Date();
    interview.duration = req.body.duration || 0;

    await interview.save();

    // Use MongoDB aggregation to recalculate average — avoids loading all documents
    const avgResult = await Interview.aggregate([
      { $match: { userId: req.user._id, status: 'completed' } },
      { $group: { _id: null, avg: { $avg: '$overallScore' }, total: { $sum: 1 } } },
    ]);

    const newAvg = Math.round((avgResult[0]?.avg || 0) * 10) / 10;
    const newTotal = avgResult[0]?.total || 1;

    // Update weak topics from feedback
    const user = await User.findById(req.user._id);
    user.stats.totalInterviews = newTotal;
    user.stats.averageScore = newAvg;

    if (aiFeedback.recommendedTopics?.length) {
      const combined = [...new Set([...user.weakTopics, ...aiFeedback.recommendedTopics])];
      user.weakTopics = combined.slice(0, 10);
    }

    user.stats.xp += Math.round(overallScore * 10);

    // Badge checks — avoid duplicates
    if (newTotal === 1 && !user.stats.badges.includes('first_interview')) {
      user.stats.badges.push('first_interview');
    }
    if (newTotal === 10 && !user.stats.badges.includes('ten_interviews')) {
      user.stats.badges.push('ten_interviews');
    }
    if (overallScore >= 9 && !user.stats.badges.includes('excellent_performance')) {
      user.stats.badges.push('excellent_performance');
    }

    await user.save({ validateBeforeSave: false });

    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/interview/history
const getInterviewHistory = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [interviews, total] = await Promise.all([
      Interview.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-questions.expectedAnswer'),
      Interview.countDocuments({ userId: req.user._id }),
    ]);

    res.json({
      success: true,
      interviews,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/interview/:id
const getInterviewById = async (req, res, next) => {
  try {
    const interview = await Interview.findOne({ _id: req.params.id, userId: req.user._id });
    if (!interview) {
      return res.status(404).json({ success: false, message: 'Interview not found.' });
    }
    res.json({ success: true, interview });
  } catch (error) {
    next(error);
  }
};

// @route POST /api/interview/chat
const chatWithAI = async (req, res, next) => {
  try {
    const { conversationHistory, userMessage, role, questionIndex } = req.body;

    // Sanitize everything that will touch the AI prompt
    const safeHistory = sanitizeConversationHistory(conversationHistory);
    const safeMessage = sanitizeInput(userMessage, 500);
    const safeRole = sanitizeRole(role);

    const response = await aiService.getChatbotResponse({
      conversationHistory: safeHistory,
      userMessage: safeMessage,
      role: safeRole,
      questionIndex: questionIndex || 0,
    });

    res.json({ success: true, response });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  generateQuestions, submitAnswer, completeInterview,
  getInterviewHistory, getInterviewById, chatWithAI,
};
