/**
 * GET /api/auth/me → { userId, email, jmeno, role } nebo 401.
 */
import { requireSession } from '../_lib/auth.mjs';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const session = requireSession(req, res);
  if (!session) return;
  res.status(200).json({
    userId: session.userId,
    email: session.email,
    jmeno: session.jmeno,
    role: session.role,
  });
}
