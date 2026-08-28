/**
 * Sdílený DB klient (obyčejný Postgres přes pg – funguje s jakýmkoliv Postgres serverem,
 * včetně Railway). Env: POSTGRES_URL, nebo DATABASE_URL.
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

/** Z tagged-template literálu poskládá parametrizovaný dotaz ($1, $2 …) – bez konkatenace vstupů. */
function buildQuery(strings, values) {
  let text = '';
  strings.forEach((part, i) => {
    text += part;
    if (i < values.length) text += `$${i + 1}`;
  });
  return { text, values };
}

/** Tagged template → parametrizovaný dotaz, stejné API jako @vercel/postgres `sql`. */
export function sql(strings, ...values) {
  const { text } = buildQuery(strings, values);
  return getPool().query(text, values);
}

/** Pro syrové SQL bez tagged-template syntaxe (viz scripts/migrate.mjs). */
export function query(text, params) {
  return getPool().query(text, params);
}

/**
 * Atomická transakce. Callback dostane `sql` tagged-template vázaný na jeden klient (BEGIN/COMMIT);
 * při jakékoliv chybě se provede ROLLBACK a chyba se přehodí. Použití:
 *   await transaction(async (sql) => { await sql`DELETE …`; await sql`INSERT …`; });
 */
export async function transaction(fn) {
  const client = await getPool().connect();
  const boundSql = (strings, ...values) => {
    const { text } = buildQuery(strings, values);
    return client.query(text, values);
  };
  try {
    await client.query('BEGIN');
    const result = await fn(boundSql);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* rollback selhal – původní chyba je důležitější */
    }
    throw e;
  } finally {
    client.release();
  }
}
