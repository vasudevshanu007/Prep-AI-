/**
 * Prompt Injection Sanitizer
 *
 * Prevents adversarial inputs from hijacking AI prompts.
 * All user-supplied strings must pass through here before
 * being interpolated into a Gemini prompt string.
 */

// Patterns that are characteristic of prompt injection attempts
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|prompts?|context)/i,
  /forget\s+(all\s+)?(previous|prior)/i,
  /disregard\s+(all\s+)?(previous|prior|above)/i,
  /you\s+are\s+now\s+a\b/i,
  /act\s+as\s+(a\s+|an\s+)?(?!interviewer|hiring)/i,   // allow "act as interviewer"
  /pretend\s+(you\s+are|to\s+be)/i,
  /new\s+(system\s+)?instructions?\s*:/i,
  /\[SYSTEM\]/i,
  /\[INST\]/i,
  /<\|im_start\|>/i,
  /###\s*(instruction|system|user|assistant|prompt)/i,
  /---\s*END\s+OF\s+PROMPT/i,
  /jailbreak/i,
  /DAN\s+mode/i,
];

/**
 * Sanitize free-form user text (answers, messages).
 * @param {*}      input     - value from req.body
 * @param {number} maxLength - hard character cap
 */
const sanitizeInput = (input, maxLength = 2000) => {
  if (typeof input !== 'string') return '';

  let out = input
    .substring(0, maxLength)
    .replace(/\x00/g, '')              // null bytes
    .replace(/[\r\n]{4,}/g, '\n\n\n') // collapse excessive blank lines
    .trim();

  for (const pattern of INJECTION_PATTERNS) {
    out = out.replace(pattern, '[removed]');
  }

  return out;
};

/**
 * Sanitize a job role string — strict allow-list of characters.
 */
const sanitizeRole = (role) => {
  if (typeof role !== 'string') return 'Software Engineer';
  const clean = role
    .replace(/[^a-zA-Z0-9\s/().,&+'#-]/g, '')
    .substring(0, 100)
    .trim();
  return clean || 'Software Engineer';
};

/**
 * Sanitize an array of skill strings.
 */
const sanitizeSkills = (skills) => {
  if (!Array.isArray(skills)) return [];
  return skills
    .filter((s) => typeof s === 'string')
    .map((s) =>
      s
        .replace(/[^a-zA-Z0-9\s.+#/-]/g, '')
        .substring(0, 50)
        .trim()
    )
    .filter((s) => s.length > 0)
    .slice(0, 10);
};

/**
 * Sanitize conversation history before passing to the chatbot prompt.
 * Strips excess messages, neutralizes injections, enforces per-message length.
 */
const sanitizeConversationHistory = (history) => {
  if (!Array.isArray(history)) return [];
  return history
    .slice(-10)
    .map((msg) => ({
      role: msg.role === 'assistant' ? 'assistant' : 'user',
      content: sanitizeInput(String(msg.content || ''), 500),
    }))
    .filter((msg) => msg.content.length > 0);
};

module.exports = {
  sanitizeInput,
  sanitizeRole,
  sanitizeSkills,
  sanitizeConversationHistory,
};
