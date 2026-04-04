import { describe, expect, it } from "vitest";

import { createDemoWizardState } from "./demo-seed";
import { validateWizardStep } from "./wizard-schema";

describe("wizard numeric sanity (QA bounds)", () => {
  it("krok 1: záporné tinfrMinutes neprojde", () => {
    const s = createDemoWizardState();
    const bad = { ...s, tinfrMinutes: -5 };
    const v = validateWizardStep(1, bad);
    expect(v.ok).toBe(false);
    expect(v.fieldErrors.tinfrMinutes).toBeDefined();
  });

  it("krok 0: záporný CAPEX neprojde", () => {
    const s = createDemoWizardState();
    const bad = { ...s, capexTotalCzk: -100 };
    const v = validateWizardStep(0, bad);
    expect(v.ok).toBe(false);
  });

  it("krok 2: nezaměstnanost > 1 neprojde (superRefine)", () => {
    const s = createDemoWizardState();
    const bad = {
      ...s,
      layerM2: {
        ...s.layerM2,
        laborMarket: {
          ...s.layerM2.laborMarket,
          unemploymentRate: {
            value: 2,
            kind: "raw_input" as const,
            note: "",
          },
        },
      },
    };
    const v = validateWizardStep(2, bad);
    expect(v.ok).toBe(false);
    expect(
      v.fieldErrors["laborMarket.unemploymentRate.value"] ??
        v.fieldErrors["laborMarket"] ??
        Object.values(v.fieldErrors).some((m) => /0 a 1/.test(m)),
    ).toBeTruthy();
  });

  it("krok 7: ΔHDP mimo rozsah neprojde", () => {
    const s = createDemoWizardState();
    const bad = { ...s, mvpManualDeltaHdpCzk: 2e14 };
    const v = validateWizardStep(7, bad);
    expect(v.ok).toBe(false);
  });

  it("demo seed stále projde kroky 0–7", () => {
    const s = createDemoWizardState();
    for (let i = 0; i <= 7; i++) {
      const v = validateWizardStep(i, s);
      expect(v.ok, `krok ${i}: ${JSON.stringify(v.fieldErrors)}`).toBe(true);
    }
  });
});
