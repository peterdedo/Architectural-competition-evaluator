/**
 * Sdílený DB klient (Postgres přes @vercel/postgres, funguje i s Neon databází).
 * Env: POSTGRES_URL, nebo DATABASE_URL (starší Vercel integrace nastavují POSTGRES_URL,
 * čerstvě propojená Neon databáze z Vercel Marketplace typicky jen DATABASE_URL – @vercel/postgres
 * sám o sobě čte pouze POSTGRES_URL, proto tu connection string vybíráme explicitně).
 * Používá se stejně v api/** (Vercel) i ve server/api-dev-server.mjs (lokální dev) a scripts/*.
 *
 * Pool se vytváří LÍNĚ (až při prvním dotazu), ne při importu modulu: @vercel/postgres
 * vyhodí výjimku hned při vytvoření klienta, pokud connection string chybí – kdyby se pool
 * stavěl hned tady nahoře, i endpointy bez nastavené databáze (třeba requireSession před
 * jakýmkoliv dotazem) by spadly na chybu databáze místo na čisté 401.
 */
import { createPool } from '@vercel/postgres';

let pool;
function getPool() {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;
    pool = createPool({ connectionString });
  }
  return pool;
}

export const sql = (strings, ...values) => getPool().sql(strings, ...values);
/** Pro syrové SQL bez tagged-template syntaxe (viz scripts/migrate.mjs). */
export const query = (text, params) => getPool().query(text, params);
