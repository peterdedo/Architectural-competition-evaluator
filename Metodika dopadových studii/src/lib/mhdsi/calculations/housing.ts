import { getNumeric, resolveAssumptions, type AssumptionOverrides } from "./resolve-assumptions";
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

export type HousingSituation = "A" | "B";

export interface HousingP1BridgeInput {
  vTVacantMvp: number;
  nKmenMvp: number;
  migrationAdjustment: number;
  /** true pokud byl použit max s M2 vacant */
  m2VacantUsed: boolean;
  /**
   * M3→M4: ruční N_agentura / N_pendler z wizardu před přepsáním výstupy z M3.
   * Vyplněno jen při `linkToEmploymentM3`.
   */
  m3EmploymentLink?: {
    nAgenturaMvp: number;
    nPendlerMvp: number;
  };
  /** Most: max s M2 vacant — pro varování při prázdné baseline. */
  applyM2VacantToHousingSupply?: boolean;
  m0Schedule?: {
    constructionStart: string;
    fullOperationPlanned: string;
    rampYearsGlobal: number;
    housingRampYearsEffective: number;
  };
  m1Territory?: {
    municipality: string;
    region: string;
    isochronesMode: "manual_same_as_diad" | "manual_custom" | "not_computed";
    isochronesManualNote: string;
  };
  m2HousingContext?: {
    population: number;
    avgRentCzk: number;
    vacantUnitsBaseline: number;
  };
}

export interface HousingInputs {
  situation: HousingSituation;
  nKmen: number;
  nAgentura: number;
  nPendler: number;
  nRelokace: number;
  /** Share per housing type key (should sum to 1; validated with warning) */
  shareHousingType: Record<string, number>;
  occByType: Record<string, number>;
  lTMarketByType: Record<string, number>;
  vTVacant: number;
  assumptionOverrides?: AssumptionOverrides;
  rampYears?: number;
  /**
   * OPEN_QUESTION_BRIDGE: PDF says ZU „dle § 2.2 příklad“ — default ZU = N_kmen + N_agentura.
   * Pass override to use another rule.
   */
  zuOverride?: number;
  /** P1 → M4 audit (nKmen/vTVacant mohou být efektivní po M2). */
  p1Bridge?: HousingP1BridgeInput;
  /**
   * Po výpočtu M3 předat do M4 hodnoty N_agentura a N_pendler z DRV-014/015 místo polí z wizardu.
   */
  linkToEmploymentM3?: boolean;
}

export interface HousingTypeSplitRow {
  typeKey: string;
  share: number;
  zuT: number;
  occ: number;
  unitsRequired: number;
  effectiveSupply: number;
  deficitSurplus: number;
}

export interface HousingResult {
  zu: number;
  ou: number;
  kH: number;
  typeRows: HousingTypeSplitRow[];
  aggregateDeficit: number;
  annualRamp: number[];
  annualOu: number[];
}

/** DRV-016 */
export function computeOuSituationA(
  nAgentura: number,
  nKmen: number,
  kH: number,
): number {
  return nAgentura + nKmen * kH;
}

/** DRV-017 */
export function computeOuSituationB(
  nAgentura: number,
  nKmen: number,
  nRelokace: number,
  kH: number,
): number {
  return nAgentura + (nKmen + nRelokace) * kH;
}

/** DRV-019, DRV-020 */
export function computeUnitsForType(
  zu: number,
  share: number,
  occ: number,
): { zuT: number; unitsRequired: number } {
  const zuT = zu * share;
  const unitsRequired = occ > 0 ? zuT / occ : 0;
  return { zuT, unitsRequired };
}

/** DRV-022 fragment: effective supply per type — CONFIGURABLE + bridge for vacant split. */
export function computeEffectiveSupplyType(
  marketCoverage: number,
  lTMarket: number,
  vTVacant: number,
  share: number,
  shareSum: number,
): number {
  const vacAlloc = shareSum > 0 ? (vTVacant * share) / shareSum : 0;
  return marketCoverage * lTMarket + vacAlloc;
}

export function runHousingCalculation(
  input: HousingInputs,
): EngineResult<HousingResult> {
  const warnings: EngineWarning[] = [];
  const trace: EngineResult<HousingResult>["trace"] = [];

  const { resolved, assumptionsUsed } = resolveAssumptions(
    input.assumptionOverrides,
    ["KH", "market_coverage", "N_relokace"],
  );

  const kH = getNumericResolved(resolved, "KH", "KH", warnings);
  const marketCoverage = getNumericResolved(
    resolved,
    "market_coverage",
    "market_coverage",
    warnings,
  );
  const nRelok =
    input.nRelokace ??
    getNumeric(resolved, "N_relokace") ??
    0;

  const p1b = input.p1Bridge;
  if (p1b?.m0Schedule) {
    const s = p1b.m0Schedule;
    trace.push(
      traceStep(
        "P1-M0-H",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "M0 harmonogram / horizont vs. náběh bydlení (audit)",
        {
          constructionStart: s.constructionStart,
          fullOperationPlanned: s.fullOperationPlanned,
          rampYearsGlobal: s.rampYearsGlobal,
          housingRampYearsEffective: s.housingRampYearsEffective,
        },
      ),
    );
  }
  if (p1b?.m1Territory) {
    const t = p1b.m1Territory;
    trace.push(
      traceStep(
        "P1-M1-H",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "M1 územní kontext pro M4 (bez GIS API)",
        {
          municipality: t.municipality,
          region: t.region,
          isochronesMode: t.isochronesMode,
          isochronesNote:
            t.isochronesManualNote && t.isochronesManualNote.length > 0
              ? t.isochronesManualNote.slice(0, 240)
              : undefined,
        },
      ),
    );
  }
  if (p1b?.m2HousingContext) {
    trace.push(
      traceStep(
        "P1-M2-BL-H",
        "OPEN_QUESTION_BRIDGE",
        undefined,
        "M2 AS-IS bydlení / demografie — baseline (audit; vstup do E_t přes vacant/migrace dle mostu)",
        {
          population: p1b.m2HousingContext.population,
          vacantUnitsBaseline: p1b.m2HousingContext.vacantUnitsBaseline,
          avgRentCzk: p1b.m2HousingContext.avgRentCzk,
        },
      ),
    );
  }
  if (
    p1b?.applyM2VacantToHousingSupply &&
    !p1b.m2VacantUsed &&
    p1b.m2HousingContext &&
    Number.isFinite(p1b.m2HousingContext.vacantUnitsBaseline) &&
    p1b.m2HousingContext.vacantUnitsBaseline <= 0
  ) {
    pushWarning(
      warnings,
      "P1_M2_HOUSING_GAP",
      "Most M2 → nabídka volných jednotek je zapnutý, ale baseline uvádí 0 volných jednotek — efektivní nabídka vychází jen z MVP pole V_t vacant.",
      "vTVacant",
    );
  }
  if (p1b?.m3EmploymentLink) {
    trace.push(
      traceStep(
        "P1-M3-M4",
        "EXPLICIT_IN_METHODOLOGY",
        undefined,
        "M4 vstupy N_agentura, N_pendler z výstupu M3 (DRV-014/015); místo ručních hodnot ve wizardu",
        {
          nAgenturaMvp: p1b.m3EmploymentLink.nAgenturaMvp,
          nPendlerMvp: p1b.m3EmploymentLink.nPendlerMvp,
          nAgenturaEffective: input.nAgentura,
          nPendlerEffective: input.nPendler,
        },
      ),
    );
  }
  if (p1b) {
    trace.push(
      traceStep(
        "P1-M4-EFFECTIVE",
        "EXPLICIT_IN_METHODOLOGY",
        undefined,
        "Efektivní vstupy M4 po P1 mostu (M2 → N_kmen, vacant; M3→M4 pokud zapnuto)",
        {
          nKmenMvp: p1b.nKmenMvp,
          nKmenEffective: input.nKmen,
          migrationAdjustment: p1b.migrationAdjustment,
          vTVacantMvp: p1b.vTVacantMvp,
          vTVacantEffective: input.vTVacant,
          m2VacantUsed: p1b.m2VacantUsed,
        },
      ),
    );
  }

  const rampYears = Math.max(1, input.rampYears ?? 1);
  trace.push(
    traceStep(
      "M4-SOURCE-MIX",
      "OPEN_QUESTION_BRIDGE",
      undefined,
      "Zdroje M4: M0/M2 baseline vs M3 řetězec vs CONFIGURABLE (KH, nabídka)",
      {
        situation: input.situation,
        linkM3toM4: Boolean(input.linkToEmploymentM3),
        nAgenturaDriver: input.linkToEmploymentM3 ? "M3_DRV" : "MVP_WIZARD",
        nPendlerDriver: input.linkToEmploymentM3 ? "M3_DRV" : "MVP_WIZARD",
        nKmenDriver:
          p1b && p1b.nKmenMvp !== input.nKmen
            ? "P1_M2_MIGRATION_PROXY"
            : "MVP_WIZARD",
        vacantDriver: p1b?.m2VacantUsed ? "P1_M2_MAX_WITH_MVP" : "MVP_WIZARD",
        rampYears,
        m0Schedule: p1b?.m0Schedule ?? null,
      },
    ),
  );

  const ou =
    input.situation === "A"
      ? computeOuSituationA(input.nAgentura, input.nKmen, kH)
      : computeOuSituationB(
          input.nAgentura,
          input.nKmen,
          nRelok,
          kH,
        );

  trace.push(
    traceStep(
      input.situation === "A" ? "DRV-016" : "DRV-017",
      "EXPLICIT_IN_METHODOLOGY",
      input.situation === "A" ? "DRV-016" : "DRV-017",
      "OU Sit. A/B",
      input.situation === "A"
        ? {
            ou,
            formulaCs: "N_agentura + N_kmen × KH (KH jen u kmenových)",
            nAgentura: input.nAgentura,
            nKmen: input.nKmen,
            kH,
            nPendlerInOu: false,
            nPendlerNoteCs:
              "N_pendler do OU v situaci A nevstupuje (M4 dle metodického listu).",
          }
        : {
            ou,
            formulaCs: "N_agentura + (N_kmen + N_relokace) × KH",
            nAgentura: input.nAgentura,
            nKmen: input.nKmen,
            nRelokace: nRelok,
            kH,
          },
    ),
  );

  const zu =
    input.zuOverride ??
    input.nKmen + input.nAgentura;
  trace.push(
    traceStep(
      "DRV-018",
      "OPEN_QUESTION_BRIDGE",
      "DRV-018",
      "ZU default = N_kmen + N_agentura (PDF: dle příklad — override allowed)",
      zu,
    ),
  );
  const shareSumAll = Object.values(input.shareHousingType).reduce((a, b) => a + b, 0);
  if (Math.abs(shareSumAll - 1) > 0.02) {
    warnMissingInput(
      warnings,
      "shareHousingType",
      `shares sum to ${shareSumAll}, expected ~1`,
    );
  }

  const typeRows: HousingTypeSplitRow[] = [];
  let aggregateDeficit = 0;
  const keys = Object.keys(input.shareHousingType);

  for (const typeKey of keys) {
    const share = input.shareHousingType[typeKey] ?? 0;
    const occ = input.occByType[typeKey] ?? 0;
    if (occ <= 0) {
      warnMissingInput(warnings, `occ_by_type.${typeKey}`, "occ<=0");
    }
    const { zuT, unitsRequired } = computeUnitsForType(zu, share, occ);
    const lM = input.lTMarketByType[typeKey] ?? 0;
    const eff = computeEffectiveSupplyType(
      marketCoverage,
      lM,
      input.vTVacant,
      share,
      shareSumAll || 1,
    );
    const deficitSurplus = unitsRequired - eff;
    aggregateDeficit += deficitSurplus;
    typeRows.push({
      typeKey,
      share,
      zuT,
      occ,
      unitsRequired,
      effectiveSupply: eff,
      deficitSurplus,
    });
    trace.push(
      traceStep(
        `TYPE-${typeKey}`,
        "CONFIGURABLE_ASSUMPTION",
        "DRV-019/020/022",
        "ZU_t, units_t, E_t simplified",
        { zuT, unitsRequired, eff },
      ),
    );
  }

  const annualRamp = buildLinearAnnualRamp(rampYears);
  const annualOu = annualRamp.map((w) => w * ou);

  const result: HousingResult = {
    zu,
    ou,
    kH,
    typeRows,
    aggregateDeficit,
    annualRamp,
    annualOu,
  };

  return mergeEngineResult(emptyEngineResult(result), {
    inputsUsed: {
      ...input,
      p1Bridge: p1b,
      rampYears,
      linkToEmploymentM3: input.linkToEmploymentM3 ?? false,
    },
    assumptionsUsed,
    intermediateValues: { kH, market_coverage: marketCoverage, nRelokace: nRelok },
    warnings,
    openQuestionsTouched: [],
    trace,
  });
}
