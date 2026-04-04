import { OpenQuestionIds } from "../../../domain/open-questions";
import { resolveAssumptions, type AssumptionOverrides } from "./resolve-assumptions";
import { getNumericResolved } from "./numeric-resolved";
import { traceStep } from "./trace";
import { pushWarning, warnMissingInput } from "./warnings";
import {
  emptyEngineResult,
  mergeEngineResult,
  type EngineResult,
  type EngineWarning,
} from "./types";

const ECON_SYMBOLS = [
  "theta",
  "MPC",
  "M_spotreba",
  "M_mista",
  "M_investice",
  "M_vlada",
  "r_retence",
  "p_stat",
  "p_kraj",
  "p_obec",
  "alpha_obec",
  "Rp_RUD",
  "v_RUD_per_cap",
  "T_ref_years",
] as const;

/** Kanonický zdroj ročního ΔHDP použitého v DRV-029 (θ×ΔHDP). */
export type DeltaHdpSourceKind =
  | "computed_profile"
  | "manual_mvp"
  | "manual_fallback";

/**
 * Zdroj roční proxy spotřeby domácností C (M6) — nesplést s automatickým ΔHDP:
 * - payroll: návaznost na M3 (N_celkem × M_region) pouze při `computed_profile`;
 * - delta_bridge: škála k použitému ΔHDP (ruční MVP / záloha) — explicitní fallback.
 */
export type HouseholdConsumptionSourceKind =
  | "payroll_proxy"
  | "delta_mvp_bridge";

/** Vstup z mapování — pipeline doplní N_celkem (M3) a OU (M4) pro audit. */
export interface EconomicM6BridgePending {
  useComputedDeltaHdp: boolean;
  capexTotalCzk: number;
  constructionRampYears: number;
  mRegionMonthlyCzk: number;
}

export interface EconomicM6BridgeResolved extends EconomicM6BridgePending {
  nCelkemFromM3: number;
  ouFromM4: number;
}

export interface EconomicInputs {
  /** Záložní / ruční ΔHDP (MVP) — vždy uloženo pro audit a fallback. */
  mvpManualDeltaHdpCzk: number;
  sStavbyM2: number;
  sPlochyM2: number;
  sStavbyKcPerM2: number;
  sPlochyKcPerM2: number;
  kMistni: number;
  kZakladni: number;
  /** DRV-032 — new jobs with migration to municipality */
  nNovaForPrud: number;
  assumptionOverrides?: AssumptionOverrides;
  /** Po `runFullCalculationPipeline`: M6 profil a návaznost M3/M4. */
  e6Bridge?: EconomicM6BridgeResolved;
}

export type EconomicPipelineInput = Omit<EconomicInputs, "e6Bridge"> & {
  e6Bridge?: EconomicM6BridgePending;
};

export interface EconomicDeltaHdpBreakdown {
  investmentImpulseAnnual: number;
  employmentIncomeProxyAnnual: number;
  governmentInducedFromInvestmentAnnual: number;
  /** Investiční fáze (profil): I_annual + indukované G z I — součást zjednodušeného DRV-028. */
  investmentPhaseAnnual: number;
  /** Provozní fáze (profil): mezdové proxy — OQ-05, součást zjednodušeného DRV-028. */
  operationalPhaseAnnual: number;
  constructionYears: number;
  capexTotalCzk: number;
  nCelkemUsed: number;
  mRegionMonthlyUsed: number;
}

export interface EconomicResult {
  deltaHdp: number;
  deltaHdpSource: DeltaHdpSourceKind;
  /** Pouze pro `computed_profile` / část fallback trace. */
  deltaHdpBreakdown?: EconomicDeltaHdpBreakdown;
  taxYield: number;
  publicBudgetStat: number;
  publicBudgetKraj: number;
  publicBudgetObec: number;
  /** Spotřeba domácností — buď z mezd (computed) nebo škála k ΔHDP (manual). */
  householdConsumptionAnnual: number;
  /** Jednoznačný zdroj výpočtu C — pro report / audit (odlišení od „automatického“ ΔHDP). */
  householdConsumptionSource: HouseholdConsumptionSourceKind;
  consumptionRetained: number;
  dznmAnnual: number;
  prudAnnual: number;
  years: number;
  cumulativeTaxYield: number;
  cumulativeHouseholdConsumption: number;
  cumulativeConsumptionRetained: number;
  cumulativeDznm: number;
  cumulativePrud: number;
}

/** DRV-029 */
export function computeTaxYield(
  theta: number,
  deltaHdp: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  return {
    value: theta * deltaHdp,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-030 */
export function computeConsumptionRetained(
  c: number,
  r: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  return {
    value: c * r,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-031 */
export function computeDznm(
  sStavby: number,
  sPlochy: number,
  rateStavby: number,
  ratePlochy: number,
  kMistni: number,
  kZakladni: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  const base = sStavby * rateStavby + sPlochy * ratePlochy;
  return {
    value: base * kMistni * kZakladni,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-032 */
export function computePrud(
  nNova: number,
  alpha: number,
  rp: number,
  vRud: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  return {
    value: nNova * alpha * rp * vRud,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/**
 * MVP škálování C k ručnímu ΔHDP — pouze pokud není zapnutý výpočet z mezd.
 * OPEN_QUESTION_BRIDGE (ne uzavřený C+I+G+(X−M) profil).
 */
export function computeHouseholdConsumptionMvpBridge(
  deltaHdp: number,
  mpc: number,
  mSpotreba: number,
): { value: number; classification: "OPEN_QUESTION_BRIDGE" } {
  return {
    value: deltaHdp * mpc * mSpotreba,
    classification: "OPEN_QUESTION_BRIDGE",
  };
}

/**
 * Spotřeba z hrubého měsíčního mediánu regionu × N_celkem — proxy, ne přímo HDP.
 * Viz OQ-05 (nepřímé / indukované efekty mimo uzavřený vzorec).
 */
export function computeHouseholdConsumptionFromPayrollProxy(
  nCelkem: number,
  mRegionMonthly: number,
  mpc: number,
  mSpotreba: number,
): { value: number; classification: "OPEN_QUESTION_BRIDGE" } {
  const payrollAnnual = nCelkem * mRegionMonthly * 12;
  return {
    value: payrollAnnual * mpc * mSpotreba,
    classification: "OPEN_QUESTION_BRIDGE",
  };
}

function tryComputeDeltaHdpProfile(
  bridge: EconomicM6BridgeResolved,
  mInvestice: number,
  mMista: number,
  mVlada: number,
  warnings: EngineWarning[],
  trace: EngineResult<EconomicResult>["trace"],
  oq: string[],
): { delta: number; breakdown: EconomicDeltaHdpBreakdown } | null {
  const years = Math.max(1, Math.floor(bridge.constructionRampYears));
  const capex = bridge.capexTotalCzk;
  if (!Number.isFinite(capex) || capex < 0) {
    pushWarning(
      warnings,
      "ECON_M6_CAPEX_INVALID",
      "CAPEX není platný — profil ΔHDP nelze spočítat.",
      "capexTotalCzk",
    );
    return null;
  }

  const I_annual = (capex / years) * mInvestice;

  const nC = bridge.nCelkemFromM3;
  const mReg = bridge.mRegionMonthlyCzk;
  let employmentIncomeProxy = 0;
  if (Number.isFinite(nC) && nC > 0 && Number.isFinite(mReg) && mReg > 0) {
    employmentIncomeProxy = nC * mReg * 12 * mMista;
    oq.push(OpenQuestionIds.OQ_05_INDIRECT_INDUCED_PMJ);
  } else {
    pushWarning(
      warnings,
      "ECON_M6_EMP_PROXY_SKIPPED",
      "Výpočet mezdového proxy k ΔHDP přeskočen (N_celkem nebo M_region nejsou kladné platné číslo).",
      "mRegion",
    );
  }

  const gInduced = I_annual * Math.max(0, mVlada - 1);
  const investmentPhaseAnnual = I_annual + gInduced;
  const operationalPhaseAnnual = employmentIncomeProxy;

  trace.push(
    traceStep(
      "M6-I-ANNUAL",
      "CONFIGURABLE_ASSUMPTION",
      "INP-604",
      "Investiční impuls (ročně): CAPEX / T_ramp × M_investice — vstup do profilu ΔHDP (§ 2.4)",
      {
        capexTotalCzk: capex,
        constructionYears: years,
        M_investice: mInvestice,
        I_annual,
      },
    ),
  );

  trace.push(
    traceStep(
      "M6-EMP-PROXY",
      "OPEN_QUESTION_BRIDGE",
      undefined,
      "Roční proxy toku spojeného s PMJ: N_celkem × M_region × 12 × M_mista — OQ-05, není uzavřený HDP výstup z mezd",
      {
        nCelkem: nC,
        mRegionMonthly: mReg,
        M_mista: mMista,
        employmentIncomeProxyAnnual: employmentIncomeProxy,
      },
    ),
  );

  trace.push(
    traceStep(
      "M6-G-INDUCED",
      "OPEN_QUESTION_BRIDGE",
      undefined,
      "Indukované veřejné výdaje z investičního impulsu: I_annual × max(0, M_vlada − 1) — ilustrativní proxy (§ 2.4 multiplikátory)",
      { M_vlada: mVlada, governmentInducedAnnual: gInduced },
    ),
  );

  const delta = I_annual + employmentIncomeProxy + gInduced;
  if (!Number.isFinite(delta)) {
    return null;
  }

  trace.push(
    traceStep(
      "M6-PHASE-INVEST",
      "OPEN_QUESTION_BRIDGE",
      undefined,
      "Investiční fáze (roční, profil M6): I_annual + indukované G z I — G je ilustrativní proxy (M6-G-INDUCED), ne přesná fiskální identita",
      investmentPhaseAnnual,
    ),
  );
  trace.push(
    traceStep(
      "M6-PHASE-OPER",
      "OPEN_QUESTION_BRIDGE",
      undefined,
      "Provozní fáze (roční, profil M6): mezdové proxy N_celkem × M_region × 12 × M_mista — OQ-05",
      operationalPhaseAnnual,
    ),
  );

  trace.push(
    traceStep(
      "M6-DELTA-PROFILE",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-028",
      "ΔHDP (roční referenční profil) = součet investičního impulsu, mezdového proxy a indukovaného G — zjednodušený rámec C+I+G bez (X−M)",
      delta,
    ),
  );

  return {
    delta,
    breakdown: {
      investmentImpulseAnnual: I_annual,
      employmentIncomeProxyAnnual: employmentIncomeProxy,
      governmentInducedFromInvestmentAnnual: gInduced,
      investmentPhaseAnnual,
      operationalPhaseAnnual,
      constructionYears: years,
      capexTotalCzk: capex,
      nCelkemUsed: nC,
      mRegionMonthlyUsed: mReg,
    },
  };
}

export function runEconomicBenefitsMvpCalculation(
  input: EconomicInputs,
): EngineResult<EconomicResult> {
  const warnings: EngineWarning[] = [];
  const oq: string[] = [];
  const trace: EngineResult<EconomicResult>["trace"] = [];

  const { resolved, assumptionsUsed } = resolveAssumptions(
    input.assumptionOverrides,
    [...ECON_SYMBOLS],
  );

  const theta = getNumericResolved(resolved, "theta", "theta", warnings);
  const mpc = getNumericResolved(resolved, "MPC", "MPC", warnings);
  const mSpotreba = getNumericResolved(
    resolved,
    "M_spotreba",
    "M_spotreba",
    warnings,
  );
  const mMista = getNumericResolved(
    resolved,
    "M_mista",
    "M_mista",
    warnings,
  );
  const mInvestice = getNumericResolved(
    resolved,
    "M_investice",
    "M_investice",
    warnings,
  );
  const mVlada = getNumericResolved(
    resolved,
    "M_vlada",
    "M_vlada",
    warnings,
  );
  const rRet = getNumericResolved(
    resolved,
    "r_retence",
    "r_retence",
    warnings,
  );
  const pStat = getNumericResolved(resolved, "p_stat", "p_stat", warnings);
  const pKraj = getNumericResolved(resolved, "p_kraj", "p_kraj", warnings);
  const pObec = getNumericResolved(resolved, "p_obec", "p_obec", warnings);
  const alphaObec = getNumericResolved(
    resolved,
    "alpha_obec",
    "alpha_obec",
    warnings,
  );
  const rpRud = getNumericResolved(resolved, "Rp_RUD", "Rp_RUD", warnings);
  const vRud = getNumericResolved(
    resolved,
    "v_RUD_per_cap",
    "v_RUD_per_cap",
    warnings,
  );
  const years = Math.max(
    1,
    Math.floor(
      getNumericResolved(
        resolved,
        "T_ref_years",
        "T_ref_years",
        warnings,
      ),
    ),
  );

  const manualDelta = input.mvpManualDeltaHdpCzk;
  if (!Number.isFinite(manualDelta)) {
    warnMissingInput(warnings, "mvpManualDeltaHdpCzk", "neplatná hodnota");
  }

  oq.push(OpenQuestionIds.OQ_10_THETA_RUD_LEGISLATION);
  oq.push(OpenQuestionIds.OQ_11_NPV_DISCOUNT);
  trace.push(
    traceStep(
      "OQ-10",
      "OPEN_QUESTION_BRIDGE",
      "OQ-10",
      "θ a RUD — legislativní přesnost v čase (viz system spec).",
      { theta, v_RUD_per_cap: vRud },
    ),
  );
  trace.push(
    traceStep(
      "OQ-11",
      "OPEN_QUESTION_BRIDGE",
      "OQ-11",
      "Kumulace bez diskontu — NPV není uzavřen ve vstupní tabulce INP.",
      { years },
    ),
  );

  let deltaHdp: number;
  let deltaHdpSource: DeltaHdpSourceKind;
  let deltaHdpBreakdown: EconomicDeltaHdpBreakdown | undefined;

  const b = input.e6Bridge;
  if (b?.useComputedDeltaHdp) {
    trace.push(
      traceStep(
        "M6-SOURCE-MIX",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "Zdroje M6: zapnutý výpočet profilu ΔHDP z CAPEX, M3 (N_celkem) a multiplikátorů; ruční ΔHDP jako záloha",
        {
          useComputedDeltaHdp: true,
          mvpManualDeltaHdpCzk: manualDelta,
          nCelkemFromM3: b.nCelkemFromM3,
          ouFromM4_auditOnly: b.ouFromM4,
          capexTotalCzk: b.capexTotalCzk,
          constructionRampYears: b.constructionRampYears,
          mRegionMonthlyCzk: b.mRegionMonthlyCzk,
        },
      ),
    );

    const prof = tryComputeDeltaHdpProfile(
      b,
      mInvestice,
      mMista,
      mVlada,
      warnings,
      trace,
      oq,
    );

    if (
      prof &&
      Number.isFinite(prof.delta) &&
      prof.delta > 0
    ) {
      deltaHdp = prof.delta;
      deltaHdpSource = "computed_profile";
      deltaHdpBreakdown = prof.breakdown;
    } else {
      deltaHdp = Number.isFinite(manualDelta) ? manualDelta : 0;
      deltaHdpSource = "manual_fallback";
      deltaHdpBreakdown = prof?.breakdown;
      pushWarning(
        warnings,
        "ECON_M6_DELTA_FALLBACK_MANUAL",
        "Profil ΔHDP nebyl použit (nulový nebo neplatný) — použit ruční odhad ΔHDP z průvodce.",
        "mvpManualDeltaHdpCzk",
      );
      trace.push(
        traceStep(
          "M6-DELTA-FALLBACK",
          "OPEN_QUESTION_BRIDGE",
          undefined,
          "Explicitní fallback na ruční mvpManualDeltaHdpCzk — nepředstavovat jako automatický výsledek profilu M6; viz varování ECON_M6_DELTA_FALLBACK_MANUAL",
          {
            manualDeltaHdpCzk: manualDelta,
            profileBreakdownPartial: Boolean(prof?.breakdown),
          },
        ),
      );
    }
  } else {
    deltaHdp = Number.isFinite(manualDelta) ? manualDelta : 0;
    deltaHdpSource = "manual_mvp";
    trace.push(
      traceStep(
        "M6-DELTA-MANUAL",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "ΔHDP pouze z ručního pole průvodce (MVP bridge) — zapněte „vypočítat ΔHDP z profilu“ v P1 pro M6",
        { mvpManualDeltaHdpCzk: manualDelta },
      ),
    );
  }

  const ty = computeTaxYield(theta, deltaHdp);
  trace.push(
    traceStep(
      "DRV-029",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-029",
      "tax_yield = theta * delta_HDP",
      ty.value,
    ),
  );

  const publicBudgetStat = ty.value * pStat;
  const publicBudgetKraj = ty.value * pKraj;
  const publicBudgetObec = ty.value * pObec;

  trace.push(
    traceStep(
      "M6-FISCAL-BUDGET-SPLIT",
      "CONFIGURABLE_ASSUMPTION",
      "INP-608",
      "Alokace výnosu daní (θ×ΔHDP) do rozpočtů: × p_stat, × p_kraj, × p_obec",
      {
        taxYieldAnnual: ty.value,
        p_stat: pStat,
        p_kraj: pKraj,
        p_obec: pObec,
        publicBudgetStat,
        publicBudgetKraj,
        publicBudgetObec,
      },
    ),
  );

  let hhc: { value: number; classification: string };
  let householdConsumptionSource: HouseholdConsumptionSourceKind;
  if (deltaHdpSource === "computed_profile" && b) {
    const pay = computeHouseholdConsumptionFromPayrollProxy(
      b.nCelkemFromM3,
      b.mRegionMonthlyCzk,
      mpc,
      mSpotreba,
    );
    hhc = pay;
    householdConsumptionSource = "payroll_proxy";
    trace.push(
      traceStep(
        "M6-C-PAYROLL",
        pay.classification,
        undefined,
        "C (proxy) = (N_celkem × M_region × 12) × MPC × M_spotreba — návaznost na M3, ne škála k celkovému ΔHDP",
        pay.value,
      ),
    );
  } else {
    hhc = computeHouseholdConsumptionMvpBridge(deltaHdp, mpc, mSpotreba);
    householdConsumptionSource = "delta_mvp_bridge";
    const hhcDesc =
      deltaHdpSource === "manual_fallback"
        ? "C bridge = ΔHDP × MPC × M_spotreba — FALLBACK: škála k ručnímu/záložnímu ΔHDP; není payroll z M3"
        : "C bridge = ΔHDP × MPC × M_spotreba — škála k ručnímu ΔHDP (režim bez profilu M6)";
    trace.push(
      traceStep(
        "HHC-MVP",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        hhcDesc,
        { value: hhc.value, deltaHdpSource },
      ),
    );
  }

  trace.push(
    traceStep(
      "M6-HHC-SOURCE",
      "OPEN_QUESTION_BRIDGE",
      undefined,
      "Kanonický zdroj proxy spotřeby domácností pro report a export",
      { householdConsumptionSource, deltaHdpSource },
    ),
  );

  const cr = computeConsumptionRetained(hhc.value, rRet);
  trace.push(
    traceStep(
      "DRV-030",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-030",
      "C_r = C * r",
      cr.value,
    ),
  );

  const dz = computeDznm(
    input.sStavbyM2,
    input.sPlochyM2,
    input.sStavbyKcPerM2,
    input.sPlochyKcPerM2,
    input.kMistni,
    input.kZakladni,
  );
  trace.push(
    traceStep(
      "DRV-031",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-031",
      "DzNM",
      dz.value,
    ),
  );

  const pr = computePrud(
    input.nNovaForPrud,
    alphaObec,
    rpRud,
    vRud,
  );
  trace.push(
    traceStep(
      "DRV-032",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-032",
      "PRUD",
      pr.value,
    ),
  );

  const cumulativeTaxYield = ty.value * years;
  const cumulativeHouseholdConsumption = hhc.value * years;
  const cumulativeConsumptionRetained = cr.value * years;
  const cumulativeDznm = dz.value * years;
  const cumulativePrud = pr.value * years;

  const result: EconomicResult = {
    deltaHdp,
    deltaHdpSource,
    deltaHdpBreakdown,
    taxYield: ty.value,
    publicBudgetStat,
    publicBudgetKraj,
    publicBudgetObec,
    householdConsumptionAnnual: hhc.value,
    householdConsumptionSource,
    consumptionRetained: cr.value,
    dznmAnnual: dz.value,
    prudAnnual: pr.value,
    years,
    cumulativeTaxYield,
    cumulativeHouseholdConsumption,
    cumulativeConsumptionRetained,
    cumulativeDznm,
    cumulativePrud,
  };

  return mergeEngineResult(emptyEngineResult(result), {
    inputsUsed: { ...input },
    assumptionsUsed,
    intermediateValues: {
      theta,
      MPC: mpc,
      M_spotreba: mSpotreba,
      M_mista: mMista,
      M_investice: mInvestice,
      M_vlada: mVlada,
      r_retence: rRet,
      p_stat: pStat,
      p_kraj: pKraj,
      p_obec: pObec,
      alpha_obec: alphaObec,
      Rp_RUD: rpRud,
      v_RUD_per_cap: vRud,
      T_ref_years: years,
      deltaHdpSource,
      householdConsumptionSource,
      m6InvestmentPhaseAnnual: deltaHdpBreakdown?.investmentPhaseAnnual ?? null,
      m6OperationalPhaseAnnual: deltaHdpBreakdown?.operationalPhaseAnnual ?? null,
    },
    warnings,
    openQuestionsTouched: [...new Set(oq)],
    trace,
  });
}
