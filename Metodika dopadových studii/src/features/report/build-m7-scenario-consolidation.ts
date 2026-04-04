import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import {
  SCENARIO_ORDER,
  type ScenarioKind,
  type WizardState,
} from "@/features/studio/wizard-types";
import { mergeModuleAssumptionsUsed } from "@/features/studio/pipeline-result-helpers";
import type {
  M7AuditLinks,
  M7ClassificationBlock,
  M7ClassifiedItem,
  M7ClassificationKind,
  M7ConsolidatedRisks,
  M7FallbackSignal,
  M7ScenarioConsolidation,
  M7ScenarioMetricsBlock,
  M7SensitivitySummary,
  ScenarioComparisonMetrics,
} from "./types";

function countWarningsByCode(ws: { code: string }[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const w of ws) {
    out[w.code] = (out[w.code] ?? 0) + 1;
  }
  return out;
}

/** Jedna řádka srovnání — pouze čtení z pipeline výsledků (žádné nové výpočty). */
export function buildScenarioComparisonRow(
  kind: ScenarioKind,
  r: FullCalculationPipelineResult | null,
): ScenarioComparisonMetrics | null {
  if (!r) return null;
  const ass = mergeModuleAssumptionsUsed(r);
  return {
    scenario: kind,
    employment: {
      nCelkem: r.employment.result.nCelkem,
      nMezera: r.employment.result.nMezera,
      rzps: r.employment.result.rzps,
    },
    housing: {
      ou: r.housing.result.ou,
      aggregateDeficit: r.housing.result.aggregateDeficit,
    },
    civic: {
      kindergartenDeficit: r.civic.result.kindergarten.deficitSurplus,
      elementaryDeficit: r.civic.result.elementary.deficitSurplus,
      healthcareDemand: r.civic.result.healthcareDemand,
    },
    economic: {
      deltaHdp: r.economic.result.deltaHdp,
      deltaHdpSource: r.economic.result.deltaHdpSource,
      taxYield: r.economic.result.taxYield,
      prudAnnual: r.economic.result.prudAnnual,
      dznmAnnual: r.economic.result.dznmAnnual,
      householdConsumptionAnnual: r.economic.result.householdConsumptionAnnual,
      householdConsumptionSource: r.economic.result.householdConsumptionSource,
      consumptionRetained: r.economic.result.consumptionRetained,
    },
    warningsCount: r.allWarnings.length,
    warningsByCode: countWarningsByCode(r.allWarnings),
    openQuestionsCount: r.allOpenQuestions.length,
    assumptionsKeyCount: Object.keys(ass).length,
  };
}

function buildScenarioMetrics(
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
): M7ScenarioMetricsBlock {
  const rows: ScenarioComparisonMetrics[] = [];
  for (const kind of SCENARIO_ORDER) {
    const row = buildScenarioComparisonRow(kind, results[kind]);
    if (row) rows.push(row);
  }
  return { rows };
}

function stableValueKey(v: unknown): string {
  if (typeof v === "number" && !Number.isFinite(v)) return "NaN";
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

/** Klíče efektivních assumptions (sloučených z M3–M6), které se mezi dostupnými scénáři liší. */
function computeVaryingAssumptionKeys(
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
): string[] {
  const kinds = SCENARIO_ORDER.filter((k) => results[k] != null);
  if (kinds.length < 2) return [];
  const merges = kinds.map((k) => mergeModuleAssumptionsUsed(results[k]));
  const keySet = new Set<string>();
  for (const m of merges) {
    for (const key of Object.keys(m)) keySet.add(key);
  }
  const varying: string[] = [];
  for (const key of keySet) {
    const vals = merges.map((m) => m[key]);
    const first = stableValueKey(vals[0]);
    if (vals.some((v) => stableValueKey(v) !== first)) {
      varying.push(key);
    }
  }
  return varying.sort();
}

function deltaKeysFromState(state: WizardState): Set<string> {
  const s = new Set<string>();
  for (const kind of SCENARIO_ORDER) {
    const d = state.scenarioAssumptionDelta[kind];
    if (d && typeof d === "object") {
      for (const k of Object.keys(d)) s.add(k);
    }
  }
  return s;
}

function buildClassification(
  state: WizardState,
): M7ClassificationBlock {
  const comparisonMetricSemantics: Record<string, M7ClassificationKind> = {
    "comparison.employment": "derived_output",
    "comparison.housing": "derived_output",
    "comparison.civic": "derived_output",
    "comparison.economic": "derived_output",
    "comparison.warningsCount": "derived_output",
    "comparison.openQuestionsCount": "derived_output",
    "comparison.assumptionsKeyCount": "derived_output",
  };

  const items: M7ClassifiedItem[] = [
    {
      id: "inp-project-territory",
      kind: "shared_input",
      labelCs:
        "Společný popis záměru a území (sekce 1–3 reportu) — jeden vstup pro všechny scénáře",
      refKey: "section01_project,section03_territory",
    },
    {
      id: "wizard-shared-assumptions",
      kind: "shared_input",
      labelCs:
        "Sdílené symboly předpokladů ve wizardu — společná báze pro všechny scénáře",
      refKey: "sharedAssumptions",
    },
    {
      id: "wizard-scenario-delta",
      kind: "scenario_delta",
      labelCs:
        "Scénářové odchylky symbolů (optimistický / střední / pesimistický) — mění efektivní vstupy pipeline",
      refKey: "scenarioAssumptionDelta",
    },
    {
      id: "p1-pipeline-bridge",
      kind: "fallback_bridge",
      labelCs:
        "P1 mosty (M0–M2 → M3–M6) — určují odvození vstupů; část může být MVP bridge dle příznaků",
      refKey: "p1PipelineBridge",
    },
    {
      id: "merged-assumptions-per-scenario",
      kind: "assumption",
      labelCs:
        "Efektivní předpoklady použité v jádře po scénářích (sloučení assumptionsUsed M3–M6)",
      refKey: "section12_assumptionsUncertainty.assumptionsMergedByScenario",
    },
    {
      id: "open-questions-per-scenario",
      kind: "open_question",
      labelCs:
        "Otevřené otázky metodiky aktivované v běhu pipeline (M3–M6) po scénářích",
      refKey: "section12_assumptionsUncertainty.openQuestionsByScenario",
    },
    {
      id: "comparison-table-metrics",
      kind: "derived_output",
      labelCs:
        "Sloupce srovnávací tabulky (sekce 11) — převzaty z výstupů modulů bez nových vzorců",
      refKey: "m7_scenario_consolidation.scenarioMetrics.rows",
    },
  ];

  const deltaKeys = deltaKeysFromState(state);
  for (const k of [...deltaKeys].sort()) {
    items.push({
      id: `scenario-delta-key:${k}`,
      kind: "scenario_delta",
      labelCs: `Scénářový parametr „${k}“ (delta oproti sdíleným předpokladům)`,
      refKey: k,
    });
  }

  return { items, comparisonMetricSemantics };
}

function buildSensitivitySummary(
  state: WizardState,
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
  varyingKeys: string[],
): M7SensitivitySummary {
  const notesCs: string[] = [];

  notesCs.push(
    "Tři scénáře nepředstavují interval spolehlivosti ani statistickou jistotu — jde o pevně zvolené varianty předpokladů dle metodiky (§ 1.5).",
  );

  if (varyingKeys.length === 0) {
    notesCs.push(
      "V efektivních předpokladech sloučených z M3–M6 se mezi dostupnými scénáři neprojevily rozdíly ve stejnojmenných symbolech (nebo je k dispozici jen jeden běh).",
    );
  } else {
    notesCs.push(
      `Symboly s odlišnou efektivní hodnotou mezi scénáři (po sloučení assumptionsUsed): ${varyingKeys.join(", ")}.`,
    );
  }

  const sharedKeys = Object.keys(state.sharedAssumptions).sort();
  if (sharedKeys.length) {
    notesCs.push(
      `Sdílená báze zahrnuje mimo jiné klíče: ${sharedKeys.slice(0, 12).join(", ")}${sharedKeys.length > 12 ? ", …" : ""}.`,
    );
  }

  return {
    varyingAssumptionKeys: varyingKeys,
    scenarioDeltaKeysPresent: [...deltaKeysFromState(state)].sort(),
    notesCs,
  };
}

function buildConsolidatedRisks(
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
): M7ConsolidatedRisks {
  const warningCodes = new Set<string>();
  const oq = new Set<string>();
  const fallbackSignals: M7FallbackSignal[] = [];

  for (const kind of SCENARIO_ORDER) {
    const r = results[kind];
    if (!r) continue;
    for (const w of r.allWarnings) warningCodes.add(w.code);
    for (const q of r.allOpenQuestions) oq.add(q);

    const dhs = r.economic.result.deltaHdpSource;
    if (dhs === "manual_fallback") {
      fallbackSignals.push({
        scenario: kind,
        kind: "delta_hdp_manual_fallback",
        detailCs:
          "ΔHDP z ručního pole / záloha — profil M6 nebyl použit nebo byl neplatný (viz varování a stopa M6).",
      });
    } else if (dhs === "manual_mvp") {
      fallbackSignals.push({
        scenario: kind,
        kind: "delta_hdp_manual_mvp",
        detailCs:
          "ΔHDP pouze z ručního MVP vstupu — v P1 není zapnutý profil M6.",
      });
    }

    if (r.economic.result.householdConsumptionSource === "delta_mvp_bridge") {
      fallbackSignals.push({
        scenario: kind,
        kind: "household_consumption_delta_bridge",
        detailCs:
          "Proxy spotřeba domácností škálovaná k použitému ΔHDP — není payroll z M3.",
      });
    }
  }

  return {
    warningCodesUnion: [...warningCodes].sort(),
    openQuestionsUnion: [...oq].sort((a, b) => a.localeCompare(b)),
    fallbackSignals,
  };
}

function buildAuditLinks(): M7AuditLinks {
  const byScenario = {} as M7AuditLinks["byScenario"];
  for (const kind of SCENARIO_ORDER) {
    byScenario[kind] = {
      tracePath: `section13_audit.byScenario.${kind}`,
      assumptionsMergedPath: `section12_assumptionsUncertainty.assumptionsMergedByScenario.${kind}`,
      openQuestionsPath: `section12_assumptionsUncertainty.openQuestionsByScenario.${kind}`,
      pipelineResultsPath: `pipeline_results.${kind}`,
    };
  }
  return { byScenario };
}

/**
 * M7 — scénářová konsolidace: balí, klasifikuje a porovnává hotové výsledky M3–M6.
 * Nepočítá moduly znovu.
 */
export function buildM7ScenarioConsolidation(
  state: WizardState,
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
): M7ScenarioConsolidation {
  const scenarioMetrics = buildScenarioMetrics(results);
  const varyingAssumptionKeys = computeVaryingAssumptionKeys(results);
  const classification = buildClassification(state);
  const sensitivitySummary = buildSensitivitySummary(
    state,
    results,
    varyingAssumptionKeys,
  );
  const consolidatedRisks = buildConsolidatedRisks(results);
  const auditLinks = buildAuditLinks();

  return {
    scenarioMetrics,
    classification,
    sensitivitySummary,
    consolidatedRisks,
    auditLinks,
  };
}
