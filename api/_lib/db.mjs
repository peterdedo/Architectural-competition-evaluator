/**
 * Sdílený DB klient (obyčejný Postgres přes pg – funguje s jakýmkoliv Postgres serverem,
 * včetně Railway; @vercel/postgres byl zkusmo použit dřív, ale jeho sql/createPool
 * odmítá connection stringy, které nejsou z Vercel Postgres/Neon poolu – proto pg).
 * Env: POSTGRES_URL, nebo DATABASE_URL.
 * Používá se stejně v api/** (Vercel) i ve server/api-dev-server.mjs (lokální dev) a scripts/*.
 *
 * Pool se vytváří LÍNĚ (až při prvním dotazu), ne při importu modulu, aby endpointy bez
 * nastavené databáze (třeba requireSession před jakýmkoliv dotazem) spadly na čisté 401,
 * ne na chybu databáze.
 */
import pg from 'pg';

const { Pool } = pg;

let pool;
function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    pool = new Pool({
      connectionString,
      ssl: connectionString?.includes('sslmode=require') ? { rejectUnauthorized: false } : false,
    });
  }
  return pool;
}

/** Tagged template → parametrizovaný dotaz, stejné API jako @vercel/postgres `sql`. */
export function sql(strings, ...values) {
  let text = '';
  strings.forEach((part, i) => {
    text += part;
    if (i < values.length) text += `$${i + 1}`;
  });
  return getPool().query(text, values);
}

/** Pro syrové SQL bez tagged-template syntaxe (viz scripts/migrate.mjs). */
export function query(text, params) {
  return getPool().query(text, params);
}
