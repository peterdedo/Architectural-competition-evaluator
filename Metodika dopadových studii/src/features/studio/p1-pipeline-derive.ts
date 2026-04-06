import type { LayerM0Project, LayerM2AsIsBaseline } from "@/domain/methodology/p1-layers";
import type { P1PipelineBridgeFlags } from "@/domain/methodology/p1-pipeline-bridge";
import type { EmploymentP1BridgeInput } from "@/lib/mhdsi/calculations/employment";
import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import type {
  ReportEngineContractBaselineM3M4,
  ReportEngineContractBaselineM5,
  ReportEngineContractBaselineM6,
  ReportP1M3M4Bridge,
  ReportP1M3M4Canonical,
  ReportP1M5Bridge,
  ReportP1M5Canonical,
  ReportP1M6Bridge,
  ReportP1M6Canonical,
} from "@/features/report/types";
import type { WizardState } from "./wizard-types";

/**
 * Jednotné odvození P1 → vstupy M3/M4 (kanonický zdroj pro mapování i report).
 * Nepřidává nové výpočty oproti rozptýleným helperům — jen je slučuje.
 */
export interface P1LayerForPipeline {
  nInvEffective: number;
  fteFactor: number;
  uM2: number | null;
  erM2: number | null;
  empRamp: number;
  migAdj: number;
  nKmenEff: number;
  vEffective: number;
  m2VacantUsed: boolean;
  housingRamp: number;
  schedule: {
    constructionStart: string;
    fullOperationPlanned: string;
    rampYearsGlobal: number;
  };
  /** M0 PMJ — krátký text do auditu (směny / kapacita). */
  pmjShiftSummary?: string;
  m2Population: number;
  m2AvgRentCzk: number;
  m2VacantBaseline: number;
}

export function baselineEmploymentRateForAudit(
  m2: LayerM2AsIsBaseline,
): number | null {
  const v = m2.laborMarket.employmentRate.value;
  if (!Number.isFinite(v) || v <= 0 || v > 1) return null;
  return v;
}

export function buildP1LayerForPipeline(state: WizardState): P1LayerForPipeline {
  const { nInvEffective, fteFactor } = effectiveNInvForEmployment(
    state.nInv,
    state.layerM0,
    state.p1PipelineBridge,
  );
  const uM2 = baselineUnemploymentRateForEngine(state.layerM2, state.p1PipelineBridge);
  const erM2 = baselineEmploymentRateForAudit(state.layerM2);
  const empRamp = effectiveEmploymentRampYears(state);
  const migAdj = nKmenMigrationAdjustment(state.layerM2, state.p1PipelineBridge);
  const nKmenEff = state.nKmen + migAdj;
  const { vEffective, m2VacantUsed } = effectiveVacantForHousing(
    state.vTVacant,
    state.layerM2,
    state.p1PipelineBridge,
  );
  const housingRamp = effectiveHousingRampYears(state);
  const shifts = state.layerM0.pmjPortfolio.shiftsDescription.trim();
  return {
    nInvEffective,
    fteFactor,
    uM2,
    erM2,
    empRamp,
    migAdj,
    nKmenEff,
    vEffective,
    m2VacantUsed,
    housingRamp,
    schedule: {
      constructionStart: state.layerM0.schedule.constructionStart,
      fullOperationPlanned: state.layerM0.schedule.fullOperationPlanned,
      rampYearsGlobal: state.rampYearsGlobal,
    },
    pmjShiftSummary: shifts.length > 0 ? shifts : undefined,
    m2Population: state.layerM2.demographics.population.value,
    m2AvgRentCzk: state.layerM2.housing.avgRentCzk.value,
    m2VacantBaseline: state.layerM2.housing.vacantUnits.value,
  };
}

export function canonicalP1SourcesForReport(state: WizardState): ReportP1M3M4Canonical {
  const f = state.p1PipelineBridge;
  const u = baselineUnemploymentRateForEngine(state.layerM2, f);
  return {
    employment: {
      nInvEffective: f.applyM0FteToEmployment ? "m0_fte_scaled" : "mvp",
      utilRzpsModifier: !f.applyM2UnemploymentToUtilRzps
        ? "none"
        : u != null
          ? "m2_unemployment_heuristic"
          : "m2_unemployment_intended_unavailable",
      employmentRamp: f.alignEmploymentRampToProjectHorizon
        ? "capped_by_project_horizon"
        : "wizard",
    },
    housing: {
      vacantSupply: f.applyM2VacantToHousingSupply ? "mvp_or_m2_max" : "mvp_only",
      nKmen: f.applyM2MigrationToKmen ? "mvp_plus_m2_migration_proxy" : "mvp",
      housingRamp: f.alignHousingRampToProjectHorizon
        ? "capped_by_project_horizon"
        : "wizard",
      m3toM4: f.linkHousingToEmploymentM3 ? "m3_drv_outputs" : "mvp_fields",
    },
  };
}

/** FTE z M0 — faktor pro N_inv (0 nebo >2 ignorováno → 1). */
export function ftePmJFactorFromM0(m0: LayerM0Project): number {
  const f = m0.pmjPortfolio.fteEquivalent;
  if (!Number.isFinite(f) || f <= 0 || f > 2) return 1;
  return f;
}

export function effectiveNInvForEmployment(
  nInvMvp: number,
  m0: LayerM0Project,
  flags: P1PipelineBridgeFlags,
): { nInvEffective: number; fteFactor: number } {
  const fteFactor = flags.applyM0FteToEmployment
    ? ftePmJFactorFromM0(m0)
    : 1;
  return { nInvEffective: nInvMvp * fteFactor, fteFactor };
}

export function effectiveEmploymentRampYears(
  state: Pick<WizardState, "employmentRampYears" | "rampYearsGlobal" | "p1PipelineBridge">,
): number {
  const { p1PipelineBridge, employmentRampYears, rampYearsGlobal } = state;
  const base = Math.max(1, Math.floor(employmentRampYears));
  if (!p1PipelineBridge.alignEmploymentRampToProjectHorizon) return base;
  return Math.max(1, Math.min(base, Math.max(1, Math.floor(rampYearsGlobal))));
}

export function effectiveHousingRampYears(
  state: Pick<WizardState, "housingRampYears" | "rampYearsGlobal" | "p1PipelineBridge">,
): number {
  const { p1PipelineBridge, housingRampYears, rampYearsGlobal } = state;
  const base = Math.max(1, Math.floor(housingRampYears));
  if (!p1PipelineBridge.alignHousingRampToProjectHorizon) return base;
  return Math.max(1, Math.min(base, Math.max(1, Math.floor(rampYearsGlobal))));
}

/** M2 nezaměstnanost (0–1) — pouze pokud je vyplněná baseline. */
export function baselineUnemploymentRateForEngine(
  m2: LayerM2AsIsBaseline,
  flags: P1PipelineBridgeFlags,
): number | null {
  if (!flags.applyM2UnemploymentToUtilRzps) return null;
  const v = m2.laborMarket.unemploymentRate.value;
  if (!Number.isFinite(v) || v <= 0 || v > 0.5) return null;
  return v;
}

/**
 * Měkký multiplikátor util_RZPS: vyšší nezaměstnanost → mírně vyšší využitelnost lokální
 * kalkulace (více rezervy na trhu). OPEN_QUESTION_BRIDGE — transparentní heuristika.
 */
export function utilRzpsMultiplierFromUnemployment(u: number): number {
  const t = Math.min(Math.max(u / 0.12, 0), 1);
  return Math.min(1.12, Math.max(0.82, 0.88 + 0.28 * t));
}

export function effectiveVacantForHousing(
  vTVacantMvp: number,
  m2: LayerM2AsIsBaseline,
  flags: P1PipelineBridgeFlags,
): { vEffective: number; m2VacantUsed: boolean } {
  const m2v = m2.housing.vacantUnits.value;
  if (!flags.applyM2VacantToHousingSupply || !Number.isFinite(m2v) || m2v <= 0) {
    return { vEffective: vTVacantMvp, m2VacantUsed: false };
  }
  return {
    vEffective: Math.max(vTVacantMvp, m2v),
    m2VacantUsed: true,
  };
}

/** Proxy: část migračního salda → osoby ovlivňující kmen (malá korekce). */
export function nKmenMigrationAdjustment(
  m2: LayerM2AsIsBaseline,
  flags: P1PipelineBridgeFlags,
): number {
  if (!flags.applyM2MigrationToKmen) return 0;
  const net = m2.migration.netPerYear.value;
  if (!Number.isFinite(net)) return 0;
  const adj = net * 0.04;
  return Math.max(-50, Math.min(50, adj));
}

/**
 * Přečte z výsledku baseline pipeline hodnoty, které engine skutečně použil u M3/M4
 * (žádný druhý výpočet — jen čtení inputsUsed / intermediateValues / výsledků).
 */
export function buildEngineContractBaselineFromPipeline(
  r: FullCalculationPipelineResult,
): ReportEngineContractBaselineM3M4 {
  const emp = r.employment;
  const hou = r.housing;
  const p1e = emp.inputsUsed.p1Bridge as EmploymentP1BridgeInput | undefined;
  const util = emp.intermediateValues.util_RZPS;
  const nInv = emp.inputsUsed.nInv;
  return {
    nInvEffective: typeof nInv === "number" ? nInv : Number(nInv),
    fteFactorApplied: p1e?.ftePmJFactor ?? 1,
    utilRzpsEffective: typeof util === "number" ? util : Number(util),
    employmentRampYears: emp.result.annualRamp.length,
    housingRampYears: hou.result.annualRamp.length,
    situation: hou.inputsUsed.situation as "A" | "B",
    nKmenEffective: Number(hou.inputsUsed.nKmen),
    nAgenturaUsed: Number(hou.inputsUsed.nAgentura),
    nPendlerUsed: Number(hou.inputsUsed.nPendler),
    vVacantEffective: Number(hou.inputsUsed.vTVacant),
    linkM3toM4: Boolean(hou.inputsUsed.linkToEmploymentM3),
    nCelkemM3: emp.result.nCelkem,
  };
}

export function summarizeP1BridgeForReport(
  state: WizardState,
  baselinePipeline?: FullCalculationPipelineResult | null,
): ReportP1M3M4Bridge {
  const layer = buildP1LayerForPipeline(state);
  const u = layer.uM2;
  const mig = layer.migAdj;
  const bridge: ReportP1M3M4Bridge = {
    flags: state.p1PipelineBridge,
    canonical: canonicalP1SourcesForReport(state),
    m0Schedule: layer.schedule,
    m2LaborMarketAudit: {
      unemploymentRate: u,
      employmentRate: layer.erM2,
    },
    m2HousingBaselineAudit: {
      population: layer.m2Population,
      vacantUnits: layer.m2VacantBaseline,
      avgRentCzk: layer.m2AvgRentCzk,
    },
    employment: {
      nInvMvp: state.nInv,
      nInvEffective: layer.nInvEffective,
      fteFactor: layer.fteFactor,
      rampYearsEffective: layer.empRamp,
      baselineUnemploymentRate: u,
    },
    housing: {
      vTVacantMvp: state.vTVacant,
      vVacantEffective: layer.vEffective,
      m2VacantUsed: layer.m2VacantUsed,
      rampYearsEffective: layer.housingRamp,
      nKmenMvp: state.nKmen,
      nKmenEffective: layer.nKmenEff,
      migrationAdjustment: mig,
      linkHousingToEmploymentM3: state.p1PipelineBridge.linkHousingToEmploymentM3,
      m3EmploymentMvp: state.p1PipelineBridge.linkHousingToEmploymentM3
        ? { nAgentura: state.nAgentura, nPendler: state.nPendler }
        : undefined,
    },
  };
  if (baselinePipeline) {
    bridge.engineContractBaseline = buildEngineContractBaselineFromPipeline(baselinePipeline);
  }
  return bridge;
}

export function canonicalP1M5SourcesForReport(state: WizardState): ReportP1M5Canonical {
  const f = state.p1PipelineBridge;
  return {
    ou: f.linkCivicOuToM4Ou ? "m4_output" : "wizard_manual",
    nCelkemForSafety: f.linkCivicSafetyToM3NCelkem ? "m3_output" : "wizard_manual",
  };
}

export function buildEngineContractM5FromPipeline(
  r: FullCalculationPipelineResult,
): ReportEngineContractBaselineM5 {
  const c = r.civic;
  return {
    ouUsed: Number(c.inputsUsed.ou),
    nCelkemM3Used: Number(c.inputsUsed.nCelkemM3),
  };
}

export function summarizeP1M5BridgeForReport(
  state: WizardState,
  baselinePipeline?: FullCalculationPipelineResult | null,
): ReportP1M5Bridge {
  const f = state.p1PipelineBridge;
  const bridge: ReportP1M5Bridge = {
    flags: {
      linkCivicOuToM4Ou: f.linkCivicOuToM4Ou,
      linkCivicSafetyToM3NCelkem: f.linkCivicSafetyToM3NCelkem,
    },
    canonical: canonicalP1M5SourcesForReport(state),
    ouWizardMvp: state.ou,
    nCelkemWizardMvp: state.nCelkemM3,
  };
  if (baselinePipeline) {
    bridge.engineContractBaseline = buildEngineContractM5FromPipeline(baselinePipeline);
  }
  return bridge;
}

export function buildEngineContractM6FromPipeline(
  r: FullCalculationPipelineResult,
): ReportEngineContractBaselineM6 {
  const e = r.economic.result;
  return {
    deltaHdpAnnualUsed: e.deltaHdp,
    deltaHdpSource: e.deltaHdpSource,
    breakdown: e.deltaHdpBreakdown ?? null,
    householdConsumptionAnnual: e.householdConsumptionAnnual,
    householdConsumptionSource: e.householdConsumptionSource,
    taxYieldAnnual: e.taxYield,
    dznmAnnual: e.dznmAnnual,
    consumptionRetainedAnnual: e.consumptionRetained,
    publicBudgetStat: e.publicBudgetStat,
    publicBudgetKraj: e.publicBudgetKraj,
    publicBudgetObec: e.publicBudgetObec,
  };
}

export function summarizeP1M6BridgeForReport(
  state: WizardState,
  baselinePipeline?: FullCalculationPipelineResult | null,
): ReportP1M6Bridge {
  const f = state.p1PipelineBridge;
  const canonical: ReportP1M6Canonical = baselinePipeline
    ? { deltaHdp: baselinePipeline.economic.result.deltaHdpSource }
    : {
        deltaHdp: f.useComputedM6DeltaHdp
          ? "computed_profile"
          : "manual_mvp",
      };
  const bridge: ReportP1M6Bridge = {
    flags: { useComputedM6DeltaHdp: f.useComputedM6DeltaHdp },
    canonical,
    manualDeltaHdpMvpCzk: state.mvpManualDeltaHdpCzk,
  };
  if (baselinePipeline) {
    bridge.engineContractBaseline = buildEngineContractM6FromPipeline(baselinePipeline);
  }
  return bridge;
}
