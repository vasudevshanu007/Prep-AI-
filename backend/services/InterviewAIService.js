/**
 * InterviewAIService — question generation, answer evaluation, overall feedback.
 */
const { ask, parseJSON } = require('./geminiClient');
const { sanitizeRole, sanitizeSkills, sanitizeInput } = require('../utils/promptSanitizer');
const cache = require('../utils/cache');

const validateEvaluation = (obj) => {
  const score = Number(obj?.score);
  return {
    score: Number.isFinite(score) ? Math.min(10, Math.max(0, Math.round(score))) : 5,
    feedback: typeof obj?.feedback === 'string' ? obj.feedback.substring(0, 1000) : 'No feedback.',
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

const getFallbackQuestion = (role, index) => {
  const questions = [
    `Tell me about your experience as a ${role}.`,
    'What are your greatest technical strengths?',
    'Describe a challenging project you worked on.',
    'How do you approach debugging a difficult problem?',
    'Explain a design pattern you have used.',
    'How do you ensure code quality?',
    'Where do you see yourself in 5 years?',
    'Describe a conflict and how you resolved it.',
    'What is your approach to learning new technologies?',
    'How do you handle tight deadlines?',
  ];
  return questions[index % questions.length];
};

const generateInterviewQuestions = async ({ role, skills, difficulty, count = 10 }) => {
  const safeRole = sanitizeRole(role);
  const safeSkills = sanitizeSkills(skills);

  const cacheKey = [safeRole, [...safeSkills].sort().join(','), difficulty, count];
  const cached = cache.get('questions', cacheKey);
  if (cached) return cached;

  try {
    const prompt = `You are an expert technical interviewer. Generate exactly ${count} interview questions for a ${safeRole} position.
Skills to focus on: ${safeSkills.length ? safeSkills.join(', ') : 'general software engineering'}
Difficulty level: ${difficulty}

Return ONLY a valid JSON array, no extra text, no markdown fences:
[{ "question": "...", "type": "technical", "difficulty": "${difficulty}", "expectedAnswer": "..." }]

Rules:
- 60% technical, 20% behavioral/HR, 20% scenario-based
- type: technical | hr | scenario | behavioral
- Return exactly ${count} questions`;

    const text = await ask(prompt);
    const parsed = parseJSON(text);
    if (!Array.isArray(parsed)) throw new Error('Invalid AI response');
    cache.set('questions', cacheKey, parsed, 15 * 60 * 1000);
    return parsed;
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    console.error('Question gen error:', err.message);
    return Array.from({ length: count }, (_, i) => ({
      question: getFallbackQuestion(safeRole, i),
      type: i % 4 === 0 ? 'hr' : 'technical',
      difficulty,
      expectedAnswer: 'Demonstrate knowledge, give examples.',
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
{"score": <0-10>, "feedback": "...", "strengths": ["..."], "improvements": ["..."]}`;

    const text = await ask(prompt);
    return validateEvaluation(parseJSON(text));
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    const words = safeAnswer.trim().split(/\s+/).length;
    return validateEvaluation({
      score: Math.min(8, Math.max(2, Math.floor(words / 8))),
      feedback: 'Answer evaluated on length. Add Gemini key for AI feedback.',
      strengths: ['Response provided'],
      improvements: ['Add more detail', 'Use specific examples'],
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
{"summary": "...", "strengths": ["..."], "improvements": ["..."], "recommendedTopics": ["..."]}`;

    const text = await ask(prompt);
    return validateFeedback(parseJSON(text));
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    return validateFeedback({
      summary: `You scored ${overallScore}/10. Keep practising!`,
      strengths: ['Completed the interview'],
      improvements: ['Review weak areas'],
      recommendedTopics: ['Data Structures', 'System Design'],
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
After acknowledging the answer, ask ONE follow-up question.

Recent conversation:
${history}

Candidate just said: "${safeMessage}"

Your response as interviewer:`;

    return await ask(prompt);
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    const fallbacks = [
      'Thank you. Can you walk me through a specific example?',
      'Interesting. How did that shape your approach to similar problems?',
      'Good answer. Can you describe a similar challenge you faced?',
    ];
    return fallbacks[questionIndex % fallbacks.length];
  }
};

module.exports = { generateInterviewQuestions, evaluateAnswer, generateInterviewFeedback, getChatbotResponse };
