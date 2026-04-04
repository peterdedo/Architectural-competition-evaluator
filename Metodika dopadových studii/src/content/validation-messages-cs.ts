/**
 * České texty pro validaci vstupů — jeden zdroj pro Zod a případné UI.
 * EN zrcadlo pro budoucí lokalizaci (stejné klíče).
 */
export const validationMessagesCs = {
  nonNeg: "Zadejte nezáporné číslo.",
  int: "Zadejte celé číslo.",
  finite: "Zadejte platné číslo.",
  range01: "Hodnota musí být mezi 0 a 1.",
  rangeYears: "Zadejte počet let v rozsahu 1–30.",
  capexMax: "CAPEX je mimo rozumný rozsah (max. 10¹⁵ Kč).",
  nInvMax: "Počet PMJ je mimo rozumný rozsah (max. 50 mil.).",
  distanceKmMax: "Vzdálenost poslední míle je mimo rozumný rozsah (max. 5 000 km).",
  minutesMax: "Čas v minutách je mimo rozumný rozsah (max. 10 080 min ≈ 1 týden).",
  tinfrMax: "Čas infrastruktury (T_infr) je mimo rozumný rozsah (max. 525 600 min).",
  rate01: "Míra nebo podíl musí být mezi 0 a 1.",
  wageMax: "Mzda je mimo rozumný rozsah (max. 500 000 Kč).",
  hdpCapitaMax: "HDP na obyvatele je mimo rozumný rozsah.",
  populationMax: "Počet obyvatel je mimo rozumný rozsah.",
  migrationRange: "Saldo migrace je mimo rozumný rozsah (−5 až 5 mil. osob / rok).",
  vacantMax: "Počet volných jednotek je mimo rozumný rozsah.",
  rentMax: "Nájem je mimo rozumný rozsah (max. 100 000 Kč).",
  gpMax: "Kapacita na 1000 obyvatel je mimo rozumný rozsah.",
  budgetCapitaMax: "Rozpočet na obyvatele je mimo rozumný rozsah.",
  shareHousingMax: "Podíl typu bydlení musí být mezi 0 a 1.",
  occMax: "Obsazenost / počet osob na jednotku je mimo rozumný rozsah.",
  countSanity: "Hodnota je mimo rozumný rozsah pro tento vstup.",
  deltaHdpRange: "ΔHDP je mimo rozumný rozsah (±10¹³ Kč).",
  m2Max: "Plocha je mimo rozumný rozsah.",
  pricePerM2Max: "Cena za m² je mimo rozumný rozsah.",
  /** Scénářové delty — podíly a efektivní kvóty (theta atd.) v modelu 0–1. */
  scenarioDeltaShareRange:
    "Scénářový parametr (podíl nebo efektivní kvóta) musí být mezi 0 a 1.",
} as const;

/** Stejné klíče jako validationMessagesCs — anglické znění pro budoucí přepínač jazyka. */
export const validationMessagesEn: Record<keyof typeof validationMessagesCs, string> = {
  nonNeg: "Enter a non-negative number.",
  int: "Enter a whole number.",
  finite: "Enter a valid number.",
  range01: "Value must be between 0 and 1.",
  rangeYears: "Enter years between 1 and 30.",
  capexMax: "CAPEX is outside a reasonable range (max 10¹⁵ CZK).",
  nInvMax: "Job count is outside a reasonable range (max 50M).",
  distanceKmMax: "Last-mile distance is outside a reasonable range (max 5,000 km).",
  minutesMax: "Minutes are outside a reasonable range (max 10,080 min ≈ one week).",
  tinfrMax: "Infrastructure time is outside a reasonable range (max 525,600 min).",
  rate01: "Rate or share must be between 0 and 1.",
  wageMax: "Wage is outside a reasonable range (max 500,000 CZK).",
  hdpCapitaMax: "GDP per capita is outside a reasonable range.",
  populationMax: "Population is outside a reasonable range.",
  migrationRange: "Net migration is outside a reasonable range (−5M to +5M persons/year).",
  vacantMax: "Vacant units are outside a reasonable range.",
  rentMax: "Rent is outside a reasonable range (max 100,000 CZK).",
  gpMax: "Capacity per 1,000 inhabitants is outside a reasonable range.",
  budgetCapitaMax: "Budget per capita is outside a reasonable range.",
  shareHousingMax: "Housing-type share must be between 0 and 1.",
  occMax: "Occupancy / persons per unit is outside a reasonable range.",
  countSanity: "Value is outside a reasonable range for this field.",
  deltaHdpRange: "ΔGDP is outside a reasonable range (±10¹³ CZK).",
  m2Max: "Area is outside a reasonable range.",
  pricePerM2Max: "Price per m² is outside a reasonable range.",
  scenarioDeltaShareRange:
    "Scenario parameter (share or effective quota) must be between 0 and 1.",
};
