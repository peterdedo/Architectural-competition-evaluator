import { describe, expect, it } from "vitest";

import { createDemoWizardState } from "./demo-seed";

import { normalizeWizardState } from "./wizard-state-migration";

import type { WizardState } from "./wizard-types";



describe("normalizeWizardState", () => {

  it("doplňuje P1 vrstvy u starého tvaru bez layerM0/1/2", () => {

    const full = createDemoWizardState();

    const {
      layerM0: _omitM0,
      layerM1: _omitM1,
      layerM2: _omitM2,
      p1PipelineBridge: _omitP1,
      ...legacy
    } = full;

    /** Záměrně neúplný objekt (legacy bez P1) — migrace ho doplní. */
    const stripped = legacy as unknown as WizardState;

    const normalized = normalizeWizardState(stripped);

    expect(normalized.layerM0.projectCode).toBe("");

    expect(normalized.layerM1.isochronesMode).toBe("manual_same_as_diad");

    expect(normalized.layerM2.demographics.year).toBeGreaterThan(1990);

    expect(normalized.p1PipelineBridge.applyM0FteToEmployment).toBe(false);

    expect(normalized.p1PipelineBridge.linkHousingToEmploymentM3).toBe(false);

    expect(normalized.p1PipelineBridge.useComputedM6DeltaHdp).toBe(true);

  });



  it("je idempotentní pro demo seed", () => {

    const s = createDemoWizardState();

    const twice = normalizeWizardState(normalizeWizardState(s));

    expect(twice.layerM0.projectCode).toBe(s.layerM0.projectCode);

    expect(twice.layerM2.demographics.population.value).toBe(

      s.layerM2.demographics.population.value,

    );

  });

});


