import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import {
  SCENARIO_ORDER,
  type ScenarioKind,
  type WizardState,
} from "@/features/studio/wizard-types";
import { mergeModuleAssumptionsUsed } from "@/features/studio/pipeline-result-helpers";
import {
  summarizeP1BridgeForReport,
  summarizeP1M5BridgeForReport,
  summarizeP1M6BridgeForReport,
} from "@/features/studio/p1-pipeline-derive";
import { wizardStateToPipelineInput } from "@/features/studio/map-to-pipeline";
import { buildMethodologyOutline110 } from "./build-methodology-outline-110";
import { buildM7ScenarioConsolidation } from "./build-m7-scenario-consolidation";
import { buildExecutiveSummaryCs } from "./build-executive-summary-cs";
import { buildPipelineExplainabilitySummary } from "@/features/studio/pipeline-explainability";
import {
  buildHeuristicMitigations,
  buildMitigationsFromCivic,
  buildRisksFromBaseline,
} from "./build-risks-cs";
import {
  METHODOLOGY_REPORT_SCHEMA_VERSION,
  type CivicModuleReportSlice,
  type EconomicModuleReportSlice,
  type EmploymentModuleReportSlice,
  type HousingModuleReportSlice,
  type M8AnnexDescriptor,
  type M8ContentLayer,
  type M8OutlineItem,
  type M8ReportCompleteness,
  type MethodologyReportSnapshot,
  type ModuleResultsBlock,
  type ReportSection11ScenarioComparison,
  type ReportSection13AuditAnnex,
  type ScenarioAuditTrace,
} from "./types";

function sliceEmployment(
  r: FullCalculationPipelineResult,
): EmploymentModuleReportSlice {
  const e = r.employment.result;
  return {
    nCelkem: e.nCelkem,
    rzps: e.rzps,
    nMezera: e.nMezera,
    zZtrata: e.zZtrata,
  };
}

function sliceHousing(r: FullCalculationPipelineResult): HousingModuleReportSlice {
  const h = r.housing.result;
  return {
    ou: h.ou,
    zu: h.zu,
    aggregateDeficit: h.aggregateDeficit,
  };
}

function sliceCivic(r: FullCalculationPipelineResult): CivicModuleReportSlice {
  const c = r.civic.result;
  return {
    demandMs: c.demandMs,
    demandZs: c.demandZs,
    kindergartenDeficit: c.kindergarten.deficitSurplus,
    elementaryDeficit: c.elementary.deficitSurplus,
    healthcareDemand: c.healthcareDemand,
    leisureFacilities: c.leisureFacilities,
    safetyFteGap: c.safetyFteGap,
  };
}

function sliceEconomic(
  r: FullCalculationPipelineResult,
): EconomicModuleReportSlice {
  const e = r.economic.result;
  return {
    deltaHdp: e.deltaHdp,
    deltaHdpSource: e.deltaHdpSource,
    deltaHdpBreakdown: e.deltaHdpBreakdown ?? null,
    taxYield: e.taxYield,
    prudAnnual: e.prudAnnual,
    dznmAnnual: e.dznmAnnual,
    householdConsumptionAnnual: e.householdConsumptionAnnual,
    householdConsumptionSource: e.householdConsumptionSource,
    consumptionRetained: e.consumptionRetained,
    cumulativeTaxYield: e.cumulativeTaxYield,
    publicBudgetStat: e.publicBudgetStat,
    publicBudgetKraj: e.publicBudgetKraj,
    publicBudgetObec: e.publicBudgetObec,
  };
}

function moduleBlock(r: FullCalculationPipelineResult): ModuleResultsBlock {
  return {
    employment: sliceEmployment(r),
    housing: sliceHousing(r),
    civic: sliceCivic(r),
    economic: sliceEconomic(r),
    warnings: r.allWarnings,
    openQuestions: r.allOpenQuestions,
    assumptionsMerged: mergeModuleAssumptionsUsed(r),
  };
}

function buildAuditAnnex(
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
): ReportSection13AuditAnnex {
  const byScenario = {} as ReportSection13AuditAnnex["byScenario"];
  for (const kind of SCENARIO_ORDER) {
    const r = results[kind];
    if (!r) {
      byScenario[kind] = null;
      continue;
    }
    const block: ScenarioAuditTrace = {
      employment: r.employment.trace,
      housing: r.housing.trace,
      civic: r.civic.trace,
      economic: r.economic.trace,
    };
    byScenario[kind] = block;
  }
  return { byScenario };
}

/**
 * Sestaví M8 metadata: osnovu § 3.1, přílohy a index vrstev obsahu.
 * Čistě indexační — žádné výpočty, žádná druhá pravda.
 */
function buildM8ReportCompleteness(): M8ReportCompleteness {
  /** Zarovnáno na závaznou osnovu 1–10 + přílohy A–D (index pro export / tisk) */
  const outline: M8OutlineItem[] = [
    {
      id: "kap-1",
      methodologyRef: "Kap. 1",
      titleCs: "Základní údaje o projektu",
      contentLayer: "inputs",
      snapshotPath: "section01_project,section03_territory.t0,rampYearsGlobal,p1_layers.m0.schedule",
    },
    {
      id: "kap-2",
      methodologyRef: "Kap. 2",
      titleCs: "Informace o investorovi a zpracovateli dopadové studie",
      contentLayer: "inputs",
      snapshotPath: "section02_investor",
    },
    {
      id: "kap-3",
      methodologyRef: "Kap. 3",
      titleCs: "Charakteristika investičního záměru",
      contentLayer: "inputs",
      snapshotPath: "p1_layers.m0",
    },
    {
      id: "kap-4",
      methodologyRef: "Kap. 4",
      titleCs: "Vymezení řešeného území",
      contentLayer: "inputs",
      snapshotPath: "section03_territory,p1_layers.m1",
    },
    {
      id: "kap-5",
      methodologyRef: "Kap. 5",
      titleCs: "Analytická část (AS-IS)",
      contentLayer: "baseline",
      snapshotPath: "p1_layers.m2AsIs,section05_asIs",
    },
    {
      id: "kap-6",
      methodologyRef: "Kap. 6",
      titleCs: "Výpočtová část (TO-BE)",
      contentLayer: "module_results",
      snapshotPath: "primaryKpiAndModules.baseline",
    },
    {
      id: "kap-7",
      methodologyRef: "Kap. 7",
      titleCs: "Scénářová analýza",
      contentLayer: "scenarios",
      snapshotPath: "section04_scenarios,section11_comparison,m7_scenario_consolidation",
    },
    {
      id: "kap-8",
      methodologyRef: "Kap. 8",
      titleCs: "Riziková analýza a mitigace",
      contentLayer: "assumptions_oq_fallback",
      snapshotPath: "section10_risks,section10_mitigations",
    },
    {
      id: "kap-9",
      methodologyRef: "Kap. 9",
      titleCs: "Závěry a doporučení",
      contentLayer: "module_results",
      snapshotPath: "executiveSummaryCs",
    },
    {
      id: "kap-10",
      methodologyRef: "Kap. 10",
      titleCs: "Přílohy",
      contentLayer: "assumptions_oq_fallback",
      snapshotPath: "explainability_summary,section12_assumptionsUncertainty,section13_audit,p1_bridges",
    },
    {
      id: "priloha-A",
      methodologyRef: "Příloha A",
      titleCs: "Scénářová konsolidace — detailní struktura",
      contentLayer: "scenarios",
      snapshotPath: "section11_comparison,m7_scenario_consolidation",
    },
    {
      id: "priloha-B",
      methodologyRef: "Příloha B",
      titleCs: "Předpoklady, otevřené otázky a výstupy výpočtu",
      contentLayer: "assumptions_oq_fallback",
      snapshotPath: "section12_assumptionsUncertainty",
    },
    {
      id: "priloha-C",
      methodologyRef: "Příloha C",
      titleCs: "Auditní stopa výpočtu",
      contentLayer: "assumptions_oq_fallback",
      snapshotPath: "section13_audit",
    },
    {
      id: "priloha-D",
      methodologyRef: "Příloha D",
      titleCs: "Vstupní vrstvy a mosty (technická příloha)",
      contentLayer: "baseline",
      snapshotPath: "p1_layers,p1_m3_m4_bridge,p1_m5_bridge,p1_m6_bridge",
    },
  ];

  const annexes: M8AnnexDescriptor[] = [
    {
      id: "annex-A",
      titleCs: "Příloha A — Scénářová konsolidace (detailní struktura)",
      snapshotPath: "section11_comparison,m7_scenario_consolidation",
      contentLayer: "scenarios",
      availableInJsonExport: true,
    },
    {
      id: "annex-B",
      titleCs: "Příloha B — Předpoklady a otevřené otázky",
      snapshotPath: "section12_assumptionsUncertainty",
      contentLayer: "assumptions_oq_fallback",
      availableInJsonExport: true,
    },
    {
      id: "annex-C",
      titleCs: "Příloha C — Auditní stopa výpočtu",
      snapshotPath: "section13_audit",
      contentLayer: "assumptions_oq_fallback",
      availableInJsonExport: true,
    },
    {
      id: "annex-D",
      titleCs: "Příloha D — Vstupní vrstvy a mosty",
      snapshotPath: "p1_layers,p1_m3_m4_bridge,p1_m5_bridge,p1_m6_bridge",
      contentLayer: "baseline",
      availableInJsonExport: true,
    },
  ];

  const contentLayerIndex: Record<M8ContentLayer, string[]> = {
    inputs: [
      "section01_project",
      "section02_investor",
      "section03_territory",
      "section04_scenarios",
      "section05_asIs",
    ],
    baseline: [
      "section05_asIs",
      "p1_layers",
      "p1_m3_m4_bridge",
      "p1_m5_bridge",
      "p1_m6_bridge",
    ],
    module_results: ["primaryKpiAndModules"],
    scenarios: [
      "section04_scenarios",
      "section11_comparison",
      "m7_scenario_consolidation",
    ],
    assumptions_oq_fallback: [
      "section10_risks",
      "section10_mitigations",
      "section12_assumptionsUncertainty",
      "section13_audit",
      "m7_scenario_consolidation.consolidatedRisks",
    ],
  };

  return { outline, annexes, contentLayerIndex };
}

export interface BuildReportOptions {
  /** Volitelné ID; jinak se vygeneruje v prohlížeči */
  reportId?: string;
}

/**
 * Sestaví report snapshot z UI stavu a výsledků pipeline.
 * Nepočítá znovu moduly — očekává již spuštěné `runAllScenarioPipelines`.
 */
export function buildMethodologyReportSnapshot(
  state: WizardState,
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
  options?: BuildReportOptions,
): MethodologyReportSnapshot | null {
  const baseline = results.baseline;
  if (!baseline) {
    return null;
  }

  const m7 = buildM7ScenarioConsolidation(state, results);
  const section11: ReportSection11ScenarioComparison = {
    rows: m7.scenarioMetrics.rows,
  };

  const id =
    options?.reportId ??
    (typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `report-${Date.now()}`);

  const p1Bridge = summarizeP1BridgeForReport(state, baseline);
  const p1M5Bridge = summarizeP1M5BridgeForReport(state, baseline);
  const p1M6Bridge = summarizeP1M6BridgeForReport(state, baseline);

  const primaryKpiAndModules = {
    baseline: moduleBlock(baseline),
  };

  const scenarioWarningsCount = {
    optimistic: results.optimistic?.allWarnings.length ?? 0,
    baseline: results.baseline?.allWarnings.length ?? 0,
    pessimistic: results.pessimistic?.allWarnings.length ?? 0,
  };

  const risks = buildRisksFromBaseline(baseline);
  const mitCivic = buildMitigationsFromCivic(baseline);
  const mitHeur = buildHeuristicMitigations(scenarioWarningsCount);

  const snapshot: MethodologyReportSnapshot = {
    metadata: {
      id,
      generatedAt: new Date().toISOString(),
      schemaVersion: METHODOLOGY_REPORT_SCHEMA_VERSION,
      source: "mhdsi-studio",
      title: state.projectName || "Bez názvu",
    },
    p1_layers: {
      m0: state.layerM0,
      m1: state.layerM1,
      m2AsIs: state.layerM2,
    },
    p1_m3_m4_bridge: p1Bridge,
    p1_m5_bridge: p1M5Bridge,
    p1_m6_bridge: p1M6Bridge,
    section01_project: {
      projectName: state.projectName,
      locationDescription: state.locationDescription,
      czNace: state.czNace,
      capexTotalCzk: state.capexTotalCzk,
      nInv: state.nInv,
    },
    section02_investor: {
      investorProfile: state.investorProfile,
      legalForm: state.legalForm,
      strategicLinks: state.strategicLinks,
    },
    section03_territory: {
      dLastMileKm: state.dLastMileKm,
      diadPrMinutes: state.diadPrMinutes,
      diadAkMinutes: state.diadAkMinutes,
      tinfrMinutes: state.tinfrMinutes,
      t0: state.t0,
      rampYearsGlobal: state.rampYearsGlobal,
    },
    section04_scenarios: {
      sharedAssumptionKeys: Object.keys(state.sharedAssumptions).sort(),
      scenarioDeltas: state.scenarioAssumptionDelta,
    },
    section05_asIs: {
      employmentInputsSummary: {
        nInv: state.nInv,
        kInv: state.kInv,
        employmentRampYears: state.employmentRampYears,
      },
      housingInputsSummary: {
        situation: state.situation,
        nKmen: state.nKmen,
        nAgentura: state.nAgentura,
        housingRampYears: state.housingRampYears,
      },
      civicInputsSummary: {
        ou: state.ou,
        capRegMs: state.capRegMs,
        capRegZs: state.capRegZs,
        civicRampYears: state.civicRampYears,
      },
      economicInputsSummary: {
        mvpManualDeltaHdpCzk: state.mvpManualDeltaHdpCzk,
        sStavbyM2: state.sStavbyM2,
        sPlochyM2: state.sPlochyM2,
      },
      m3m4EffectiveBaseline: p1Bridge.engineContractBaseline,
      m5EffectiveBaseline: p1M5Bridge.engineContractBaseline,
      m6EffectiveBaseline: p1M6Bridge.engineContractBaseline,
    },
    primaryKpiAndModules,
    section10_risks: risks,
    section10_mitigations: [...mitCivic, ...mitHeur],
    section11_comparison: section11,
    m7_scenario_consolidation: m7,
    section12_assumptionsUncertainty: {
      assumptionsMergedByScenario: {
        optimistic: results.optimistic
          ? mergeModuleAssumptionsUsed(results.optimistic)
          : null,
        baseline: mergeModuleAssumptionsUsed(results.baseline),
        pessimistic: results.pessimistic
          ? mergeModuleAssumptionsUsed(results.pessimistic)
          : null,
      },
      openQuestionsByScenario: {
        optimistic: results.optimistic?.allOpenQuestions ?? [],
        baseline: results.baseline?.allOpenQuestions ?? [],
        pessimistic: results.pessimistic?.allOpenQuestions ?? [],
      },
      m7VaryingEffectiveAssumptionKeys: m7.sensitivitySummary.varyingAssumptionKeys,
    },
    section13_audit: buildAuditAnnex(results),
    m8_report_completeness: buildM8ReportCompleteness(),
    methodology_outline_1_10: { chapters: [] },
    executiveSummaryCs: "",
    explainability_summary: buildPipelineExplainabilitySummary(
      state,
      "baseline",
      baseline,
    ),
  };

  snapshot.executiveSummaryCs = buildExecutiveSummaryCs(snapshot);
  snapshot.methodology_outline_1_10 = buildMethodologyOutline110(state, snapshot);
  return snapshot;
}

/** Serializovatelné pipeline vstupy pro export (stejné mapování jako výpočet). */
export function buildPipelineInputsExport(
  state: WizardState,
): Record<ScenarioKind, ReturnType<typeof wizardStateToPipelineInput>> {
  const out = {} as Record<
    ScenarioKind,
    ReturnType<typeof wizardStateToPipelineInput>
  >;
  for (const k of SCENARIO_ORDER) {
    out[k] = wizardStateToPipelineInput(state, k);
  }
  return out;
}
