"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { buildMethodologyReportSnapshot } from "../build-report-snapshot";
import { reportCs } from "../report-copy-cs";
import { useWizardStore } from "@/features/studio/wizard-store";
import { ReportSnapshotRenderer } from "./ReportSnapshotRenderer";
import { ReportEmptyState } from "./ReportEmptyState";

export function ReportPrintPageClient() {
  const { state, results } = useWizardStore();

  const snapshot = useMemo(
    () => buildMethodologyReportSnapshot(state, results),
    [state, results],
  );

  useEffect(() => {
    if (snapshot?.metadata.title) {
      document.title = `Tisk — ${snapshot.metadata.title}`;
    }
    return () => {
      document.title = "MHDSI — hodnocení dopadů strategických investic";
    };
  }, [snapshot?.metadata.title]);

  if (!snapshot) {
    return <ReportEmptyState variant="print" />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="print-no-print flex flex-wrap items-center justify-between gap-3 border-b bg-muted/30 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => window.print()}>
            {reportCs.print.openPrintDialog}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/report">{reportCs.print.backToScreenReport}</Link>
          </Button>
        </div>
        <p className="max-w-xl text-xs text-muted-foreground">
          {reportCs.print.printHint}
        </p>
      </div>
      <div className="print-report-root bg-white text-black">
        <ReportSnapshotRenderer snapshot={snapshot} variant="print" />
      </div>
    </div>
  );
}
