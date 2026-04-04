"use client";



import { useShallow } from "zustand/react/shallow";

import { useWizardStore } from "./wizard-store";



/** Úzké selektory pro jednotlivé kroky — rerender jen při změně polí daného kroku. */

export function useWizardStep0Slice() {

  return useWizardStore(

    useShallow((s) => ({

      projectName: s.state.projectName,

      locationDescription: s.state.locationDescription,

      czNace: s.state.czNace,

      capexTotalCzk: s.state.capexTotalCzk,

      nInv: s.state.nInv,

      investorProfile: s.state.investorProfile,

      legalForm: s.state.legalForm,

      strategicLinks: s.state.strategicLinks,

      t0: s.state.t0,

      layerM0: s.state.layerM0,

    })),

  );

}



export function useWizardStep1Slice() {

  return useWizardStore(

    useShallow((s) => ({

      dLastMileKm: s.state.dLastMileKm,

      diadPrMinutes: s.state.diadPrMinutes,

      diadAkMinutes: s.state.diadAkMinutes,

      tinfrMinutes: s.state.tinfrMinutes,

      layerM1: s.state.layerM1,

    })),

  );

}



export function useWizardStep2Slice() {

  return useWizardStore(

    useShallow((s) => ({

      layerM2: s.state.layerM2,

    })),

  );

}



export function useWizardStep3Slice() {

  return useWizardStore(

    useShallow((s) => ({

      rampYearsGlobal: s.state.rampYearsGlobal,

      scenarioAssumptionDelta: s.state.scenarioAssumptionDelta,

    })),

  );

}



export function useWizardStep4Slice() {

  return useWizardStore(

    useShallow((s) => ({

      nInv: s.state.nInv,

      kInv: s.state.kInv,

      aUp: s.state.aUp,

      bUp: s.state.bUp,

      cUp: s.state.cUp,

      mNew: s.state.mNew,

      mRegion: s.state.mRegion,

      npVm: s.state.npVm,

      npTotal: s.state.npTotal,

      zI: s.state.zI,

      mI: s.state.mI,

      nSub: s.state.nSub,

      employmentRampYears: s.state.employmentRampYears,

      rampYearsGlobal: s.state.rampYearsGlobal,

      p1PipelineBridge: s.state.p1PipelineBridge,

      layerM0: s.state.layerM0,

      layerM2: s.state.layerM2,

    })),

  );

}



export function useWizardStep5Slice() {

  return useWizardStore(

    useShallow((s) => ({

      situation: s.state.situation,

      nKmen: s.state.nKmen,

      nAgentura: s.state.nAgentura,

      nPendler: s.state.nPendler,

      nRelokace: s.state.nRelokace,

      shareByt: s.state.shareByt,

      shareRodinny: s.state.shareRodinny,

      occByt: s.state.occByt,

      occRodinny: s.state.occRodinny,

      lMarketByt: s.state.lMarketByt,

      lMarketRodinny: s.state.lMarketRodinny,

      vTVacant: s.state.vTVacant,

      housingRampYears: s.state.housingRampYears,

      rampYearsGlobal: s.state.rampYearsGlobal,

      p1PipelineBridge: s.state.p1PipelineBridge,

      layerM2: s.state.layerM2,

    })),

  );

}



export function useWizardStep6Slice() {

  return useWizardStore(

    useShallow((s) => ({

      ou: s.state.ou,

      capRegMs: s.state.capRegMs,

      capRegZs: s.state.capRegZs,

      enrolledMs: s.state.enrolledMs,

      enrolledZs: s.state.enrolledZs,

      pxSpecialistsAggregate: s.state.pxSpecialistsAggregate,

      kstandardLeisure: s.state.kstandardLeisure,

      nCelkemM3: s.state.nCelkemM3,

      nAgentCizinci: s.state.nAgentCizinci,

      fteSecurityPer1000: s.state.fteSecurityPer1000,

      acuteBedsCapacity: s.state.acuteBedsCapacity,

      leisureCapacityUnits: s.state.leisureCapacityUnits,

      civicRampYears: s.state.civicRampYears,

    })),

  );

}



export function useWizardStep7Slice() {

  return useWizardStore(

    useShallow((s) => ({

      p1PipelineBridge: s.state.p1PipelineBridge,

      mvpManualDeltaHdpCzk: s.state.mvpManualDeltaHdpCzk,

      sStavbyM2: s.state.sStavbyM2,

      sPlochyM2: s.state.sPlochyM2,

      sStavbyKcPerM2: s.state.sStavbyKcPerM2,

      sPlochyKcPerM2: s.state.sPlochyKcPerM2,

      kMistni: s.state.kMistni,

      kZakladni: s.state.kZakladni,

      nNovaForPrud: s.state.nNovaForPrud,

    })),

  );

}


