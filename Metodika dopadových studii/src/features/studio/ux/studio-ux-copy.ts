/**

 * Primární copy pro UX redesign průvodce — lidské nadpisy a podnadpisy.

 * Metodické symboly a interní klíče jsou v tooltipech / expert sekci.

 */



export const uxWizard = {

  /** Viditelných 6 makrokroků — pořadí odpovídá toku kroků 0–9 */

  /** Vysvětlení vztahu 6 fází / 10 podkroků — lišta makrokroků + postranní panel. */
  macroVersusSubstepsExplainer:
    "Šest fází = hlavní témata; přesná pozice je v hlavičce karty („Krok x z 10“).",

  macroClickHint:
    "U již vyplněných fází můžete kliknout a vrátit se na jejich začátek.",

  macroSteps: [

    { id: "intent", label: "Záměr", hint: "Co a kdo investuje, rozsah, T0" },

    { id: "territory", label: "Území", hint: "Vymezení, dostupnost, DIAD" },

    { id: "asis", label: "Výchozí stav", hint: "Území před záměrem (AS-IS)" },

    { id: "scenarios", label: "Čas a scénáře", hint: "Horizont a tři varianty" },

    { id: "inputs", label: "Klíčové vstupy", hint: "Dopady podle oblastí" },

    { id: "outcomes", label: "Výsledky", hint: "Závěry a limity" },

  ] as const,



  /** Lidské nadpisy kroků (10 interních kroků) */

  stepTitles: [

    "Záměr a popis projektu",

    "Území a dostupnost",

    "Výchozí stav území",

    "Horizont a scénáře hodnocení",

    "Zaměstnanost a trh práce",

    "Bydlení",

    "Občanská vybavenost",

    "Ekonomika a veřejné rozpočty",

    "Výsledky hodnocení",

    "Předpoklady a nejistoty",

  ],



  /** Co krok řeší + proč (CardDescription) */

  stepIntros: [

    "Strukturovaný popis záměru — investor, rozsah, harmonogram, PMJ a strategické vazby včetně rozhodného okamžiku T0.",

    "Kde záměr leží, jak je vymezený — volitelná geometrie a metrické vstupy dostupnosti pro výpočet.",

    "Baseline území před realizací: demografie, trh práce, bydlení a další — odděleně od odhadů dopadů.",

    "Referenční horizont a tři scénáře (optimistický, střední, pesimistický) — stejné předpoklady, jiné varianty vývoje.",

    "Odhad potřeby pracovních míst a souvislostí na trhu práce v regionu.",

    "Bytová potřeba a obsazenost — vstupy pro odhad obyvatel a tlaku na bydlení.",

    "Školství, zdraví, bezpečnost a volný čas — kapacity a poptávka.",

    "HDP a rozpočty obcí — podle metodiky, s ručním ΔHDP pro MVP.",

    "Přehled dopadů a srovnání scénářů — zde získáte odpovědi pro další krok.",

    "Přehled předpokladů a otevřených otázek — transparentní limity výpočtu.",

  ],



  summary: {

    title: "Průběh",

    completeness: "Vyplnění kroků",

    missing: "Chybí nebo je třeba doplnit",

    resultsOk: "Výsledky výpočtu",

    resultsYes: "K dispozici (baseline)",

    resultsNo:

      "Ještě ne — dokončete vstupní kroky až po ekonomiku; po kliknutí na Další se připraví výstup a zobrazí obrazovka výsledků.",

    resultsHint:

      "Po změně vstupů použijte „Přepočíst“ na obrazovce výsledků.",

    topWarnings: "Aktuální varování (baseline)",

    none: "Žádná",

    warningNavigateToField: "Přejít k poli ve formuláři",

    firstStepWithErrors: "Přejít k prvnímu kroku s chybou",

    uncertainModule: "Slabě podložená oblast (podle varování)",

    expertNoteTitle: "Technická poznámka (metodika)",

    expertNoteBody:

      "Čísla pro výpočet M3–M6 zadáváte v následujících krocích — v prohlížeči se nic nepřepočítává. AS-IS baseline je zatím informační vrstva.",

  },



  /** Scénářové parametry — lidský popisek, `expert` pro tooltip */

  scenarioDeltaFields: [

    {

      human: "Využitelnost lokální kalkulace práce (RZPS)",

      expert: "util_RZPS",

    },

    { human: "Efektivní daňová kvóta", expert: "theta" },

    { human: "Podíl dojížďujících", expert: "p_pendler" },

    { human: "Podíl kmenových zaměstnanců u investora", expert: "k_inv" },

  ],



  /**
   * Kontext každého kroku — čo je vstup, prečo sa pýtame.
   * Index odpovedá číslu interného kroku (0–9).
   */
  stepContextType: [
    "intent",     // 0 — Záměr
    "baseline",   // 1 — Území
    "baseline",   // 2 — AS-IS
    "scenario",   // 3 — Scénáře
    "impact",     // 4 — Zaměstnanost
    "impact",     // 5 — Bydlení
    "impact",     // 6 — Občanská vybavenost
    "impact",     // 7 — Ekonomika
    "results",    // 8 — Výsledky
    "audit",      // 9 — Předpoklady
  ] as const,

  stepContextLabel: {
    intent: "Popis záměru",
    baseline: "Výchozí stav",
    scenario: "Scénářové předpoklady",
    impact: "Vstup výpočtu dopadů",
    results: "Výsledky",
    audit: "Transparentnost a limity",
  } as const,

  stepContextTip: {
    intent: "Popis záměru slouží jako identifikační a kontextuální vrstva — neentruje přímo do vzorců, ale definuje rámec hodnocení.",
    baseline: "Výchozí stav (AS-IS baseline) popisuje území před záměrem. Tyto hodnoty jsou referenční — nejsou vstupy výpočtu dopadů, ale slouží pro srovnání.",
    scenario: "Scénářové parametry určují, jak se výsledky liší mezi optimistickým, středním a pesimistickým scénářem. Prázdné pole = použije se předvolená hodnota metodiky.",
    impact: "Vstupy tohoto kroku přímo vstupují do výpočtového jádra (M3–M6). Ovlivňují odhad pracovních míst, bydlení, vybavenosti a ekonomických efektů.",
    results: "Výsledková obrazovka zobrazuje vypočítané dopady — nepřidávají se žádná nová data, jen se vizualizuje výstup jádra.",
    audit: "Přehled použitých předpokladů a otevřených otázek metodiky — transparentní vrstva pro audit a dokumentaci.",
  } as const,

  /** Po změně vstupů při existujícím baseline — výsledková obrazovka / report. */
  resultsStale: {
    title: "Vstupy se změnily od posledního přepočtu",
    body:
      "Zobrazená čísla odpovídají poslednímu úspěšnému přepočtu. Pro shodu s aktuálními vstupy stiskněte „Přepočíst všechny scénáře“.",
    shortHint:
      "Změnili jste vstupy — výsledky mohou být neaktuální, dokud znovu nepřepočítáte.",
  },

  decision: {

    title: "Shrnutí pro rozhodnutí",

    conclusion: "Shrnutí čísel",

    decisionBulletsTitle: "Co z toho plyne pro rozhodnutí",

    nextSteps: "Doporučené další kroky",

    topKpi: "Klíčová čísla (střední scénář)",

    deepDive: "Detail a scénáře",

    expertJson: "Technický detail výpočtu (pro audit)",

    explainabilityIntro:
      "Níže: srovnání polí průvodce s tím, co engine skutečně použil po mostech P1 — bez syrového JSON.",

  },

} as const;


