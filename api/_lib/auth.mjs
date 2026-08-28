/**
 * Sdílená auth logika (přihlašování + session cookie). Env: JWT_SECRET.
 * Používá se v api/** (Vercel), server/api-dev-server.mjs a server/openai-proxy.mjs (lokální dev).
 */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { parse, serialize } from 'cookie';

const COOKIE_NAME = 'archieval_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dní

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not configured on the server');
  return secret;
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signSessionToken({ userId, email, jmeno, role }) {
  return jwt.sign({ userId, email, jmeno, role }, getJwtSecret(), { expiresIn: SESSION_MAX_AGE_SECONDS });
}

export function verifySessionToken(token) {
  try {
    return jwt.verify(token, getJwtSecret());
  } catch {
    return null;
  }
}

/** Přečte a ověří session cookie z hlavičky požadavku (funguje na Vercel i lokálním dev serveru). */
export function getSessionFromRequest(req) {
  const cookieHeader = req.headers?.cookie;
  if (!cookieHeader) return null;
  const cookies = parse(cookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  return verifySessionToken(token);
}

export function setSessionCookie(res, token) {
  const cookie = serialize(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
  res.setHeader('Set-Cookie', cookie);
}

export function clearSessionCookie(res) {
  const cookie = serialize(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  res.setHeader('Set-Cookie', cookie);
}

/** Stejná chybová obálka jako api/openai/chat.js. */
export function sendAuthError(res, status, message, details = '', code = '') {
  res.status(status).json({
    error: message,
    details,
    ...(code ? { errorInfo: { code, message, details } } : {}),
  });
}

/** Vrátí session z požadavku, nebo rovnou pošle 401 a vrátí null (volající pak jen `if (!session) return;`). */
export function requireSession(req, res) {
  const session = getSessionFromRequest(req);
  if (!session) {
    sendAuthError(res, 401, 'Not authenticated', 'Přihlaste se prosím znovu.', 'AUTH_REQUIRED');
    return null;
  }
  return session;
}

/**
 * Jako requireSession, ale navíc vyžaduje roli 'admin'. Pro destruktivní operace nad SDÍLENÝMI
 * daty (mazání návrhů), aby je jeden porotce nemohl smazat celé porotě. Vrátí session, nebo
 * pošle 401/403 a vrátí null.
 */
export function requireAdmin(req, res) {
  const session = requireSession(req, res);
  if (!session) return null;
  if (session.role !== 'admin') {
    sendAuthError(
      res,
      403,
      'Vyžadováno oprávnění administrátora',
      'Tuto akci může provést jen organizátor (role admin).',
      'AUTH_FORBIDDEN'
    );
    return null;
  }
  return session;
}
