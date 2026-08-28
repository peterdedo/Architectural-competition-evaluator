/**
 * POST /api/auth/login  { email, password } → nastaví session cookie.
 */
import { sql } from '../_lib/db.mjs';
import { verifyPassword, signSessionToken, setSessionCookie } from '../_lib/auth.mjs';

export default async function handler(req, res) {
  const sendError = (status, message, details = '', code = '') => {
    res.status(status).json({
      error: message,
      details,
      ...(code ? { errorInfo: { code, message, details } } : {}),
    });
  };

  if (req.method !== 'POST') {
    sendError(405, 'Method not allowed');
    return;
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      sendError(400, 'Invalid JSON body');
      return;
    }
  }

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  if (!email || !password) {
    sendError(400, 'E-mail a heslo jsou povinné', '', 'AUTH_MISSING_CREDENTIALS');
    return;
  }

  try {
    const { rows } = await sql`SELECT id, jmeno, email, password_hash, role FROM users WHERE email = ${email}`;
    const user = rows[0];
    if (!user) {
      sendError(401, 'Nesprávný e-mail nebo heslo', '', 'AUTH_INVALID_CREDENTIALS');
      return;
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      sendError(401, 'Nesprávný e-mail nebo heslo', '', 'AUTH_INVALID_CREDENTIALS');
      return;
    }

    const token = signSessionToken({ userId: user.id, email: user.email, jmeno: user.jmeno, role: user.role });
    setSessionCookie(res, token);
    res.status(200).json({ userId: user.id, email: user.email, jmeno: user.jmeno, role: user.role });
  } catch (e) {
    sendError(
      500,
      e instanceof Error ? e.message : 'Login failed',
      'Zkontrolujte připojení k databázi (POSTGRES_URL) a JWT_SECRET na serveru.',
      'AUTH_LOGIN_ERROR'
    );
  }
}
