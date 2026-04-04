import { describe, expect, it } from "vitest";
import { createDemoWizardState } from "@/features/studio/demo-seed";
import { runAllScenarioPipelines } from "@/features/studio/run-all-scenarios";
import {
  AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD,
  WARNING_CODE_AGENCY_SHARE_RISK,
} from "@/lib/mhdsi/calculations/employment";
import {
  baselineHasAgencyShareRisk,
  snapshotUnionHasAgencyShareRisk,
} from "./agency-share-risk-snapshot";
import { buildMethodologyReportSnapshot } from "./build-report-snapshot";

describe("AGENCY_SHARE_RISK — konzistence engine / snapshot / baseline flag", () => {
  it("demo seed: baseline má varování a snapshot detekuje stejný signál", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const emp = results.baseline?.employment.result;
    expect(emp).toBeDefined();
    const share =
      emp!.nCelkem > 0 ? emp!.nAgenturaCalc / emp!.nCelkem : 0;
    expect(share).toBeGreaterThan(AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD);
    expect(
      results.baseline?.allWarnings.some(
        (w) => w.code === WARNING_CODE_AGENCY_SHARE_RISK,
      ),
    ).toBe(true);

    const snap = buildMethodologyReportSnapshot(state, results, {
      reportId: "test-agency-risk",
    });
    expect(snap).not.toBeNull();
    expect(baselineHasAgencyShareRisk(snap!)).toBe(true);
    expect(snapshotUnionHasAgencyShareRisk(snap!)).toBe(true);
    expect(
      snap!.m7_scenario_consolidation.consolidatedRisks.warningCodesUnion,
    ).toContain(WARNING_CODE_AGENCY_SHARE_RISK);
  });

  it("nízká mezera práce: žádné AGENCY_SHARE_RISK → baseline flag false", () => {
    const state = createDemoWizardState();
    state.aUp = 320;
    state.scenarioAssumptionDelta = {
      ...state.scenarioAssumptionDelta,
      baseline: {
        ...state.scenarioAssumptionDelta.baseline,
        util_RZPS: 0.99,
      },
    };
    const results = runAllScenarioPipelines(state);
    const emp = results.baseline?.employment.result;
    const share =
      emp && emp.nCelkem > 0 ? emp.nAgenturaCalc / emp.nCelkem : 0;
    expect(share).toBeLessThanOrEqual(AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD);
    expect(
      results.baseline?.allWarnings.some(
        (w) => w.code === WARNING_CODE_AGENCY_SHARE_RISK,
      ),
    ).toBe(false);

    const snap = buildMethodologyReportSnapshot(state, results, {
      reportId: "test-no-agency-risk",
    });
    expect(snap).not.toBeNull();
    expect(baselineHasAgencyShareRisk(snap!)).toBe(false);
  });
});
