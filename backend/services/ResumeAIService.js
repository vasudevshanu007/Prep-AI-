/**
 * ResumeAIService — ATS analysis of resume text.
 */
const { ask, parseJSON } = require('./geminiClient');
const { sanitizeInput } = require('../utils/promptSanitizer');

const analyzeResume = async (resumeText) => {
  const safeText = sanitizeInput(resumeText, 4000);

  const prompt = `You are an expert ATS system and career counselor. Analyze this resume text:

${safeText}

Return ONLY valid JSON, no markdown:
{
  "atsScore": <0-100>,
  "overallScore": <0-100>,
  "sections": {
    "contact": <0-100>, "summary": <0-100>, "experience": <0-100>,
    "skills": <0-100>, "education": <0-100>, "projects": <0-100>
  },
  "strengths": ["..."],
  "weaknesses": ["..."],
  "suggestions": ["..."],
  "keywords": ["..."],
  "missingKeywords": ["..."],
  "summary": "2-3 sentence resume assessment"
}`;

  const text = await ask(prompt);
  return parseJSON(text);
};

module.exports = { analyzeResume };
