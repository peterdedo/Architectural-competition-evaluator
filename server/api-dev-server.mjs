/**
 * Lokální dev server pro api/auth/**, api/navrhy/** a api/scoring/** (mimo /api/openai/*,
 * to má svůj vlastní server/openai-proxy.mjs). Spouští se přes: npm run dev:api
 * (nebo automaticky přes npm run dev / concurrently).
 *
 * Volá přímo stejné handler soubory jako Vercel (api/**\/*.js, export default async
 * function handler(req, res)) – žádná duplicitní logika, jen tenký req/res shim, aby
 * se choval jako Vercel Node runtime (req.body pre-parsed JSON, req.query, res.status().json()).
 *
 * Env: POSTGRES_URL, JWT_SECRET (načteno z .env / .env.local v koreňovém adresáři).
 * Port: API_DEV_SERVER_PORT (default 8793).
 */
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, URL, pathToFileURL } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(repoRoot, '.env'), override: true });
dotenv.config({ path: path.join(repoRoot, '.env.local'), override: true });

const PORT = Number(process.env.API_DEV_SERVER_PORT || 8793);

const routes = [
  { method: 'POST', pattern: /^\/api\/auth\/login$/, file: '../api/auth/login.js' },
  { method: 'POST', pattern: /^\/api\/auth\/logout$/, file: '../api/auth/logout.js' },
  { method: 'GET', pattern: /^\/api\/auth\/me$/, file: '../api/auth/me.js' },
  { method: 'GET', pattern: /^\/api\/navrhy$/, file: '../api/navrhy/index.js' },
  { method: 'POST', pattern: /^\/api\/navrhy$/, file: '../api/navrhy/index.js' },
  { method: 'PATCH', pattern: /^\/api\/navrhy\/([^/]+)$/, file: '../api/navrhy/[id].js', params: ['id'] },
  { method: 'DELETE', pattern: /^\/api\/navrhy\/([^/]+)$/, file: '../api/navrhy/[id].js', params: ['id'] },
  { method: 'GET', pattern: /^\/api\/scoring\/summary$/, file: '../api/scoring/summary.js' },
  { method: 'GET', pattern: /^\/api\/scoring$/, file: '../api/scoring/index.js' },
  { method: 'PUT', pattern: /^\/api\/scoring$/, file: '../api/scoring/index.js' },
];

const handlerCache = new Map();
async function loadHandler(relFile) {
  if (!handlerCache.has(relFile)) {
    const mod = await import(pathToFileURL(path.join(__dirname, relFile)).href);
    handlerCache.set(relFile, mod.default);
  }
  return handlerCache.get(relFile);
}

function buildRes(nodeRes) {
  let statusCode = 200;
  const res = {
    status(code) {
      statusCode = code;
      return res;
    },
    setHeader(name, value) {
      nodeRes.setHeader(name, value);
      return res;
    },
    json(obj) {
      const body = JSON.stringify(obj);
      if (!nodeRes.getHeader('Content-Type')) nodeRes.setHeader('Content-Type', 'application/json');
      nodeRes.writeHead(statusCode);
      nodeRes.end(body);
    },
    send(text) {
      if (!nodeRes.getHeader('Content-Type')) nodeRes.setHeader('Content-Type', 'text/plain');
      nodeRes.writeHead(statusCode);
      nodeRes.end(text);
    },
  };
  return res;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  const pathname = (url.pathname || '/').replace(/\/+$/, '') || '/';

  const route = routes.find((r) => r.method === req.method && r.pattern.test(pathname));
  if (!route) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  const match = pathname.match(route.pattern);
  const query = {};
  (route.params || []).forEach((name, i) => {
    query[name] = decodeURIComponent(match[i + 1]);
  });

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  let body = undefined;
  if (raw) {
    try {
      body = JSON.parse(raw);
    } catch {
      body = raw;
    }
  }

  req.body = body;
  req.query = query;

  try {
    const handler = await loadHandler(route.file);
    await handler(req, buildRes(res));
  } catch (e) {
    console.error('[api-dev-server] Handler error:', e);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'Internal error' }));
    }
  }
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`\n[api-dev-server] CHYBA: port ${PORT} je obsazený (EADDRINUSE).`);
    console.error('  Windows (PowerShell):');
    console.error(`    Get-NetTCPConnection -LocalPort ${PORT} -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,OwningProcess`);
    console.error('    Stop-Process -Id <OwningProcess> -Force\n');
    process.exit(1);
  }
  console.error('[api-dev-server] Chyba serveru:', err);
  process.exit(1);
});

server.listen(PORT, '127.0.0.1', () => {
  console.info('');
  console.info('══════════════════════════════════════════════════════════════');
  console.info('  api-dev-server');
  console.info(`  Naslouchá  ·  http://127.0.0.1:${PORT}  →  /api/auth, /api/navrhy, /api/scoring`);
  console.info(`  POSTGRES_URL  ·  ${process.env.POSTGRES_URL ? 'nastaveno' : 'CHYBÍ — viz .env.example'}`);
  console.info(`  JWT_SECRET    ·  ${process.env.JWT_SECRET ? 'nastaveno' : 'CHYBÍ — viz .env.example'}`);
  console.info('══════════════════════════════════════════════════════════════');
  console.info('');
});
