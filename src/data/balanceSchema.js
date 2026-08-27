// Bilanční struktura návrhu (P03) + nabídková cena (P06)
// =====================================================================
// Jediný zdroj pravdy pro novou sadu údajů architektonického návrhu.
// Nahrazuje starou sadu urbanistických indikátorů.
//
// Rozlišujeme tři druhy polí:
//   kind: 'input'    – ručně zadávaná hodnota
//   kind: 'derived'  – automaticky počítaná (viz utils/balanceCalculations.js), NIKDY se needituje ani neukládá
// a dvě dynamické kolekce (patra / místnosti), viz `collections` níže.
//
// Jednotky se NIKDY nemíchají: 'm2' plochy, 'm3' objemy, 'Kc' ceny, 'pct' poměr.
// Uživatelské názvy jsou česky; interní id jsou lowercase snake_case s prefixem sekce
// (konvence projektu – dříve U01/I01…, nyní čitelné slugy).

export const UNIT = {
  M2: 'm²',
  M3: 'm³',
  KC: 'Kč',
  PCT: '%',
};

// --- Statické sekce se skalárními poli (tečou i přes stávající tabulky/scoring jako informativní data) ---
// Každé pole: { id, nazev, kind, jednotka, unitType, derivedFrom? }
export const BALANCE_SECTIONS = [
  {
    id: 'bilance-ploch',
    code: 'A',
    nazev: 'Bilance ploch',
    popis: 'Bilance ploch řešeného území.',
    jednotka: UNIT.M2,
    unitType: 'm2',
    ikona: '📐',
    referenceNote: 'CELKEM (plocha 3 546 m²) – referenční hodnota ze zdroje, nikoli tvrdá validace.',
    fields: [
      { id: 'bilance_zastavena', nazev: 'Zastavěná plocha', kind: 'input' },
      { id: 'bilance_zpevnena', nazev: 'Zpevněná plocha', kind: 'input' },
      { id: 'bilance_nezpevnena', nazev: 'Nezpevněná plocha', kind: 'input' },
      { id: 'bilance_celkem', nazev: 'Celkem', kind: 'derived', derivedFrom: ['bilance_zastavena', 'bilance_zpevnena', 'bilance_nezpevnena'] },
    ],
  },
  {
    id: 'demolice',
    code: 'B',
    nazev: 'Demolice stávající stavby',
    popis: 'Objem demolice stávající stavby nebo jejích částí.',
    jednotka: UNIT.M3,
    unitType: 'm3',
    ikona: '🏚️',
    fields: [
      { id: 'demolice_nadzemni', nazev: 'Nadzemní', kind: 'input' },
      { id: 'demolice_celkem', nazev: 'Celkem', kind: 'derived', derivedFrom: ['demolice_nadzemni'] },
    ],
  },
  {
    id: 'obestaveny-prostor',
    code: 'C',
    nazev: 'Celkový obestavěný prostor',
    popis: 'Celkový obestavěný prostor navržené stavby.',
    jednotka: UNIT.M3,
    unitType: 'm3',
    ikona: '🧊',
    fields: [
      { id: 'obestaveny_podzemni', nazev: 'Podzemní', kind: 'input' },
      { id: 'obestaveny_nadzemni', nazev: 'Nadzemní', kind: 'input' },
      { id: 'obestaveny_celkem', nazev: 'Celkem', kind: 'derived', derivedFrom: ['obestaveny_podzemni', 'obestaveny_nadzemni'] },
    ],
  },
  {
    id: 'nove-objemy',
    code: 'D',
    nazev: 'Obestavěný prostor nových objemů',
    popis: 'Objem dostavby stávajícího objektu.',
    jednotka: UNIT.M3,
    unitType: 'm3',
    ikona: '🏗️',
    fields: [
      { id: 'nove_podzemni', nazev: 'Podzemní', kind: 'input' },
      { id: 'nove_nadzemni', nazev: 'Nadzemní', kind: 'input' },
      { id: 'nove_celkem', nazev: 'Celkem', kind: 'derived', derivedFrom: ['nove_podzemni', 'nove_nadzemni'] },
    ],
  },
  {
    id: 'obalka',
    code: 'H',
    nazev: 'Plocha obálky vytápěné části budovy',
    popis: 'Celková plocha obalových konstrukcí budovy.',
    jednotka: UNIT.M2,
    unitType: 'm2',
    ikona: '🧱',
    fields: [
      { id: 'obalka_fasady', nazev: 'Fasády', kind: 'input', popis: 'Vnější stěny, výplně otvorů.' },
      { id: 'obalka_strechy', nazev: 'Střechy', kind: 'input', popis: 'Střechy, terasy.' },
      { id: 'obalka_konstrukce', nazev: 'Konstrukce', kind: 'input', popis: 'Konstrukce k nevytápěným prostorám, podlaha na zemině, stěny vytápěné části budovy k zemině.' },
      { id: 'obalka_celkem', nazev: 'Celkem', kind: 'derived', derivedFrom: ['obalka_fasady', 'obalka_strechy', 'obalka_konstrukce'] },
    ],
  },
  {
    id: 'prosklení',
    code: 'I',
    nazev: 'Podíl prosklených ploch',
    popis: 'Poměr prosklených konstrukcí obálky budovy.',
    jednotka: UNIT.M2,
    unitType: 'm2',
    ikona: '🪟',
    fields: [
      { id: 'proskleni_aw', nazev: 'AW', kind: 'input', popis: 'Celková plocha svislých průsvitných konstrukcí obálky budovy (oken a dveří) v kontaktu s venkovním vzduchem.' },
      { id: 'proskleni_af', nazev: 'AF', kind: 'input', popis: 'Celková plocha svislých průsvitných a neprůsvitných konstrukcí obálky budovy v kontaktu s venkovním vzduchem (stěny včetně oken a dveří).' },
      { id: 'proskleni_podil', nazev: 'Podíl prosklených ploch', kind: 'derived', derivedRule: 'ratio', derivedFrom: ['proskleni_aw', 'proskleni_af'], jednotka: UNIT.PCT, unitType: 'pct' },
    ],
  },
];

// --- Dynamické kolekce (patra / místnosti) ---
// E a F: dynamický seznam pater { id, label, value(m²) }, Celkem = součet.
// G: dynamický seznam pater, každé s dynamickým seznamem místností { id, name, area(m²) };
//    součet za patro = součet místností, celkem = součet pater.
export const FLOOR_COLLECTIONS = [
  {
    id: 'hpp',
    code: 'E',
    key: 'hpp',
    nazev: 'Hrubá podlažní plocha',
    popis: 'Plocha všech podlaží vymezených vnějším lícem obvodových konstrukcí.',
    jednotka: UNIT.M2,
    unitType: 'm2',
    ikona: '📊',
    kind: 'floors', // seznam pater s jednou hodnotou plochy
  },
  {
    id: 'uzitna-plocha',
    code: 'F',
    key: 'uzitna',
    nazev: 'Celková užitná plocha',
    popis: 'Součet ploch místností.',
    jednotka: UNIT.M2,
    unitType: 'm2',
    ikona: '📐',
    kind: 'floors',
  },
  {
    id: 'bilance-mistnosti',
    code: 'G',
    key: 'mistnosti',
    nazev: 'Bilance místností',
    popis: 'Užitná plocha jednotlivých místností po podlažích.',
    jednotka: UNIT.M2,
    unitType: 'm2',
    ikona: '🚪',
    kind: 'rooms', // seznam pater, každé s dynamickým seznamem místností
  },
];

// Výchozí patra (seed) – uživatel může přidávat/odebírat další. Žádné hardcoded 3NP/4NP.
export const DEFAULT_FLOOR_LABELS = ['Podzemní podlaží', 'Nadzemní 1. NP', 'Nadzemní 2. NP'];

// --- P06: Nabídková cena (Kč, bez DPH) – NENÍ hodnoticí indikátor, jen data návrhu ---
export const OFFER_PRICE = {
  id: 'nabidkova-cena',
  code: 'P06',
  key: 'nabidkovaCena',
  nazev: 'Nabídková cena',
  popis: 'Ceny jsou uváděny bez DPH.',
  jednotka: UNIT.KC,
  unitType: 'Kc',
  ikona: '💰',
  items: [
    { id: 'fs1', nazev: 'FS 1 – Příprava projektu' },
    { id: 'fs2', nazev: 'FS 2 – Dopracování Návrhu stavby' },
    { id: 'fs3', nazev: 'FS 3 – Projekt pro povolení záměru' },
    { id: 'obstaravatelska', nazev: 'Obstaravatelská činnost pro zajištění pravomocného povolení' },
    { id: 'fs4', nazev: 'FS 4 – Projekt pro provádění stavby' },
    { id: 'interier', nazev: 'Projekt interiéru' },
    { id: 'fs5', nazev: 'FS 5 – Soupis prací a dodávek' },
    { id: 'spoluprace_dodavatel', nazev: 'Spolupráce při výběru dodavatele stavby' },
    { id: 'fs6', nazev: 'FS 6 – Dozor projektanta' },
  ],
};

// --- Odvozené pomocné indexy ---

/** Všechna pole (input i derived) napříč statickými bilančními sekcemi. */
export const ALL_BALANCE_FIELDS = BALANCE_SECTIONS.flatMap((s) =>
  s.fields.map((f) => ({ ...f, sectionId: s.id, sectionCode: s.code, jednotka: f.jednotka || s.jednotka, unitType: f.unitType || s.unitType }))
);

/** Pouze ručně zadávaná skalární pole – tečou přes stávající konfiguračně řízené obrazovky jako informativní data. */
export const SCALAR_INPUT_FIELDS = ALL_BALANCE_FIELDS.filter((f) => f.kind === 'input');

/** Pouze odvozená pole. */
export const DERIVED_FIELDS = ALL_BALANCE_FIELDS.filter((f) => f.kind === 'derived');

export function getSectionById(id) {
  return BALANCE_SECTIONS.find((s) => s.id === id) || null;
}

export function getFieldById(id) {
  return ALL_BALANCE_FIELDS.find((f) => f.id === id) || null;
}
