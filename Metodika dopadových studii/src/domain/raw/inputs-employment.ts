import { z } from "zod";

/**
 * M3 — employment module raw inputs (INP-301–316).
 */
export const employmentInputsSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  /** INP-301 */
  kInv: z.number().min(0).max(1).optional(),
  /** INP-302–304 */
  aUp: z.number().nonnegative().optional(),
  bUp: z.number().nonnegative().optional(),
  cUp: z.number().nonnegative().optional(),
  /** INP-305–306 — often from AssumptionSet */
  gamma: z.number().nonnegative().optional(),
  delta: z.number().nonnegative().optional(),
  /** INP-307 */
  utilRzps: z.number().min(0).max(1).optional(),
  /** INP-308–309 */
  mNewCzk: z.number().nonnegative().optional(),
  mRegionCzk: z.number().nonnegative().optional(),
  /** INP-310 */
  alphaElast: z.number().min(0).max(1).optional(),
  /** INP-311–312 */
  npVm: z.number().nonnegative().optional(),
  npTotal: z.number().nonnegative().optional(),
  /** INP-313–314 */
  zI: z.number().nonnegative().optional(),
  mI: z.number().min(0).max(1).optional(),
  /** INP-315 */
  nSub: z.number().nonnegative().optional(),
  /** INP-316 */
  pPendler: z.number().min(0).max(1).optional(),

  extension: z.record(z.unknown()).optional(),
});

export type EmploymentInputs = z.infer<typeof employmentInputsSchema>;
