/**
 * Ručně založí účet porotce (v1 nemá admin UI — viz plán backendu).
 * Spuštění: npm run db:create-user -- "Jméno Příjmení" email@example.com heslo123 [role]
 *   role: 'porotce' (výchozí) nebo 'admin' (jen informativní, appka role zatím nijak nerozlišuje)
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { hashPassword } from '../api/_lib/auth.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(repoRoot, '.env'), override: true });
dotenv.config({ path: path.join(repoRoot, '.env.local'), override: true });

const [, , jmeno, email, password, role = 'porotce'] = process.argv;

if (!jmeno || !email || !password) {
  console.error('Použití: npm run db:create-user -- "Jméno Příjmení" email@example.com heslo123 [role]');
  process.exit(1);
}
if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.error('CHYBA: POSTGRES_URL (nebo DATABASE_URL) není nastaveno (viz .env.example).');
  process.exit(1);
}

// Dynamický import db.mjs AŽ po dotenv.config(), aby pg Pool vznikl s connection
// stringem, který je v tu chvíli už načtený z .env (pool se sice tvoří líně, import
// necháváme až sem pro jistotu).
const { sql } = await import('../api/_lib/db.mjs');

try {
  const passwordHash = await hashPassword(password);
  const { rows } = await sql`
    INSERT INTO users (jmeno, email, password_hash, role)
    VALUES (${jmeno}, ${email.trim().toLowerCase()}, ${passwordHash}, ${role})
    ON CONFLICT (email) DO UPDATE SET jmeno = EXCLUDED.jmeno, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role
    RETURNING id, jmeno, email, role
  `;
  console.log('Účet vytvořen/aktualizován:', rows[0]);
} catch (e) {
  console.error('Vytvoření účtu selhalo:', e instanceof Error ? e.message : e);
  process.exit(1);
}
