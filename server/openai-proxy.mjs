/**
 * Lokálny dev proxy pre OpenAI (spolu s Vite).
 * Spustenie: npm run dev:proxy (alebo cez concurrently v npm run dev).
 *
 * Env: OPENAI_API_KEY (načíta sa z .env / .env.local v koreňovom adresári projektu)
 * Port: OPENAI_PROXY_PORT (default 8792 — mimo typický zombie na 8788)
 *
 * Diagnostika: GET /api/openai/health – vždy 200, aj bez kľúča (synchronizujte PROXY_DIAG_VERSION s api/openai/health.js a openaiProxy.js).
 */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import dotenv from 'dotenv';
import { getOpenAiChatMaxBodyBytes, validateChatRequestModel } from './openai-chat-limits.mjs';

const PROXY_DIAG_VERSION = 'openai-diag-v2';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
// override: true — hodnoty z .env vždy přebijí systémové / uživatelské proměnné Windows
// (jinak prázdný OPENAI_API_KEY v OS ignoruje klíč v souboru a proxy hlásí „NE“).
dotenv.config({ path: path.join(repoRoot, '.env'), override: true });
dotenv.config({ path: path.join(repoRoot, '.env.local'), override: true });

const PORT = Number(process.env.OPENAI_PROXY_PORT || 8792);
const KEY = (process.env.OPENAI_API_KEY || '').trim();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  /** Jednotná cesta bez koncového lomítka (aby /api/openai/health/ nespadlo do globálního KEY guardu). */
  const pathname = (url.pathname || '/').replace(/\/+$/, '') || '/';

  const sendJson = (status, obj) => {
    const body = JSON.stringify(obj);
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(body),
    });
    res.end(body);
  };
  const sendError = (status, message, details = '', code = '') => {
    sendJson(status, {
      error: message,
      details,
      ...(code
        ? {
            errorInfo: { code, message, details },
          }
        : {}),
    });
  };

  // Diagnostika: vždy pred kontrolou KEY – aby šlo zistiť „proxy beží“ aj bez .env
  if (req.method === 'GET' && pathname === '/api/openai/health') {
    sendJson(200, {
      ok: true,
      mode: 'local-proxy',
      proxyVersion: PROXY_DIAG_VERSION,
      hasOpenAiKey: Boolean(KEY),
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!KEY) {
    sendError(
      503,
      'OPENAI_API_KEY is not set',
      'V kořenovém adresáři projektu (viz výstup terminálu „Kořen pro .env“) vytvořte nebo upravte .env nebo .env.local s řádkem OPENAI_API_KEY=sk-... (ne VITE_OPENAI_KEY – to proxy nečte). Po změně úplně zastavte a znovu spusťte npm run dev. Viz .env.example. GET /api/openai/health stále funguje pro diagnostiku.',
      'OPENAI_KEY_MISSING'
    );
    return;
  }

  try {
    if (req.method === 'POST' && pathname === '/api/openai/chat') {
      const maxBytes = getOpenAiChatMaxBodyBytes();
      const chunks = [];
      let total = 0;
      for await (const chunk of req) {
        total += chunk.length;
        if (total > maxBytes) {
          sendError(
            413,
            `Chat request body exceeds limit (${total} > ${maxBytes} bytes)`,
            'Zmenšete tělo požadavku nebo nastavte OPENAI_CHAT_MAX_BODY_BYTES v .env (viz .env.example).',
            'OPENAI_CHAT_PAYLOAD_TOO_LARGE'
          );
          req.destroy();
          return;
        }
        chunks.push(chunk);
      }
      const rawBody = Buffer.concat(chunks);

      let parsedBody;
      try {
        parsedBody = JSON.parse(rawBody.toString('utf8'));
      } catch {
        sendError(
          400,
          'Invalid JSON body',
          'Tělo musí být platný JSON objekt (Chat Completions).',
          'OPENAI_CHAT_BODY_INVALID'
        );
        return;
      }
      if (!parsedBody || typeof parsedBody !== 'object') {
        sendError(
          400,
          'Expected JSON object body',
          'Očekáván objekt s polem model a messages.',
          'OPENAI_CHAT_BODY_INVALID'
        );
        return;
      }
      const modelCheck = validateChatRequestModel(parsedBody);
      if (!modelCheck.ok) {
        sendError(
          400,
          modelCheck.code === 'OPENAI_CHAT_MODEL_MISSING'
            ? 'Chat request must include a non-empty string field "model"'
            : `Model "${modelCheck.model}" is not allowed on this proxy`,
          'Povolené modely: výchozí gpt-4o, gpt-4o-mini — viz OPENAI_CHAT_ALLOWED_MODELS v .env.example.',
          modelCheck.code
        );
        return;
      }

      const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${KEY}`,
        },
        body: rawBody,
      });
      const text = await r.text();
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(text);
      return;
    }

    // GET /models: na rozdíl od Vercel zde ponecháno zapnuté – proxy naslouchá jen 127.0.0.1 (ne veřejný internet).
    if (req.method === 'GET' && pathname === '/api/openai/models') {
      const r = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${KEY}` },
      });
      const text = await r.text();
      res.writeHead(r.status, { 'Content-Type': 'application/json' });
      res.end(text);
      return;
    }

    res.writeHead(404);
    res.end();
  } catch (e) {
    sendError(
      502,
      e instanceof Error ? e.message : 'Proxy error',
      'Chyba při volání OpenAI z lokálního proxy. Zkontrolujte síť a dostupnost api.openai.com.',
      'PROXY_UPSTREAM_ERROR'
    );
  }
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error('\n[openai-proxy] CHYBA: port je obsazený (EADDRINUSE)');
    console.error(`  Adresa: 127.0.0.1:${PORT}`);
    console.error(
      '  Pravděpodobně běží starý openai-proxy z předchozího npm run dev, druhý terminál, nebo jiný projekt na stejném portu.'
    );
    console.error('  Vite pak může běžet, ale odpovídá cizí proces — v aplikaci uvidíte matoucí diagnostiku (/health jako starý proxy).\n');
    console.error('  Windows (CMD):');
    console.error(`    netstat -ano | findstr :${PORT}`);
    console.error('    taskkill /PID <PID_z_posledniho_sloupce> /F');
    console.error('\n  Windows (PowerShell):');
    console.error(`    Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess`);
    console.error('    Stop-Process -Id <OwningProcess> -Force');
    console.error('\n  Poté znovu: npm run dev   (nebo jen npm run dev:proxy)\n');
    process.exit(1);
  }
  console.error('[openai-proxy] Chyba serveru:', err);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  const keyLine = KEY ? 'ano (načteno z .env / .env.local)' : 'NE — doplňte .env, pak restart npm run dev';
  console.info('');
  console.info('══════════════════════════════════════════════════════════════');
  console.info(`  openai-proxy   ·  ${PROXY_DIAG_VERSION}`);
  console.info(`  Naslouchá      ·  http://127.0.0.1:${PORT}  →  OpenAI (chat, models)`);
  console.info(`  Kořen .env     ·  ${repoRoot}`);
  console.info(`  OPENAI_API_KEY ·  ${keyLine}`);
  console.info('══════════════════════════════════════════════════════════════');
  console.info('');
  if (!KEY) {
    console.warn(
      '[openai-proxy] Bez klíče: GET /api/openai/health → 200 (diagnostika); POST /chat a GET /models → 503 OPENAI_KEY_MISSING.'
    );
  }
});
