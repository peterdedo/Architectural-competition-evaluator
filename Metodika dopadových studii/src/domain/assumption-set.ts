import { z } from "zod";
import type { AssumptionKey } from "./assumptions-registry";

/**
 * Versioned parameter bundle — CONFIGURABLE_ASSUMPTION keys from spec + PDF page refs.
 */
export const assumptionSourceRefSchema = z.object({
  pdfPageApprox: z.number().int().positive().optional(),
  label: z.string().optional(),
});

export type AssumptionSourceRef = z.infer<typeof assumptionSourceRefSchema>;

export const assumptionSetSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  /** Semantic version for audit (e.g. MHDSI-1.7-2026Q1) */
  methodologyConfigVersion: z.string().min(1),
  createdAt: z.string().datetime(),

  /**
   * Overrides for known keys (AssumptionKeys) + EXTENSIBLE string keys.
   */
  overrides: z.record(z.union([z.number(), z.string(), z.boolean()])).default({}),

  /**
   * Per-key provenance — same keys as `overrides` where applicable.
   */
  sourceRefs: z.record(assumptionSourceRefSchema).optional(),

  extension: z.record(z.unknown()).optional(),
});

export type AssumptionSet = z.infer<typeof assumptionSetSchema>;

/** Typed helper — keys are AssumptionKey | string */
export type AssumptionOverrides = Partial<Record<AssumptionKey | string, number | string | boolean>>;
