/**
 * Společný limit velikosti těla pro POST /api/openai/chat (serverless + lokální proxy).
 * Env: OPENAI_CHAT_MAX_BODY_BYTES (číslo v bajtech), jinak výchozí 10 MiB.
 */
export const DEFAULT_OPENAI_CHAT_MAX_BODY_BYTES = 10 * 1024 * 1024;

const MIN_BYTES = 1024;
const MAX_CAP_BYTES = 50 * 1024 * 1024;

export function getOpenAiChatMaxBodyBytes() {
  const raw = process.env.OPENAI_CHAT_MAX_BODY_BYTES;
  if (raw == null || String(raw).trim() === '') {
    return DEFAULT_OPENAI_CHAT_MAX_BODY_BYTES;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < MIN_BYTES || n > MAX_CAP_BYTES) {
    return DEFAULT_OPENAI_CHAT_MAX_BODY_BYTES;
  }
  return Math.floor(n);
}

/** Výchozí povolené modely — odpovídají použití v src/ (useAIAssistant, vision, PDF, …). */
const DEFAULT_ALLOWED_CHAT_MODELS = Object.freeze(['gpt-4o', 'gpt-4o-mini']);

/**
 * Seznam povolených modelů pro POST /api/openai/chat (přesná shoda řetězce).
 * Env OPENAI_CHAT_ALLOWED_MODELS = čárkou oddělené ID (prázdné = výchozí dvojice výše).
 */
export function getAllowedChatModelIds() {
  const raw = process.env.OPENAI_CHAT_ALLOWED_MODELS;
  if (raw == null || String(raw).trim() === '') {
    return [...DEFAULT_ALLOWED_CHAT_MODELS];
  }
  return String(raw)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * @param {Record<string, unknown>} body
 * @returns {{ ok: true, model: string } | { ok: false, code: 'OPENAI_CHAT_MODEL_MISSING' | 'OPENAI_CHAT_MODEL_NOT_ALLOWED', model: string, allowed: string[] }}
 */
export function validateChatRequestModel(body) {
  const allowed = getAllowedChatModelIds();
  const model = body && typeof body.model === 'string' ? body.model.trim() : '';
  if (!model) {
    return { ok: false, code: 'OPENAI_CHAT_MODEL_MISSING', model: '', allowed };
  }
  if (!allowed.includes(model)) {
    return { ok: false, code: 'OPENAI_CHAT_MODEL_NOT_ALLOWED', model, allowed };
  }
  return { ok: true, model };
}
