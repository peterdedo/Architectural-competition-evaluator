import { z } from "zod";

/**
 * INP-003 `AOIVuz_geom` — polygon or definitional point (WGS84).
 * EXTENSIBLE: full GeoJSON validation may be added in v2.
 */
export const aoivuzGeometrySchema = z
  .object({
    type: z.enum(["Point", "Polygon", "MultiPolygon"]),
    coordinates: z.unknown(),
  })
  .passthrough();

export type AoivuzGeometry = z.infer<typeof aoivuzGeometrySchema>;

export const wgs84PointSchema = z.object({
  lon: z.number(),
  lat: z.number(),
});

export type Wgs84Point = z.infer<typeof wgs84PointSchema>;
