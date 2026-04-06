import { describe, expect, it } from "vitest";
import { createDemoWizardState } from "./demo-seed";
import { runAllScenarioPipelines } from "./run-all-scenarios";
import { buildPipelineExplainabilitySummary } from "./pipeline-explainability";

describe("buildPipelineExplainabilitySummary", () => {
  it("obsahuje očekávané sekce (baseline, demo seed)", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const s = buildPipelineExplainabilitySummary(state, "baseline", results.baseline);
    expect(s.map((x) => x.id)).toEqual(
      expect.arrayContaining([
        "terminology",
        "m3_m4_inputs",
        "m4_ou",
        "m5_civic",
        "m6_economic",
      ]),
    );
  });

  it("M4 OU sekce má lidské řádky z trace (DRV-016)", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const s = buildPipelineExplainabilitySummary(state, "baseline", results.baseline);
    const ouSec = s.find((x) => x.id === "m4_ou");
    expect(ouSec?.bulletsCs?.length).toBeGreaterThan(0);
    expect(ouSec?.bulletsCs?.some((b) => /N_agentura|OU|KH/i.test(b))).toBe(true);
  });

  it("M4 tabulka má řádky pro kmen, agenturu, pendler, vacant", () => {
    const state = createDemoWizardState();
    const results = runAllScenarioPipelines(state);
    const s = buildPipelineExplainabilitySummary(state, "baseline", results.baseline);
    const m4 = s.find((x) => x.id === "m3_m4_inputs");
    const labels = m4?.rows?.map((r) => r.metric) ?? [];
    expect(labels.some((l) => l.includes("N_kmen"))).toBe(true);
    expect(labels.some((l) => l.includes("N_agentura"))).toBe(true);
    expect(labels.some((l) => l.includes("N_pendler"))).toBe(true);
    expect(labels.some((l) => l.includes("vacant"))).toBe(true);
  });
});
