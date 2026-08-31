// Bezpečné výpočty odvozených bilančních hodnot (P03) a nabídkové ceny (P06).
// =====================================================================
// Zásady:
//  - prázdná hodnota NENÍ nula: chybějící/nevyplněný vstup vrací null (nevyhodnoceno),
//    nikoli 0, aby součty a poměry nevydávaly falešné výsledky;
//  - žádné NaN / Infinity / dělení nulou nesmí opustit tento modul;
//  - všechny součty i poměry počítáme jen z reálně vyplněných vstupů.

import {
  BALANCE_SECTIONS,
  DEFAULT_FLOOR_LABELS,
  OFFER_PRICE,
  getFieldById,
} from '../data/balanceSchema.js';

let __uid = 0;
const uid = (prefix) => `${prefix}_${Date.now().toString(36)}_${(++__uid).toString(36)}`;

/** Převod libovolné hodnoty na konečné číslo, nebo null pokud je prázdná/neplatná. */
export function safeNum(value) {
  const v = value && typeof value === 'object' && 'value' in value ? value.value : value;
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  if (typeof v !== 'string') return null;
  const trimmed = v.trim();
  if (trimmed === '') return null;
  const cleaned = trimmed.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  if (cleaned === '' || cleaned === '-' || cleaned === '.') return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

/** Součet pouze vyplněných hodnot; když není vyplněná žádná, vrací null (nevyhodnoceno). */
export function sumPresent(values) {
  const nums = values.map(safeNum).filter((n) => n !== null);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0);
}

/**
 * Bezpečný poměr prosklení AW / AF.
 * Vrací null, když AW nebo AF chybí, nebo když AF <= 0 (žádné Infinity / dělení nulou).
 * Výsledek je poměr; do procent se převádí až v UI (viz `asPercent`).
 */
export function glazingRatio(aw, af) {
  const a = safeNum(aw);
  const f = safeNum(af);
  if (a === null || f === null) return null;
  if (f <= 0) return null;
  const r = a / f;
  return Number.isFinite(r) ? r : null;
}

/** Poměr (0..1) → procenta, s ošetřením null. */
export function asPercent(ratio, decimals = 1) {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return null;
  return Number((ratio * 100).toFixed(decimals));
}

/**
 * Vypočítá hodnotu odvozeného pole ze skalárních dat návrhu.
 * @param {string} fieldId - id odvozeného pole (kind: 'derived')
 * @param {Object} data - navrh.data (mapa skalárních hodnot)
 * @returns {number|null} vypočítaná hodnota nebo null (nevyhodnoceno)
 */
export function computeDerivedField(fieldId, data = {}) {
  const field = getFieldById(fieldId);
  if (!field || field.kind !== 'derived') return null;

  if (field.derivedRule === 'ratio') {
    const [awId, afId] = field.derivedFrom;
    return glazingRatio(data[awId], data[afId]);
  }
  // výchozí pravidlo: součet vyplněných zdrojových polí
  return sumPresent((field.derivedFrom || []).map((id) => data[id]));
}

/** Vrací mapu { derivedFieldId: hodnota|null } pro všechny statické bilanční sekce. */
export function computeAllDerived(data = {}) {
  const out = {};
  BALANCE_SECTIONS.forEach((section) => {
    section.fields
      .filter((f) => f.kind === 'derived')
      .forEach((f) => {
        out[f.id] = computeDerivedField(f.id, data);
      });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Dynamické kolekce: patra (E, F) a místnosti (G)
// ---------------------------------------------------------------------------

export function makeFloor(label = 'Další podlaží', value = '') {
  return { id: uid('floor'), label, value };
}

export function makeRoom(name = '', area = '') {
  return { id: uid('room'), name, area };
}

/** Nová kolekce pater se seedem výchozích podlaží (E, F). */
export function makeFloorsCollection() {
  return { floors: DEFAULT_FLOOR_LABELS.map((label) => makeFloor(label, '')) };
}

/** Nová kolekce místností: patra se seedem, každé zatím bez místností (G). */
export function makeRoomsCollection() {
  return {
    floors: DEFAULT_FLOOR_LABELS.map((label) => ({ id: uid('floor'), label, rooms: [] })),
  };
}

/** Nová nabídková cena (P06) – položky dle schématu, prázdné ceny/poznámky. */
export function makeOfferPrice() {
  return {
    items: OFFER_PRICE.items.map((it) => ({ id: it.id, label: it.nazev, price: '', note: '' })),
  };
}

/** Doplní chybějící id u pater z importu, ať jde každé pole ve formuláři upravit. */
export function ensureFloorsCollection(stored) {
  if (!stored || !Array.isArray(stored.floors) || stored.floors.length === 0) {
    return makeFloorsCollection();
  }
  return {
    floors: stored.floors.map((f) => ({
      id: f?.id || uid('floor'),
      label: f?.label ? String(f.label) : 'Podlaží',
      value: f?.value === null || f?.value === undefined ? '' : f.value,
    })),
  };
}

export function ensureRoomsCollection(stored) {
  if (!stored || !Array.isArray(stored.floors) || stored.floors.length === 0) {
    return makeRoomsCollection();
  }
  return {
    floors: stored.floors.map((f) => ({
      id: f?.id || uid('floor'),
      label: f?.label ? String(f.label) : 'Podlaží',
      rooms: Array.isArray(f?.rooms)
        ? f.rooms.map((r) => ({
            id: r?.id || uid('room'),
            name: r?.name ? String(r.name) : '',
            area: r?.area === null || r?.area === undefined ? '' : r.area,
          }))
        : [],
    })),
  };
}

export function ensureOfferPrice(stored) {
  const base = makeOfferPrice();
  if (!stored || !Array.isArray(stored.items)) return base;
  const byId = new Map(stored.items.map((it) => [it?.id, it]));
  return {
    items: base.items.map((it) => {
      const found = byId.get(it.id);
      if (!found) return it;
      return {
        ...it,
        price: found.price === null || found.price === undefined ? '' : found.price,
        note: found.note ? String(found.note) : '',
      };
    }),
  };
}

/** Zápis skaláru do navrh.data (smaže AI obálku { value, source }). Prázdný řetězec pole odstraní. */
export function setScalarValue(data, id, raw) {
  const next = { ...(data || {}) };
  const trimmed = String(raw ?? '').trim().replace(/\s/g, '').replace(',', '.');
  if (trimmed === '' || trimmed === '-' || trimmed === '.') {
    delete next[id];
  } else {
    next[id] = trimmed;
  }
  return next;
}

/** Nastaví plochu podlaží podle popisku (HPP / užitná) – pro úpravy přímo ve srovnávací tabulce. */
export function setFloorValueByLabel(collection, label, raw) {
  const ensured = ensureFloorsCollection(collection);
  const trimmed = String(raw ?? '').trim().replace(/\s/g, '').replace(',', '.');
  const empty = trimmed === '' || trimmed === '-' || trimmed === '.';
  let found = false;
  const floors = ensured.floors.map((f) => {
    if (f.label !== label) return f;
    found = true;
    return { ...f, value: empty ? '' : trimmed };
  });
  if (!found && !empty) floors.push(makeFloor(label, trimmed));
  return { floors };
}

export function setOfferItemPrice(offer, itemId, raw) {
  const ensured = ensureOfferPrice(offer);
  const trimmed = String(raw ?? '').trim().replace(/\s/g, '').replace(',', '.');
  const empty = trimmed === '' || trimmed === '-' || trimmed === '.';
  return {
    items: ensured.items.map((it) => (it.id === itemId ? { ...it, price: empty ? '' : trimmed } : it)),
  };
}

/** Součet ploch pater kolekce E/F; null pokud nic vyplněno. */
export function floorsTotal(collection) {
  if (!collection || !Array.isArray(collection.floors)) return null;
  return sumPresent(collection.floors.map((f) => f.value));
}

/** Součet užitných ploch místností v jednom patře (G); null pokud nic vyplněno. */
export function roomsFloorTotal(floor) {
  if (!floor || !Array.isArray(floor.rooms)) return null;
  return sumPresent(floor.rooms.map((r) => r.area));
}

/** Celkový součet užitných ploch všech místností napříč patry (G); null pokud nic vyplněno. */
export function roomsGrandTotal(collection) {
  if (!collection || !Array.isArray(collection.floors)) return null;
  const perFloor = collection.floors.map((f) => roomsFloorTotal(f)).filter((v) => v !== null);
  if (perFloor.length === 0) return null;
  return perFloor.reduce((a, b) => a + b, 0);
}

/** Celková nabídková cena (P06) = součet vyplněných cen položek; null pokud nic vyplněno. */
export function offerPriceTotal(offer) {
  if (!offer || !Array.isArray(offer.items)) return null;
  return sumPresent(offer.items.map((it) => it.price));
}
