"use client";

import type { MethodologyReportSnapshot } from "../types";
import { ReportSnapshotRenderer } from "./ReportSnapshotRenderer";

export function ReportDocument({
  snapshot,
}: {
  snapshot: MethodologyReportSnapshot;
}) {
  return <ReportSnapshotRenderer snapshot={snapshot} variant="screen" />;
}
