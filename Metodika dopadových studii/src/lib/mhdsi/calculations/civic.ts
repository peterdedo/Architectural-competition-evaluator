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
import { buildLinearAnnualRamp } from "./employment";

const CIVIC_SYMBOLS = [
  "std_MS_per_1000",
  "std_ZS_per_1000",
  "free_cap_factor",
  "beds_per_1000",
] as const;

/** P1 most M5 — před výpočtem z wizardu (bez kanonických štítků). */
export interface CivicP1BridgeInput {
  linkOuToM4: boolean;
  linkSafetyToM3: boolean;
  ouWizardMvp: number;
  nCelkemWizardMvp: number;
}

/** Po `runFullCalculationPipeline`: kanonický zdroj OU a N_celkem pro bezpečnost. */
export interface CivicP1BridgeResolved extends CivicP1BridgeInput {
  ouCanonical: "m4_output" | "wizard_manual";
  nCelkemCanonical: "m3_output" | "wizard_manual";
}

export interface CivicInputs {
  ou: number;
  capRegMs: number;
  capRegZs: number;
  enrolledMs: number;
  enrolledZs: number;
  /** INP-508 — OQ-08: NX = OU/PX; use per-type PX or single aggregate */
  pxSpecialistsByType?: Record<string, number>;
  /** Single PX fallback when table incomplete */
  pxSpecialistsAggregate?: number;
  /** INP-509 — K per 100 obyv (aggregate) */
  kstandardLeisure: number;
  nCelkemM3: number;
  nAgentCizinci: number;
  /** CONFIGURABLE: FTE security per 1000 residents (spec: tabulky) */
  fteSecurityPer1000?: number;
  /** Volitelná kapacita akutních lůžek (pro deficit zdravotní péče) */
  acuteBedsCapacity?: number;
  /** Volitelná kapacita volnočasových zařízení (jednotky srovnatelné s poptávkou) */
  leisureCapacityUnits?: number;
  assumptionOverrides?: AssumptionOverrides;
  rampYears?: number;
  /** Po pipeline: zdroje OU / N_celkem pro audit M5. */
  p1Bridge?: CivicP1BridgeResolved;
}

/**
 * Vstup z mapování — `runFullCalculationPipeline` doplní kanonické příznaky a přepíše OU / N_celkem.
 */
export type CivicPipelineInput = Omit<CivicInputs, "p1Bridge"> & {
  p1Bridge?: CivicP1BridgeInput;
};

export type CivicDomain =
  | "kindergarten"
  | "elementary"
  | "healthcare"
  | "leisure"
  | "safety";

export interface CivicMitigationItem {
  domain: CivicDomain;
  deficit: number;
  suggestion: string;
  classification: "CONFIGURABLE_ASSUMPTION" | "OPEN_QUESTION_BRIDGE";
}

export interface CivicSectorResult {
  demand: number;
  freeCapacity: number;
  deficitSurplus: number;
}

export interface CivicResult {
  demandMs: number;
  demandZs: number;
  freeMs: number;
  freeZs: number;
  kindergarten: CivicSectorResult;
  elementary: CivicSectorResult;
  bedsNeed: number;
  /** NX podle OQ-08 */
  healthcareDemand: number;
  /** Sektor: poptávka lůžek vs volná kapacita */
  healthcareBeds: CivicSectorResult;
  leisureFacilities: number;
  leisure: CivicSectorResult;
  safetyFteGap: number;
  mitigations: CivicMitigationItem[];
  annualRamp: number[];
  annualOuScaled: number[];
}

/** DRV-023 — CONFIGURABLE_ASSUMPTION („cca“) */
export function computeDemandKindergarten(
  ou: number,
  stdMsPer1000: number,
): number {
  return (ou * stdMsPer1000) / 1000;
}

/** DRV-024 */
export function computeDemandElementary(
  ou: number,
  stdZsPer1000: number,
): number {
  return (ou * stdZsPer1000) / 1000;
}

/** DRV-025 — per sector */
export function computeFreeCapacity(
  capReg: number,
  enrolled: number,
  freeCapFactor: number,
): number {
  return freeCapFactor * capReg - enrolled;
}

/** DRV-026 */
export function computeBedsNeed(
  ou: number,
  bedsPer1000: number,
): number {
  return (ou / 1000) * bedsPer1000;
}

/** DRV-027 */
export function computeLeisureCount(
  ou: number,
  kLeisure: number,
): number {
  return (ou / 100) * kLeisure;
}

/**
 * Healthcare demand proxy — OQ-08: NX = OU/PX.
 * OPEN_QUESTION_BRIDGE when PX incomplete.
 */
export function computeHealthcareDemandNx(
  ou: number,
  px: number | undefined,
  oq: string[],
): { demand: number } {
  if (px === undefined || px <= 0) {
    oq.push(OpenQuestionIds.OQ_08_HEALTH_NX_OU_PX);
    return { demand: 0 };
  }
  return { demand: ou / px };
}

/** Safety staffing gap — CONFIGURABLE table simplified to FTE per 1000 Obyv. */
export function computeSafetyFteGap(
  ou: number,
  nCelkemM3: number,
  nAgentCizinci: number,
  ftePer1000: number,
): number {
  const need = (ou / 1000) * ftePer1000;
  const baseline = (nCelkemM3 + nAgentCizinci) / 1000;
  return need - baseline;
}

const domainCs: Record<CivicDomain, string> = {
  kindergarten: "mateřské školy",
  elementary: "základní školy",
  healthcare: "zdravotnictví",
  leisure: "volný čas a komunitní zařízení",
  safety: "bezpečnost",
};

function mitigationFor(
  domain: CivicDomain,
  deficit: number,
): CivicMitigationItem | null {
  if (deficit <= 0) return null;
  return {
    domain,
    deficit,
    suggestion: `Zvážit doplnění kapacity nebo mitigaci v oblasti „${domainCs[domain]}“ (MHDSI oddíl 2.3).`,
    classification: "OPEN_QUESTION_BRIDGE",
  };
}

export function runCivicAmenitiesCalculation(
  input: CivicInputs,
): EngineResult<CivicResult> {
  const warnings: EngineWarning[] = [];
  const oq: string[] = [];
  const trace: EngineResult<CivicResult>["trace"] = [];

  const p1b = input.p1Bridge;
  if (p1b) {
    trace.push(
      traceStep(
        "M5-SOURCE-MIX",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "Zdroje M5: OU z M4 vs ručně; N_celkem (bezpečnost) z M3 vs ručně; školy/zdraví/volnočas dle DRV-023–027",
        {
          ou: {
            canonical: p1b.ouCanonical,
            ouEffective: input.ou,
            ouWizardMvp: p1b.ouWizardMvp,
          },
          nCelkemForSafety: {
            canonical: p1b.nCelkemCanonical,
            nCelkemEffective: input.nCelkemM3,
            nCelkemWizardMvp: p1b.nCelkemWizardMvp,
          },
        },
      ),
    );
    if (!p1b.linkOuToM4) {
      pushWarning(
        warnings,
        "CIVIC_OU_WIZARD_ONLY",
        "OU pro občanskou vybavenost se bere z ručního pole průvodce, ne z výstupu M4 (DRV-016/017). Zapněte most P1 „OU z M4“ pro metodickou návaznost.",
        "ou",
      );
    }
    if (!p1b.linkSafetyToM3) {
      pushWarning(
        warnings,
        "CIVIC_NCELKEM_WIZARD_ONLY",
        "N_celkem pro bezpečnost se bere z ručního pole průvodce, ne z výstupu M3 (DRV-007). Zapněte most P1 „N_celkem z M3“ pro návaznost.",
        "nCelkemM3",
      );
    }
    trace.push(
      traceStep(
        "P1-M5-OU",
        p1b.ouCanonical === "m4_output"
          ? "EXPLICIT_IN_METHODOLOGY"
          : "OPEN_QUESTION_BRIDGE",
        undefined,
        p1b.ouCanonical === "m4_output"
          ? "OU = výstup M4 (obyvatelé k usazení dle situace A/B)"
          : "OU z ručního pole průvodce (fallback)",
        { ouEffective: input.ou, ouWizardMvp: p1b.ouWizardMvp },
      ),
    );
    trace.push(
      traceStep(
        "P1-M5-NCEL",
        p1b.nCelkemCanonical === "m3_output"
          ? "EXPLICIT_IN_METHODOLOGY"
          : "OPEN_QUESTION_BRIDGE",
        "DRV-007",
        p1b.nCelkemCanonical === "m3_output"
          ? "N_celkem pro bezpečnost = výstup M3 (potřeba PMJ po kmenových)"
          : "N_celkem z ručního pole průvodce (fallback)",
        {
          nCelkemEffective: input.nCelkemM3,
          nCelkemWizardMvp: p1b.nCelkemWizardMvp,
        },
      ),
    );
  }

  const { resolved, assumptionsUsed } = resolveAssumptions(
    input.assumptionOverrides,
    [...CIVIC_SYMBOLS],
  );

  const stdMs = getNumericResolved(
    resolved,
    "std_MS_per_1000",
    "std_MS_per_1000",
    warnings,
  );
  const stdZs = getNumericResolved(
    resolved,
    "std_ZS_per_1000",
    "std_ZS_per_1000",
    warnings,
  );
  const freeCap = getNumericResolved(
    resolved,
    "free_cap_factor",
    "free_cap_factor",
    warnings,
  );
  const bedsPer1000 = getNumericResolved(
    resolved,
    "beds_per_1000",
    "beds_per_1000",
    warnings,
  );

  const demandMs = computeDemandKindergarten(input.ou, stdMs);
  const demandZs = computeDemandElementary(input.ou, stdZs);
  trace.push(
    traceStep(
      "DRV-023",
      "CONFIGURABLE_ASSUMPTION",
      "DRV-023",
      "demand_MS = OU * std_MS/1000",
      demandMs,
    ),
  );
  trace.push(
    traceStep(
      "DRV-024",
      "CONFIGURABLE_ASSUMPTION",
      "DRV-024",
      "demand_ZS = OU * std_ZS/1000",
      demandZs,
    ),
  );

  const freeMs = computeFreeCapacity(input.capRegMs, input.enrolledMs, freeCap);
  const freeZs = computeFreeCapacity(input.capRegZs, input.enrolledZs, freeCap);
  trace.push(
    traceStep(
      "DRV-025",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-025",
      "free = free_cap * cap_reg - enrolled (per sector)",
      { freeMs, freeZs },
    ),
  );

  const kindergarten: CivicSectorResult = {
    demand: demandMs,
    freeCapacity: freeMs,
    deficitSurplus: demandMs - freeMs,
  };
  const elementary: CivicSectorResult = {
    demand: demandZs,
    freeCapacity: freeZs,
    deficitSurplus: demandZs - freeZs,
  };

  const bedsNeed = computeBedsNeed(input.ou, bedsPer1000);
  trace.push(
    traceStep(
      "DRV-026",
      "CONFIGURABLE_ASSUMPTION",
      "DRV-026",
      "beds_need = OU/1000 * beds_per_1000",
      bedsNeed,
    ),
  );

  const leisureFacilities = computeLeisureCount(
    input.ou,
    input.kstandardLeisure,
  );
  trace.push(
    traceStep(
      "DRV-027",
      "EXPLICIT_IN_METHODOLOGY",
      "DRV-027",
      "N_zarizeni = (OU/100)*K",
      leisureFacilities,
    ),
  );

  let pxAgg = input.pxSpecialistsAggregate;
  if (pxAgg === undefined && input.pxSpecialistsByType) {
    const vals = Object.values(input.pxSpecialistsByType);
    pxAgg =
      vals.length > 0
        ? vals.reduce((a, b) => a + b, 0) / vals.length
        : undefined;
  }

  const health = computeHealthcareDemandNx(input.ou, pxAgg, oq);
  const healthNxDesc =
    pxAgg === undefined || !Number.isFinite(pxAgg) || pxAgg <= 0
      ? "OQ-08: bez platného vstupu PX specialistů není NX = OU/PX vyčísleno (0 je neúplný proxy)"
      : "NX = OU / PX (souhrnný nebo agregovaný vstup PX)";
  trace.push(
    traceStep(
      "HEALTH-NX",
      "OPEN_QUESTION_BRIDGE",
      "OQ-08",
      healthNxDesc,
      health.demand,
    ),
  );

  const fteSec =
    input.fteSecurityPer1000 ??
    getNumericResolved(
      resolved,
      "fte_security_per_1000",
      "fte_security_per_1000",
      warnings,
    );
  const safetyFteGap = computeSafetyFteGap(
    input.ou,
    input.nCelkemM3,
    input.nAgentCizinci,
    fteSec,
  );

  const bedsCap = input.acuteBedsCapacity ?? 0;
  const healthcareBeds: CivicSectorResult = {
    demand: bedsNeed,
    freeCapacity: bedsCap,
    deficitSurplus: bedsNeed - bedsCap,
  };

  const leisureCap = input.leisureCapacityUnits ?? 0;
  const leisure: CivicSectorResult = {
    demand: leisureFacilities,
    freeCapacity: leisureCap,
    deficitSurplus: leisureFacilities - leisureCap,
  };

  const mitigations: CivicMitigationItem[] = [];
  const pushM = (d: CivicDomain, def: number) => {
    const m = mitigationFor(d, def);
    if (m) mitigations.push(m);
  };
  pushM("kindergarten", kindergarten.deficitSurplus);
  pushM("elementary", elementary.deficitSurplus);
  pushM("healthcare", healthcareBeds.deficitSurplus);
  pushM("leisure", leisure.deficitSurplus);
  pushM("safety", Math.max(0, safetyFteGap));

  const rampYears = Math.max(1, input.rampYears ?? 1);
  const annualRamp = buildLinearAnnualRamp(rampYears);
  const annualOuScaled = annualRamp.map((w) => w * input.ou);

  const result: CivicResult = {
    demandMs,
    demandZs,
    freeMs,
    freeZs,
    kindergarten,
    elementary,
    bedsNeed,
    healthcareDemand: health.demand,
    healthcareBeds,
    leisureFacilities,
    leisure,
    safetyFteGap,
    mitigations,
    annualRamp,
    annualOuScaled,
  };

  if (pxAgg === undefined) {
    warnMissingInput(warnings, "pxSpecialists", "healthcare NX not computed");
  }

  return mergeEngineResult(emptyEngineResult(result), {
    inputsUsed: { ...input },
    assumptionsUsed,
    intermediateValues: {
      std_MS_per_1000: stdMs,
      std_ZS_per_1000: stdZs,
      free_cap_factor: freeCap,
      beds_per_1000: bedsPer1000,
    },
    warnings,
    openQuestionsTouched: [...new Set(oq)],
    trace,
  });
}
