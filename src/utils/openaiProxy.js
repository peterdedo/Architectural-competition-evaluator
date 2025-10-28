/**
 * Volania na vlastný backend proxy – bez OpenAI API kľúča v prehliadači.
 * Produkcia: relatívne `/api/openai/...` (napr. Vercel serverless).
 * Dev: Vite proxy → server/openai-proxy.mjs (OPENAI_API_KEY v .env).
 *
 * Voliteľne: VITE_API_BASE_URL (bez koncového lomítka) pre absolútny pôvod API.
 */

/** Očakávaná verzia diagnostického kontraktu – zosúlaďte s server/openai-proxy.mjs a api/openai/health.js */
export const OPENAI_PROXY_DIAG_VERSION = 'openai-diag-v2';

/** Kód chyby zo serverless api/openai/models.js, keď je výpis modelov vypnutý (predvolené na Vercel). */
export const OPENAI_MODELS_LIST_DISABLED_CODE = 'OPENAI_MODELS_LIST_DISABLED';

/** Kód chyby z proxy pri prekročení stropu veľkosti tela POST /api/openai/chat (413). */
export const OPENAI_CHAT_PAYLOAD_TOO_LARGE_CODE = 'OPENAI_CHAT_PAYLOAD_TOO_LARGE';

/** Model nie je na allowliste servera (400). */
export const OPENAI_CHAT_MODEL_NOT_ALLOWED_CODE = 'OPENAI_CHAT_MODEL_NOT_ALLOWED';

/** Chýba neprázdne pole model v tele POST /api/openai/chat (400). */
export const OPENAI_CHAT_MODEL_MISSING_CODE = 'OPENAI_CHAT_MODEL_MISSING';

function trimBase(base) {
  return (base || '').replace(/\/$/, '');
}

/**
 * @param {string} path napr. '/api/openai/chat'
 */
export function openAiProxyUrl(path) {
  const p = path.startsWith('/') ? path : `/${path}`;
  const base = trimBase(import.meta.env.VITE_API_BASE_URL);
  if (base) return `${base}${p}`;
  return p;
}

/**
 * POST /api/openai/chat – telo = OpenAI Chat Completions request JSON (model, messages, …).
 * @param {Record<string, unknown>} body
 * @returns {Promise<Response>}
 */
export async function postOpenAiChatCompletions(body) {
  return fetch(openAiProxyUrl('/api/openai/chat'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

/**
 * GET /api/openai/models – zoznam modelov (test pripojenia).
 * Na Vercel je endpoint predvolene vypnutý (403 OPENAI_MODELS_LIST_DISABLED), pokiaľ nie je OPENAI_ALLOW_MODELS_LIST=true.
 * @returns {Promise<Response>}
 */
export async function getOpenAiModels() {
  return fetch(openAiProxyUrl('/api/openai/models'), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}

/**
 * GET /api/openai/health – neobsahuje tajné hodnoty, len mode / verzia / či je nastavený kľúč na serveri.
 * @returns {Promise<Response>}
 */
export async function getOpenAiHealth() {
  return fetch(openAiProxyUrl('/api/openai/health'), {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
}
