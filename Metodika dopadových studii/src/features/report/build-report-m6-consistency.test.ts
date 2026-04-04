import { describe, expect, it } from "vitest";
import { createDemoWizardState } from "@/features/studio/demo-seed";
import { runAllScenarioPipelines } from "@/features/studio/run-all-scenarios";
import { buildEngineContractM6FromPipeline } from "@/features/studio/p1-pipeline-derive";
import { buildMethodologyReportSnapshot } from "./build-report-snapshot";

describe("M6 — jedna pravda mezi engine, reportem a kanonickým baseline", () => {
  it("slice baseline, section05 a p1_m6_bridge odpovídají výstupu pipeline", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const base = results.baseline!;
    const snap = buildMethodologyReportSnapshot(state, results);
    expect(snap).not.toBeNull();

    const m6 = buildEngineContractM6FromPipeline(base);
    expect(snap!.p1_m6_bridge.engineContractBaseline).toEqual(m6);
    expect(snap!.section05_asIs.m6EffectiveBaseline).toEqual(m6);

    const econ = snap!.primaryKpiAndModules.baseline.economic;
    const er = base.economic.result;
    expect(econ.deltaHdp).toBe(er.deltaHdp);
    expect(econ.deltaHdpSource).toBe(er.deltaHdpSource);
    expect(econ.deltaHdpBreakdown).toEqual(er.deltaHdpBreakdown ?? null);
    expect(econ.taxYield).toBe(er.taxYield);
    expect(econ.householdConsumptionAnnual).toBe(er.householdConsumptionAnnual);
    expect(econ.householdConsumptionSource).toBe(er.householdConsumptionSource);
    expect(econ.dznmAnnual).toBe(er.dznmAnnual);
    expect(econ.consumptionRetained).toBe(er.consumptionRetained);
    expect(econ.publicBudgetStat).toBe(er.publicBudgetStat);
    expect(econ.publicBudgetKraj).toBe(er.publicBudgetKraj);
    expect(econ.publicBudgetObec).toBe(er.publicBudgetObec);

    for (const row of snap!.section11_comparison.rows) {
      const pr = results[row.scenario];
      expect(pr).not.toBeNull();
      expect(row.economic.deltaHdp).toBe(pr!.economic.result.deltaHdp);
      expect(row.economic.taxYield).toBe(pr!.economic.result.taxYield);
      expect(row.economic.householdConsumptionAnnual).toBe(
        pr!.economic.result.householdConsumptionAnnual,
      );
      expect(row.economic.householdConsumptionSource).toBe(
        pr!.economic.result.householdConsumptionSource,
      );
      expect(row.economic.consumptionRetained).toBe(
        pr!.economic.result.consumptionRetained,
      );
    }

    expect(snap!.section11_comparison.rows).toBe(
      snap!.m7_scenario_consolidation.scenarioMetrics.rows,
    );
    expect(snap!.m7_scenario_consolidation.scenarioMetrics.rows.length).toBe(
      snap!.section11_comparison.rows.length,
    );
  });
});
