-- ArchiEval: schéma pro přihlašování a sdílená data poroty.
-- Spustit přes: npm run db:migrate (čte tento soubor a provede ho proti POSTGRES_URL).

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  jmeno TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'porotce',
  funkce TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- id NENÍ generováno databází – klient posílá vlastní id (Date.now() + Math.random(),
-- stejné jako dnešní frontend generuje pro localStorage), aby se nemusela měnit logika
-- tvorby návrhu v StepUpload.jsx/StepResults.jsx.
CREATE TABLE IF NOT EXISTS navrhy (
  id DOUBLE PRECISION PRIMARY KEY,
  nazev TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'zpracován',
  source TEXT,
  file_format TEXT,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS scoring_settings (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  indicator_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  weight INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, indicator_id)
);

-- Váha nesmí být předvyplněná: NULL = porota ji ještě nezadala (žádný default 10).
ALTER TABLE scoring_settings ALTER COLUMN weight DROP DEFAULT;
ALTER TABLE scoring_settings ALTER COLUMN weight DROP NOT NULL;

-- Ochrana proti hádání hesla hrubou silou: počítadlo neúspěšných pokusů a dočasné uzamčení účtu.
-- (idempotentní – lze spustit i nad existující databází)
ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS funkce TEXT;
