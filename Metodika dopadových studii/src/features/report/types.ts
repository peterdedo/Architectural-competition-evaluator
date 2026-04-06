/**
 * Kanonický datový model výstupního reportu MHDSI (Prompt 5+).
 * Jednotný vstup pro report view, JSON export i budoucí PDF/tisk (Prompt 6).
 *
 * Legacy typ `ReportSnapshot` v `src/domain/report/report-snapshot.ts` slouží
 * starší specifikaci M8 úložiště — nepleťte s tímto DTO.
 */
import type {
  DeltaHdpSourceKind,
  EconomicDeltaHdpBreakdown,
  HouseholdConsumptionSourceKind,
} from "@/lib/mhdsi/calculations/economic";
import type { EngineWarning, TraceStep } from "@/lib/mhdsi/calculations/types";
import type { ScenarioKind } from "@/features/studio/wizard-types";
import type {
  LayerM0Project,
  LayerM1Territory,
  LayerM2AsIsBaseline,
} from "@/domain/methodology/p1-layers";
import type { P1PipelineBridgeFlags } from "@/domain/methodology/p1-pipeline-bridge";

/**
 * Verze schématu report snapshotu — bump při každé změně DTO.
 *
 * Changelog:
 *   1.0.0 — výchozí schema (EPIC 1, M3+M4)
 *   1.1.0 — přidán P1 bridge M5, civic baseline (EPIC 2)
 *   1.2.0 — přidán P1 bridge M6, economic baseline, p1_layers (EPIC 3)
 *   1.3.0 — přidána M7 scénářová konsolidace, section12 M7 index (EPIC 4)
 *   1.4.0 — přidána M8 report completeness: osnova § 3.1, přílohy, index vrstev (EPIC 5)
 *   1.5.0 — přidán explainability_summary (efektivní vstupy M4–M6, bez nových výpočtů)
 *   1.6.0 — methodology_outline_1_10: závazná osnova kapitol 1–10 (prezentační vrstva)
 *   1.6.1 — podkapitoly 1.1–10.4: závazné názvy MHDSI + dataSourceHintCs (mapování na snapshot)
 */
export const METHODOLOGY_REPORT_SCHEMA_VERSION = "1.6.1" as const;

/**
 * Report-only: pokrytí kapitoly vůči metodické osnově.
 * `partial` = částečně pokryto; `missing` = data v aplikaci nejsou / nejsou strukturovaná (nezaměňovat za chybu výpočtu).
 */
export type MethodologyChapterCompleteness = "complete" | "partial" | "missing";

export interface MethodologyOutlineSubsection {
  id: string;
  titleCs: string;
  completeness: MethodologyChapterCompleteness;
  noteCs?: string;
  /** Kde brát data ve snapshotu / průvodci (jedna pravda — bez duplicitního obsahu). */
  dataSourceHintCs?: string;
}

export interface MethodologyOutlineChapter {
  chapter: number;
  titleCs: string;
  completeness: MethodologyChapterCompleteness;
  coverageNoteCs?: string;
  subsections: MethodologyOutlineSubsection[];
}

/** Závazná osnova 1–10 pro TOC a štítky — bez nových výpočtů */
export interface MethodologyOutline110 {
  chapters: MethodologyOutlineChapter[];
}

/** Lidsky čitelný přehled efektivních vstupů — jedna pravda s UI výsledků. */
export interface ReportExplainabilityRow {
  metric: string;
  /** Hodnota zobrazená v průvodci (raw). */
  wizardValueCs: string | null;
  /** Hodnota použitá v engine po mostech. */
  engineValueCs: string;
  whyCs: string | null;
}

export interface ReportExplainabilitySection {
  id: string;
  titleCs: string;
  introCs?: string;
  rows?: ReportExplainabilityRow[];
  bulletsCs?: string[];
}

export type ReportExplainabilitySummary = ReportExplainabilitySection[];

// --- M7 scénářová konsolidace (EPIC 4) — bez nových výpočtů M3–M6 ---

export type M7ClassificationKind =
  | "shared_input"
  | "scenario_delta"
  | "derived_output"
  | "assumption"
  | "open_question"
  | "fallback_bridge";

export interface M7ClassifiedItem {
  id: string;
  kind: M7ClassificationKind;
  labelCs: string;
  /** Odkaz na klíč ve wizardu / sekci snapshotu */
  refKey?: string;
}

export interface M7ScenarioMetricsBlock {
  rows: ScenarioComparisonMetrics[];
}

export interface M7ClassificationBlock {
  items: M7ClassifiedItem[];
  /** Sémantika bloků srovnávací tabulky (M3–M6 výstupy = odvozené z jádra). */
  comparisonMetricSemantics: Record<string, M7ClassificationKind>;
}

export interface M7SensitivitySummary {
  /** Efektivní symboly (merged assumptionsUsed), které se liší mezi scénáři. */
  varyingAssumptionKeys: string[];
  /** Klíče vyskytující se v některé scénářové deltě wizardu. */
  scenarioDeltaKeysPresent: string[];
  notesCs: string[];
}

export interface M7FallbackSignal {
  scenario: ScenarioKind;
  kind: string;
  detailCs: string;
}

export interface M7ConsolidatedRisks {
  warningCodesUnion: string[];
  openQuestionsUnion: string[];
  fallbackSignals: M7FallbackSignal[];
}

export interface M7AuditLinkPerScenario {
  tracePath: string;
  assumptionsMergedPath: string;
  openQuestionsPath: string;
  pipelineResultsPath: string;
}

export interface M7AuditLinks {
  byScenario: Record<ScenarioKind, M7AuditLinkPerScenario>;
}

/** Kanonická vrstva M7 — jedna pravda pro srovnání scénářů a exporty. */
export interface M7ScenarioConsolidation {
  scenarioMetrics: M7ScenarioMetricsBlock;
  classification: M7ClassificationBlock;
  sensitivitySummary: M7SensitivitySummary;
  consolidatedRisks: M7ConsolidatedRisks;
  auditLinks: M7AuditLinks;
}

export interface ReportMetadata {
  id: string;
  generatedAt: string;
  schemaVersion: typeof METHODOLOGY_REPORT_SCHEMA_VERSION;
  /** Odkud byl report sestaven */
  source: "mhdsi-studio";
  /** Pracovní název / identifikace běhu */
  title: string;
}

/** 1. Základní údaje o projektu */
export interface ReportSection01Project {
  projectName: string;
  locationDescription: string;
  czNace: string;
  capexTotalCzk: number;
  nInv: number;
}

/** 2. Investor a charakteristika záměru */
export interface ReportSection02Investor {
  investorProfile: string;
  legalForm: string;
  strategicLinks: string;
}

/** 3. Vymezení území a časový rámec */
export interface ReportSection03TerritoryAndTime {
  dLastMileKm: number;
  diadPrMinutes: number;
  diadAkMinutes: number;
  tinfrMinutes: number;
  t0: string;
  rampYearsGlobal: number;
}

/** 4. Scénáře hodnocení — vstupní delty (bez přepočtu) */
export interface ReportSection04Scenarios {
  sharedAssumptionKeys: string[];
  scenarioDeltas: Record<
    ScenarioKind,
    Record<string, number>
  >;
}

/** 5. Shrnutí výchozí situace (AS-IS vstupy relevantní pro moduly) */
export interface ReportSection05AsIsSummary {
  employmentInputsSummary: Record<string, number | string>;
  housingInputsSummary: Record<string, number | string>;
  civicInputsSummary: Record<string, number | string>;
  economicInputsSummary: Record<string, number | string>;
  /**
   * Efektivní vstupy M3/M4 po P1 a pipeline (baseline) — odlišné od ručních polí průvodce,
   * pokud jsou zapnuté mosty (FTE, M2, M3→M4).
   */
  m3m4EffectiveBaseline?: ReportEngineContractBaselineM3M4;
  /** Efektivní OU / N_celkem pro M5 po pipeline (baseline), pokud jsou zapnuté mosty. */
  m5EffectiveBaseline?: ReportEngineContractBaselineM5;
  /** Baseline M6 — zdroj ΔHDP a rozpad podle engine (EPIC 3). */
  m6EffectiveBaseline?: ReportEngineContractBaselineM6;
}

/** Kanonický zdroj vstupů M5 (občanská vybavenost) — stejné literály jako v trace `M5-SOURCE-MIX` / `CivicP1BridgeResolved`. */
export interface ReportP1M5Canonical {
  ou: "m4_output" | "wizard_manual";
  nCelkemForSafety: "m3_output" | "wizard_manual";
}

export interface ReportP1M5BridgeFlags {
  linkCivicOuToM4Ou: boolean;
  linkCivicSafetyToM3NCelkem: boolean;
}

/** Hodnoty skutečně použité enginem v baseline pro M5 (audit). */
export interface ReportEngineContractBaselineM5 {
  ouUsed: number;
  nCelkemM3Used: number;
}

/** P1 most do M5 — odvozené vstupy a příznaky (EPIC 2). */
export interface ReportP1M5Bridge {
  flags: ReportP1M5BridgeFlags;
  canonical: ReportP1M5Canonical;
  ouWizardMvp: number;
  nCelkemWizardMvp: number;
  engineContractBaseline?: ReportEngineContractBaselineM5;
}

export interface ReportP1M6BridgeFlags {
  useComputedM6DeltaHdp: boolean;
}

/** Kanonický zdroj ΔHDP v baseline — shodný s `EconomicResult.deltaHdpSource`. */
export interface ReportP1M6Canonical {
  deltaHdp: DeltaHdpSourceKind;
}

export interface ReportEngineContractBaselineM6 {
  deltaHdpAnnualUsed: number;
  deltaHdpSource: DeltaHdpSourceKind;
  breakdown?: EconomicDeltaHdpBreakdown | null;
  householdConsumptionAnnual: number;
  householdConsumptionSource: HouseholdConsumptionSourceKind;
  taxYieldAnnual: number;
  dznmAnnual: number;
  consumptionRetainedAnnual: number;
  publicBudgetStat: number;
  publicBudgetKraj: number;
  publicBudgetObec: number;
}

/** P1 most do M6 — profil ΔHDP vs ruční MVP (EPIC 3). */
export interface ReportP1M6Bridge {
  flags: ReportP1M6BridgeFlags;
  canonical: ReportP1M6Canonical;
  manualDeltaHdpMvpCzk: number;
  engineContractBaseline?: ReportEngineContractBaselineM6;
}

/** P1 — explicitní metodická vrstva M0–M2 (odděleně od dílčích vstupů M3–M6 v sekci 5). */
export interface ReportP1Layers {
  m0: LayerM0Project;
  m1: LayerM1Territory;
  m2AsIs: LayerM2AsIsBaseline;
}

/** Kanonický popis zdrojů vstupů M3/M4 (baseline vs. MVP vs. most). */
export interface ReportP1M3M4Canonical {
  employment: {
    nInvEffective: "mvp" | "m0_fte_scaled";
    utilRzpsModifier:
      | "none"
      | "m2_unemployment_heuristic"
      | "m2_unemployment_intended_unavailable";
    employmentRamp: "wizard" | "capped_by_project_horizon";
  };
  housing: {
    vacantSupply: "mvp_only" | "mvp_or_m2_max";
    nKmen: "mvp" | "mvp_plus_m2_migration_proxy";
    housingRamp: "wizard" | "capped_by_project_horizon";
    m3toM4: "mvp_fields" | "m3_drv_outputs";
  };
}

/**
 * Hodnoty, které engine skutečně použil v baseline scénáři (jedna pravda oproti ručním polím průvodce).
 * Nepřidává nové výpočty — jen čte výstup `runFullCalculationPipeline`.
 */
export interface ReportEngineContractBaselineM3M4 {
  nInvEffective: number;
  fteFactorApplied: number;
  utilRzpsEffective: number;
  employmentRampYears: number;
  housingRampYears: number;
  situation: "A" | "B";
  nKmenEffective: number;
  nAgenturaUsed: number;
  nPendlerUsed: number;
  vVacantEffective: number;
  linkM3toM4: boolean;
  /** DRV-007 N_celkem (po k_inv) — vstup do DRV-014/015. */
  nCelkemM3: number;
}

/** P1 → M3/M4 odvozené vstupy (stejné jako mapování do pipeline). */
export interface ReportP1M3M4Bridge {
  flags: P1PipelineBridgeFlags;
  canonical: ReportP1M3M4Canonical;
  /** M0 harmonogram (textové štítky z vrstvy záměru). */
  m0Schedule: {
    constructionStart: string;
    fullOperationPlanned: string;
    rampYearsGlobal: number;
  };
  /** M2 souhrn pro audit (nezávisle na tom, zda vstupují do vzorce). */
  m2LaborMarketAudit: {
    unemploymentRate: number | null;
    employmentRate: number | null;
  };
  m2HousingBaselineAudit: {
    population: number;
    vacantUnits: number;
    avgRentCzk: number;
  };
  employment: {
    nInvMvp: number;
    nInvEffective: number;
    fteFactor: number;
    rampYearsEffective: number;
    baselineUnemploymentRate: number | null;
  };
  housing: {
    vTVacantMvp: number;
    vVacantEffective: number;
    m2VacantUsed: boolean;
    rampYearsEffective: number;
    nKmenMvp: number;
    nKmenEffective: number;
    migrationAdjustment: number;
    linkHousingToEmploymentM3: boolean;
    /** Ruční hodnoty ve wizardu, pokud je zapnuto propojení M3→M4 (efektivní vstupy jdou z M3). */
    m3EmploymentMvp?: { nAgentura: number; nPendler: number };
  };
  /** Volitelně: skutečné hodnoty z baseline pipeline (sjednocení s engine). */
  engineContractBaseline?: ReportEngineContractBaselineM3M4;
}

/** Výstupy modulu pro jeden scénář — jen čísla a pole vhodné pro JSON/report */
export interface EmploymentModuleReportSlice {
  nCelkem: number;
  rzps: number;
  nMezera: number;
  zZtrata: number;
}

export interface HousingModuleReportSlice {
  ou: number;
  zu: number;
  aggregateDeficit: number;
}

export interface CivicModuleReportSlice {
  demandMs: number;
  demandZs: number;
  kindergartenDeficit: number;
  elementaryDeficit: number;
  healthcareDemand: number;
  leisureFacilities: number;
  safetyFteGap: number;
}

export interface EconomicModuleReportSlice {
  deltaHdp: number;
  deltaHdpSource: DeltaHdpSourceKind;
  deltaHdpBreakdown?: EconomicDeltaHdpBreakdown | null;
  taxYield: number;
  prudAnnual: number;
  dznmAnnual: number;
  householdConsumptionAnnual: number;
  householdConsumptionSource: HouseholdConsumptionSourceKind;
  consumptionRetained: number;
  cumulativeTaxYield: number;
  publicBudgetStat: number;
  publicBudgetKraj: number;
  publicBudgetObec: number;
}

export interface ModuleResultsBlock {
  employment: EmploymentModuleReportSlice;
  housing: HousingModuleReportSlice;
  civic: CivicModuleReportSlice;
  economic: EconomicModuleReportSlice;
  warnings: EngineWarning[];
  openQuestions: string[];
  assumptionsMerged: Record<string, string | number | boolean>;
}

/** 6–9 + agregované KPI — pro referenční (baseline) scénář v hlavním textu */
export interface ReportModuleNarrative {
  baseline: ModuleResultsBlock;
}

/** 10 — strukturované riziko (generováno z engine + OQ, bez nových výpočtů) */
export interface ReportRiskItem {
  id: string;
  category:
    | "workforce"
    | "housing"
    | "civic"
    | "economic"
    | "data_quality"
    | "methodology";
  severity: "info" | "low" | "medium" | "high";
  titleCs: string;
  detailCs: string;
  source: "warning" | "open_question" | "civic_mitigation" | "assumption_note";
  ref?: string;
}

export interface ReportMitigationItem {
  id: string;
  relatedRiskId?: string;
  titleCs: string;
  detailCs: string;
  source: "civic_engine" | "heuristic";
}

/** 11 — srovnání scénářů */
export interface ScenarioComparisonMetrics {
  scenario: ScenarioKind;
  employment: {
    nCelkem: number;
    nMezera: number;
    rzps: number;
  };
  housing: {
    ou: number;
    aggregateDeficit: number;
  };
  civic: {
    kindergartenDeficit: number;
    elementaryDeficit: number;
    healthcareDemand: number;
  };
  economic: {
    deltaHdp: number;
    deltaHdpSource: DeltaHdpSourceKind;
    taxYield: number;
    prudAnnual: number;
    dznmAnnual: number;
    householdConsumptionAnnual: number;
    householdConsumptionSource: HouseholdConsumptionSourceKind;
    consumptionRetained: number;
  };
  warningsCount: number;
  warningsByCode: Record<string, number>;
  openQuestionsCount: number;
  assumptionsKeyCount: number;
}

export interface ReportSection11ScenarioComparison {
  rows: ScenarioComparisonMetrics[];
}

/** 12 */
export interface ReportSection12AssumptionsAndUncertainty {
  assumptionsMergedByScenario: Record<
    ScenarioKind,
    Record<string, string | number | boolean> | null
  >;
  openQuestionsByScenario: Record<ScenarioKind, string[]>;
  /**
   * Index M7 — symboly s odlišnou efektivní hodnotou mezi scénáři
   * (stejné jako `m7_scenario_consolidation.sensitivitySummary.varyingAssumptionKeys`).
   */
  m7VaryingEffectiveAssumptionKeys?: string[];
}

/** 13 — auditní příloha */
export interface ScenarioAuditTrace {
  employment: TraceStep[];
  housing: TraceStep[];
  civic: TraceStep[];
  economic: TraceStep[];
}

export interface ReportSection13AuditAnnex {
  byScenario: Record<ScenarioKind, ScenarioAuditTrace | null>;
}

// --- M8 Report Completeness (EPIC 5) — prezentační a balicí vrstva nad P1–M7 ---
// Additive: žádné nové výpočty; jen indexace a strukturování existujících dat.

/**
 * Vrstva obsahu — odděluje vstupy, AS-IS baseline, výpočtové výstupy,
 * scénáře a assumptions/OQ/fallbacky.
 */
export type M8ContentLayer =
  | "inputs"
  | "baseline"
  | "module_results"
  | "scenarios"
  | "assumptions_oq_fallback";

/**
 * Položka osnovy dokumentu dle § 3.1.
 * Mapuje metodický bod na cestu do existujícího snapshotu — bez nových výpočtů.
 */
export interface M8OutlineItem {
  /** Interní ID pro renderer a tisk (např. "kap-1", "priloha-A"). */
  id: string;
  /** Odkaz na bod metodiky dle § 3.1 (např. "§ 3.1 bod 1", "Příloha A"). */
  methodologyRef: string;
  /** Český titulek sekce/přílohy. */
  titleCs: string;
  /** Vrstva obsahu — pro barevné odlišení a indexaci. */
  contentLayer: M8ContentLayer;
  /**
   * Cesta do snapshotu (informativní, pro renderer/export).
   * Více klíčů odděleno čárkou.
   */
  snapshotPath: string;
}

/** Standardizovaný deskriptor přílohy dokumentu. */
export interface M8AnnexDescriptor {
  id: string;
  titleCs: string;
  /** Cesta do snapshotu (informativní). */
  snapshotPath: string;
  contentLayer: M8ContentLayer;
  /** Je obsah dostupný i v JSON exportu (celý snapshot nebo výřez)? */
  availableInJsonExport: boolean;
}

/**
 * M8 — metadata completeness pro report (EPIC 5).
 * Neobsahuje žádná čísla ani výpočty — pouze indexaci existujících dat.
 */
export interface M8ReportCompleteness {
  /** Závazná osnova dle § 3.1 (10 bodů + přílohy). */
  outline: M8OutlineItem[];
  /** Standardizované přílohy s jednotnými názvy a pořadím. */
  annexes: M8AnnexDescriptor[];
  /**
   * Index vrstev obsahu — mapuje vrstvu na klíče snapshotu.
   * Jen pro navigaci a export; není výpočetní.
   */
  contentLayerIndex: Record<M8ContentLayer, string[]>;
}

export interface MethodologyReportSnapshot {
  metadata: ReportMetadata;
  /** Strukturovaná vrstva P1 (M0–M2) — baseline AS-IS je v `m2AsIs`. */
  p1_layers: ReportP1Layers;
  /** P1 most do M3/M4 — odvozené vstupy a příznaky. */
  p1_m3_m4_bridge: ReportP1M3M4Bridge;
  /** P1 most do M5 — OU z M4, N_celkem z M3 pro bezpečnost. */
  p1_m5_bridge: ReportP1M5Bridge;
  /** P1 most do M6 — profil ΔHDP z CAPEX/M3 vs ruční vstup. */
  p1_m6_bridge: ReportP1M6Bridge;
  section01_project: ReportSection01Project;
  section02_investor: ReportSection02Investor;
  section03_territory: ReportSection03TerritoryAndTime;
  section04_scenarios: ReportSection04Scenarios;
  section05_asIs: ReportSection05AsIsSummary;
  /** Hlavní KPI a modulové výsledky (baseline) */
  primaryKpiAndModules: ReportModuleNarrative;
  section10_risks: ReportRiskItem[];
  section10_mitigations: ReportMitigationItem[];
  section11_comparison: ReportSection11ScenarioComparison;
  /** M7 — kanonická scénářová konsolidace; `section11.rows` musí být shodné s `scenarioMetrics.rows`. */
  m7_scenario_consolidation: M7ScenarioConsolidation;
  section12_assumptionsUncertainty: ReportSection12AssumptionsAndUncertainty;
  section13_audit: ReportSection13AuditAnnex;
  /**
   * M8 — osnova § 3.1, přílohy a index vrstev obsahu (EPIC 5).
   * Čistě prezentační / indexační — žádné výpočty.
   */
  m8_report_completeness: M8ReportCompleteness;
  /** Osnova kapitol 1–10 dle minimální závazné struktury DS (TOC + completeness) */
  methodology_outline_1_10: MethodologyOutline110;
  /** Manažerské shrnutí (česky) — čistě textová interpretace výše */
  executiveSummaryCs: string;
  /**
   * Ověřitelnost: srovnání rušných vstupů průvodce s efektivními vstupy baseline pipeline.
   * Čistě odvozeno z inputsUsed/trace — žádný paralelní výpočet.
   */
  explainability_summary: ReportExplainabilitySummary;
}
