import { describe, expect, it } from "vitest";
import { resolveTrustFraming } from "@/content/trust-framing-cs";
import { createDemoWizardState } from "@/features/studio/demo-seed";
import { runAllScenarioPipelines } from "@/features/studio/run-all-scenarios";
import { buildDecisionScreenCopy } from "@/features/studio/ux/decision-screen-copy";
import { buildMethodologyReportSnapshot } from "./build-report-snapshot";

/**
 * Report (interpretační blok) a obrazovka výsledků musí pro trust používat stejné
 * vstupy: počty varování a OQ za baseline, ne M7 unie (jinak hrozí drift úrovně jistoty).
 */
describe("trust framing — baseline konzistence report vs výsledky", () => {
  it("stejná úroveň jako buildDecisionScreenCopy pro stejný snapshot", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const snap = buildMethodologyReportSnapshot(state, results, {
      reportId: "trust-consistency",
    });
    expect(snap).not.toBeNull();
    const b = snap!.primaryKpiAndModules.baseline;
    const varying =
      snap!.m7_scenario_consolidation.sensitivitySummary.varyingAssumptionKeys
        .length;
    const fromDecision = buildDecisionScreenCopy(snap!);
    const direct = resolveTrustFraming(
      b.warnings.length,
      b.openQuestions.length,
      varying,
    );
    expect(direct.level).toBe(fromDecision.confidenceLevel);
    expect(direct.summary).toBe(fromDecision.confidenceSummary);
  });
});
