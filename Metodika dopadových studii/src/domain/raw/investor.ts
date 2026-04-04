import { z } from "zod";

/**
 * INP-011 — `investor_profile`: investor, právní forma (jedno textové pole ve spec).
 *
 * DTO rozklad na dvě vlastnosti je **pohled na stejný vstup** (validace aplikace může
 * vyžadovat obě části); není druhý samostatný INP.
 */
export const investorSchema = z.object({
  id: z.string().uuid(),
  investorProfile: z.string().min(1),
  legalForm: z.string().min(1),
  extension: z.record(z.unknown()).optional(),
});

export type Investor = z.infer<typeof investorSchema>;
