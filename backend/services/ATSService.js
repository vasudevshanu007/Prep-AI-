const { ask, parseJSON } = require('./geminiClient');
const { sanitizeInput } = require('../utils/promptSanitizer');

const analyzeATS = async (resumeText, jobDescription, jobTitle = '') => {
  const safeResume = sanitizeInput(resumeText, 5000);
  const safeJD     = sanitizeInput(jobDescription, 3000);
  const safeTitle  = sanitizeInput(jobTitle, 100);

  const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach.

Analyze the resume against the job description and return a detailed ATS compatibility report.

RESUME:
${safeResume}

JOB DESCRIPTION:
${safeJD}
${safeTitle ? `\nJOB TITLE: ${safeTitle}` : ''}

Return ONLY valid JSON, no markdown:
{
  "atsScore": <0-100 overall ATS compatibility score>,
  "matchPercentage": <0-100 keyword match percentage>,
  "matchedKeywords": ["keyword1", "keyword2"],
  "missingKeywords": ["missing1", "missing2"],
  "skillGaps": [
    { "skill": "name", "importance": "critical|high|medium|low", "suggestion": "how to demonstrate this" }
  ],
  "sectionScores": {
    "skills": <0-100>,
    "experience": <0-100>,
    "education": <0-100>,
    "formatting": <0-100>
  },
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["actionable suggestion1", "actionable suggestion2", "actionable suggestion3"],
  "improvedSummary": "A rewritten professional summary tailored to this specific job description"
}`;

  try {
    const text = await ask(prompt);
    const result = parseJSON(text);
    // Clamp all scores to valid range
    result.atsScore = Math.min(100, Math.max(0, Number(result.atsScore) || 0));
    result.matchPercentage = Math.min(100, Math.max(0, Number(result.matchPercentage) || 0));
    if (result.sectionScores) {
      for (const key of Object.keys(result.sectionScores)) {
        result.sectionScores[key] = Math.min(100, Math.max(0, Number(result.sectionScores[key]) || 0));
      }
    }
    return result;
  } catch {
    // Fallback: simple keyword matching
    const jdWords = new Set(safeJD.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    const resumeWords = new Set(safeResume.toLowerCase().match(/\b[a-z]{3,}\b/g) || []);
    const matched = [...jdWords].filter((w) => resumeWords.has(w)).slice(0, 10);
    const missing = [...jdWords].filter((w) => !resumeWords.has(w)).slice(0, 10);
    const score = Math.round((matched.length / Math.max(jdWords.size, 1)) * 100);
    return {
      atsScore: score, matchPercentage: score,
      matchedKeywords: matched, missingKeywords: missing,
      skillGaps: [], sectionScores: { skills: score, experience: score, education: score, formatting: 70 },
      strengths: ['Resume submitted successfully'],
      weaknesses: ['Add Gemini API key for detailed analysis'],
      suggestions: ['Add your Gemini API key for detailed ATS analysis'],
      improvedSummary: '',
    };
  }
};

module.exports = { analyzeATS };
