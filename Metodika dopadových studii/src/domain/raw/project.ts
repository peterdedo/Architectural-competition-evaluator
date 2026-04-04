import { z } from "zod";
import { aoivuzGeometrySchema } from "../common/geometry";

/**
 * INP-010 — employment structure (table).
 */
export const employmentStructureRowSchema = z.object({
  category: z.string(),
  headcountOrFte: z.number().nonnegative().optional(),
  wageBandCzk: z.number().nonnegative().optional(),
  shifts: z.string().optional(),
  extension: z.record(z.unknown()).optional(),
});

export type EmploymentStructureRow = z.infer<
  typeof employmentStructureRowSchema
>;

/**
 * M0 — project and intent (INP-001–012).
 * MVP vs optional fields: see docs/mhdsi-domain-model.md.
 */
export const projectSchema = z.object({
  id: z.string().uuid(),

  /** INP-001 */
  projectName: z.string().min(1),
  /** INP-002 */
  locationDescription: z.string().min(1),
  /**
   * INP-003 — WGS84 polygon / bod záměru (EXPLICIT).
   * MVP: ve spec je povinný údaj pro strukturu DS; pokud je dočasně nahrazen
   * ručním AOIS v `TerritorialDefinition`, validuje aplikační vrstva.
   */
  aoivuzGeom: aoivuzGeometrySchema.optional(),
  /** INP-004 — capacities, areas, production (structured bag) */
  scopeCapacity: z.record(z.unknown()),
  /** INP-005 */
  czNace: z.string().min(1),
  /** INP-006 */
  capexTotalCzk: z.number().nonnegative(),
  /** INP-009 */
  nInv: z.number().int().nonnegative(),
  /** INP-010 */
  employmentStructure: z.array(employmentStructureRowSchema).min(1),

  investorId: z.string().uuid(),
  /** INP-007–008 — linked timeline entity */
  projectTimelineId: z.string().uuid(),

  /** INP-012 — CONFIGURABLE_ASSUMPTION / narrative */
  strategicLinks: z.string().optional(),

  extension: z.record(z.unknown()).optional(),
});

export type Project = z.infer<typeof projectSchema>;
