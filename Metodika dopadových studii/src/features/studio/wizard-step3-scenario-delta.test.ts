import { describe, expect, it } from "vitest";

import { scenarioDeltaFieldErrorPath } from "@/content/scenario-delta-bounds";
import { createDemoWizardState } from "./demo-seed";
import { mergeAssumptionsForScenario, wizardStateToPipelineInput } from "./map-to-pipeline";
import { validateWizardStep } from "./wizard-schema";

describe("krok 3 — scenarioAssumptionDelta", () => {
  it("demo seed projde validací", () => {
    const s = createDemoWizardState();
    const v = validateWizardStep(3, s);
    expect(v.ok, JSON.stringify(v.fieldErrors)).toBe(true);
  });

  it("util_RZPS > 1 u baseline selže a chyba má očekávaný klíč", () => {
    const s = createDemoWizardState();
    const bad = {
      ...s,
      scenarioAssumptionDelta: {
        ...s.scenarioAssumptionDelta,
        baseline: {
          ...s.scenarioAssumptionDelta.baseline,
          util_RZPS: 1.5,
        },
      },
    };
    const v = validateWizardStep(3, bad);
    expect(v.ok).toBe(false);
    const path = scenarioDeltaFieldErrorPath("baseline", "util_RZPS");
    expect(v.fieldErrors[path]).toContain("0 a 1");
  });

  it("neznámý klíč v deltě selže", () => {
    const s = createDemoWizardState();
    const bad = {
      ...s,
      scenarioAssumptionDelta: {
        ...s.scenarioAssumptionDelta,
        optimistic: {
          ...s.scenarioAssumptionDelta.optimistic,
          nonsense_param: 0.5,
        },
      },
    };
    const v = validateWizardStep(3, bad);
    expect(v.ok).toBe(false);
    expect(
      v.fieldErrors[
        scenarioDeltaFieldErrorPath("optimistic", "nonsense_param")
      ],
    ).toMatch(/Neznámý scénářový parametr/);
  });

  it("M_i mimo 0–1 selže (persist bez UI pole)", () => {
    const s = createDemoWizardState();
    const bad = {
      ...s,
      scenarioAssumptionDelta: {
        ...s.scenarioAssumptionDelta,
        pessimistic: {
          ...s.scenarioAssumptionDelta.pessimistic,
          M_i: 2,
        },
      },
    };
    const v = validateWizardStep(3, bad);
    expect(v.ok).toBe(false);
    expect(
      v.fieldErrors[scenarioDeltaFieldErrorPath("pessimistic", "M_i")],
    ).toBeDefined();
  });

  it("merge + wizardStateToPipelineInput po validních deltách beze změny chování (baseline)", () => {
    const s = createDemoWizardState();
    const merged = mergeAssumptionsForScenario(s, "baseline");
    expect(merged.util_RZPS).toBe(s.scenarioAssumptionDelta.baseline.util_RZPS);
    expect(merged.theta).toBe(s.scenarioAssumptionDelta.baseline.theta);
    const input = wizardStateToPipelineInput(s, "baseline");
    expect(input.employment.nInv).toBeDefined();
  });
});
