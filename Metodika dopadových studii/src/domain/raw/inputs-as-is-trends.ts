import { z } from "zod";

/**
 * M2 — AS-IS trends (INP-201–205). v2: ČSÚ/Eurostat feeds per spec MVP table.
 */
export const asIsTrendInputsSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  /** INP-201 */
  popT0: z.number().int().nonnegative().optional(),
  /** INP-202 */
  ageGroups: z
    .object({
      age0to14: z.number().nonnegative(),
      age15to64: z.number().nonnegative(),
      age65plus: z.number().nonnegative(),
    })
    .optional(),
  /** INP-203 */
  migrationBalancePerYear: z.number().optional(),
  /** INP-204 */
  naceShares: z.record(z.number()).optional(),
  /** INP-205 — OQ-03 */
  v0VkNTrend: z.record(z.unknown()).optional(),

  extension: z.record(z.unknown()).optional(),
});

export type AsIsTrendInputs = z.infer<typeof asIsTrendInputsSchema>;
