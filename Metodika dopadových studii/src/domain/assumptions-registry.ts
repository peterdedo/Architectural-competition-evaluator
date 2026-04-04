/**
 * Klíče CONFIGURABLE_ASSUMPTION — mapování na symboly z docs/mhdsi-system-spec.md
 * (tabulky INP, scénářové parametry). Hodnoty defaultů jsou pouze z příkladů v PDF
 * — vždy ověřit vůči platné legislativě a roku (OQ-10).
 *
 * Rozšíření: libovolné další klíče přes `AssumptionSet.overrides` (string).
 */
export const AssumptionKeys = {
  // M1 — § 1.4
  DIADPR_MINUTES: "DIADpr",
  DIADAK_MINUTES: "DIADak",
  TINFR_MINUTES: "Tinfr",
  BUFFER_COBCE_M: "buffer_cobce_m",
  ISOCHRONE_ENGINE: "isochrone_engine",
  // M2
  NACE_SHARES: "NACE_shares",
  // M3 — § 2.1
  K_INV: "k_inv",
  GAMMA_RZPS: "gamma",
  DELTA_RZPS: "delta",
  UTIL_RZPS: "util_RZPS",
  ALPHA_ELAST: "alpha_elast",
  M_I: "M_i",
  P_PENDLER_SHARE: "p_pendler",
  // M4 — § 2.2
  K_HOUSEHOLD: "KH",
  SHARE_HOUSING_TYPE: "share_housing_type",
  OCC_BY_TYPE: "occ_by_type",
  N_RELOKACE: "N_relokace",
  MARKET_COVERAGE: "market_coverage",
  // M5 — § 2.3
  STD_MS_PER_1000: "std_MS_per_1000",
  STD_ZS_PER_1000: "std_ZS_per_1000",
  FREE_CAP_FACTOR: "free_cap_factor",
  BEDS_PER_1000: "beds_per_1000",
  // M6 — § 2.4
  MPC: "MPC",
  M_SPOTREBA: "M_spotreba",
  M_MISTA: "M_mista",
  M_INVESTICE: "M_investice",
  M_VLADA: "M_vlada",
  T_REF_YEARS: "T_ref_years",
  THETA_TAX_QUOTA: "theta",
  P_STAT: "p_stat",
  P_KRAJ: "p_kraj",
  P_OBEC: "p_obec",
  R_RETENCE: "r_retence",
  INCLUDE_XM: "include_XM",
  ALPHA_OBEC_RUD: "alpha_obec",
  RP_RUD: "Rp_RUD",
  V_RUD_PER_CAP: "v_RUD_per_cap",
  /**
   * OQ-01: implementační přepínač znaménka u korekce DIADak (`+` / `-` u Tinfr).
   * Není číselná hodnota z PDF — pouze rozhodnutí mimo doslovný text.
   */
  DIADAK_TINFR_SIGN: "DIADak_Tinfr_sign",
} as const;

export type AssumptionKey = (typeof AssumptionKeys)[keyof typeof AssumptionKeys];

/** Defaulty jen tam, kde spec uvádí příkladové číslo (CONFIGURABLE). */
export const DefaultAssumptionValues: Readonly<
  Partial<Record<AssumptionKey, number | string>>
> = {
  [AssumptionKeys.DIADPR_MINUTES]: 30,
  [AssumptionKeys.DIADAK_MINUTES]: 60,
  [AssumptionKeys.GAMMA_RZPS]: 0.3,
  [AssumptionKeys.DELTA_RZPS]: 0.15,
  [AssumptionKeys.K_HOUSEHOLD]: 1.34,
  [AssumptionKeys.P_PENDLER_SHARE]: 0.065,
  [AssumptionKeys.MARKET_COVERAGE]: 0.8,
  [AssumptionKeys.STD_MS_PER_1000]: 34,
  [AssumptionKeys.STD_ZS_PER_1000]: 96,
  [AssumptionKeys.FREE_CAP_FACTOR]: 0.9,
  [AssumptionKeys.BEDS_PER_1000]: 2.5,
  [AssumptionKeys.THETA_TAX_QUOTA]: 0.34,
  [AssumptionKeys.MPC]: 0.8,
  [AssumptionKeys.M_SPOTREBA]: 1.8,
  [AssumptionKeys.M_MISTA]: 1.7,
  [AssumptionKeys.M_INVESTICE]: 1.7,
  [AssumptionKeys.M_VLADA]: 1.75,
  [AssumptionKeys.RP_RUD]: 1.34,
  [AssumptionKeys.V_RUD_PER_CAP]: 16500,
  [AssumptionKeys.ALPHA_OBEC_RUD]: 0.05,
};
