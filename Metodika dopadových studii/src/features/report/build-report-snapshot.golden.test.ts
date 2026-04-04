import { describe, expect, it } from "vitest";
import { createDemoWizardState } from "@/features/studio/demo-seed";
import { runAllScenarioPipelines } from "@/features/studio/run-all-scenarios";
import { buildMethodologyReportSnapshot } from "./build-report-snapshot";
import { stableStringify } from "./stable-json";

/**
 * Referenční projekt = ukázková data průvodce (`createDemoWizardState`).
 * Regresím v jádře nebo snapshot builderu se změní tento snapshot — zkontrolujte diff.
 */
describe("buildMethodologyReportSnapshot (golden)", () => {
  it("produces stable output for demo seed (normalized metadata)", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const snap = buildMethodologyReportSnapshot(state, results, {
      reportId: "golden-rc",
    });
    expect(snap).not.toBeNull();
    const normalized = {
      ...snap!,
      metadata: {
        ...snap!.metadata,
        id: "golden-rc",
        generatedAt: "2000-01-01T00:00:00.000Z",
      },
    };
    expect(stableStringify(normalized)).toMatchSnapshot();
  });
});
