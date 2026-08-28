/**
 * Vytvoří/aktualizuje tabulky v databázi podle db/schema.sql.
 * Spuštění: npm run db:migrate   (POSTGRES_URL musí být v .env)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
dotenv.config({ path: path.join(repoRoot, '.env'), override: true });
dotenv.config({ path: path.join(repoRoot, '.env.local'), override: true });

if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
  console.error('CHYBA: POSTGRES_URL (nebo DATABASE_URL) není nastaveno (viz .env.example).');
  process.exit(1);
}

// Dynamický import db.mjs AŽ po dotenv.config(), aby pg Pool vznikl s connection
// stringem, který je v tu chvíli už načtený z .env (pool se sice tvoří líně, import
// necháváme až sem pro jistotu).
const { query } = await import('../api/_lib/db.mjs');

const schema = fs.readFileSync(path.join(repoRoot, 'db', 'schema.sql'), 'utf8');
const statements = schema
  .split(/;\s*(?:\n|$)/)
  .map((s) => s.trim())
  .filter(Boolean);

try {
  for (const statement of statements) {
    await query(statement);
  }
  console.log(`Hotovo — provedeno ${statements.length} SQL příkazů z db/schema.sql.`);
} catch (e) {
  console.error('Migrace selhala:', e instanceof Error ? e.message : e);
  process.exit(1);
}
