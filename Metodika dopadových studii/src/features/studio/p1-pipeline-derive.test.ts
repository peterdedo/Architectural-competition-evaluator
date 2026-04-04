import { describe, expect, it } from "vitest";

import {
  createDefaultP1PipelineBridgeFlags,
  createRecommendedP1PipelineBridgeFlags,
} from "@/domain/methodology/p1-pipeline-bridge";

import { createDemoWizardState } from "./demo-seed";

import { utilRzpsMultiplierFromUnemployment } from "@/lib/mhdsi/calculations/employment";

import {

  buildP1LayerForPipeline,

  buildEngineContractBaselineFromPipeline,

  canonicalP1SourcesForReport,

  effectiveNInvForEmployment,

  effectiveVacantForHousing,

  summarizeP1BridgeForReport,

} from "./p1-pipeline-derive";

import { wizardStateToPipelineInput } from "./map-to-pipeline";
import { runAllScenarioPipelines } from "./run-all-scenarios";



describe("p1-pipeline-derive", () => {

  it("FTE mění efektivní N_inv při zapnutém mostu", () => {

    const s = createDemoWizardState();

    const on = effectiveNInvForEmployment(s.nInv, s.layerM0, {

      ...s.p1PipelineBridge,

      applyM0FteToEmployment: true,

    });

    const off = effectiveNInvForEmployment(s.nInv, s.layerM0, {

      ...s.p1PipelineBridge,

      applyM0FteToEmployment: false,

    });

    expect(on.fteFactor).toBeLessThanOrEqual(1);

    expect(off.nInvEffective).toBe(s.nInv);

    expect(on.nInvEffective).toBeLessThanOrEqual(s.nInv);

  });



  it("M2 vacant zvyšuje efektivní nabídku při zapnutém mostu", () => {

    const s = createDemoWizardState();

    const r = effectiveVacantForHousing(10, s.layerM2, {

      ...createRecommendedP1PipelineBridgeFlags(),

      applyM2VacantToHousingSupply: true,

    });

    expect(r.vEffective).toBeGreaterThanOrEqual(10);

    expect(r.m2VacantUsed).toBe(true);

  });

});



describe("wizardStateToPipelineInput + P1", () => {

  it("mapuje employment/housing s p1Bridge a zachovává civic/economic", () => {

    const s = createDemoWizardState();

    const input = wizardStateToPipelineInput(s, "baseline");

    expect(input.employment.p1Bridge).toBeDefined();

    expect(input.housing.p1Bridge).toBeDefined();

    expect(input.employment.p1Bridge?.nInvMvp).toBe(s.nInv);

    expect(input.civic.ou).toBe(s.ou);

    expect(input.economic.mvpManualDeltaHdpCzk).toBe(s.mvpManualDeltaHdpCzk);

  });

  it("při vypnutém M3→M4 mostu nemapuje m3EmploymentLink ani linkToEmploymentM3", () => {

    const s = createDemoWizardState();

    const input = wizardStateToPipelineInput(

      {

        ...s,

        p1PipelineBridge: {

          ...s.p1PipelineBridge,

          linkHousingToEmploymentM3: false,

        },

      },

      "baseline",

    );

    expect(input.housing.linkToEmploymentM3).toBe(false);

    expect(input.housing.p1Bridge?.m3EmploymentLink).toBeUndefined();

  });

});



describe("buildP1LayerForPipeline + canonical", () => {

  it("vrací konzistentní vrstvu a kanonické zdroje pro demo", () => {

    const s = createDemoWizardState();

    const layer = buildP1LayerForPipeline(s);

    expect(layer.nInvEffective).toBeGreaterThan(0);

    expect(layer.empRamp).toBeGreaterThanOrEqual(1);

    const canon = canonicalP1SourcesForReport(s);

    expect(canon.employment.nInvEffective).toBe("m0_fte_scaled");

    expect(canon.housing.m3toM4).toBe("m3_drv_outputs");

  });

});



describe("utilRzpsMultiplierFromUnemployment", () => {

  it("je v rozumném pásmu", () => {

    expect(utilRzpsMultiplierFromUnemployment(0.035)).toBeGreaterThan(0.8);

    expect(utilRzpsMultiplierFromUnemployment(0.035)).toBeLessThan(1.15);

  });

});



describe("engine contract vs pipeline (EPIC 1)", () => {

  it("summarizeP1BridgeForReport doplňuje engineContractBaseline ze baseline pipeline", () => {

    const s = createDemoWizardState();

    const results = runAllScenarioPipelines(s);

    const b = results.baseline!;

    const br = summarizeP1BridgeForReport(s, b);

    expect(br.engineContractBaseline).toBeDefined();

    expect(br.engineContractBaseline).toEqual(buildEngineContractBaselineFromPipeline(b));

  });



  it("všechny P1 mosty vypnuté: MVP nInv a bez M3→M4 v kontraktu", () => {

    const s = createDemoWizardState();

    const off = { ...s, p1PipelineBridge: createDefaultP1PipelineBridgeFlags() };

    const results = runAllScenarioPipelines(off);

    const ec = buildEngineContractBaselineFromPipeline(results.baseline!);

    expect(ec.nInvEffective).toBe(off.nInv);

    expect(ec.linkM3toM4).toBe(false);

    expect(ec.fteFactorApplied).toBe(1);

  });

});


