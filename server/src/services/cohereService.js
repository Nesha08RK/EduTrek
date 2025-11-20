import { CohereClient } from 'cohere-ai';

let client = null;

function getClient() {
  if (!client) {
    const token = process.env.COHERE_API_KEY;
    if (!token) {
      throw new Error('COHERE_API_KEY not configured');
    }
    client = new CohereClient({ token });
  }
  return client;
}

async function logAvailableModels() {
  try {
    const client = getClient();
    const res = await client.models.list();
    const names = (res?.models || []).map((m) => m.name || m.id || m).join(', ');
    console.error('[cohere] Available models:', names || '(none returned)');
  } catch (e) {
    console.error('[cohere] Failed to list models:', e?.message || e);
  }
}

/**
 * Calls Cohere chat to generate a response.
 * @param {string} message - The user's message
 * @param {Array<{role: 'USER'|'CHATBOT'|'SYSTEM', message: string}>} history - Optional prior turns
 * @returns {Promise<string>} - The assistant response text
 */
export async function chatWithCohere(message, history = []) {
  const client = getClient();

  // Map history to Cohere's chat_history format if provided
  const chat_history = history.map((h) => ({
    role: h.role?.toLowerCase() === 'user' ? 'USER' : h.role?.toUpperCase() || 'USER',
    message: h.message,
  }));

  const preferred = process.env.COHERE_MODEL;
  const modelsToTry = [
    ...(preferred ? [preferred] : []),
    // Newer/current generative chat models (as per account listing)
    'command-a-03-2025',
    'command-a-reasoning-08-2025',
    'command-r-plus-08-2024',
    'command-r-08-2024',
    // Aya family (may be available as general chat models)
    'c4ai-aya-expanse-32b',
    'c4ai-aya-expanse-8b',
    // Legacy fallbacks (likely removed, kept for completeness)
    'command',
    'command-light',
    'command-mini'
  ];

  let lastErr = null;
  for (const model of modelsToTry) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[cohere] Using model: ${model}`);
      }
      const response = await client.chat({
        model,
        message,
        chat_history,
        temperature: 0.3,
      });
      return response.text ?? 'Sorry, I could not generate a response at the moment.';
    } catch (err) {
      lastErr = err;
      const msg = (err && err.message) ? err.message : String(err);
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[cohere] Model ${model} failed:`, msg);
      }
      // If it's a 404 NotFoundError for a removed model, try next; otherwise rethrow
      const isNotFound = msg && /notfound|404/i.test(msg);
      if (!isNotFound) {
        break;
      }
    }
  }
  await logAvailableModels();
  throw lastErr || new Error('Cohere chat failed for all models');
}

/**
 * Generate a 10-question quiz for a given topic using Cohere. Returns normalized JSON.
 * Each question: { id, prompt, options: string[3-5], correctIndex, explanation, difficulty }
 * @param {string} topic
 * @param {('mixed'|'easy'|'medium'|'hard')} difficulty
 * @returns {Promise<Array>}
 */
export async function generateQuizQuestions(topic, difficulty = 'mixed') {
  const client = getClient();

  const preferred = process.env.COHERE_MODEL;
  const modelsToTry = [
    ...(preferred ? [preferred] : []),
    'command-a-03-2025',
    'command-a-reasoning-08-2025',
    'command-r-plus-08-2024',
    'command-r-08-2024',
  ];

  const systemPrompt = `You are a meticulous quiz generator for the topic: ${topic}.
Generate 10 multiple-choice questions. Each must have 4 options, exactly one correct.
Difficulty: ${difficulty}. Provide concise explanations.
Return ONLY valid JSON array (no code fences, no commentary), with the schema:
[
  {
    "id": string,              // a short unique id
    "prompt": string,          // the question text
    "options": [string, string, string, string],
    "correctIndex": 0|1|2|3,   // integer index of the correct option
    "explanation": string,     // short explanation
    "difficulty": "easy"|"medium"|"hard"
  }, ... 10 items total
]`;

  let lastErr = null;
  for (const model of modelsToTry) {
    try {
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[cohere] Generating quiz with model: ${model}`);
      }
      const response = await client.chat({
        model,
        message: systemPrompt,
        temperature: 0.3,
      });
      const text = (response.text || '').trim();
      const json = extractJSONArray(text);
      if (!Array.isArray(json) || json.length === 0) {
        throw new Error('Model returned empty or non-array JSON');
      }
      // Normalize and validate
      const normalized = json.slice(0, 10).map((q, idx) => ({
        id: String(q.id ?? idx + 1),
        prompt: String(q.prompt ?? ''),
        options: Array.isArray(q.options) ? q.options.map(String).slice(0, 4) : [],
        correctIndex: Number.isInteger(q.correctIndex) ? q.correctIndex : 0,
        explanation: String(q.explanation ?? ''),
        difficulty: ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : 'medium',
      })).filter(q => q.prompt && q.options.length === 4);
      if (normalized.length < 10) {
        // If less than 10 validated, that's still acceptable; client can handle fewer
        console.warn(`[quiz] Only ${normalized.length} valid questions generated`);
      }
      return normalized;
    } catch (err) {
      lastErr = err;
      const msg = err?.message || String(err);
      if (process.env.NODE_ENV !== 'production') {
        console.error(`[cohere] Quiz generation with ${model} failed:`, msg);
      }
    }
  }
  await logAvailableModels();
  throw lastErr || new Error('Failed to generate quiz questions');
}

// Utility: extract first JSON array from a string (strips code fences if present)
function extractJSONArray(text) {
  try {
    // Strip markdown code fences
    const cleaned = text.replace(/^```[a-zA-Z]*\n|```$/g, '').trim();
    if (cleaned.startsWith('[')) return JSON.parse(cleaned);
    // Find first '[' and last ']'
    const start = cleaned.indexOf('[');
    const end = cleaned.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
      const slice = cleaned.slice(start, end + 1);
      return JSON.parse(slice);
    }
  } catch (e) {
    // fall through
  }
  return [];
}
