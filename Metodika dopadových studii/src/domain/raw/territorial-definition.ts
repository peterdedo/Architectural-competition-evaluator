import { z } from "zod";
import { wgs84PointSchema } from "../common/geometry";

/**
 * INP-106 — routing/isochrone engine (CONFIGURABLE).
 */
export const isochroneEngineSchema = z.enum([
  "openrouteservice",
  "esri",
  "custom",
  "manual",
]);

export type IsochroneEngine = z.infer<typeof isochroneEngineSchema>;

/**
 * M1 — territory, isochrones, buffers (INP-101–108).
 * MVP: manual polygon OR municipality list; manual `d_last_mile`; no mandatory ORS (spec).
 */
export const territorialDefinitionSchema = z.object({
  id: z.string().uuid(),
  projectId: z.string().uuid(),

  /** INP-101 */
  entryPointLonLat: wgs84PointSchema.optional(),
  /** INP-102 — Euclidean last-mile distance (km) */
  dLastMileKm: z.number().nonnegative().optional(),
  /**
   * INP-103–105 — minuty CONFIGURABLE.
   * Precedence pro výpočet: `AssumptionSet.overrides` (scénář) má přednost před tímto záznamem.
   */
  diadPrMinutes: z.number().positive().optional(),
  diadAkMinutes: z.number().positive().optional(),
  /** INP-105 — infrastructure time correction (min) — OQ-01 */
  tinfrMinutes: z.number().optional(),

  /** INP-106 — v2: automated isochrones */
  isochroneEngine: isochroneEngineSchema.optional(),

  /** INP-107 — buffer for settlement parts (m) */
  bufferCobceM: z.number().positive().optional(),

  /** INP-108 — RÚIAN / admin boundaries reference (GIS handles in v2) */
  adminBoundaries: z.unknown().optional(),

  /**
   * MVP alternative: list of municipality codes / IDs when full GIS deferred.
   */
  municipalityCodes: z.array(z.string()).optional(),

  /** Manual AOIS polygon(s) when not from engine — disks not rings per PDF */
  aoisPolygonsManual: z.unknown().optional(),

  extension: z.record(z.unknown()).optional(),
});

export type TerritorialDefinition = z.infer<typeof territorialDefinitionSchema>;
