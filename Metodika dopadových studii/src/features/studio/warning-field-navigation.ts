import type { ScenarioKind } from "./wizard-types";

export type WarningFieldNavigation = {
  step: number;
  elementId: string;
};

/** Symboly ve scénářových deltách (krok 3) — odpovídají `ScenarioNum` id. */
const SCENARIO_DELTA_SYMBOLS = new Set([
  "util_RZPS",
  "theta",
  "p_pendler",
  "k_inv",
]);

const OCC_TYPE_TO_INPUT: Record<string, string> = {
  byt: "occByt",
  rodinny: "occRodinny",
};

/** Symboly z implicitních fallbacků / sdílených předpokladů — přehled na kroku 9. */
const SHARED_ASSUMPTION_SYMBOLS = new Set([
  "KH",
  "market_coverage",
  "gamma",
  "delta",
  "alpha_elast",
  "std_MS_per_1000",
  "std_ZS_per_1000",
  "free_cap_factor",
  "beds_per_1000",
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
  "fte_security_per_1000",
]);

/**
 * Mapuje `EngineWarning.field` na krok průvodce a `id` vstupního prvku (pokud existuje).
 * Používá se jen pro navigaci v UI — žádná business logika.
 */
export function resolveWarningFieldNavigation(
  field: string,
  activeScenario: ScenarioKind,
): WarningFieldNavigation | null {
  if (field === "k_inv") {
    return { step: 4, elementId: "kInv" };
  }
  if (field === "M_region") {
    return { step: 4, elementId: "mRegion" };
  }
  if (field === "NP_total") {
    return { step: 4, elementId: "npTotal" };
  }
  if (field === "vTVacant") {
    return { step: 5, elementId: "vTVacant" };
  }
  if (field === "shareHousingType") {
    return { step: 5, elementId: "shareByt" };
  }
  if (field === "mvpManualDeltaHdpCzk") {
    return { step: 7, elementId: "mvpManualDeltaHdpCzk" };
  }
  if (field === "pxSpecialists") {
    return { step: 6, elementId: "pxSpecialistsAggregate" };
  }
  if (field === "capexTotalCzk") {
    return { step: 0, elementId: "capexTotalCzk" };
  }

  const occ = /^occ_by_type\.(.+)$/.exec(field);
  if (occ) {
    const id = OCC_TYPE_TO_INPUT[occ[1] ?? ""];
    if (id) return { step: 5, elementId: id };
  }

  if (SCENARIO_DELTA_SYMBOLS.has(field)) {
    return {
      step: 3,
      elementId: `scenario-${activeScenario}-${field}`,
    };
  }

  if (SHARED_ASSUMPTION_SYMBOLS.has(field)) {
    return { step: 9, elementId: `shared-assumption-${field}` };
  }

  return null;
}
