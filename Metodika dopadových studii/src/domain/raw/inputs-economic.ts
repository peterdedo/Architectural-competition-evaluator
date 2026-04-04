import { z } from "zod";

/**
 * INP-608 — budget shares (state / region / municipality).
 */
export const taxBudgetSharesSchema = z.object({
  pStat: z.number().min(0).max(1).optional(),
  pKraj: z.number().min(0).max(1).optional(),
  pObec: z.number().min(0).max(1).optional(),
});

export type TaxBudgetShares = z.infer<typeof taxBudgetSharesSchema>;

/**
 * M6 — economic benefits / public finance inputs (INP-601–616).
 */
export const economicBenefitInputsSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  /** INP-601–605 */
  mpc: z.number().min(0).max(1).optional(),
  mSpotreba: z.number().positive().optional(),
  mMista: z.number().positive().optional(),
  mInvestice: z.number().positive().optional(),
  mVlada: z.number().positive().optional(),
  /** INP-606 */
  tRefYears: z.number().int().positive().optional(),
  /** INP-607 */
  theta: z.number().min(0).max(1).optional(),
  /** INP-608 */
  taxBudgetShares: taxBudgetSharesSchema.optional(),
  /** INP-609 */
  rRetence: z.number().min(0).max(1).optional(),
  /** INP-610–611 */
  sStavbyM2: z.number().nonnegative().optional(),
  sPlochyM2: z.number().nonnegative().optional(),
  /** INP-612–613 */
  sStavbyKcPerM2: z.number().nonnegative().optional(),
  sPlochyKcPerM2: z.number().nonnegative().optional(),
  kMistniKZakladni: z.record(z.number()).optional(),
  /** INP-614–616 */
  alphaObec: z.number().min(0).max(1).optional(),
  rpRud: z.number().positive().optional(),
  vRudPerCapCzk: z.number().nonnegative().optional(),

  /**
   * Ruční ΔHDP pro MVP (tabulka MVP ve spec: M6 částečný HDP).
   * **Není** řádek INP v tabulce vstupů — most k VYP_2.4_2; plný VYP_2.4_1 je OQ / v2.
   */
  mvpManualDeltaHdpCzk: z.number().optional(),

  /**
   * Scénářový přepínač — ve spec jako `include_XM` (CONFIGURABLE).
   * Kanonický zdroň též `AssumptionKeys.INCLUDE_XM` v `AssumptionSet.overrides`.
   */
  includeXm: z.boolean().optional(),

  extension: z.record(z.unknown()).optional(),
});

export type EconomicBenefitInputs = z.infer<typeof economicBenefitInputsSchema>;
