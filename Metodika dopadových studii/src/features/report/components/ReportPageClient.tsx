"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { buildMethodologyReportSnapshot } from "../build-report-snapshot";
import { reportCs } from "../report-copy-cs";
import { TRUST_NUMBERS_FOOTNOTE } from "@/content/trust-framing-cs";
import { useWizardStore } from "@/features/studio/wizard-store";
import { ExportToolbar } from "./ExportToolbar";
import { ReportDocument } from "./ReportDocument";
import { ReportEmptyState } from "./ReportEmptyState";

export function ReportPageClient() {
  const { state, results } = useWizardStore();

  const snapshot = useMemo(
    () => buildMethodologyReportSnapshot(state, results),
    [state, results],
  );

  if (!snapshot) {
    return <ReportEmptyState variant="screen" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/studio">{reportCs.linkStudio}</Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href="/report/print">{reportCs.print.linkPrintView}</Link>
          </Button>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">{reportCs.linkHome}</Link>
        </Button>
      </div>
      <div
        className="mx-4 rounded-lg border border-border/70 bg-muted/25 px-4 py-3"
        aria-labelledby="report-edit-wizard-heading"
      >
        <h2
          id="report-edit-wizard-heading"
          className="text-sm font-semibold text-foreground"
        >
          {reportCs.editWizard.title}
        </h2>
        <p className="mt-1 text-xs leading-snug text-muted-foreground">
          {reportCs.editWizard.hint}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="default" size="sm" asChild>
            <Link href="/studio">{reportCs.editWizard.openWizard}</Link>
          </Button>
          {reportCs.editWizard.steps.map(({ step, label }) => (
            <Button key={step} variant="outline" size="sm" asChild>
              <Link href={`/studio?step=${step}`}>{label}</Link>
            </Button>
          ))}
        </div>
      </div>
      <div className="px-4 space-y-2">
        <ExportToolbar state={state} results={results} snapshot={snapshot} />
        <p className="text-xs text-muted-foreground leading-snug max-w-3xl">
          {reportCs.pageToolbarHint} {TRUST_NUMBERS_FOOTNOTE}
        </p>
      </div>
      <ReportDocument snapshot={snapshot} />
    </div>
  );
}
