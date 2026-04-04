import { describe, expect, it } from "vitest";
import { createDemoWizardState } from "@/features/studio/demo-seed";
import { runAllScenarioPipelines } from "@/features/studio/run-all-scenarios";
import {
  buildM7ScenarioConsolidation,
  buildScenarioComparisonRow,
} from "./build-m7-scenario-consolidation";
import { buildMethodologyReportSnapshot } from "./build-report-snapshot";
import { serializeReportSnapshot, serializeScenarioComparisonOnly } from "./report-exports";
import type { WizardState } from "@/features/studio/wizard-types";

describe("buildM7ScenarioConsolidation", () => {
  it("scenarioMetrics odpovídá řádkům z pipeline (bez nových výpočtů)", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const m7 = buildM7ScenarioConsolidation(state, results);
    expect(m7.scenarioMetrics.rows.length).toBe(3);
    for (const row of m7.scenarioMetrics.rows) {
      const r = results[row.scenario]!;
      expect(row.employment.nCelkem).toBe(r.employment.result.nCelkem);
      expect(row.economic.deltaHdp).toBe(r.economic.result.deltaHdp);
    }
  });

  it("shodné scénářové delty → stejné klíče varying můžou být prázdné pro stejné merged assumptions", () => {
    const base = createDemoWizardState();
    const sameDelta = {
      util_RZPS: 0.5,
      k_inv: 0.22,
      p_pendler: 0.065,
      theta: 0.34,
      M_i: 0.1,
    };
    const state: WizardState = {
      ...base,
      scenarioAssumptionDelta: {
        optimistic: { ...sameDelta },
        baseline: { ...sameDelta },
        pessimistic: { ...sameDelta },
      },
    };
    const results = runAllScenarioPipelines(state);
    const m7 = buildM7ScenarioConsolidation(state, results);
    expect(m7.sensitivitySummary.varyingAssumptionKeys.length).toBe(0);
    const opt = m7.scenarioMetrics.rows.find((x) => x.scenario === "optimistic")!;
    const pes = m7.scenarioMetrics.rows.find((x) => x.scenario === "pessimistic")!;
    expect(opt.employment.nCelkem).toBe(pes.employment.nCelkem);
    expect(opt.economic.deltaHdp).toBe(pes.economic.deltaHdp);
  });

  it("klasifikace obsahuje povinné druhy", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const m7 = buildM7ScenarioConsolidation(state, results);
    const kinds = new Set(m7.classification.items.map((i) => i.kind));
    expect(kinds.has("shared_input")).toBe(true);
    expect(kinds.has("scenario_delta")).toBe(true);
    expect(kinds.has("derived_output")).toBe(true);
    expect(kinds.has("assumption")).toBe(true);
    expect(kinds.has("open_question")).toBe(true);
    expect(kinds.has("fallback_bridge")).toBe(true);
  });

  it("consolidatedRisks agreguje kódy a OQ", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const m7 = buildM7ScenarioConsolidation(state, results);
    expect(m7.consolidatedRisks.warningCodesUnion.length).toBeGreaterThanOrEqual(0);
    expect(Array.isArray(m7.consolidatedRisks.openQuestionsUnion)).toBe(true);
    expect(m7.auditLinks.byScenario.baseline.tracePath).toContain("section13");
  });

  it("buildScenarioComparisonRow je null pro chybějící výsledek", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const partial = { ...results, optimistic: null };
    expect(buildScenarioComparisonRow("optimistic", partial.optimistic)).toBeNull();
  });
});

describe("M7 ↔ report snapshot ↔ export", () => {
  it("section11.rows je stejná reference jako m7.scenarioMetrics.rows", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const snap = buildMethodologyReportSnapshot(state, results)!;
    expect(snap.section11_comparison.rows).toBe(
      snap.m7_scenario_consolidation.scenarioMetrics.rows,
    );
  });

  it("section12 m7 index shodný s M7 sensitivity", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const snap = buildMethodologyReportSnapshot(state, results)!;
    expect(snap.section12_assumptionsUncertainty.m7VaryingEffectiveAssumptionKeys).toEqual(
      snap.m7_scenario_consolidation.sensitivitySummary.varyingAssumptionKeys,
    );
  });

  it("export srovnání obsahuje m7_scenario_consolidation", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const snap = buildMethodologyReportSnapshot(state, results)!;
    const json = serializeScenarioComparisonOnly(snap);
    expect(json).toContain("m7_scenario_consolidation");
    expect(json).toContain("scenarioMetrics");
    const full = serializeReportSnapshot(snap);
    expect(full).toContain("m7_scenario_consolidation");
  });
});
