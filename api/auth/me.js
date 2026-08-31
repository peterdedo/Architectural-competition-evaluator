/**
 * GET /api/auth/me → aktuální účet z DB (jméno, systémová role, zobrazená funkce).
 * Čte se z tabulky users, ne jen z JWT, aby se změna funkce projevila bez nového přihlášení.
 */
import { sql } from '../_lib/db.mjs';
import { requireSession, sendAuthError } from '../_lib/auth.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const session = requireSession(req, res);
  if (!session) return;

  try {
    const { rows } = await sql`
      SELECT id, jmeno, email, role, funkce FROM users WHERE id = ${session.userId}
    `;
    const user = rows[0];
    if (!user) {
      sendAuthError(res, 401, 'Not authenticated', 'Přihlaste se prosím znovu.', 'AUTH_REQUIRED');
      return;
    }
    res.status(200).json({
      userId: user.id,
      email: user.email,
      jmeno: user.jmeno,
      role: user.role,
      funkce: user.funkce || null,
    });
  } catch (e) {
    sendAuthError(res, 500, e instanceof Error ? e.message : 'Failed to load session', '', 'AUTH_ME_ERROR');
  }
}
