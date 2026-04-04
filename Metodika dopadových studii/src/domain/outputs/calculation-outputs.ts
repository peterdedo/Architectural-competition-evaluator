import { z } from "zod";
import { vypBlockIdSchema } from "../modules";

/**
 * Aggregated outputs per VYP block (calculated outputs layer).
 * Keys align with PDF VYP steps; values are module-specific bags.
 */
export const vypBlockOutputSchema = z.object({
  vypId: vypBlockIdSchema,
  payload: z.record(z.unknown()),
});

export type VypBlockOutput = z.infer<typeof vypBlockOutputSchema>;

/**
 * VYP_2.1_5 — tabular employment output (explicit table in PDF).
 */
export const employmentTableV215Schema = z.object({
  rows: z.array(z.record(z.union([z.string(), z.number(), z.null()]))),
});

export const calculationOutputsSchema = z.object({
  /** Ordered list of block outputs */
  vypBlocks: z.array(vypBlockOutputSchema),
  /** Consolidated scalars for reporting */
  summary: z.record(z.unknown()).optional(),
});

export type CalculationOutputs = z.infer<typeof calculationOutputsSchema>;
