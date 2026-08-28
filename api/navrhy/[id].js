/**
 * PATCH  /api/navrhy/:id  { nazev, status, source, fileFormat, data } → uloží změny
 * DELETE /api/navrhy/:id  → smaže návrh
 */
import { sql } from '../_lib/db.mjs';
import { requireSession, requireAdmin, sendAuthError } from '../_lib/auth.mjs';

export default async function handler(req, res) {
  // DELETE nad sdílenými návrhy smí jen admin – aby jeden porotce nesmazal data celé porotě.
  // Ostatní metody (PATCH – doplnění bilance) stačí přihlášenému porotci.
  const session = req.method === 'DELETE' ? requireAdmin(req, res) : requireSession(req, res);
  if (!session) return;

  const id = Number(req.query?.id);
  if (!Number.isFinite(id)) {
    sendAuthError(res, 400, 'Neplatné id návrhu', '', 'NAVRHY_INVALID_ID');
    return;
  }

  if (req.method === 'PATCH') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        sendAuthError(res, 400, 'Invalid JSON body');
        return;
      }
    }
    const nazev = typeof body?.nazev === 'string' ? body.nazev : null;
    const status = typeof body?.status === 'string' ? body.status : null;
    const source = typeof body?.source === 'string' ? body.source : null;
    const fileFormat = typeof body?.fileFormat === 'string' ? body.fileFormat : null;
    const data = body?.data && typeof body.data === 'object' ? body.data : null;

    try {
      const { rowCount } = await sql`
        UPDATE navrhy SET
          nazev = COALESCE(${nazev}, nazev),
          status = COALESCE(${status}, status),
          source = COALESCE(${source}, source),
          file_format = COALESCE(${fileFormat}, file_format),
          data = COALESCE(${data ? JSON.stringify(data) : null}::jsonb, data),
          updated_at = now()
        WHERE id = ${id}
      `;
      if (rowCount === 0) {
        sendAuthError(res, 404, 'Návrh nenalezen', '', 'NAVRHY_NOT_FOUND');
        return;
      }
      res.status(200).json({ ok: true });
    } catch (e) {
      sendAuthError(res, 500, e instanceof Error ? e.message : 'Failed to update navrh', '', 'NAVRHY_UPDATE_ERROR');
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      await sql`DELETE FROM navrhy WHERE id = ${id}`;
      res.status(200).json({ ok: true });
    } catch (e) {
      sendAuthError(res, 500, e instanceof Error ? e.message : 'Failed to delete navrh', '', 'NAVRHY_DELETE_ERROR');
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
