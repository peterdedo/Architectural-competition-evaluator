// Registr ukazatelů, které lze zahrnout do váženého hodnocení poroty.
// =====================================================================
// Bere pouze "list" (leaf) hodnoty ze schématu (balanceSchema.js), NIKDY odvozené
// součty typu Celkem tam, kde by to duplikovalo součet svých vlastních složek
// (Celkem = a+b+c → skórovat a, b, c i Celkem zároveň by bylo počítání dvakrát).
// U dynamických kolekcí (E/F/G – patra/místnosti) je naopak přirozenou jednotkou
// právě jejich součet za návrh, protože počet pater/místností se liší návrh od návrhu.
//
// Směr (higher/lower) a váhu NEPŘEDEPISUJE tento soubor – nastavuje si je porota
// v UI. Bez explicitní volby směru i váhy se ukazatel do skóre nezapočítává
// (viz utils/balanceScore.js). Appka nedoplňuje výchozí váhu 10.

import { safeNum, computeDerivedField, floorsTotal, roomsGrandTotal } from '../utils/balanceCalculations.js';

const scalar = (id, nazev, sectionCode, jednotka, shortLabel) => ({
  id,
  nazev,
  shortLabel: shortLabel || nazev,
  sectionCode,
  jednotka,
  getValue: (data) => safeNum(data?.[id]),
});

export const SCORING_INDICATORS = [
  // Názvy = P03 (balanceSchema). shortLabel jen pro úzké sloupce (heatmapa, radar).
  scalar('bilance_zastavena', 'Zastavěná plocha', 'A', 'm²', 'Zastavěná'),
  scalar('bilance_zpevnena', 'Zpevněná plocha', 'A', 'm²', 'Zpevněná'),
  scalar('bilance_nezpevnena', 'Nezpevněná plocha', 'A', 'm²', 'Nezpevněná'),

  scalar('demolice_nadzemni', 'Nadzemní', 'B', 'm³', 'Demolice'),

  scalar('obestaveny_podzemni', 'Podzemní', 'C', 'm³', 'Obest. podzemí'),
  scalar('obestaveny_nadzemni', 'Nadzemní', 'C', 'm³', 'Obest. nadzemí'),

  scalar('nove_podzemni', 'Podzemní', 'D', 'm³', 'Nové podzemí'),
  scalar('nove_nadzemni', 'Nadzemní', 'D', 'm³', 'Nové nadzemí'),

  {
    id: 'hpp_celkem',
    nazev: 'Hrubá podlažní plocha',
    shortLabel: 'HPP',
    sectionCode: 'E',
    jednotka: 'm²',
    getValue: (data) => floorsTotal(data?.hpp),
  },
  {
    id: 'uzitna_celkem',
    nazev: 'Celková užitná plocha',
    shortLabel: 'Užitná',
    sectionCode: 'F',
    jednotka: 'm²',
    getValue: (data) => floorsTotal(data?.uzitna),
  },
  {
    id: 'mistnosti_celkem',
    nazev: 'Bilance místností',
    shortLabel: 'Místnosti',
    sectionCode: 'G',
    jednotka: 'm²',
    getValue: (data) => roomsGrandTotal(data?.mistnosti),
  },

  scalar('obalka_fasady', 'Fasády', 'H', 'm²', 'Fasády'),
  scalar('obalka_strechy', 'Střechy', 'H', 'm²', 'Střechy'),
  scalar('obalka_konstrukce', 'Konstrukce', 'H', 'm²', 'Konstrukce'),

  {
    id: 'proskleni_podil',
    nazev: 'Podíl prosklených ploch',
    shortLabel: 'Prosklení',
    sectionCode: 'I',
    jednotka: '%',
    getValue: (data) => {
      const ratio = computeDerivedField('proskleni_podil', data || {});
      return ratio === null ? null : ratio * 100;
    },
  },
];

export function getScoringIndicatorById(id) {
  return SCORING_INDICATORS.find((i) => i.id === id) || null;
}
