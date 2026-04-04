import { z } from "zod";

/**
 * INP-412 — Situation A vs B (OQ-06: not auto-determined by methodology).
 */
export const housingSituationSchema = z.enum(["A", "B"]);

export type HousingSituation = z.infer<typeof housingSituationSchema>;

/**
 * M4 — housing module raw inputs (INP-401–412).
 */
export const housingInputsSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  /** INP-401 */
  kH: z.number().positive().optional(),
  /** INP-402–405 — typically fed from M3 / user */
  nKmen: z.number().nonnegative().optional(),
  nAgentura: z.number().nonnegative().optional(),
  nPendler: z.number().nonnegative().optional(),
  nRelokace: z.number().nonnegative().optional(),
  /** INP-406 — shares by housing type */
  shareHousingType: z.record(z.number()).optional(),
  /** INP-407 */
  occByType: z.record(z.number()).optional(),
  /** INP-408–409 */
  lTMarketByType: z.record(z.number()).optional(),
  vTVacant: z.number().nonnegative().optional(),
  /** INP-410 */
  bBeds: z.number().nonnegative().optional(),
  /** INP-411 */
  marketCoverage: z.number().min(0).max(1).optional(),
  /** INP-412 */
  situationAb: housingSituationSchema.optional(),

  extension: z.record(z.unknown()).optional(),
});

export type HousingInputs = z.infer<typeof housingInputsSchema>;
