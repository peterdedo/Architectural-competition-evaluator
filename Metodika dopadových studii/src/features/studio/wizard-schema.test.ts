import { describe, expect, it } from "vitest";

import { createDemoWizardState } from "./demo-seed";

import { validateWizardStep } from "./wizard-schema";

import { wizardStateToPipelineInput } from "./map-to-pipeline";

import {

  effectiveNInvForEmployment,

  effectiveVacantForHousing,

  nKmenMigrationAdjustment,

} from "./p1-pipeline-derive";



describe("validateWizardStep (P1 kroky)", () => {

  it("prochází kroky 0–3 pro demo seed", () => {

    const s = createDemoWizardState();

    for (let i = 0; i <= 3; i++) {

      const v = validateWizardStep(i, s);

      expect(v.ok, `krok ${i}: ${JSON.stringify(v.fieldErrors)}`).toBe(true);

    }

  });

});



describe("wizardStateToPipelineInput — regrese M3–M6", () => {

  it("mapuje stejně jako dříve pro demo základní vstupy", () => {

    const s = createDemoWizardState();

    const input = wizardStateToPipelineInput(s, "baseline");

    const nEff = effectiveNInvForEmployment(

      s.nInv,

      s.layerM0,

      s.p1PipelineBridge,

    );

    expect(input.employment.nInv).toBeCloseTo(nEff.nInvEffective, 5);

    expect(input.housing.situation).toBe(s.situation);

    const vac = effectiveVacantForHousing(

      s.vTVacant,

      s.layerM2,

      s.p1PipelineBridge,

    );

    expect(input.housing.vTVacant).toBeCloseTo(vac.vEffective, 5);

    expect(input.housing.nKmen).toBeCloseTo(

      s.nKmen + nKmenMigrationAdjustment(s.layerM2, s.p1PipelineBridge),

      5,

    );

    expect(input.civic.ou).toBe(s.ou);

    expect(input.economic.mvpManualDeltaHdpCzk).toBe(s.mvpManualDeltaHdpCzk);

    expect(input.economic.e6Bridge?.useComputedDeltaHdp).toBe(
      s.p1PipelineBridge.useComputedM6DeltaHdp,
    );

    expect(input.housing.linkToEmploymentM3).toBe(

      s.p1PipelineBridge.linkHousingToEmploymentM3,

    );

    expect(input.housing.p1Bridge?.m3EmploymentLink).toBeDefined();

  });

});


