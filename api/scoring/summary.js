/**
 * GET /api/scoring/summary → vážené skóre podle KAŽDÉHO porotce zvlášť, pro pohled "Souhrn poroty".
 * Používá stejnou čistou funkci scoreProjects jako frontend (src/utils/balanceScore.js),
 * jen nad daty z DB místo z localStorage.
 */
import { sql } from '../_lib/db.mjs';
import { requireSession, sendAuthError } from '../_lib/auth.mjs';
import { scoreProjects } from '../../src/utils/balanceScore.js';
import { SCORING_INDICATORS } from '../../src/data/scoringIndicators.js';

export default async function handler(req, res) {
  const session = requireSession(req, res);
  if (!session) return;

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const [{ rows: navrhyRows }, { rows: userRows }, { rows: settingsRows }] = await Promise.all([
      sql`SELECT id, nazev, status, source, file_format, data FROM navrhy ORDER BY created_at ASC`,
      sql`SELECT id, jmeno, email FROM users ORDER BY jmeno ASC`,
      sql`SELECT user_id, indicator_id, direction, weight FROM scoring_settings`,
    ]);

    const projects = navrhyRows.map((row) => ({
      id: Number(row.id),
      nazev: row.nazev,
      status: row.status,
      source: row.source,
      fileFormat: row.file_format,
      data: row.data,
    }));

    const settingsByUser = new Map();
    settingsRows.forEach((r) => {
      if (!settingsByUser.has(r.user_id)) settingsByUser.set(r.user_id, { directions: {}, weights: {} });
      const entry = settingsByUser.get(r.user_id);
      entry.directions[r.indicator_id] = r.direction;
      entry.weights[r.indicator_id] = r.weight;
    });

    const porotci = userRows
      .filter((u) => settingsByUser.has(u.id))
      .map((u) => {
        const { directions, weights } = settingsByUser.get(u.id);
        const scoredProposals = scoreProjects(projects, SCORING_INDICATORS, directions, weights);
        return {
          userId: u.id,
          jmeno: u.jmeno,
          email: u.email,
          scoredProposals: scoredProposals.map((p) => ({
            id: p.id,
            nazev: p.nazev,
            weightedScore: p.weightedScore,
            scoredIndicatorCount: p.scoredIndicatorCount,
          })),
        };
      });

    res.status(200).json({ porotci, navrhCount: projects.length });
  } catch (e) {
    sendAuthError(res, 500, e instanceof Error ? e.message : 'Failed to build jury summary', '', 'SCORING_SUMMARY_ERROR');
  }
}
