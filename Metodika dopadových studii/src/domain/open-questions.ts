/**
 * OPEN QUESTION identifiers — docs/mhdsi-system-spec.md (kompletní seznam + NPV).
 * Nepředstavují konfigurovatelné defaulty; patří do audit trace a dokumentace rozhodnutí.
 */
export const OpenQuestionIds = {
  OQ_01_DIADAK_TINFR_SIGN: "OQ-01",
  OQ_02_T_POSM_UNITS: "OQ-02",
  OQ_03_TREND_FORMULA_V0_VK_N: "OQ-03",
  OQ_04_SUBSTITUTION_MULTI_PROFESSION: "OQ-04",
  OQ_05_INDIRECT_INDUCED_PMJ: "OQ-05",
  OQ_06_SITUATION_AB_AUTO: "OQ-06",
  OQ_07_SECTION_06_CALC_LIST: "OQ-07",
  OQ_08_HEALTH_NX_OU_PX: "OQ-08",
  OQ_09_MITIGATION_TEXT_VS_EMPLOYMENT: "OQ-09",
  OQ_10_THETA_RUD_LEGISLATION: "OQ-10",
  /** NPV zmínka ve spec scénářových parametrech — uzavřený vzorec není ve spec tabulce INP */
  OQ_11_NPV_DISCOUNT: "OQ-11",
} as const;

export type OpenQuestionId =
  (typeof OpenQuestionIds)[keyof typeof OpenQuestionIds];
