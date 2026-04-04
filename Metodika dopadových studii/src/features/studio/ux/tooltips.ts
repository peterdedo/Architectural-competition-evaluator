import {
  TRUST_SCENARIOS_PRIMARY,
  TRUST_SCENARIOS_SECONDARY,
  TRUST_OQ_PRIMARY,
} from "@/content/trust-framing-cs";

/**
 * Centralizované texty tooltipov a info panelov pre UI.
 *
 * Pravidlá:
 * - Prvá veta: ľudský popis čo to je.
 * - Druhá veta (voliteľná): prečo to záleží / metodický kontext.
 * - Max 2-3 vety. Žiadna dlhá dokumentácia.
 */

export const tips = {
  // --- KPI ---
  kpiEmployment:
    "Celkový odhadovaný počet pracovných miest potrebných pre realizáciu záme­ru — vrátane priamych aj navazujúcich miest v regióne. Číslo vychádza zo stredného scénára (baseline).",

  kpiHousingOu:
    "Odhadovaný počet nových obyvateľov, ktorí sa v regióne usadia v súvislosti so zámerom. Vstupuje do výpočtu potreby bytov a občianskej vybavenosti.",

  kpiTaxYield:
    "Orientačný ročný daňový výnos pre verejné rozpočty — štát, kraj a obec. Výpočet je zjednodušený (metodika MHDSI) a slúži len pre porovnanie scénárov, nie pre presné fiškálne plánovanie.",

  kpiDeltaHdp:
    "Odhad zmeny hrubého domáceho produktu (HDP) spôsobenej zámerom. Hodnota môže pochádzať z výpočtového profilu alebo z ručne zadanej hodnoty — zdroj je uvedený v reporte.",

  kpiHouseholdC:
    "Orientačný ročný objem výdavkov domácností spojených so zámerom. Odvodenec počtu usadených obyvateľov a priemernej domácej spotreby podľa metodiky.",

  kpiPrud:
    "Príspevok obci na rozpočtové určenie daní (RUD) — ročný odhad. Závisí od počtu usadených obyvateľov a koeficientov podľa zákona o RUD.",

  kpiDznm:
    "Odhad ročného výnosu dane z nehnuteľností pre obec. Závisí od predpokladanej novej výstavby a sadzby dane.",

  // --- Scénáre ---
  scenarios: `${TRUST_SCENARIOS_PRIMARY} ${TRUST_SCENARIOS_SECONDARY}`,

  baseline:
    "Stredný scénár (baseline) je hlavný referenčný výsledok. Používa strednú hodnotu každého scénárového parametra. Optimistický a pesimistický scénár ukazujú citlivosť výsledkov na iné predpoklady.",

  scenarioParams:
    "Každý scénár môže mať iné hodnoty týchto parametrov. Ak pole necháte prázdne, použije sa predvolená hodnota z registra predpokladov (fallback). Rozdiely medzi scénármi ukazujú, ako citlivé sú výsledky na zmenu predpokladov.",

  // --- Predpoklady a OQ ---
  assumptions:
    "Predpoklady sú hodnoty parametrov, ktoré výpočet potrebuje, ale priamo nevyplývajú zo vstupných dát záme­ru. Niektoré zadáte v priebodci, iné pochádzajú z metodiky (predvolené hodnoty). Všetky sú viditeľné v reporte.",

  openQuestions: `${TRUST_OQ_PRIMARY} Znamená to vyšší nejistotu odhadu, ne chybu výpočtu.`,

  fallback:
    "Fallback (záložná hodnota) nastáva, keď pre daný parameter nebol zadaný konkrétny vstup. Systém automaticky použije predvolenú hodnotu z registra predpokladov a vydá upozornenie. Výsledok je stále platný, ale menej presný.",

  deltaHdpSource:
    "Odhad změny HDP buď dopočítáme z rozsahu investice a pracovních míst, nebo použijete vlastní číslo z průvodce. Která varianta platí, je vždy uvedeno u výsledku.",

  // --- Warnings ---
  warning:
    "Upozornenie vznikne, keď výpočet použil záložnú hodnotu namiesto presného vstupu, alebo keď metodika identifikovala otvorenú otázku. Upozornenie neznamená chybu — výsledok je stále platný, ale odporúčame skontrolovať uvedené pole.",

  // --- Wizard kontexty ---
  wizardBaseline:
    "Výchozí stav (AS-IS baseline) popisuje území pred realizáciou záme­ru — demografia, trh práce a bydlenie. Tieto dáta nie sú vstupy výpočtu dopadov, ale referenčná vrstva pre porovnanie.",

  wizardImpactInput:
    "Tyto údaje přímo ovlivní odhad pracovních míst, bydlení, občanské vybavenosti a veřejných financí.",

  wizardScenarioChange:
    "Scénárová odchýlka je hodnota parametra, ktorá sa líši medzi optimistickým, stredným a pesimistickým scénárom. Ak pole necháte prázdne, použije sa predvolená hodnota.",

  // --- Report ---
  reportInputsLayer:
    "Sekcia obsahuje vstupy záme­ru presne tak, ako boli zadané v priebodci — bez prepočtov. Slúži na audit a overenie, že výpočet vychádza zo správnych dát.",

  reportBaselineLayer:
    "AS-IS baseline — stav územia pred zámerom. Referenčná vrstva, nie vstup výpočtu.",

  reportResultsLayer:
    "Odhady dopadů podle oblastí pro každý ze tří scénářů. Hodnoty jsou orientační a vycházejí ze zadaných vstupů.",

  reportScenariosLayer:
    "Srovnání tří variant předpokladů — stejná logika jako v průvodci.",

  reportAssumptionsLayer:
    "Předpoklady, otevřené otázky a záložní hodnoty, které odhad použil — pro kontrolu a dokumentaci.",
} as const;
