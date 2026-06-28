const { GoogleGenerativeAI } = require('@google/generative-ai');

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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Gemini 503 = server overloaded (temporary), 429 = rate limit
// Retry up to 3 times with exponential backoff: 2s → 4s → 8s
const ask = async (prompt, retriesLeft = 3) => {
  try {
    const model = getModel();
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    const msg = err.message || '';
    const is503 = msg.includes('503') || err.status === 503;
    const is429 = msg.includes('429') || err.status === 429;
    const isOverload = msg.toLowerCase().includes('overload') || msg.toLowerCase().includes('high demand');

    if ((is503 || is429 || isOverload) && retriesLeft > 0) {
      const waitMs = (4 - retriesLeft) * 2000; // 2s, 4s, 8s
      await sleep(waitMs);
      return ask(prompt, retriesLeft - 1);
    }

    // All retries exhausted or non-retryable error — throw a clean message
    if (is503 || isOverload) {
      throw new Error('AI service is temporarily overloaded. Please try again in a moment.');
    }
    if (is429) {
      throw new Error('AI request limit reached. Please wait a minute and try again.');
    }
    throw err;
  }
};

const parseJSON = (text) => {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  return JSON.parse(cleaned);
};

module.exports = { ask, parseJSON };
