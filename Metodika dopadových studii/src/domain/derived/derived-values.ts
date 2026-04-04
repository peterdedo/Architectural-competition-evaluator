import { z } from "zod";
import type { MhdsiModuleId } from "../modules";

/**
 * DRV-001–032 — derived variables (spec table "odvozené proměnné").
 * Stored as one object per calculation run / scenario step for traceability.
 */
export const derivedValuesBlockSchema = z.object({
  /** DRV-001 — OQ-02 units */
  tPosmMinutes: z.number().nonnegative().optional(),
  /** DRV-002 */
  diadPrKor: z.number().optional(),
  /** DRV-003 — OQ-01 */
  diadAkKor: z.number().optional(),
  /** DRV-004 */
  aoisPolygons: z.unknown().optional(),
  /** DRV-005 */
  rZap: z.number().min(0).max(1).optional(),
  /** DRV-006 */
  indexAge: z.number().nonnegative().optional(),
  /** DRV-007 */
  nCelkem: z.number().optional(),
  /** DRV-008–009 */
  rzpsRaw: z.number().optional(),
  rzps: z.number().optional(),
  /** DRV-010–012 */
  sM: z.number().optional(),
  sT: z.number().optional(),
  zZtrata: z.number().optional(),
  /** DRV-013–015 */
  nMezera: z.number().optional(),
  nPendlerCalc: z.number().optional(),
  nAgenturaCalc: z.number().optional(),
  /** DRV-016–022 */
  ouA: z.number().optional(),
  ouB: z.number().optional(),
  zu: z.number().optional(),
  zuTByType: z.record(z.number()).optional(),
  unitsTByType: z.record(z.number()).optional(),
  kpn: z.number().optional(),
  eTByType: z.record(z.number()).optional(),
  /** DRV-023–027 */
  demandMs: z.number().optional(),
  demandZs: z.number().optional(),
  freeMsZs: z.number().optional(),
  bedsNeed: z.number().optional(),
  nZarizeni: z.number().optional(),
  /** DRV-028–032 */
  deltaHdp: z.number().optional(),
  taxYield: z.number().optional(),
  cR: z.number().optional(),
  dznm: z.number().optional(),
  /** DRV-032 — část vzorce PRUD (`N_nová × …`) */
  nNovaPrud: z.number().optional(),
  prud: z.number().optional(),

  extension: z.record(z.unknown()).optional(),
});

export type DerivedValuesBlock = z.infer<typeof derivedValuesBlockSchema>;

export interface DerivedVariableMeta {
  id: `DRV-${string}`;
  module: MhdsiModuleId;
}
