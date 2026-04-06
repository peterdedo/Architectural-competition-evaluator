/**
 * Report-only osnova kapitol 1–10 a podkapitol 1.1–10.4 dle minimální závazné struktury MHDSI.
 * Žádné výpočty — jen odhad pokrytí z textových vstupů a přítomnosti dat ve snapshotu.
 */
import type { WizardState } from "@/features/studio/wizard-types";
import type {
  MethodologyOutline110,
  MethodologyOutlineChapter,
  MethodologyReportSnapshot,
} from "./types";

function nz(s: string | undefined | null): boolean {
  return Boolean(s && String(s).trim().length > 0);
}

/**
 * Sestaví metadatabázi kapitol 1–10 a podkapitol pro TOC, štítky completeness a audit mapování.
 * `snapshot` musí mít vyplněné `executiveSummaryCs` (pro kap. 9).
 */
export function buildMethodologyOutline110(
  state: WizardState,
  snapshot: MethodologyReportSnapshot,
): MethodologyOutline110 {
  const m0 = state.layerM0;
  const m1 = state.layerM1;
  const hasExec = nz(snapshot.executiveSummaryCs);

  const ch1Complete =
    nz(state.projectName) &&
    nz(state.locationDescription) &&
    state.capexTotalCzk > 0;

  const ch1: MethodologyOutline110["chapters"][number] = {
    chapter: 1,
    titleCs: "Základní údaje o projektu",
    completeness: ch1Complete ? "complete" : "partial",
    subsections: [
      {
        id: "1.1",
        titleCs: "Název projektu / záměru",
        completeness: nz(state.projectName) ? "complete" : "partial",
        dataSourceHintCs: "section01_project.projectName",
      },
      {
        id: "1.2",
        titleCs:
          "Místo realizace (AOIVuz, nebo definiční bod, AOIDadm)",
        completeness:
          nz(state.locationDescription) && nz(m1.definitionPointLabel)
            ? "partial"
            : nz(state.locationDescription) || nz(m1.definitionPointLabel)
              ? "partial"
              : "missing",
        noteCs:
          "AOIVuz / AOIDadm: textově v průvodci a vrstvě M1; přesné GIS hranice nejsou v MVP generovány.",
        dataSourceHintCs:
          "section01_project.locationDescription, p1_layers.m1.definitionPointLabel, m1.municipality",
      },
      {
        id: "1.3",
        titleCs:
          "Předpokládané souhrnné investiční náklady a časový rámec projektu (etapizace)",
        completeness:
          state.capexTotalCzk > 0 && nz(state.t0) ? "complete" : "partial",
        noteCs:
          "Etapizace v odvozeném smyslu: CAPEX + T0 + horizont; detailní milníky viz harmonogram v 1.4.",
        dataSourceHintCs:
          "section01_project.capexTotalCzk, section03_territory.t0, section03_territory.rampYearsGlobal",
      },
      {
        id: "1.4",
        titleCs: "Projektové období (fáze příprava – výstavba – provoz)",
        completeness:
          nz(m0.schedule.constructionStart) ||
          nz(m0.schedule.fullOperationPlanned)
            ? "partial"
            : "missing",
        noteCs:
          nz(m0.schedule.constructionStart) || nz(m0.schedule.fullOperationPlanned)
            ? "Textové štítky harmonogramu ve vrstvě záměru (M0); strukturovaná Gantt osa v aplikaci není."
            : "V aktuální verzi reportu chybí strukturovaná etapizace — doplňte textově v průvodci (harmonogram).",
        dataSourceHintCs: "p1_layers.m0.schedule",
      },
    ],
  };

  const ch2: MethodologyOutlineChapter = {
    chapter: 2,
    titleCs: "Informace o investorovi a zpracovateli dopadové studie",
    completeness: "partial",
    coverageNoteCs:
      "Údaje o zpracovateli DS (název organizace, IČO, odpovědná osoba) nejsou v této verzi aplikace ve strukturovaných vstupech — doplní se v textu finální studie.",
    subsections: [
      {
        id: "2.1",
        titleCs:
          "Základní údaje o investorovi (název, IČO, sídlo, právní forma, kontaktní osoba)",
        completeness:
          nz(state.investorProfile) || nz(state.legalForm) ? "partial" : "missing",
        noteCs:
          "K dispozici volný text profilu a právní forma — strukturované IČO, sídlo a kontakt nejsou v polích MVP.",
        dataSourceHintCs: "section02_investor.investorProfile, section02_investor.legalForm",
      },
      {
        id: "2.2",
        titleCs:
          "Základní údaje o zpracovateli DS (název, IČO, sídlo, odpovědný garant, kontaktní osoba)",
        completeness: "missing",
        noteCs:
          "Nejsou součástí výstupu z aplikace — doplní zpracovatel mimo MHDSI UI.",
        dataSourceHintCs: "— (mimo snapshot)",
      },
      {
        id: "2.3",
        titleCs:
          "Popis role zpracovatele DS, způsob spolupráce se zadavatelem a investorem",
        completeness: "missing",
        noteCs:
          "Nejsou součástí strukturovaných vstupů — doplní se v textu finální dokumentace.",
        dataSourceHintCs: "— (mimo snapshot)",
      },
    ],
  };

  const hasM0Narrative =
    nz(m0.capacityNarrative) ||
    m0.scopeCapacity.floorAreaM2 > 0 ||
    m0.scopeCapacity.siteAreaM2 > 0;

  const ch3: MethodologyOutline110["chapters"][number] = {
    chapter: 3,
    titleCs: "Charakteristika investičního záměru",
    completeness: hasM0Narrative ? "partial" : "missing",
    coverageNoteCs:
      "Profesní klasifikace (CZ-ISCO), typ investice a vazby na jiné projekty nejsou ve strukturovaných polích reportu.",
    subsections: [
      {
        id: "3.1",
        titleCs: "Popis projektu (kapacita, funkce, technologie)",
        completeness: hasM0Narrative ? "partial" : "missing",
        dataSourceHintCs: "p1_layers.m0 (capacityNarrative, scopeCapacity, pmjPortfolio)",
      },
      {
        id: "3.2",
        titleCs:
          "Strategický význam projektu (vazba na státní a krajské strategie, průmyslové priority, politiky transformace)",
        completeness:
          state.strategicLinks.trim().length > 0 ||
          m0.strategicDocuments.some((d) => nz(d.title))
            ? "partial"
            : "missing",
        dataSourceHintCs:
          "section02_investor.strategicLinks, p1_layers.m0.strategicDocuments",
      },
      {
        id: "3.3",
        titleCs:
          "Odvětvová klasifikace (CZ-NACE), profesní klasifikace (CZ-ISCO) a typ investice (výrobní, technologická, výzkumná)",
        completeness: nz(state.czNace) ? "partial" : "missing",
        noteCs:
          "CZ-NACE je ve vstupech; CZ-ISCO a typ investice jako samostatná pole v MVP nejsou.",
        dataSourceHintCs:
          "section01_project.czNace, p1_layers.m0.secondaryNace",
      },
      {
        id: "3.4",
        titleCs: "Popis stávající situace a zdůvodnění potřebnosti záměru",
        completeness: "missing",
        noteCs:
          "Samostatná strukturovaná kapitola není v datech — část kontextu může být v popisu záměru (M0).",
        dataSourceHintCs: "p1_layers.m0.capacityNarrative (částečný kontext)",
      },
      {
        id: "3.5",
        titleCs:
          "Vazby na jiné investiční projekty v území, synergie a odlišnosti",
        completeness: "missing",
        noteCs: "Nejsou k dispozici ve strukturovaných vstupech.",
        dataSourceHintCs: "—",
      },
    ],
  };

  const ch4: MethodologyOutlineChapter = {
    chapter: 4,
    titleCs: "Vymezení řešeného území",
    completeness:
      nz(m1.municipality) && nz(m1.definitionPointLabel) ? "partial" : "missing",
    coverageNoteCs:
      "Mapové přílohy a přesné hranice AOI nejsou generovány z aplikace; metrické vstupy dostupnosti (DIAD) a text M1 slouží jako náhrada.",
    subsections: [
      {
        id: "4.1",
        titleCs: "AOIVuz – vlastní území záměru",
        completeness: nz(m1.definitionPointLabel) ? "partial" : "missing",
        dataSourceHintCs: "p1_layers.m1.definitionPointLabel, m1.geoJsonText, m1.boundaryNote",
      },
      {
        id: "4.2",
        titleCs: "AOIDadm – dotčené administrativní území",
        completeness:
          nz(m1.municipality) && nz(m1.cadastralArea) ? "partial" : "missing",
        dataSourceHintCs: "p1_layers.m1.municipality, m1.region, m1.cadastralArea, m1.aoiUnitsLabel",
      },
      {
        id: "4.3",
        titleCs:
          "AOISiadpr / AOISiadak – spádové území podle doby dojížďky (preferovaná, akceptovaná)",
        completeness: "partial",
        noteCs:
          "Preferovaná / akceptovatelná doba dojížďky (DIAD) a poslední míle — viz číselná pole v reportu; isochrony dle režimu M1.",
        dataSourceHintCs:
          "section03_territory (diad*, dLastMileKm, tinfrMinutes), p1_layers.m1.isochronesMode, m1.isochronesManualNote",
      },
      {
        id: "4.4",
        titleCs:
          "Způsob stanovení spádového území, použitá metodika a zdroje dat",
        completeness: "partial",
        noteCs:
          "Režim isochron a poznámky jsou v datech M1 (JSON příloha); plná metodická citace je v textu studie mimo šablonu.",
        dataSourceHintCs: "p1_layers.m1 (isochrones*, geoJsonText)",
      },
    ],
  };

  const ch5: MethodologyOutline110["chapters"][number] = {
    chapter: 5,
    titleCs: "Analytická část (AS-IS)",
    completeness: "partial",
    coverageNoteCs:
      "Kompletní AS-IS je v datové vrstvě M2 a shrnutí vstupů; digitální infrastruktura a samostatný environmentální blok nejsou plně strukturovány.",
    subsections: [
      {
        id: "5.1",
        titleCs:
          "Demografický profil území (obyvatelstvo, migrace, struktura domácností)",
        completeness: "partial",
        dataSourceHintCs: "p1_layers.m2AsIs.demographics, m2.ageShares, section05_asIs",
      },
      {
        id: "5.2",
        titleCs:
          "Trh práce (zaměstnanost, nezaměstnanost, kvalifikační struktura, mzdová úroveň)",
        completeness: "partial",
        dataSourceHintCs: "p1_layers.m2AsIs (nezaměstnanost, mzdy, migrace — dle vyplnění)",
      },
      {
        id: "5.3",
        titleCs:
          "Infrastruktura a dostupnost (dopravní, technická, digitální)",
        completeness: "partial",
        noteCs:
          "Částečně přes metrické vstupy dostupnosti v kapitole 4 a text M1; technická infrastruktura není plná tabulka.",
        dataSourceHintCs: "section03_territory, p1_layers.m1",
      },
      {
        id: "5.4",
        titleCs:
          "Bydlení (dostupnost, kapacity, ceny, developerské projekty)",
        completeness: "partial",
        dataSourceHintCs: "p1_layers.m2AsIs (bydlení baseline), section05_asIs",
      },
      {
        id: "5.5",
        titleCs:
          "Občanská vybavenost (školství, zdravotnictví, sociální a volnočasová infrastruktura)",
        completeness: "partial",
        noteCs: "Baseline území; odhadované nároky z výpočtu jsou v kapitole 6.",
        dataSourceHintCs: "p1_layers.m2AsIs.civic, section05_asIs",
      },
      {
        id: "5.6",
        titleCs: "Veřejné finance a fiskální základna obcí",
        completeness: "partial",
        noteCs: "Kontext v baseline M2; detailní rozpočty nejsou vstupem MVP.",
        dataSourceHintCs: "p1_layers.m2AsIs.publicFinance, section05_asIs",
      },
      {
        id: "5.7",
        titleCs: "Bezpečnostní a environmentální aspekty",
        completeness: "missing",
        noteCs:
          "Samostatná strukturovaná část AS-IS v reportu z aplikace není.",
        dataSourceHintCs: "—",
      },
    ],
  };

  const ch6: MethodologyOutlineChapter = {
    chapter: 6,
    titleCs: "Výpočtová část (TO-BE)",
    completeness: "complete",
    subsections: [
      {
        id: "6.1",
        titleCs:
          "Zaměstnanost – přímá, nepřímá, indukovaná pracovní místa; substituční efekt; RZPS",
        completeness: "complete",
        dataSourceHintCs: "primaryKpiAndModules.baseline.employment (+ JSON modul v reportu)",
      },
      {
        id: "6.2",
        titleCs:
          "Mobilita a konektivita – dopady na dojížďku, dopravní zatížení, pendlery",
        completeness: "partial",
        noteCs:
          "Parametry vstupů a dostupnost vstupují do modelu; samostatný dopravní model není výstupem.",
        dataSourceHintCs: "section03_territory, scénářové delty",
      },
      {
        id: "6.3",
        titleCs:
          "Bydlení – očekávaný vliv na poptávku po bydlení, ceny a dostupnost",
        completeness: "complete",
        dataSourceHintCs: "primaryKpiAndModules.baseline.housing",
      },
      {
        id: "6.4",
        titleCs: "Občanská vybavenost",
        completeness: "complete",
        dataSourceHintCs: "primaryKpiAndModules.baseline.civic",
      },
      {
        id: "6.5",
        titleCs:
          "Fiskální dopady – příspěvek do veřejných rozpočtů (stát, kraj, obec), daň z nemovitostí, RUD",
        completeness: "complete",
        dataSourceHintCs: "primaryKpiAndModules.baseline.economic (veřejné rozpočty, daně)",
      },
      {
        id: "6.6",
        titleCs: "Spotřební a multiplikační efekty",
        completeness: "partial",
        noteCs:
          "Částečně přes výstupy ekonomického modulu (spotřeba domácností, retence).",
        dataSourceHintCs: "primaryKpiAndModules.baseline.economic",
      },
      {
        id: "6.7",
        titleCs:
          "Zhodnocení socioekonomických přínosů – HDP, kvalita života, image území",
        completeness: "complete",
        noteCs: "Souhrn přes KPI a ukazatele ΔHDP / daňové výnosy v reportu.",
        dataSourceHintCs: "primaryKpiAndModules.baseline.economic, KPI blok reportu",
      },
    ],
  };

  const ch7: MethodologyOutline110["chapters"][number] = {
    chapter: 7,
    titleCs: "Scénářová analýza",
    completeness: "complete",
    subsections: [
      {
        id: "7.1",
        titleCs: "Optimistický scénář",
        completeness: "complete",
        dataSourceHintCs: "section04_scenarios.scenarioDeltas.optimistic, section11_comparison řádek",
      },
      {
        id: "7.2",
        titleCs: "Střední scénář",
        completeness: "complete",
        dataSourceHintCs: "section04_scenarios.scenarioDeltas.baseline, section11_comparison",
      },
      {
        id: "7.3",
        titleCs: "Pesimistický scénář",
        completeness: "complete",
        dataSourceHintCs: "section04_scenarios.scenarioDeltas.pessimistic, section11_comparison",
      },
      {
        id: "7.4",
        titleCs: "Diskuse rozdílů a klíčových faktorů",
        completeness: "complete",
        noteCs:
          "Konsolidace scénářů, citlivost a srovnávací tabulka — viz m7_scenario_consolidation a sekce scénářů v reportu.",
        dataSourceHintCs: "m7_scenario_consolidation, section11_comparison",
      },
    ],
  };

  const hasRisks = snapshot.section10_risks.length > 0;
  const hasMit = snapshot.section10_mitigations.length > 0;

  const ch8: MethodologyOutline110["chapters"][number] = {
    chapter: 8,
    titleCs: "Riziková analýza a mitigace",
    completeness: hasRisks || hasMit ? "partial" : "missing",
    coverageNoteCs:
      "Časový profil rizik a kvantifikace významnosti nejsou v generovaném výstupu plně strukturovány.",
    subsections: [
      {
        id: "8.1",
        titleCs:
          "Identifikace klíčových rizik (zaměstnanost, agenturní pracovníci, substituční efekt, bydlení, dopravní kapacita)",
        completeness: hasRisks ? "partial" : "missing",
        dataSourceHintCs: "section10_risks, baseline warnings (section12)",
      },
      {
        id: "8.2",
        titleCs: "Odhad významnosti rizik a jejich časový profil",
        completeness: "missing",
        noteCs:
          "V aktuální verzi aplikace není tato část strukturovaně generována — doplní analytik v textu studie.",
        dataSourceHintCs: "—",
      },
      {
        id: "8.3",
        titleCs: "Návrh mitigačních opatření",
        completeness: hasMit ? "partial" : "missing",
        dataSourceHintCs: "section10_mitigations",
      },
    ],
  };

  const ch9: MethodologyOutlineChapter = {
    chapter: 9,
    titleCs: "Závěry a doporučení",
    completeness: hasExec ? "partial" : "missing",
    coverageNoteCs:
      "Manažerské shrnutí je generované z výstupů; závazná doporučení pro zadavatele doplní zpracovatel finálního dokumentu.",
    subsections: [
      {
        id: "9.1",
        titleCs: "Shrnutí hlavních zjištění dopadové studie",
        completeness: hasExec ? "partial" : "missing",
        dataSourceHintCs: "executiveSummaryCs (část)",
      },
      {
        id: "9.2",
        titleCs: "Celkové zhodnocení dopadů a přínosů",
        completeness: hasExec ? "partial" : "missing",
        dataSourceHintCs: "executiveSummaryCs",
      },
      {
        id: "9.3",
        titleCs: "Doporučení pro rozhodování zadavatele",
        completeness: "missing",
        noteCs:
          "Strukturované závazné doporučení zadavateli není v šabloně oddělené — doplní se v textu finální studie.",
        dataSourceHintCs: "— (mimo generovaný blok)",
      },
    ],
  };

  const ch10: MethodologyOutline110["chapters"][number] = {
    chapter: 10,
    titleCs: "Přílohy",
    completeness: "partial",
    coverageNoteCs:
      "Mapové přílohy a některé metodické odkazy nejsou generovány z aplikace — viz JSON export a známá omezení MVP.",
    subsections: [
      {
        id: "10.1",
        titleCs: "Použité datové zdroje a metodické odkazy",
        completeness: "partial",
        dataSourceHintCs: "explainability_summary, section12 (předpoklady), glossary",
      },
      {
        id: "10.2",
        titleCs: "Datové tabulky a modelové výpočty",
        completeness: "partial",
        dataSourceHintCs: "JSON modulů v reportu, section11_comparison, export snapshot",
      },
      {
        id: "10.3",
        titleCs:
          "Mapové přílohy (AOIVuz, AOIDadm, AOIS, hustoty obyvatel, významná sídla, body vybavenosti)",
        completeness: "missing",
        noteCs: "Nejsou součástí výstupu z aplikace.",
        dataSourceHintCs: "—",
      },
      {
        id: "10.4",
        titleCs: "Scénářové výstupy a vizualizace",
        completeness: "partial",
        noteCs:
          "Tabulky a textová konsolidace scénářů v reportu; samostatné grafické podklady mimo aplikaci.",
        dataSourceHintCs: "m7_scenario_consolidation, section11_comparison, section13_audit",
      },
    ],
  };

  return {
    chapters: [ch1, ch2, ch3, ch4, ch5, ch6, ch7, ch8, ch9, ch10],
  };
}
