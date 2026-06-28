/**
 * CodeReviewService — AI review of submitted code.
 */
const { ask, parseJSON } = require('./geminiClient');
const { sanitizeInput } = require('../utils/promptSanitizer');

const validateReview = (obj) => {
  const score = Number(obj?.score);
  return {
    score: Number.isFinite(score) ? Math.min(10, Math.max(0, Math.round(score))) : 5,
    feedback: typeof obj?.feedback === 'string' ? obj.feedback.substring(0, 1000) : '',
    timeComplexity: typeof obj?.timeComplexity === 'string' ? obj.timeComplexity : 'N/A',
    spaceComplexity: typeof obj?.spaceComplexity === 'string' ? obj.spaceComplexity : 'N/A',
    improvements: Array.isArray(obj?.improvements) ? obj.improvements.slice(0, 5).map(String) : [],
    codeQuality: Number.isFinite(Number(obj?.codeQuality)) ? Number(obj.codeQuality) : score,
    correctness: Number.isFinite(Number(obj?.correctness)) ? Number(obj.correctness) : score,
  };
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
    return validateReview(parseJSON(text));
  } catch (err) {
    if (err.message.includes('GEMINI_API_KEY')) throw err;
    const score = Math.round((testResults.passed / Math.max(testResults.total, 1)) * 10);
    return validateReview({ score, feedback: 'Reviewed based on test results.', codeQuality: score, correctness: score });
  }
};

module.exports = { reviewCode };
