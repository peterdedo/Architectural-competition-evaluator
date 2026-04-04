import { z } from "zod";
import { vypBlockIdSchema } from "../modules";

const mhdsiModuleIdSchema = z.enum([
  "M0",
  "M1",
  "M2",
  "M3",
  "M4",
  "M5",
  "M6",
  "M7",
  "M8",
]);

/**
 * Single audit step — links formula / VYP to inputs snapshot and numeric output.
 */
export const calculationTraceEntrySchema = z.object({
  stepIndex: z.number().int().nonnegative(),
  module: mhdsiModuleIdSchema,
  vypId: vypBlockIdSchema.optional(),
  /** e.g. DRV-007, formula step id */
  formulaId: z.string().optional(),
  /** Input identifiers / values used (redacted in exports if needed) */
  inputRefs: z.record(z.unknown()),
  output: z.unknown(),
  openQuestionRefs: z.array(z.string()).optional(),
});

export type CalculationTraceEntry = z.infer<typeof calculationTraceEntrySchema>;

/** `runId` musí odpovídat `CalculationRun.id` (jedna větev identity). */
export const calculationTraceSchema = z.object({
  runId: z.string().uuid(),
  entries: z.array(calculationTraceEntrySchema),
});

export type CalculationTrace = z.infer<typeof calculationTraceSchema>;
