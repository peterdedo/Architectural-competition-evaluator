/** Uživatelské texty (cs) — připraveno pro pozdější i18n vrstvu. */
export const cs = {
  /** Krátké texty pro domovskou stránku a režim uživatelského testování (bez nových funkcí). */
  usability: {
    homeTitle: "MHDSI — studie dopadů strategické investice",
    homeLead:
      "Průvodce vede vstupy do výpočetního jádra a zobrazí srovnání scénářů. Pro rychlý průchod jsou předvyplněná ukázková data.",
    homeStepsHint:
      "Průvodce → kroky Další → výsledky se přepočítají → zkontrolujte shrnutí → otevřete report.",
    studioBanner:
      "Údaje jsou předvyplněné pro rychlý náhled. Rozpracovaný stav vstupů se ukládá v tomto prohlížeči — můžete se k práci vrátit později (stejné zařízení a prohlížeč). Po změně vstupů použijte na obrazovce výsledků tlačítko Přepočíst.",
    /** Krátký `<summary>` pro sbalený banner — méně vizuálního šumu nahoře. */
    studioBannerSummary: "Poznámka k ukázkovým datům, uložení a přepočtu",
    /** Po F5: vstupy z prohlížeče, pozice průvodce vždy od začátku (viz persist currentStep). */
    restoredInputsHint:
      "Vstupy byly obnoveny z uloženého stavu — průvodce začíná od prvního kroku.",
  },
  resultsView: {
    noBaselineTitle: "Výsledky ještě nejsou připravené",
    noBaselineBody:
      "Stiskněte tlačítko níže — z aktuálních vstupů z průvodce se spočítají všechny tři scénáře. Potom uvidíte přehled a doporučení.",
  },
  wizard: {
    title: "Průvodce studií dopadů",
    progress: (n: number, total: number) => `Krok ${n} z ${total}`,
    back: "Zpět",
    next: "Další",
    /** Během synchronního výpočtu pipeline (může trvat několik sekund). */
    calculating: "Počítáme odhad dopadů…",
    calculatingHint:
      "Probíhá přepočet tří scénářů v prohlížeči — krátce počkejte; čísla jsou orientační.",
    recalculate: "Přepočíst všechny scénáře",
    resetDemo: "Obnovit ukázková data",
    linkReport: "Výstupní report",
    helperEngineBoundary:
      "Údaje slouží jako vstup do výpočtu — výsledky uvidíte po dokončení vstupních kroků.",
    stepTitles: [
      "Základní údaje o projektu",
      "Investor a charakteristika záměru",
      "Vymezení území",
      "Harmonogram a scénáře",
      "Zaměstnanost",
      "Bydlení",
      "Občanská vybavenost",
      "Ekonomické a fiskální přínosy",
      "Výsledky a srovnání scénářů",
      "Předpoklady a nejistoty",
    ],
    scenarioParamsIntro:
      "Scénářové parametry — odlišné hodnoty pro každý scénář vývoje",
    deltaHdpField: {
      label: "Odhad změny HDP — vstupní hodnota",
      helper:
        "Orientační vstup v Kč. Pokud je zapnut výpočtový profil, jádro tento odhad odvodí automaticky; toto pole pak slouží jako záloha.",
      labelTitle:
        "Zdroj skutečně použité hodnoty (profil vs. ruční) je viditelný v reportu.",
    },
  },
  scenarios: {
    optimistic: "Optimistický",
    baseline: "Střední scénář",
    pessimistic: "Pesimistický",
  },
  scenarioSymbols: {
    util_RZPS: "Využitelnost lokální pracovní síly",
    theta: "Efektivní daňová kvóta",
    p_pendler: "Podíl dojíždějících pracovníků",
    k_inv: "Podíl kmenových zaměstnanců u investora",
  },
  dashboard: {
    /** Primární lidský název; technický symbol je v titulTooltip / podnadpisu karty */
    kpiEmployment: "Potřeba pracovních míst",
    kpiRzps: "Využití regionální pracovní síly",
    kpiHousingOu: "Obyvatelé k usazení",
    kpiCivicOu: "Obyvatelé (občanská vybavenost)",
    kpiTax: "Orientační daňový výnos",
    kpiHouseholdC: "Spotřeba domácností (ročně)",
    kpiDznm: "Daň z nemovitostí (ročně)",
    kpiPrud: "Příspěvek obcím na RUD (ročně)",
    kpiDeltaHdp: "Odhad změny HDP",
    kpiDeltaHdpMethodSymbol: "Symbol metodiky: ΔHDP",
    kpiDeltaHdpModeLine: "Zdroj hodnoty: viz detail",
    kpiDeltaHdpCardTooltip:
      "Odhad změny HDP může vycházet z výpočtového profilu (automaticky z CAPEX a počtu míst) nebo z ručně zadané hodnoty. Zdroj je uveden v reportu.",
    kpiDeltaHdpResultsFootnote:
      "Odhad změny HDP závisí na zvoleném režimu vstupu. Daňový výnos vždy sleduje použitou hodnotu ΔHDP ve zvoleném scénáři.",
    warnings: "Upozornění výpočtu",
    assumptions: "Použité předpoklady",
    openQuestions: "Otevřené otázky metodiky",
    intermediate: "Mezivýsledky",
    expand: "Rozbalit",
    collapse: "Sbalit",
    comparisonTitle: "Srovnání scénářů",
    m7StudioNoteTitle: "Citlivostní analýza (přehled)",
    emptyResultsHint: "Spusťte přepočet tlačítkem výše.",
    noWarnings: "Žádná upozornění.",
    warningFieldHint: (field: string) => `Vztahuje se k poli: ${field}`,
    warningGoToField: "Přejít na vstup v průvodci",
  },
  assumptionsPanel: {
    intro:
      "Přehled klíčových předpokladů, které ovlivňují výsledky — spolu se scénářovými odchylkami a otevřenými otázkami metodiky.",
    sharedFromWizard: "Sdílené předpoklady (z průvodce)",
    scenarioDeltas: "Odchylky podle scénářů",
  },
} as const;
