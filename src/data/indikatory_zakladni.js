// Sada bilančních údajů návrhu (P03) – nahrazuje starou sadu urbanistických indikátorů.
// =====================================================================
// Jediným zdrojem pravdy je src/data/balanceSchema.js. Tento soubor z něj odvozuje:
//   `indikatory` – ploché skalární VSTUPNÍ pole (A/B/C/D/H/I), aby stávající konfiguračně
//                  řízené obrazovky (výběr kritérií, tabulky, detail) fungovaly beze změny;
//   `kategorie`  – bilanční sekce jako kategorie pro seskupování.
//
// Odvozené součty (Celkem), dynamická patra (E/F), místnosti (G) a nabídková cena (P06)
// nejsou ploché indikátory – řeší je strukturovaný formulář (BalanceForm) a
// utils/balanceCalculations.js. Do skóre tato data nevstupují: direction = 'informative'
// (jde o data návrhu, nikoli hodnoticí indikátory – viz zadání §8, žádné váhy se nevymýšlejí).

import { BALANCE_SECTIONS, SCALAR_INPUT_FIELDS } from './balanceSchema.js';

const SECTION_COLORS = {
  'bilance-ploch': '#3B82F6',
  demolice: '#EF4444',
  'obestaveny-prostor': '#8B5CF6',
  'nove-objemy': '#F59E0B',
  obalka: '#10B981',
  'prosklení': '#06B6D4',
};

export const indikatory = SCALAR_INPUT_FIELDS.map((f) => ({
  id: f.id,
  nazev: f.nazev,
  jednotka: f.jednotka,
  kategorie: f.sectionId,
  description: f.popis || '',
  popis: f.popis || '',
  typ: 'kvantitativní',
  zdroj: 'formulář',
  direction: 'informative', // data návrhu, nescoruje se
  vaha: 10,
  ikona: (BALANCE_SECTIONS.find((s) => s.id === f.sectionId) || {}).ikona || '📊',
  comparison_method: 'numeric',
  data_type: 'float',
  unitType: f.unitType,
}));

export const kategorie = BALANCE_SECTIONS.map((s) => ({
  id: s.id,
  nazev: s.nazev,
  popis: s.popis,
  barva: SECTION_COLORS[s.id] || '#64748B',
  ikona: s.ikona,
}));
