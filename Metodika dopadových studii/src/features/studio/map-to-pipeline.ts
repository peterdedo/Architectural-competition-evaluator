import type { FullCalculationPipelineInput } from "@/lib/mhdsi/calculations/run-pipeline";

import type { AssumptionOverrides } from "@/lib/mhdsi/calculations/resolve-assumptions";

import type { ScenarioKind, WizardState } from "./wizard-types";

import { buildP1LayerForPipeline } from "./p1-pipeline-derive";



/** Sloučí sdílené předpoklady a deltu scénáře — bez výpočtů, jen skládání objektů. */

export function mergeAssumptionsForScenario(

  state: WizardState,

  scenario: ScenarioKind,

): AssumptionOverrides {

  const shared = state.sharedAssumptions;

  const delta = state.scenarioAssumptionDelta[scenario] ?? {};

  const out: AssumptionOverrides = {};

  for (const [k, v] of Object.entries(shared)) {

    out[k] = v;

  }

  for (const [k, v] of Object.entries(delta)) {

    out[k] = v;

  }

  return out;

}



/**

 * Mapuje stav průvodce na vstup `runFullCalculationPipeline`.

 * Zahrnuje P1 → M3/M4 odvození přes `buildP1LayerForPipeline` (kanonická vrstva).

 */

export function wizardStateToPipelineInput(

  state: WizardState,

  scenario: ScenarioKind,

): FullCalculationPipelineInput {

  const ass = mergeAssumptionsForScenario(state, scenario);



  const shareSum = state.shareByt + state.shareRodinny || 1;

  const shareHousingType: Record<string, number> = {

    byt: state.shareByt / shareSum,

    rodinny: state.shareRodinny / shareSum,

  };

  const occByType: Record<string, number> = {

    byt: state.occByt,

    rodinny: state.occRodinny,

  };

  const lTMarketByType: Record<string, number> = {

    byt: state.lMarketByt,

    rodinny: state.lMarketRodinny,

  };



  const p1Layer = buildP1LayerForPipeline(state);

  const {

    nInvEffective,

    fteFactor,

    uM2,

    empRamp,

    migAdj,

    nKmenEff,

    vEffective,

    m2VacantUsed,

    housingRamp,

    schedule,

    pmjShiftSummary,

    m2Population,

    m2AvgRentCzk,

    m2VacantBaseline,

  } = p1Layer;



  const employmentP1Bridge = {
    nInvMvp: state.nInv,
    ftePmJFactor: fteFactor,
    baselineUnemploymentRate: uM2,
    baselineEmploymentRate: p1Layer.erM2,
    applyM2UnemploymentToUtilRzps:
      state.p1PipelineBridge.applyM2UnemploymentToUtilRzps,
    regionLabel: state.layerM1.region,
    municipalityLabel: state.layerM1.municipality,
    isochronesMode: state.layerM1.isochronesMode,
    isochronesManualNote: state.layerM1.isochronesManualNote,
    m0Schedule: {
      constructionStart: schedule.constructionStart,
      fullOperationPlanned: schedule.fullOperationPlanned,
      rampYearsGlobal: schedule.rampYearsGlobal,
      employmentRampYearsEffective: empRamp,
    },
    pmjShiftSummary,
  };

  const housingP1Bridge = {
    vTVacantMvp: state.vTVacant,
    nKmenMvp: state.nKmen,
    migrationAdjustment: migAdj,
    m2VacantUsed,
    applyM2VacantToHousingSupply:
      state.p1PipelineBridge.applyM2VacantToHousingSupply,
    m0Schedule: {
      constructionStart: schedule.constructionStart,
      fullOperationPlanned: schedule.fullOperationPlanned,
      rampYearsGlobal: schedule.rampYearsGlobal,
      housingRampYearsEffective: housingRamp,
    },
    m1Territory: {
      municipality: state.layerM1.municipality,
      region: state.layerM1.region,
      isochronesMode: state.layerM1.isochronesMode,
      isochronesManualNote: state.layerM1.isochronesManualNote,
    },
    m2HousingContext: {
      population: m2Population,
      avgRentCzk: m2AvgRentCzk,
      vacantUnitsBaseline: m2VacantBaseline,
    },
    ...(state.p1PipelineBridge.linkHousingToEmploymentM3
      ? {
          m3EmploymentLink: {
            nAgenturaMvp: state.nAgentura,
            nPendlerMvp: state.nPendler,
          },
        }
      : {}),
  };



  return {

    employment: {

      nInv: nInvEffective,

      kInv: state.kInv,

      aUp: state.aUp,

      bUp: state.bUp,

      cUp: state.cUp,

      mNew: state.mNew,

      mRegion: state.mRegion,

      npVm: state.npVm,

      npTotal: state.npTotal,

      zI: state.zI,

      mI: state.mI,

      nSub: state.nSub,

      rampYears: empRamp,

      assumptionOverrides: ass,

      p1Bridge: employmentP1Bridge,

    },

    housing: {

      situation: state.situation,

      nKmen: nKmenEff,

      nAgentura: state.nAgentura,

      nPendler: state.nPendler,

      nRelokace: state.nRelokace,

      shareHousingType,

      occByType,

      lTMarketByType,

      vTVacant: vEffective,

      rampYears: housingRamp,

      assumptionOverrides: ass,

      p1Bridge: housingP1Bridge,

      linkToEmploymentM3: state.p1PipelineBridge.linkHousingToEmploymentM3,

    },

    civic: {

      ou: state.ou,

      capRegMs: state.capRegMs,

      capRegZs: state.capRegZs,

      enrolledMs: state.enrolledMs,

      enrolledZs: state.enrolledZs,

      pxSpecialistsAggregate: state.pxSpecialistsAggregate,

      kstandardLeisure: state.kstandardLeisure,

      nCelkemM3: state.nCelkemM3,

      nAgentCizinci: state.nAgentCizinci,

      fteSecurityPer1000: state.fteSecurityPer1000,

      acuteBedsCapacity: state.acuteBedsCapacity,

      leisureCapacityUnits: state.leisureCapacityUnits,

      rampYears: state.civicRampYears,

      assumptionOverrides: ass,

      p1Bridge: {
        linkOuToM4: state.p1PipelineBridge.linkCivicOuToM4Ou,
        linkSafetyToM3: state.p1PipelineBridge.linkCivicSafetyToM3NCelkem,
        ouWizardMvp: state.ou,
        nCelkemWizardMvp: state.nCelkemM3,
      },

    },

    economic: {

      mvpManualDeltaHdpCzk: state.mvpManualDeltaHdpCzk,

      sStavbyM2: state.sStavbyM2,

      sPlochyM2: state.sPlochyM2,

      sStavbyKcPerM2: state.sStavbyKcPerM2,

      sPlochyKcPerM2: state.sPlochyKcPerM2,

      kMistni: state.kMistni,

      kZakladni: state.kZakladni,

      nNovaForPrud: state.nNovaForPrud,

      assumptionOverrides: ass,

      e6Bridge: {
        useComputedDeltaHdp: state.p1PipelineBridge.useComputedM6DeltaHdp,
        capexTotalCzk: state.capexTotalCzk,
        constructionRampYears: empRamp,
        mRegionMonthlyCzk: state.mRegion,
      },

    },

  };

}


