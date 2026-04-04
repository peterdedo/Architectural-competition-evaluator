import { ImplicitNumericFallbacks } from "./implicit-fallbacks";
import { getNumeric, resolveAssumptions, type AssumptionOverrides } from "./resolve-assumptions";
import { traceStep } from "./trace";
import { pushWarning, warnMissingInput } from "./warnings";
import type { EngineWarning } from "./types";
import {
  emptyEngineResult,
  mergeEngineResult,
  type EngineResult,
} from "./types";

/**
 * Metodická hranice rizika: podíl N_agentura k N_celkem (po DRV-014/015).
 * Při překročení (> prah) engine emituje varování AGENCY_SHARE_RISK — neměnit bez metodiky.
 */
export const AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD = 0.05;

export const WARNING_CODE_AGENCY_SHARE_RISK = "AGENCY_SHARE_RISK" as const;

/** Symbols pulled from assumptions registry for M3 */
const EMPLOYMENT_SYMBOLS = [
  "k_inv",
  "gamma",
  "delta",
  "util_RZPS",
  "alpha_elast",
  "M_i",
  "p_pendler",
] as const;

/** Volitelný P1 most (M0/M1/M2) — audit a úprava util_RZPS; N_inv je již efektivní z mapování. */
export interface EmploymentP1BridgeInput {
  /** Původní N_inv z MVP průvodce před FTE. */
  nInvMvp: number;
  /** FTE faktor z M0 (1 = bez úpravy). */
  ftePmJFactor: number;
  /** M2 míra nezaměstnanosti (0–1), nebo null. */
  baselineUnemploymentRate: number | null;
  /** M2 míra zaměstnanosti (0–1) — audit, nepřepisuje DRV bez samostatné metodiky. */
  baselineEmploymentRate?: number | null;
  applyM2UnemploymentToUtilRzps: boolean;
  /** M0 harmonogram + odvozená rampa zaměstnanosti (audit). */
  m0Schedule?: {
    constructionStart: string;
    fullOperationPlanned: string;
    rampYearsGlobal: number;
    employmentRampYearsEffective: number;
  };
  /** M0 PMJ — směny / provoz (text). */
  pmjShiftSummary?: string;
  regionLabel?: string;
  municipalityLabel?: string;
  /** M1: režim isochron (bez API) — audit, ne vstup do DRV. */
  isochronesMode?: "manual_same_as_diad" | "manual_custom" | "not_computed";
  /** M1: ruční poznámka k dojížďce / zachycení území (zkráceno ve stopě). */
  isochronesManualNote?: string;
}

export interface EmploymentInputs {
  nInv: number;
  /** INP-301 — optional if in overrides */
  kInv?: number;
  aUp: number;
  bUp: number;
  cUp: number;
  mNew: number;
  mRegion: number;
  npVm: number;
  npTotal: number;
  zI: number;
  mI?: number;
  nSub: number;
  assumptionOverrides?: AssumptionOverrides;
  /** Years to spread annual totals (≥1). Last year reaches full scale. */
  rampYears?: number;
  /** P1 → M3 audit a baseline úpravy. */
  p1Bridge?: EmploymentP1BridgeInput;
}

export interface EmploymentResult {
  nCelkem: number;
  rzpsRaw: number;
  rzps: number;
  sM: number;
  sT: number;
  zZtrata: number;
  nMezera: number;
  nPendlerCalc: number;
  nAgenturaCalc: number;
  /** Per-year factors summing to 1 across rampYears */
  annualRamp: number[];
  /** Same keys, scaled workforce demand (N_celkem) */
  annualWorkforceDemand: number[];
}

/** DRV-007 */
export function computeWorkforceDemand(
  nInv: number,
  kInv: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  return {
    value: (1 - kInv) * nInv,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-008 */
export function computeRzpsRaw(
  a: number,
  b: number,
  c: number,
  gamma: number,
  delta: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  return {
    value: a + gamma * b + delta * c,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-009 */
export function computeRzpsAfterUtil(
  rzpsRaw: number,
  utilRzps: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  return {
    value: rzpsRaw * utilRzps,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-010 */
export function computeSubstitutionBase(
  alphaElast: number,
  mNew: number,
  mRegion: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY"; warning?: string } {
  if (mRegion <= 0) {
    return {
      value: 0,
      classification: "EXPLICIT_IN_METHODOLOGY",
      warning: "M_region<=0: S_m set to 0 (division undefined in PDF formula).",
    };
  }
  return {
    value: alphaElast * ((mNew - mRegion) / mRegion),
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-011 */
export function computeSubstitutionCompetition(
  sM: number,
  npVm: number,
  npTotal: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY"; warning?: string } {
  if (npTotal <= 0) {
    return {
      value: 0,
      classification: "EXPLICIT_IN_METHODOLOGY",
      warning: "NP_total<=0: S_t set to 0.",
    };
  }
  return {
    value: (1 - npVm / npTotal) * sM,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-012 */
export function computeZztrata(
  zI: number,
  mI: number,
  sT: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  return {
    value: zI * mI * sT,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-013 */
export function computeLaborGap(
  nCelkem: number,
  rzps: number,
  nSub: number,
): { value: number; classification: "EXPLICIT_IN_METHODOLOGY" } {
  return {
    value: nCelkem - rzps - nSub,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** DRV-014, DRV-015 */
export function splitLaborGap(
  nCelkem: number,
  nMezera: number,
  pPendler: number,
): {
  nPendlerCalc: number;
  nAgenturaCalc: number;
  classification: "EXPLICIT_IN_METHODOLOGY";
} {
  const nPendlerCalc = pPendler * nCelkem;
  const nAgenturaCalc = nMezera - nPendlerCalc;
  return {
    nPendlerCalc,
    nAgenturaCalc,
    classification: "EXPLICIT_IN_METHODOLOGY",
  };
}

/** Heuristika pro M2 nezaměstnanost → multiplikátor util_RZPS (OPEN_QUESTION_BRIDGE). */
export function utilRzpsMultiplierFromUnemployment(u: number): number {
  const t = Math.min(Math.max(u / 0.12, 0), 1);
  return Math.min(1.12, Math.max(0.82, 0.88 + 0.28 * t));
}

export function buildLinearAnnualRamp(rampYears: number): number[] {
  const n = Math.max(1, Math.floor(rampYears));
  if (n === 1) return [1];
  const weights: number[] = [];
  let sum = 0;
  for (let y = 1; y <= n; y++) {
    const w = y;
    weights.push(w);
    sum += w;
  }
  return weights.map((w) => w / sum);
}

/**
 * Full M3 pipeline — explicit DRV-007 … DRV-015 + optional linear ramp (OPEN_QUESTION_BRIDGE for profile).
 */
export function runEmploymentCalculation(
  input: EmploymentInputs,
): EngineResult<EmploymentResult> {
  const warnings: EngineWarning[] = [];
  const trace: EngineResult<EmploymentResult>["trace"] = [];

  const { resolved, assumptionsUsed } = resolveAssumptions(
    input.assumptionOverrides,
    [...EMPLOYMENT_SYMBOLS],
  );

  const p1 = input.p1Bridge;
  if (p1?.m0Schedule) {
    const s = p1.m0Schedule;
    const hasText =
      [s.constructionStart, s.fullOperationPlanned].some(
        (x) => x && String(x).trim().length > 0,
      ) || s.rampYearsGlobal > 0;
    if (hasText) {
      trace.push(
        traceStep(
          "P1-M0-SCHED",
          "OPEN_QUESTION_BRIDGE",
          undefined,
          "M0 harmonogram / horizont vs. náběh zaměstnanosti (audit)",
          {
            constructionStart: s.constructionStart,
            fullOperationPlanned: s.fullOperationPlanned,
            rampYearsGlobal: s.rampYearsGlobal,
            employmentRampYearsEffective: s.employmentRampYearsEffective,
          },
        ),
      );
    }
  }
  if (p1?.pmjShiftSummary && p1.pmjShiftSummary.trim().length > 0) {
    trace.push(
      traceStep(
        "P1-M0-PMJ",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "M0 PMJ struktura (směny / provoz — textový kontext)",
        { shifts: p1.pmjShiftSummary.slice(0, 280) },
      ),
    );
  }
  if (
    p1 &&
    (p1.baselineUnemploymentRate != null || p1.baselineEmploymentRate != null)
  ) {
    trace.push(
      traceStep(
        "P1-M2-MKT",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "M2 AS-IS trh práce — baseline (audit; úprava util jen při P1-M2-U)",
        {
          unemploymentRate: p1.baselineUnemploymentRate ?? null,
          employmentRate: p1.baselineEmploymentRate ?? null,
        },
      ),
    );
  }
  if (
    p1?.applyM2UnemploymentToUtilRzps &&
    (p1.baselineUnemploymentRate == null ||
      p1.baselineUnemploymentRate <= 0 ||
      p1.baselineUnemploymentRate > 0.5)
  ) {
    pushWarning(
      warnings,
      "P1_BASELINE_GAP",
      "Most M2 → util_RZPS je zapnutý, ale v AS-IS baseline není použitelná míra nezaměstnanosti (0–0,5). Používá se symbol util_RZPS z předpokladů.",
      "util_RZPS",
    );
  }

  let kInv = input.kInv ?? getNumeric(resolved, "k_inv");
  if (kInv === undefined) {
    warnMissingInput(warnings, "k_inv", "using 0");
    kInv = 0;
  }
  const gamma = getNumeric(resolved, "gamma") ?? 0;
  const delta = getNumeric(resolved, "delta") ?? 0;
  let utilRzps = getNumeric(resolved, "util_RZPS");
  if (utilRzps === undefined) {
    utilRzps = ImplicitNumericFallbacks.util_RZPS_when_missing;
    pushWarning(
      warnings,
      "ASSUMPTION_FALLBACK",
      "util_RZPS nebyl v předpokladech — použit implicitní fallback (viz implicit-fallbacks.ts).",
      "util_RZPS",
    );
  }
  const utilRzpsBeforeM2 = utilRzps;
  if (
    p1?.applyM2UnemploymentToUtilRzps &&
    p1.baselineUnemploymentRate != null &&
    p1.baselineUnemploymentRate > 0
  ) {
    const mult = utilRzpsMultiplierFromUnemployment(p1.baselineUnemploymentRate);
    utilRzps *= mult;
    trace.push(
      traceStep(
        "P1-M2-U",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        `util_RZPS škálováno podle M2 (nezaměstnanost ${p1.baselineUnemploymentRate.toFixed(4)}), mult=${mult.toFixed(4)}`,
        { before: utilRzpsBeforeM2, after: utilRzps },
      ),
    );
    pushWarning(
      warnings,
      "P1_BASELINE_BRIDGE",
      "Použita měkká úprava util_RZPS z AS-IS míry nezaměstnanosti (M2) — heuristika, ne uzavřený PDF vzorec.",
      "util_RZPS",
    );
  }
  const alphaElast = getNumeric(resolved, "alpha_elast") ?? 0;
  const mI = input.mI ?? getNumeric(resolved, "M_i") ?? 0;
  const pPendler = getNumeric(resolved, "p_pendler") ?? 0;

  const rampYears = Math.max(1, input.rampYears ?? 1);

  trace.push(
    traceStep(
      "M3-SOURCE-MIX",
      "OPEN_QUESTION_BRIDGE",
      undefined,
      "Zdroje vstupů M3: baseline P1 vs CONFIGURABLE předpoklady vs most (ne nový výpočet)",
      {
        nInv: {
          driver:
            p1 && p1.ftePmJFactor !== 1 ? "P1_M0_FTE" : "MVP_WIZARD",
          nInvMvp: p1?.nInvMvp,
          nInvEffective: input.nInv,
        },
        utilRZPS: {
          driver:
            p1?.applyM2UnemploymentToUtilRzps &&
            p1.baselineUnemploymentRate != null &&
            p1.baselineUnemploymentRate > 0
              ? "P1_M2_HEURISTIC_ON_ASSUMPTIONS"
              : p1?.applyM2UnemploymentToUtilRzps
                ? "ASSUMPTIONS_ONLY_BASELINE_GAP"
                : "ASSUMPTIONS_ONLY",
          utilRzpsEffective: utilRzps,
        },
        ramp: {
          years: rampYears,
          m0Schedule: p1?.m0Schedule ?? null,
        },
      },
    ),
  );

  const wd = computeWorkforceDemand(input.nInv, kInv);
  trace.push(
    traceStep(
      "DRV-007",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-007",
      "N_celkem = (1-k_inv)*N_inv",
      wd.value,
    ),
  );
  if (p1 && p1.ftePmJFactor !== 1) {
    trace.push(
      traceStep(
        "P1-FTE",
        "EXPLICIT_IN_METHODOLOGY",
        undefined,
        `N_inv z MVP=${p1.nInvMvp}, FTE faktor M0=${p1.ftePmJFactor.toFixed(4)} → efektivní N_inv=${input.nInv.toFixed(2)}`,
        { nInvMvp: p1.nInvMvp, fte: p1.ftePmJFactor, nInvEffective: input.nInv },
      ),
    );
  }
  if (
    p1 &&
    (p1.municipalityLabel ||
      p1.regionLabel ||
      p1.isochronesMode ||
      (p1.isochronesManualNote && p1.isochronesManualNote.length > 0))
  ) {
    trace.push(
      traceStep(
        "P1-M1-CTX",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "Územní kontext (M1) — audit; neovlivňuje DRV bez GIS API (ruční režim / poznámka)",
        {
          municipality: p1.municipalityLabel ?? "",
          region: p1.regionLabel ?? "",
          isochronesMode: p1.isochronesMode ?? "not_computed",
          isochronesNote:
            p1.isochronesManualNote && p1.isochronesManualNote.length > 0
              ? p1.isochronesManualNote.slice(0, 240)
              : undefined,
        },
      ),
    );
  }

  const rzpsRaw = computeRzpsRaw(
    input.aUp,
    input.bUp,
    input.cUp,
    gamma,
    delta,
  );
  trace.push(
    traceStep(
      "DRV-008",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-008",
      "RZPS_raw = A + gamma*B + delta*C",
      rzpsRaw.value,
    ),
  );

  const rzpsV = computeRzpsAfterUtil(rzpsRaw.value, utilRzps);
  trace.push(
    traceStep(
      "DRV-009",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-009",
      "RZPS = RZPS_raw * util_RZPS",
      rzpsV.value,
    ),
  );

  const sM = computeSubstitutionBase(
    alphaElast,
    input.mNew,
    input.mRegion,
  );
  if (sM.warning) {
    pushWarning(warnings, "SUBSTITUTION_BASE", sM.warning, "M_region");
  }
  trace.push(
    traceStep(
      "DRV-010",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-010",
      "S_m = alpha * (M_new-M_reg)/M_reg",
      sM.value,
    ),
  );

  const sT = computeSubstitutionCompetition(
    sM.value,
    input.npVm,
    input.npTotal,
  );
  if (sT.warning) {
    pushWarning(warnings, "SUBSTITUTION_COMPETITION", sT.warning, "NP_total");
  }
  trace.push(
    traceStep(
      "DRV-011",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-011",
      "S_t = (1-NP_vm/NP_tot)*S_m",
      sT.value,
    ),
  );

  const zz = computeZztrata(input.zI, mI, sT.value);
  trace.push(
    traceStep(
      "DRV-012",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-012",
      "Z_ztrata = Z_i * M_i * S_t",
      zz.value,
    ),
  );

  const gap = computeLaborGap(wd.value, rzpsV.value, input.nSub);
  trace.push(
    traceStep(
      "DRV-013",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-013",
      "N_mezera = N_celkem - RZPS - N_sub",
      gap.value,
    ),
  );

  const split = splitLaborGap(wd.value, gap.value, pPendler);
  trace.push(
    traceStep(
      "DRV-014",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-014",
      "N_pendler = p * N_celkem",
      split.nPendlerCalc,
    ),
  );
  trace.push(
    traceStep(
      "DRV-015",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-015",
      "N_agentura = N_mezera - N_pendler",
      split.nAgenturaCalc,
    ),
  );

  if (wd.value > 0 && split.nAgenturaCalc > 0) {
    const agencyShare = split.nAgenturaCalc / wd.value;
    if (agencyShare > AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD) {
      const pctLabel = (agencyShare * 100).toFixed(1).replace(".", ",");
      pushWarning(
        warnings,
        WARNING_CODE_AGENCY_SHARE_RISK,
        `Odhad podílu agenturních pracovníků ${pctLabel} % z potřeby PMJ (N_celkem) překračuje metodickou hranici rizika (> 5 %).`,
        "p_pendler",
      );
      trace.push(
        traceStep(
          "M3-AGENCY-SHARE-SIGNAL",
          "EXPLICIT_IN_METHODOLOGY",
          "DRV-014/015",
          "N_agentura / N_celkem — metodický rizikový signál při podílu > 5 %",
          {
            agencyShare,
            threshold: AGENCY_SHARE_OF_N_CELKEM_RISK_THRESHOLD,
            nAgenturaCalc: split.nAgenturaCalc,
            nCelkem: wd.value,
          },
        ),
      );
    }
  }

  const annualRamp = buildLinearAnnualRamp(rampYears);
  if (rampYears > 1) {
    trace.push(
      traceStep(
        "RAMP",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "Linear workforce ramp — not a closed PDF formula; MVP distribution only.",
        annualRamp,
      ),
    );
  }

  const annualWorkforceDemand = annualRamp.map((f) => f * wd.value);

  const result: EmploymentResult = {
    nCelkem: wd.value,
    rzpsRaw: rzpsRaw.value,
    rzps: rzpsV.value,
    sM: sM.value,
    sT: sT.value,
    zZtrata: zz.value,
    nMezera: gap.value,
    nPendlerCalc: split.nPendlerCalc,
    nAgenturaCalc: split.nAgenturaCalc,
    annualRamp,
    annualWorkforceDemand,
  };

  return mergeEngineResult(emptyEngineResult(result), {
    inputsUsed: {
      nInv: input.nInv,
      nInvMvp: p1?.nInvMvp,
      p1Bridge: p1,
      rampYears,
      aUp: input.aUp,
      bUp: input.bUp,
      cUp: input.cUp,
      mNew: input.mNew,
      mRegion: input.mRegion,
      npVm: input.npVm,
      npTotal: input.npTotal,
      zI: input.zI,
      nSub: input.nSub,
      kInv: input.kInv,
      mI: input.mI,
    },
    assumptionsUsed,
    intermediateValues: {
      k_inv: kInv,
      gamma,
      delta,
      util_RZPS: utilRzps,
      alpha_elast: alphaElast,
      M_i: mI,
      p_pendler: pPendler,
    },
    warnings,
    openQuestionsTouched: [],
    trace,
  });
}
