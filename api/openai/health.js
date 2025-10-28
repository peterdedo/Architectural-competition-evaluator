/**
 * Vercel Serverless: diagnostika proxy (bez citlivých dat).
 * Synchronizujte proxyVersion s server/openai-proxy.mjs a OPENAI_PROXY_DIAG_VERSION v openaiProxy.js.
 */
const PROXY_DIAG_VERSION = 'openai-diag-v2';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  const hasOpenAiKey = Boolean(key && String(key).trim());

  res.status(200).json({
    ok: true,
    mode: 'serverless',
    proxyVersion: PROXY_DIAG_VERSION,
    hasOpenAiKey,
    timestamp: new Date().toISOString(),
  });
}
