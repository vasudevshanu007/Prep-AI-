const Interview = require('../models/Interview');
const aiService  = require('../services/aiService');
const { sanitizeRole, sanitizeSkills } = require('../utils/promptSanitizer');
const { ask, parseJSON } = require('../services/geminiClient');

// Company data — interview patterns, focus areas, culture
const COMPANIES = [
  {
    id: 'google', name: 'Google', emoji: '🔍',
    color: '#4285F4',
    description: 'Focus on algorithms, data structures, system design, and Googleyness.',
    rounds: ['Technical Phone Screen', 'Coding (x3)', 'System Design', 'Behavioral'],
    focusAreas: ['Algorithms & DS', 'System Design', 'Problem Solving', 'Leadership'],
    difficulty: 'hard',
    skills: ['Algorithms', 'Data Structures', 'System Design', 'Distributed Systems', 'Leadership'],
    questionPatterns: ['Graph problems', 'Dynamic Programming', 'Design Google Search', 'Googliness questions'],
  },
  {
    id: 'amazon', name: 'Amazon', emoji: '📦',
    color: '#FF9900',
    description: 'Heavy behavioral focus using Leadership Principles. Coding uses bar-raiser format.',
    rounds: ['Online Assessment', 'Technical (x2)', 'Bar Raiser', 'Behavioral'],
    focusAreas: ['Leadership Principles', 'System Design', 'Coding', 'Customer Obsession'],
    difficulty: 'hard',
    skills: ['Leadership Principles', 'System Design', 'Algorithms', 'Behavioral', 'Ownership'],
    questionPatterns: ['STAR format', 'Design Amazon Prime', 'Customer obsession stories', 'Ownership examples'],
  },
  {
    id: 'microsoft', name: 'Microsoft', emoji: '🪟',
    color: '#00A4EF',
    description: 'Balanced technical and cultural fit. Growth mindset is key.',
    rounds: ['Phone Screen', 'Technical (x3)', 'Behavioral', 'As-Appropriate'],
    focusAreas: ['Coding', 'System Design', 'Growth Mindset', 'Collaboration'],
    difficulty: 'medium',
    skills: ['Object Oriented Design', 'System Design', 'Algorithms', 'Behavioral', 'Teamwork'],
    questionPatterns: ['OOD questions', 'Design Teams/Office 365', 'Collaboration stories', 'Growth mindset'],
  },
  {
    id: 'meta', name: 'Meta', emoji: '👥',
    color: '#1877F2',
    description: 'Focuses on scale and speed. Move fast, break things mentality.',
    rounds: ['Initial Screen', 'Coding (x2)', 'System Design', 'Behavioral'],
    focusAreas: ['Scalability', 'Coding Speed', 'Product Sense', 'Impact'],
    difficulty: 'hard',
    skills: ['Algorithms', 'System Design at Scale', 'Product Thinking', 'Impact-driven'],
    questionPatterns: ['Design Facebook Feed', 'Fast coding rounds', 'Conflict resolution', 'Scale challenges'],
  },
  {
    id: 'adobe', name: 'Adobe', emoji: '🎨',
    color: '#FF0000',
    description: 'Focus on creativity, design systems, and collaborative problem solving.',
    rounds: ['HR Screen', 'Technical (x2)', 'System Design', 'Managerial'],
    focusAreas: ['System Design', 'OOP', 'Creativity', 'Collaboration'],
    difficulty: 'medium',
    skills: ['OOP Design', 'System Design', 'Creativity', 'Problem Solving', 'Teamwork'],
    questionPatterns: ['Design Adobe CC', 'OOP problems', 'Creative solutions', 'Team scenarios'],
  },
  {
    id: 'flipkart', name: 'Flipkart', emoji: '🛒',
    color: '#2874F0',
    description: 'E-commerce scale problems. Strong emphasis on system design and DSA.',
    rounds: ['Online Test', 'Technical (x2)', 'System Design', 'HR'],
    focusAreas: ['DSA', 'System Design', 'E-commerce Domain', 'Scalability'],
    difficulty: 'medium',
    skills: ['Data Structures', 'Algorithms', 'System Design', 'E-commerce', 'Backend'],
    questionPatterns: ['Design Flipkart Search', 'Cart system design', 'DSA problems', 'Scalability questions'],
  },
  {
    id: 'swiggy', name: 'Swiggy', emoji: '🍕',
    color: '#FC8019',
    description: 'Real-time systems, geo-spatial problems, and delivery optimization.',
    rounds: ['Technical Screen', 'Coding Round', 'System Design', 'Culture Fit'],
    focusAreas: ['Real-time Systems', 'Geo-spatial', 'Backend', 'Problem Solving'],
    difficulty: 'medium',
    skills: ['Backend Systems', 'Real-time Design', 'Algorithms', 'Distributed Systems'],
    questionPatterns: ['Design delivery tracking', 'Route optimization', 'Real-time notifications', 'Geo queries'],
  },
  {
    id: 'zomato', name: 'Zomato', emoji: '🍽️',
    color: '#E23744',
    description: 'Product-focused, real-time delivery systems, recommendation engines.',
    rounds: ['Tech Interview', 'System Design', 'Product Case', 'Behavioral'],
    focusAreas: ['Product Thinking', 'System Design', 'Recommendations', 'Scalability'],
    difficulty: 'medium',
    skills: ['System Design', 'Product Sense', 'Algorithms', 'Recommendation Systems'],
    questionPatterns: ['Design restaurant search', 'Recommendation engine', 'Product metrics', 'Delivery ETA'],
  },
];

// @route GET /api/companies
const getCompanies = (req, res) => {
  // Strip internal question patterns from public response
  const safe = COMPANIES.map(({ questionPatterns: _, ...c }) => c);
  res.json({ success: true, companies: safe });
};

// @route GET /api/companies/:id
const getCompanyById = (req, res) => {
  const company = COMPANIES.find((c) => c.id === req.params.id);
  if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });
  const { questionPatterns: _, ...safe } = company;
  res.json({ success: true, company: safe });
};

// @route POST /api/companies/:id/generate
// Generate a company-specific interview session
const generateCompanyInterview = async (req, res, next) => {
  try {
    const company = COMPANIES.find((c) => c.id === req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    const { targetRole = 'Software Engineer', count = 10 } = req.body;
    const safeRole = sanitizeRole(targetRole);
    const clampedCount = Math.min(15, Math.max(5, parseInt(count) || 10));

    const prompt = `You are a ${company.name} interviewer. Generate exactly ${clampedCount} interview questions
for a ${safeRole} position at ${company.name}.

Company focus: ${company.focusAreas.join(', ')}
Typical question patterns: ${company.questionPatterns.join(', ')}
Difficulty: ${company.difficulty}

Return ONLY a valid JSON array, no markdown:
[
  {
    "question": "question text",
    "type": "technical|behavioral|system_design|hr",
    "difficulty": "easy|medium|hard",
    "expectedAnswer": "key points for a strong answer",
    "companyContext": "why ${company.name} asks this type of question"
  }
]

Mix: 40% technical coding, 30% system design, 20% behavioral, 10% HR/culture fit.`;

    const text    = await ask(prompt);
    const questions = parseJSON(text);

    if (!Array.isArray(questions)) throw new Error('Invalid AI response');

    const interview = await Interview.create({
      userId:        req.user._id,
      role:          safeRole,
      skills:        company.skills,
      difficulty:    company.difficulty,
      interviewType: 'mixed',
      questions: questions.map((q) => ({
        question:       q.question,
        type:           ['technical','hr','scenario','behavioral'].includes(q.type) ? q.type : 'technical',
        difficulty:     ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : company.difficulty,
        expectedAnswer: q.expectedAnswer || '',
      })),
    });

    res.json({ success: true, interview, company: { name: company.name, emoji: company.emoji, focusAreas: company.focusAreas } });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/companies/:id/readiness
// Compute company readiness score based on user's interview history
const getReadinessScore = async (req, res, next) => {
  try {
    const company = COMPANIES.find((c) => c.id === req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found.' });

    // Get last 10 completed interviews for relevance
    const interviews = await Interview.find({
      userId: req.user._id,
      status: 'completed',
    }).sort({ createdAt: -1 }).limit(10).select('overallScore difficulty role');

    if (!interviews.length) {
      return res.json({ success: true, readinessScore: 0, message: 'Complete some interviews first to see your readiness score.' });
    }

    const avgScore = interviews.reduce((s, i) => s + i.overallScore, 0) / interviews.length;
    const hardInterviews = interviews.filter((i) => i.difficulty === 'hard').length;
    const difficultyBonus = company.difficulty === 'hard' ? (hardInterviews / interviews.length) * 20 : 10;

    const readinessScore = Math.min(100, Math.round(avgScore * 8 + difficultyBonus));

    res.json({ success: true, readinessScore, avgScore: Math.round(avgScore * 10) / 10, totalInterviews: interviews.length });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCompanies, getCompanyById, generateCompanyInterview, getReadinessScore };
