import { describe, expect, it } from "vitest";
import { createDemoWizardState } from "./demo-seed";
import { firstInvalidWizardStepIndex } from "./wizard-schema";

describe("firstInvalidWizardStepIndex", () => {
  it("vrátí null pro výchozí demo stav (kroky 0–7 projdou)", () => {
    const state = createDemoWizardState();
    expect(firstInvalidWizardStepIndex(state)).toBeNull();
  });

  it("vrátí 0 při neplatném kroku 0", () => {
    const state = createDemoWizardState();
    state.projectName = "";
    expect(firstInvalidWizardStepIndex(state)).toBe(0);
  });

  it("vrátí 1 při neplatném kroku 1, pokud je krok 0 v pořádku", () => {
    const state = createDemoWizardState();
    state.diadPrMinutes = -1;
    expect(firstInvalidWizardStepIndex(state)).toBe(1);
  });
});
