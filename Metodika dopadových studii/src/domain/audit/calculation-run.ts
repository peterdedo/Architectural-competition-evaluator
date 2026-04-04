import { z } from "zod";
import { derivedValuesBlockSchema } from "../derived/derived-values";
import { calculationOutputsSchema } from "../outputs/calculation-outputs";

export const calculationRunStatusSchema = z.enum([
  "pending",
  "running",
  "completed",
  "failed",
]);

export type CalculationRunStatus = z.infer<typeof calculationRunStatusSchema>;

/**
 * One execution of the pipeline for a project + scenario (audit + outputs).
 */
export const calculationRunSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  scenarioId: z.string().uuid(),
  assumptionSetId: z.string().uuid(),

  status: calculationRunStatusSchema,
  startedAt: z.string().datetime(),
  finishedAt: z.string().datetime().optional(),

  /** Immutable snapshot IDs or embedded hashes of raw inputs used */
  inputSnapshotRef: z.string().min(1),

  /** Derived layer — filled when status completed */
  derived: derivedValuesBlockSchema.optional(),

  /** Calculated outputs — VYP blocks + summary */
  outputs: calculationOutputsSchema.optional(),

  errorMessage: z.string().optional(),

  extension: z.record(z.unknown()).optional(),
});

export type CalculationRun = z.infer<typeof calculationRunSchema>;
