/**
 * Vercel Serverless: proxy na OpenAI Chat Completions.
 * Env: OPENAI_API_KEY (server only).
 * OPENAI_CHAT_MAX_BODY_BYTES – volitelný strop velikosti JSON těla (viz server/openai-chat-limits.mjs).
 */
import {
  getOpenAiChatMaxBodyBytes,
  validateChatRequestModel,
} from '../../server/openai-chat-limits.mjs';

export default async function handler(req, res) {
  const sendError = (status, message, details = '', code = '') => {
    res.status(status).json({
      error: message,
      details,
      ...(code
        ? {
            errorInfo: { code, message, details },
          }
        : {}),
    });
  };

  if (req.method !== 'POST') {
    sendError(405, 'Method not allowed');
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    sendError(
      503,
      'OPENAI_API_KEY is not configured on the server',
      'Na Vercel přidejte OPENAI_API_KEY v Project Settings → Environment Variables a znovu nasaďte.',
      'OPENAI_KEY_MISSING'
    );
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      sendError(400, 'Invalid JSON body');
      return;
    }
  }
  if (!body || typeof body !== 'object') {
    sendError(400, 'Expected JSON object body');
    return;
  }

  const modelCheck = validateChatRequestModel(body);
  if (!modelCheck.ok) {
    sendError(
      400,
      modelCheck.code === 'OPENAI_CHAT_MODEL_MISSING'
        ? 'Chat request must include a non-empty string field "model"'
        : `Model "${modelCheck.model}" is not allowed on this proxy`,
      'Výchozí povolené modely jsou gpt-4o a gpt-4o-mini. Rozšíření: OPENAI_CHAT_ALLOWED_MODELS na serveru (čárkou oddělené ID).',
      modelCheck.code
    );
    return;
  }

  const maxBytes = getOpenAiChatMaxBodyBytes();
  let serialized;
  try {
    serialized = JSON.stringify(body);
  } catch {
    sendError(
      400,
      'Request body is not JSON-serializable',
      'Zkontrolujte strukturu messages (žádné cyklické reference).',
      'OPENAI_CHAT_BODY_INVALID'
    );
    return;
  }
  const byteLength = Buffer.byteLength(serialized, 'utf8');
  if (byteLength > maxBytes) {
    sendError(
      413,
      `Chat request body exceeds limit (${byteLength} > ${maxBytes} bytes)`,
      'Zmenšete počet obrázků/stránek v jednom volání nebo zvyšte OPENAI_CHAT_MAX_BODY_BYTES na serveru (horní mez 50 MiB).',
      'OPENAI_CHAT_PAYLOAD_TOO_LARGE'
    );
    return;
  }

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: serialized,
    });
    const text = await r.text();
    const ct = r.headers.get('content-type') || 'application/json';
    res.status(r.status);
    res.setHeader('Content-Type', ct);
    res.send(text);
  } catch (e) {
    sendError(
      502,
      e instanceof Error ? e.message : 'Upstream proxy error',
      'Chyba při volání OpenAI z Vercel funkce. Zkontrolujte síť a stav OpenAI API.',
      'PROXY_UPSTREAM_ERROR'
    );
  }
}
