/**
 * P1 → M3/M4 most: explicitní příznaky, které zapínají odvození vstupů z M0/M1/M2.
 * Výchozí hodnoty při migraci starého stavu: vše false (chování jako MVP).
 */

export interface P1PipelineBridgeFlags {
  /** M0: násobit N_inv faktorem FTE z PMJ portfolia (DRV-007). */
  applyM0FteToEmployment: boolean;
  /** M2: měkká úprava util_RZPS podle míry nezaměstnanosti z AS-IS baseline. */
  applyM2UnemploymentToUtilRzps: boolean;
  /** Horizont projektu: min(employmentRampYears, rampYearsGlobal). */
  alignEmploymentRampToProjectHorizon: boolean;
  /** M2: max(vTVacant, volné jednotky z AS-IS) pro nabídku bydlení. */
  applyM2VacantToHousingSupply: boolean;
  /** M2: drobná úprava N_kmen podle migračního salda (proxy). */
  applyM2MigrationToKmen: boolean;
  /** Horizont: min(housingRampYears, rampYearsGlobal). */
  alignHousingRampToProjectHorizon: boolean;
  /**
   * M4: N_agentura a N_pendler ve výpočtu převezmou výstupy M3 (DRV-014/015),
   * ruční pole ve wizardu slouží jen jako záloha / audit (MVP).
   */
  linkHousingToEmploymentM3: boolean;
  /**
   * M5: OU (INP-501) pro občanskou vybavenost z výstupu M4 (housing.result.ou),
   * nikoli z izolovaného pole průvodce.
   */
  linkCivicOuToM4Ou: boolean;
  /**
   * M5: N_celkem pro bezpečnost (INP-510) z výstupu M3 (DRV-007),
   * nikoli z izolovaného pole průvodce.
   */
  linkCivicSafetyToM3NCelkem: boolean;
  /**
   * M6: odhad ΔHDP jako profil (CAPEX + návaznost na M3 přes multiplikátory z § 2.4),
   * místo čistě ručního pole; ruční hodnota zůstává jako záloha / audit.
   */
  useComputedM6DeltaHdp: boolean;
}

export function createDefaultP1PipelineBridgeFlags(): P1PipelineBridgeFlags {
  return {
    applyM0FteToEmployment: false,
    applyM2UnemploymentToUtilRzps: false,
    alignEmploymentRampToProjectHorizon: false,
    applyM2VacantToHousingSupply: false,
    applyM2MigrationToKmen: false,
    alignHousingRampToProjectHorizon: false,
    linkHousingToEmploymentM3: false,
    linkCivicOuToM4Ou: false,
    linkCivicSafetyToM3NCelkem: false,
    /** Výchozí ON: profil § 2.4 místo čistého ručního ΔHDP; uživatel může v P1 vypnout. */
    useComputedM6DeltaHdp: true,
  };
}

/** Doporučené zapnutí pro nové projekty / demo (metodická návaznost). */
export function createRecommendedP1PipelineBridgeFlags(): P1PipelineBridgeFlags {
  return {
    applyM0FteToEmployment: true,
    applyM2UnemploymentToUtilRzps: true,
    alignEmploymentRampToProjectHorizon: true,
    applyM2VacantToHousingSupply: true,
    applyM2MigrationToKmen: true,
    alignHousingRampToProjectHorizon: true,
    linkHousingToEmploymentM3: true,
    linkCivicOuToM4Ou: true,
    linkCivicSafetyToM3NCelkem: true,
    useComputedM6DeltaHdp: true,
  };
}
