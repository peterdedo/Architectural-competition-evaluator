/**
 * GET /api/scoring → { directions, weights } přihlášeného porotce
 * PUT /api/scoring { directions, weights } → uloží (nahradí) jeho vlastní nastavení
 * Nezávislé na ostatních porotcích – viz api/scoring/summary.js pro souhrn napříč porotou.
 */
import { sql, transaction } from '../_lib/db.mjs';
import { requireSession, sendAuthError } from '../_lib/auth.mjs';

export default async function handler(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT indicator_id, direction, weight FROM scoring_settings WHERE user_id = ${session.userId}
      `;
      const directions = {};
      const weights = {};
      rows.forEach((r) => {
        directions[r.indicator_id] = r.direction;
        weights[r.indicator_id] = r.weight;
      });
      res.status(200).json({ directions, weights });
    } catch (e) {
      sendAuthError(res, 500, e instanceof Error ? e.message : 'Failed to load scoring settings', '', 'SCORING_LOAD_ERROR');
    }
    return;
  }

  if (req.method === 'PUT') {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        sendAuthError(res, 400, 'Invalid JSON body');
        return;
      }
    }
    const directions = body?.directions && typeof body.directions === 'object' ? body.directions : {};
    const weights = body?.weights && typeof body.weights === 'object' ? body.weights : {};
    const indicatorIds = Array.from(new Set([...Object.keys(directions), ...Object.keys(weights)]));

    try {
      // Atomicky: buď se uloží celé nové nastavení, nebo (při chybě) nezůstane porotci
      // půlka smazaná – DELETE i všechny INSERTy jsou v jedné transakci.
      await transaction(async (sql) => {
        await sql`DELETE FROM scoring_settings WHERE user_id = ${session.userId}`;
        for (const indicatorId of indicatorIds) {
          const direction = directions[indicatorId];
          if (direction !== 'higher' && direction !== 'lower') continue; // bez směru se ukazatel do skóre nepočítá
          const weight = Number.isFinite(weights[indicatorId]) ? weights[indicatorId] : 10;
          await sql`
            INSERT INTO scoring_settings (user_id, indicator_id, direction, weight)
            VALUES (${session.userId}, ${indicatorId}, ${direction}, ${weight})
          `;
        }
      });
      res.status(200).json({ ok: true });
    } catch (e) {
      sendAuthError(res, 500, e instanceof Error ? e.message : 'Failed to save scoring settings', '', 'SCORING_SAVE_ERROR');
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
