/** České nadpisy a statické texty výstupního reportu. */
export const reportCs = {
  print: {
    documentTitle: "Studie dopadu strategické investice",
    documentSubtitle:
      "Stejná data jako na obrazovce — bez nových přepočtů, upraveno pro tisk nebo PDF.",
    auditTruncatedNote:
      "[zkráceno — plný obsah auditní přílohy je v elektronickém JSON exportu]",
    openPrintDialog: "Tisk nebo uložit jako PDF",
    linkPrintView: "Tisková verze / PDF",
    backToScreenReport: "Zpět na report",
    printHint:
      "V dialogu tisku zvolte uložit jako PDF nebo tiskárnu. Okraje: cca 14 mm.",
  },
  pageTitle: "Výstupní report studie dopadu",
  pageSubtitle:
    "Stejná data jako ve výsledcích průvodce — z jednoho uloženého běhu, bez dalšího přepočítávání.",
  /** Mikrotext pod lištou reportu — stejná data jako ve výsledcích průvodce */
  pageToolbarHint:
    "Toto jsou stejná data jako na obrazovce výsledků průvodce — bez nového přepočtu.",
  noDataTitle: "Zatím není co zobrazit",
  noDataLead:
    "Report vznikne až po tom, co v průvodci dokončíte vstupy a jednou spustíte přepočet všech scénářů. Zatím v prohlížeči nejsou uložené výsledky.",
  noDataWhatToDo: "Co udělat",
  noDataStep1:
    "Otevřete průvodce a projděte kroky až po sekci ekonomika a veřejné rozpočty.",
  noDataStep2:
    "Klikněte na Další — zobrazí se výsledky; tam stiskněte Přepočíst všechny scénáře.",
  noDataStep3: "Vraťte se na tuto stránku — report se naplní automaticky.",
  linkStudio: "Otevřít průvodce",
  linkHome: "Úvodní stránka",
  editWizard: {
    title: "Upravit vstupy v průvodci",
    hint: "Data zůstávají uložená v tomto prohlížeči — po úpravách znovu přepočtěte scénáře na obrazovce výsledků.",
    openWizard: "Otevřít průvodce od začátku",
    quickLinksTitle: "Rychlý skok na krok",
    steps: [
      { step: 0, label: "Záměr a projekt" },
      { step: 2, label: "Výchozí stav území (AS-IS)" },
      { step: 4, label: "Zaměstnanost a trh práce" },
      { step: 7, label: "Ekonomika a rozpočty" },
      { step: 8, label: "Výsledky v průvodci" },
    ] as const,
  },
  exportsAria: {
    inputs: "Stáhnout JSON: vstupy podle scénářů",
    wizardState: "Stáhnout JSON: uložené odpovědi průvodce",
    results: "Stáhnout JSON: výsledky výpočtu všech scénářů",
    snapshot: "Stáhnout JSON: celý report pro archivaci",
    comparison: "Stáhnout JSON: srovnání tří scénářů",
  },
  exports: {
    title: "Stáhnout data (JSON)",
    inputs: "Všechny vstupy podle scénářů",
    wizardState: "Celý průvodce (uložené odpovědi)",
    results: "Všechny výsledky výpočtu",
    snapshot: "Celý report pro archivaci",
    comparison: "Srovnání tří scénářů",
  },
  sections: {
    executive: "Manažerské shrnutí",
    kpi: "Klíčové ukazatele (střední scénář)",
    p1: "Vstupy záměru a výchozí stav území",
    p1m34: "Auditní stopa — odvozené vstupy zaměstnanosti a bydlení (JSON)",
    p1m5: "Auditní stopa — odvozené vstupy občanské vybavenosti (JSON)",
    p1m6: "Auditní stopa — zdroj ΔHDP a profil ekonomiky (JSON)",
    s01: "1. Základní údaje o projektu",
    s02: "2. Investor a charakteristika záměru",
    s03: "3. Vymezení území a časový rámec",
    s04: "4. Scénáře hodnocení",
    s05: "5. Shrnutí výchozí situace",
    s06: "6. Dopady na zaměstnanost",
    s07: "7. Dopady na bydlení",
    s08: "8. Dopady na občanskou vybavenost",
    s09: "9. Ekonomické a fiskální přínosy",
    s10r: "10. Rizika",
    s10m: "10. Mitigace rizik",
    s11: "11. Srovnání scénářů",
    m7: "Scénářová konsolidace — přehled všech tří scénářů (M7)",
    s12: "12. Předpoklady a nejistoty",
    s13: "13. Auditní příloha",
  },
  labels: {
    confirmed: "Potvrzené výstupy výpočtu",
    assumptionDriven: "Části závislé na předpokladech",
    uncertainties: "Nejistoty a otevřené otázky",
    warningsBlock: "Upozornění z výpočtu",
    assumptionsBlock: "Použité předpoklady",
    oqBlock: "Otevřené otázky metodiky",
    traceNote:
      "Detailní auditní stopa je uvedena níže — pro čtení reportu není nutná.",
    baselineWarningsNote:
      "(Střední scénář — referenční výsledky pro text reportu)",
    auditTraceToggle: "Zobrazit auditní stopu (JSON)",
    moduleJsonNote:
      "Technický výpis dílčích výsledků — shodný se strukturou dat v exportu.",
    mitigationSourceCivic: "Z výpočtu občanské vybavenosti",
    mitigationSourceHeuristic:
      "Heuristika (porovnání počtu upozornění mezi scénáři)",
    comparisonTable: {
      scenario: "Scénář",
      nCelkem: "Pracovní místa celkem",
      nMezera: "Mezera na trhu práce",
      ou: "Noví obyvatelé",
      housingDeficit: "Bytový deficit (odhad)",
      deltaHdp: "Odhad změny HDP",
      deltaHdpSourceShort: "Zdroj ΔHDP",
      taxYield: "Daňový výnos (rok)",
      householdC: "Spotřeba domácností (rok)",
      dznm: "Daň z nemovitostí (rok)",
      deltaHdpFootnote:
        "Odhad změny HDP vychází z výpočtu M6. Při zapnutém profilu se ΔHDP liší mezi scénáři; při ručním zadání může být shodný. Zdroj ΔHDP: Profil / Záloha / Ruční.",
      warnings: "Upozornění",
      oq: "Otev. otázky",
    },
    kpi: {
      deltaHdp: "Odhad změny HDP",
      deltaHdpSub:
        "Zdroj ΔHDP viz podnadpis (profil M6 / ruční vstup / záloha)",
    },
  },
  m8: {
    outlineTitle: "Struktura dokumentu dle metodiky",
    outlineNote:
      "Přehled osnovy studie dopadu dle metodiky MHDSI — ukazuje, kde v reportu naleznete jednotlivé části.",
    outlineToggle: "Zobrazit strukturu dokumentu",
    annexesHeader: "Přílohy",
    annexesNote:
      "Plný obsah všech příloh je k dispozici ve formě JSON exportu (celý snapshot nebo srovnání scénářů).",
    layers: {
      inputs: "VSTUPY",
      baseline: "AS-IS BASELINE",
      module_results: "VÝPOČTY (střední scénář)",
      scenarios: "SCÉNÁŘE",
      assumptions_oq_fallback: "PŘEDPOKLADY / OQ / FALLBACK",
    },
    layerDescriptions: {
      inputs: "Vstupní data průvodce a popis záměru",
      baseline: "Výchozí stav AS-IS — referenční, ne vstup výpočtu",
      module_results: "Výstupy výpočetního jádra M3–M6 pro střední scénář",
      scenarios: "Varianty (střední / optimistický / pesimistický) a M7 konsolidace",
      assumptions_oq_fallback:
        "Předpoklady, otevřené otázky a záložní hodnoty",
    },
  },
} as const;
