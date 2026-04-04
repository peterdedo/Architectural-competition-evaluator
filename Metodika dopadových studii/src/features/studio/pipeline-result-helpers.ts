import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";

/** Sloučí `assumptionsUsed` ze všech modulů pipeline (M3–M6) pro přehledné UI. */
export function mergeModuleAssumptionsUsed(
  r: FullCalculationPipelineResult | null | undefined,
): Record<string, string | number | boolean> {
  if (!r) return {};
  return {
    ...r.employment.assumptionsUsed,
    ...r.housing.assumptionsUsed,
    ...r.civic.assumptionsUsed,
    ...r.economic.assumptionsUsed,
  };
}
