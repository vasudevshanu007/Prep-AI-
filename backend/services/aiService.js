const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sanitizeInput, sanitizeRole, sanitizeSkills } = require('../utils/promptSanitizer');
const cache = require('../utils/cache');

// Lazy singleton — only initialised when first needed
let _model = null;

const getModel = () => {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'placeholder') {
    throw new Error('GEMINI_API_KEY not configured. Add it to backend/.env');
  }
  if (!_model) {
    const genAI = new GoogleGenerativeAI(key);
    _model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });
  }
  return _model;
};

// Send a prompt and return trimmed text
const ask = async (prompt) => {
  const model = getModel();
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

// Strip markdown fences and parse JSON safely
const parseJSON = (text) => {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};

// ─── Schema validators — prevent malformed AI output from corrupting DB ───────

const validateEvaluation = (obj) => {
  const score = Number(obj?.score);
  return {
    score: Number.isFinite(score) ? Math.min(10, Math.max(0, Math.round(score))) : 5,
    feedback: typeof obj?.feedback === 'string' ? obj.feedback.substring(0, 1000) : 'No feedback available.',
    strengths: Array.isArray(obj?.strengths) ? obj.strengths.slice(0, 5).map(String) : [],
    improvements: Array.isArray(obj?.improvements) ? obj.improvements.slice(0, 5).map(String) : [],
  };
};

const validateFeedback = (obj) => ({
  summary: typeof obj?.summary === 'string' ? obj.summary.substring(0, 1000) : '',
  strengths: Array.isArray(obj?.strengths) ? obj.strengths.slice(0, 5).map(String) : [],
  improvements: Array.isArray(obj?.improvements) ? obj.improvements.slice(0, 5).map(String) : [],
  recommendedTopics: Array.isArray(obj?.recommendedTopics) ? obj.recommendedTopics.slice(0, 10).map(String) : [],
});

const validateCodeReview = (obj) => {
  const score = Number(obj?.score);
  return {
    score: Number.isFinite(score) ? Math.min(10, Math.max(0, Math.round(score))) : 5,
    feedback: typeof obj?.feedback === 'string' ? obj.feedback.substring(0, 1000) : '',
    timeComplexity: typeof obj?.timeComplexity === 'string' ? obj.timeComplexity : 'N/A',
    spaceComplexity: typeof obj?.spaceComplexity === 'string' ? obj.spaceComplexity : 'N/A',
    improvements: Array.isArray(obj?.improvements) ? obj.improvements.slice(0, 5).map(String) : [],
    codeQuality: Number.isFinite(Number(obj?.codeQuality)) ? Math.min(10, Math.max(0, Number(obj.codeQuality))) : score,
    correctness: Number.isFinite(Number(obj?.correctness)) ? Math.min(10, Math.max(0, Number(obj.correctness))) : score,
  };
};

// ─── Public API ───────────────────────────────────────────────────────────────

const generateInterviewQuestions = async ({ role, skills, difficulty, count = 10 }) => {
  // Sanitize at the service boundary as a second defence layer
  const safeRole = sanitizeRole(role);
  const safeSkills = sanitizeSkills(skills);

  // Cache key — same inputs always produce the same set of questions
  const cacheKey = [safeRole, [...safeSkills].sort().join(','), difficulty, count];
  const cached = cache.get('questions', cacheKey);
  if (cached) return cached;

  try {
    const prompt = `You are an expert technical interviewer. Generate exactly ${count} interview questions for a ${safeRole} position.
Skills to focus on: ${safeSkills.length ? safeSkills.join(', ') : 'general software engineering'}
Difficulty level: ${difficulty}

Return ONLY a valid JSON array, no extra text, no markdown fences:
[
  {
    "question": "question text here",
    "type": "technical",
    "difficulty": "${difficulty}",
    "expectedAnswer": "key points expected in a good answer"
  }
]

Rules:
- 60% technical, 20% behavioral/HR, 20% scenario-based
- type must be one of: technical, hr, scenario, behavioral
- difficulty must be: easy, medium, or hard
- Return exactly ${count} questions`;

    const text = await ask(prompt);
    const parsed = parseJSON(text);
    if (!Array.isArray(parsed)) throw new Error('Invalid AI response format');
    cache.set('questions', cacheKey, parsed, 15 * 60 * 1000); // cache 15 min
    return parsed;
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    console.error('Gemini question gen error:', err.message);
    return Array.from({ length: count }, (_, i) => ({
      question: getFallbackQuestion(safeRole, i),
      type: i % 4 === 0 ? 'hr' : i % 4 === 1 ? 'scenario' : 'technical',
      difficulty,
      expectedAnswer: 'Demonstrate knowledge, give examples, be specific.',
    }));
  }
};

const evaluateAnswer = async ({ question, userAnswer, expectedAnswer, role }) => {
  const safeAnswer = sanitizeInput(userAnswer, 3000);
  const safeRole = sanitizeRole(role);

  try {
    const prompt = `You are an expert ${safeRole} interviewer evaluating this candidate answer.

Question: ${question}
Expected key points: ${expectedAnswer}
Candidate answered: ${safeAnswer}

Return ONLY valid JSON, no markdown:
{
  "score": <integer 0-10>,
  "feedback": "2-3 sentences of specific, constructive feedback",
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific improvement 1", "specific improvement 2"]
}`;

    const text = await ask(prompt);
    return validateEvaluation(parseJSON(text));
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    const words = safeAnswer.trim().split(/\s+/).length;
    return validateEvaluation({
      score: Math.min(8, Math.max(2, Math.floor(words / 8))),
      feedback: 'Answer evaluated on content length. Add your Gemini key for detailed AI feedback.',
      strengths: ['Response provided'],
      improvements: ['Provide more detail', 'Use specific examples'],
    });
  }
};

const generateInterviewFeedback = async ({ role, questions, overallScore }) => {
  try {
    const qaSummary = questions
      .filter((q) => q.userAnswer)
      .map((q, i) => `Q${i + 1} (${q.type}): "${q.question}" — Score: ${q.aiEvaluation?.score ?? 'N/A'}/10`)
      .join('\n');

    const prompt = `As a senior ${sanitizeRole(role)} hiring manager, give overall interview feedback.
Overall score: ${overallScore}/10
Questions answered:
${qaSummary}

Return ONLY valid JSON, no markdown:
{
  "summary": "2-3 sentence honest overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement area 1", "improvement area 2", "improvement area 3"],
  "recommendedTopics": ["topic to study 1", "topic to study 2", "topic to study 3"]
}`;

    const text = await ask(prompt);
    return validateFeedback(parseJSON(text));
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    return validateFeedback({
      summary: `You scored ${overallScore}/10. Keep practising!`,
      strengths: ['Completed the interview', 'Attempted all questions'],
      improvements: ['Review weak areas', 'Practice more mock interviews'],
      recommendedTopics: ['Data Structures', 'System Design', 'Communication'],
    });
  }
};

const analyzeResume = async (resumeText) => {
  const safeText = sanitizeInput(resumeText, 4000);

  const prompt = `You are an expert ATS system and career counselor. Analyze this resume text:

${safeText}

Return ONLY valid JSON, no markdown:
{
  "atsScore": <0-100>,
  "overallScore": <0-100>,
  "sections": {
    "contact": <0-100>,
    "summary": <0-100>,
    "experience": <0-100>,
    "skills": <0-100>,
    "education": <0-100>,
    "projects": <0-100>
  },
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2", "weakness 3"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3", "suggestion 4"],
  "keywords": ["found keyword 1", "found keyword 2", "found keyword 3"],
  "missingKeywords": ["missing 1", "missing 2", "missing 3"],
  "summary": "2-3 sentence resume assessment"
}`;

  const text = await ask(prompt);
  return parseJSON(text);
};

const reviewCode = async ({ problem, code, language, testResults }) => {
  try {
    const prompt = `You are a senior software engineer reviewing this code submission.

Problem: ${sanitizeInput(problem, 200)}
Language: ${language}
Test results: ${testResults.passed}/${testResults.total} passed
Code:
\`\`\`${language}
${sanitizeInput(code, 3000)}
\`\`\`

Return ONLY valid JSON, no markdown:
{
  "score": <0-10>,
  "feedback": "specific 2-3 sentence code review",
  "timeComplexity": "O(...)",
  "spaceComplexity": "O(...)",
  "improvements": ["improvement 1", "improvement 2"],
  "codeQuality": <0-10>,
  "correctness": <0-10>
}`;

    const text = await ask(prompt);
    return validateCodeReview(parseJSON(text));
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    const score = Math.round((testResults.passed / Math.max(testResults.total, 1)) * 10);
    return validateCodeReview({
      score,
      feedback: 'Code reviewed based on test results. Add your Gemini key for AI code review.',
      timeComplexity: 'N/A',
      spaceComplexity: 'N/A',
      improvements: ['Add your Gemini key for AI code review'],
      codeQuality: score,
      correctness: score,
    });
  }
};

const getChatbotResponse = async ({ conversationHistory, userMessage, role, questionIndex }) => {
  try {
    const safeRole = sanitizeRole(role);
    const safeMessage = sanitizeInput(userMessage, 500);

    const history = conversationHistory
      .slice(-8)
      .map((m) => `${m.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${m.content}`)
      .join('\n');

    const prompt = `You are an experienced ${safeRole} interviewer. Keep responses to 2-4 sentences.
After acknowledging the candidate's answer, ask ONE follow-up or next interview question.
Be professional and encouraging.

Recent conversation:
${history}

Candidate just said: "${safeMessage}"

Your response as interviewer:`;

    return await ask(prompt);
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    const followUps = [
      'Thank you for sharing that. Can you walk me through a specific example?',
      'Interesting. How did that experience shape your approach to similar problems?',
      'Good answer. Can you describe a time you faced a similar challenge?',
      'Appreciated. What would you do differently if you faced that situation again?',
      'Great. Tell me about your experience working in a team under tight deadlines.',
    ];
    return followUps[questionIndex % followUps.length];
  }
};

// ─── Feature 2: Generate single adaptive question at a given difficulty ───────
const generateAdaptiveQuestion = async ({ role, skills, difficulty, previousQuestions = [] }) => {
  const safeRole   = sanitizeRole(role);
  const safeSkills = sanitizeSkills(skills);
  const prevList   = previousQuestions.slice(-3).map((q) => `- ${q}`).join('\n');

  try {
    const prompt = `You are an adaptive AI interviewer for a ${safeRole} position.
The candidate's performance requires a ${difficulty} difficulty question next.
Skills: ${safeSkills.join(', ') || 'general software engineering'}
${prevList ? `Recent questions asked (avoid repeating):\n${prevList}` : ''}

Generate exactly ONE new ${difficulty} interview question.
Return ONLY valid JSON, no markdown:
{
  "question": "the interview question",
  "type": "technical|hr|scenario|behavioral",
  "difficulty": "${difficulty}",
  "expectedAnswer": "key points expected in a strong answer"
}`;

    const text   = await ask(prompt);
    const parsed = parseJSON(text);
    return {
      question:       String(parsed.question || ''),
      type:           ['technical','hr','scenario','behavioral'].includes(parsed.type) ? parsed.type : 'technical',
      difficulty,
      expectedAnswer: String(parsed.expectedAnswer || ''),
    };
  } catch {
    return {
      question:       getFallbackQuestion(safeRole, Math.floor(Math.random() * 10)),
      type:           'technical',
      difficulty,
      expectedAnswer: 'Demonstrate knowledge, give examples, be specific.',
    };
  }
};

// ─── Feature 13: AI Coding Mentor ────────────────────────────────────────────
const generateCodingMentor = async ({ problem, code, language, score, testResults }) => {
  const safeCode    = sanitizeInput(code, 3000);
  const safeProblem = sanitizeInput(problem, 200);

  try {
    const prompt = `You are a senior software engineer and coding mentor.
A student submitted this solution:

Problem: ${safeProblem}
Language: ${language}
Score: ${score}/10  |  Tests passed: ${testResults.passed}/${testResults.total}
Code:
\`\`\`${language}
${safeCode}
\`\`\`

Provide detailed mentorship. Return ONLY valid JSON, no markdown:
{
  "analysis": "2-3 sentence deep-dive into their approach and correctness",
  "optimizations": ["specific optimization 1", "specific optimization 2", "specific optimization 3"],
  "alternativeApproach": "describe a better/different algorithm or data structure approach",
  "bestPractices": ["industry best practice 1", "industry best practice 2"],
  "learningPath": ["topic to study next 1", "topic 2", "topic 3"]
}`;

    const text   = await ask(prompt);
    const result = parseJSON(text);
    return {
      analysis:            String(result.analysis || ''),
      optimizations:       Array.isArray(result.optimizations)       ? result.optimizations.slice(0,5).map(String)    : [],
      alternativeApproach: String(result.alternativeApproach || ''),
      bestPractices:       Array.isArray(result.bestPractices)        ? result.bestPractices.slice(0,5).map(String)    : [],
      learningPath:        Array.isArray(result.learningPath)         ? result.learningPath.slice(0,5).map(String)     : [],
    };
  } catch {
    return {
      analysis:            `You scored ${score}/10. Keep practising!`,
      optimizations:       ['Review time complexity', 'Consider edge cases', 'Add error handling'],
      alternativeApproach: 'Consider using a hash map for O(1) lookups instead of nested loops.',
      bestPractices:       ['Write clean, readable code', 'Handle edge cases first'],
      learningPath:        ['Data Structures', 'Algorithm Design', 'Big-O Analysis'],
    };
  }
};

const getFallbackQuestion = (role, index) => {
  const questions = [
    `Tell me about your experience as a ${role}.`,
    'What are your greatest technical strengths?',
    'Describe a challenging project you worked on.',
    'How do you approach debugging a difficult problem?',
    'Explain a design pattern you have used.',
    'How do you ensure code quality?',
    'Where do you see yourself in 5 years?',
    'Describe a conflict in a team and how you resolved it.',
    'What is your approach to learning new technologies?',
    'How do you handle tight deadlines?',
  ];
  return questions[index % questions.length];
};

module.exports = {
  generateInterviewQuestions,
  evaluateAnswer,
  generateInterviewFeedback,
  analyzeResume,
  reviewCode,
  getChatbotResponse,
  generateAdaptiveQuestion,
  generateCodingMentor,
};
