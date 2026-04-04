import { z } from "zod";

/**
 * M5 — civic amenities (INP-501–511).
 * `OU` often derived from M4 — may be duplicated here for scenario snapshot.
 */
export const civicAmenityInputsSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  /** INP-501 */
  ou: z.number().nonnegative().optional(),
  /** INP-502–503 */
  capRegMsZs: z.record(z.number()).optional(),
  enrolledMsZs: z.record(z.number()).optional(),
  /** INP-504–505 */
  stdMsPer1000: z.number().nonnegative().optional(),
  stdZsPer1000: z.number().nonnegative().optional(),
  /** INP-506–507 */
  freeCapFactor: z.number().min(0).max(1).optional(),
  bedsPer1000: z.number().nonnegative().optional(),
  /** INP-508–509 — tables */
  pxSpecialists: z.record(z.unknown()).optional(),
  kstandardLeisure: z.record(z.number()).optional(),
  /** INP-510–511 */
  nCelkemM3: z.number().nonnegative().optional(),
  nAgentCizinci: z.number().nonnegative().optional(),

  extension: z.record(z.unknown()).optional(),
});

export type CivicAmenityInputs = z.infer<typeof civicAmenityInputsSchema>;
