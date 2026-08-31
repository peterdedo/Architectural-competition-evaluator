// Generátor id pro NÁVRHY (primární klíč na serveru – viz db/schema.sql `navrhy.id DOUBLE PRECISION`).
//
// PŮVODNÍ schéma `Date.now() + Math.random()` vypadá náhodně, ale ve skutečnosti kolidovalo:
// double má ~16 platných desetinných číslic; Date.now() spotřebuje 13 na celou část, takže
// na zlomkovou (desetinnou, tj. tu "náhodnou") část zbydou jen ~3–4 číslice → v RÁMCI JEDNÉ
// MILISEKUNDY existuje jen ~10 000 rozlišitelných hodnot, ne miliardy. Při hromadném nahrání
// (např. 24 řádků z jednoho Excelu zpracovaných ve stejné ms) je kolize reálná – a protože
// POST /api/navrhy je teď INSERT-only (ON CONFLICT DO NOTHING, viz api/navrhy/index.js), by
// kolidující položka byla na serveru TICHO zahozena, i když se klientovi vrátí 201.
//
// Oprava: čítač namísto náhody, kombinovaný s timestampem celočíselně (ŽÁDNÁ ztráta přesnosti –
// Date.now()*1000 + seq je vždy přesné celé číslo v bezpečném rozsahu double). V rámci jedné
// milisekundy tak jde vytvořit až 1000 garantovaně různých id bez jakékoli kolize.
let seq = 0;

export function generateNavrhId() {
  seq = (seq + 1) % 1000;
  return Date.now() * 1000 + seq;
}
