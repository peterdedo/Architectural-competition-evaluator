import { z } from "zod";

/**
 * Katalog pravidel ve spec: kvalita — škála 1–5 (EXPLICIT_IN_METHODOLOGY).
 * V tabulce INP v system spec **není** přidělené INP-*; slouží k M6/M8 a reportu.
 * Rozsah kritérií = OPEN_QUESTION (doplnit dle PDF oddílu kvalita).
 */
export const impactQualityInputSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),
  /** Agregát nebo jediné kritérium — detail rozpadu v extension / v2 */
  qualityLikert1To5: z.number().int().min(1).max(5).optional(),
  extension: z.record(z.unknown()).optional(),
});

export type ImpactQualityInput = z.infer<typeof impactQualityInputSchema>;
