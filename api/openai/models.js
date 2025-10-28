/**
 * Vercel Serverless: proxy na OpenAI GET /v1/models (test kľúča).
 * Env: OPENAI_API_KEY (server only).
 *
 * Bezpečnost: veřejný výpis modelů zbytečně odhaluje platnost klíče a zvyšuje náklady.
 * Výchozí stav je zamítnout – zapněte jen explicitně: OPENAI_ALLOW_MODELS_LIST=true
 * (kontrola před ověřením klíče, aby nešlo odvodit „klíč je nastaven“).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  if (process.env.OPENAI_ALLOW_MODELS_LIST !== 'true') {
    res.status(403).json({
      error: {
        code: 'OPENAI_MODELS_LIST_DISABLED',
        message: 'GET /api/openai/models is disabled on this deployment',
        details: {
          hint:
            'Na Vercel je výpis modelů ve výchozím stavu vypnutý (zneužití veřejného endpointu). ' +
            'Chat (/api/openai/chat) tím není ovlivněn. Pokud ho opravdu potřebujete, nastavte OPENAI_ALLOW_MODELS_LIST=true v Environment Variables.',
        },
      },
    });
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

  try {
    const r = await fetch('https://api.openai.com/v1/models', {
      headers: { Authorization: `Bearer ${key}` },
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
