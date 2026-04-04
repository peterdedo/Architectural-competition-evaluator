import { WARNING_CODE_AGENCY_SHARE_RISK } from "@/lib/mhdsi/calculations/employment";
import type { MethodologyReportSnapshot } from "./types";

export function baselineHasAgencyShareRisk(
  snapshot: MethodologyReportSnapshot,
): boolean {
  return snapshot.primaryKpiAndModules.baseline.warnings.some(
    (w) => w.code === WARNING_CODE_AGENCY_SHARE_RISK,
  );
}

/** True pokud riziko platí pro střední scénář nebo alespoň jeden další běh. */
export function snapshotUnionHasAgencyShareRisk(
  snapshot: MethodologyReportSnapshot,
): boolean {
  return snapshot.m7_scenario_consolidation.consolidatedRisks.warningCodesUnion.includes(
    WARNING_CODE_AGENCY_SHARE_RISK,
  );
}
