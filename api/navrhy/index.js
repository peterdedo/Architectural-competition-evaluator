/**
 * GET  /api/navrhy  → seznam všech návrhů (sdílené napříč porotou)
 * POST /api/navrhy  { id, nazev, status, source, fileFormat, data } → vytvoří návrh
 */
import { sql } from '../_lib/db.mjs';
import { requireSession, sendAuthError } from '../_lib/auth.mjs';

function toClient(row) {
  return {
    id: Number(row.id),
    nazev: row.nazev,
    status: row.status,
    source: row.source,
    fileFormat: row.file_format,
    data: row.data,
  };
}

export default async function handler(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`SELECT id, nazev, status, source, file_format, data FROM navrhy ORDER BY created_at ASC`;
      res.status(200).json({ navrhy: rows.map(toClient) });
    } catch (e) {
      sendAuthError(res, 500, e instanceof Error ? e.message : 'Failed to load navrhy', '', 'NAVRHY_LOAD_ERROR');
    }
    return;
  }

  if (req.method === 'POST') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        sendAuthError(res, 400, 'Invalid JSON body');
        return;
      }
    }
    const id = Number(body?.id);
    const nazev = typeof body?.nazev === 'string' ? body.nazev : '';
    if (!Number.isFinite(id) || !nazev) {
      sendAuthError(res, 400, 'Pole id (číslo) a nazev jsou povinná', '', 'NAVRHY_INVALID_BODY');
      return;
    }
    const status = typeof body?.status === 'string' ? body.status : 'zpracován';
    const source = typeof body?.source === 'string' ? body.source : null;
    const fileFormat = typeof body?.fileFormat === 'string' ? body.fileFormat : null;
    const data = body?.data && typeof body.data === 'object' ? body.data : {};

    try {
      await sql`
        INSERT INTO navrhy (id, nazev, status, source, file_format, data, created_by)
        VALUES (${id}, ${nazev}, ${status}, ${source}, ${fileFormat}, ${JSON.stringify(data)}::jsonb, ${session.userId})
        ON CONFLICT (id) DO UPDATE SET
          nazev = EXCLUDED.nazev,
          status = EXCLUDED.status,
          source = EXCLUDED.source,
          file_format = EXCLUDED.file_format,
          data = EXCLUDED.data,
          updated_at = now()
      `;
      res.status(201).json({ ok: true });
    } catch (e) {
      sendAuthError(res, 500, e instanceof Error ? e.message : 'Failed to create navrh', '', 'NAVRHY_CREATE_ERROR');
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
