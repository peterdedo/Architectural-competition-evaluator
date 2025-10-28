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
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    res.status(503).json({
      error: {
        code: 'OPENAI_KEY_MISSING',
        message: 'OPENAI_API_KEY is not configured on the server',
        details: {
          hint: 'Na Vercel přidejte OPENAI_API_KEY v Project Settings → Environment Variables a znovu nasaďte.',
        },
      },
    });
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      res.status(400).json({ error: { message: 'Invalid JSON body' } });
      return;
    }
  }
  if (!body || typeof body !== 'object') {
    res.status(400).json({ error: { message: 'Expected JSON object body' } });
    return;
  }

  const modelCheck = validateChatRequestModel(body);
  if (!modelCheck.ok) {
    res.status(400).json({
      error: {
        code: modelCheck.code,
        message:
          modelCheck.code === 'OPENAI_CHAT_MODEL_MISSING'
            ? 'Chat request must include a non-empty string field "model"'
            : `Model "${modelCheck.model}" is not allowed on this proxy`,
        details: {
          hint:
            'Výchozí povolené modely jsou gpt-4o a gpt-4o-mini. Rozšíření: OPENAI_CHAT_ALLOWED_MODELS na serveru (čárkou oddělené ID).',
          allowedModels: modelCheck.allowed,
        },
      },
    });
    return;
  }

  const maxBytes = getOpenAiChatMaxBodyBytes();
  let serialized;
  try {
    serialized = JSON.stringify(body);
  } catch {
    res.status(400).json({
      error: {
        code: 'OPENAI_CHAT_BODY_INVALID',
        message: 'Request body is not JSON-serializable',
        details: { hint: 'Zkontrolujte strukturu messages (žádné cyklické reference).' },
      },
    });
    return;
  }
  const byteLength = Buffer.byteLength(serialized, 'utf8');
  if (byteLength > maxBytes) {
    res.status(413).json({
      error: {
        code: 'OPENAI_CHAT_PAYLOAD_TOO_LARGE',
        message: `Chat request body exceeds limit (${byteLength} > ${maxBytes} bytes)`,
        details: {
          hint:
            'Zmenšete počet obrázků/stránek v jednom volání nebo zvyšte OPENAI_CHAT_MAX_BODY_BYTES na serveru (horní mez 50 MiB).',
          maxBytes,
          actualBytes: byteLength,
        },
      },
    });
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
    res.status(502).json({
      error: {
        code: 'PROXY_UPSTREAM_ERROR',
        message: e instanceof Error ? e.message : 'Upstream proxy error',
        details: {
          hint: 'Chyba při volání OpenAI z Vercel funkce. Zkontrolujte síť a stav OpenAI API.',
        },
      },
    });
  }
}
