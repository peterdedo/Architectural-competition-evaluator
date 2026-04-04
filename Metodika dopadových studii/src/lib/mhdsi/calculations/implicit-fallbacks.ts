/**
 * Numerické fallbacky použité jen tehdy, když symbol není v `resolved` ani v
 * `DefaultAssumptionValues` v domain registry. Slouží pro stabilní engine a pozdější UI;
 * hodnoty odpovídají příkladům v PDF / system spec (ověřit vůči roku a legislativě).
 */
export const ImplicitNumericFallbacks = {
  util_RZPS_when_missing: 1,
  theta: 0.34,
  MPC: 0.8,
  M_spotreba: 1.8,
  M_mista: 1.7,
  M_investice: 1.7,
  M_vlada: 1.75,
  r_retence: 0.65,
  p_stat: 0.33,
  p_kraj: 0.33,
  p_obec: 0.34,
  alpha_obec: 0.05,
  Rp_RUD: 1.34,
  v_RUD_per_cap: 16500,
  T_ref_years: 10,
  std_MS_per_1000: 34,
  std_ZS_per_1000: 96,
  free_cap_factor: 0.9,
  beds_per_1000: 2.5,
  KH: 1.34,
  market_coverage: 0.8,
  fte_security_per_1000: 0.5,
} as const;
