// Registr ukazatelů, které lze zahrnout do váženého hodnocení poroty.
// =====================================================================
// Bere pouze "list" (leaf) hodnoty ze schématu (balanceSchema.js), NIKDY odvozené
// součty typu Celkem tam, kde by to duplikovalo součet svých vlastních složek
// (Celkem = a+b+c → skórovat a, b, c i Celkem zároveň by bylo počítání dvakrát).
// U dynamických kolekcí (E/F/G – patra/místnosti) je naopak přirozenou jednotkou
// právě jejich součet za návrh, protože počet pater/místností se liší návrh od návrhu.
//
// Směr (higher/lower) a váhu NEPŘEDEPISUJE tento soubor – nastavuje si je porota
// v UI (viz utils/scoringSettings.js). Bez explicitní volby poroty se ukazatel
// do skóre nezapočítává (viz utils/balanceScore.js).

import { safeNum, computeDerivedField, floorsTotal, roomsGrandTotal } from '../utils/balanceCalculations.js';

const scalar = (id, nazev, sectionCode, jednotka) => ({
  id,
  nazev,
  sectionCode,
  jednotka,
  getValue: (data) => safeNum(data?.[id]),
});

export const SCORING_INDICATORS = [
  // A. Bilance ploch
  scalar('bilance_zastavena', 'Zastavěná plocha', 'A', 'm²'),
  scalar('bilance_zpevnena', 'Zpevněná plocha', 'A', 'm²'),
  scalar('bilance_nezpevnena', 'Nezpevněná plocha', 'A', 'm²'),

  // B. Demolice stávající stavby
  scalar('demolice_nadzemni', 'Demolice (nadzemní)', 'B', 'm³'),

  // C. Celkový obestavěný prostor
  scalar('obestaveny_podzemni', 'Obestavěný prostor – podzemní', 'C', 'm³'),
  scalar('obestaveny_nadzemni', 'Obestavěný prostor – nadzemní', 'C', 'm³'),

  // D. Obestavěný prostor nových objemů
  scalar('nove_podzemni', 'Nové objemy – podzemní', 'D', 'm³'),
  scalar('nove_nadzemni', 'Nové objemy – nadzemní', 'D', 'm³'),

  // E/F/G – dynamická patra/místnosti: skóruje se součet za návrh (jediná srovnatelná jednotka)
  {
    id: 'hpp_celkem',
    nazev: 'Hrubá podlažní plocha (celkem)',
    sectionCode: 'E',
    jednotka: 'm²',
    getValue: (data) => floorsTotal(data?.hpp),
  },
  {
    id: 'uzitna_celkem',
    nazev: 'Celková užitná plocha (celkem)',
    sectionCode: 'F',
    jednotka: 'm²',
    getValue: (data) => floorsTotal(data?.uzitna),
  },
  {
    id: 'mistnosti_celkem',
    nazev: 'Bilance místností (celkem)',
    sectionCode: 'G',
    jednotka: 'm²',
    getValue: (data) => roomsGrandTotal(data?.mistnosti),
  },

  // H. Plocha obálky
  scalar('obalka_fasady', 'Obálka – fasády', 'H', 'm²'),
  scalar('obalka_strechy', 'Obálka – střechy', 'H', 'm²'),
  scalar('obalka_konstrukce', 'Obálka – konstrukce', 'H', 'm²'),

  // I. Podíl prosklených ploch – skóruje se přímo poměr (AW/AF samotné nejsou směrově smysluplné)
  {
    id: 'proskleni_podil',
    nazev: 'Podíl prosklených ploch',
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
