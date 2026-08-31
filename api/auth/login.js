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

  // Ochrana proti hrubé síle: po MAX_ATTEMPTS neúspěšných pokusech se účet na LOCK_MINUTES zamkne.
  const MAX_ATTEMPTS = 8;
  const LOCK_MINUTES = 15;

  try {
    const { rows } = await sql`SELECT id, jmeno, email, password_hash, role, funkce, failed_attempts, locked_until FROM users WHERE email = ${email}`;
    const user = rows[0];
    if (!user) {
      // Stejná odpověď jako u špatného hesla (žádné vyzrazení, zda účet existuje).
      sendError(401, 'Nesprávný e-mail nebo heslo', '', 'AUTH_INVALID_CREDENTIALS');
      return;
    }

    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      sendError(
        429,
        'Účet je dočasně uzamčen po příliš mnoha pokusech',
        `Zkuste to prosím znovu za pár minut, nebo kontaktujte organizátora.`,
        'AUTH_LOCKED'
      );
      return;
    }

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) {
      // Zvýšit počítadlo; při dosažení limitu účet zamknout.
      const attempts = (user.failed_attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        await sql`UPDATE users SET failed_attempts = ${attempts}, locked_until = now() + (${LOCK_MINUTES} * interval '1 minute') WHERE id = ${user.id}`;
      } else {
        await sql`UPDATE users SET failed_attempts = ${attempts} WHERE id = ${user.id}`;
      }
      sendError(401, 'Nesprávný e-mail nebo heslo', '', 'AUTH_INVALID_CREDENTIALS');
      return;
    }

    // Úspěch → vynulovat počítadlo a odemknout.
    if (user.failed_attempts || user.locked_until) {
      await sql`UPDATE users SET failed_attempts = 0, locked_until = NULL WHERE id = ${user.id}`;
    }

    const token = signSessionToken({
      userId: user.id,
      email: user.email,
      jmeno: user.jmeno,
      role: user.role,
      funkce: user.funkce || null,
    });
    setSessionCookie(res, token);
    res.status(200).json({
      userId: user.id,
      email: user.email,
      jmeno: user.jmeno,
      role: user.role,
      funkce: user.funkce || null,
    });
  } catch (e) {
    sendError(
      500,
      e instanceof Error ? e.message : 'Login failed',
      'Zkontrolujte připojení k databázi (POSTGRES_URL) a JWT_SECRET na serveru.',
      'AUTH_LOGIN_ERROR'
    );
  }
}
