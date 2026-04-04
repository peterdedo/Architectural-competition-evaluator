"use client";

import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { EngineWarning } from "@/lib/mhdsi/calculations/types";
import { uxWizard } from "../ux/studio-ux-copy";
import {
  inferUncertainAreaLabel,
  warningSeverity,
  warningSeverityLabel,
  warningTitleLine,
} from "../ux/warning-card-meta";

const NUM_STEPS = 10;

export const WizardSummaryPanel = memo(function WizardSummaryPanel({
  currentStep,
  missingCount,
  baselineWarnings,
  hasBaselineResult,
}: {
  currentStep: number;
  missingCount: number;
  baselineWarnings: EngineWarning[];
  hasBaselineResult: boolean;
}) {
  const top = baselineWarnings.slice(0, 3);
  const uncertain = inferUncertainAreaLabel(baselineWarnings);

  return (
    <Card className="h-fit lg:sticky lg:top-4">
      <CardHeader className="py-3">
        <CardTitle className="text-base">{uxWizard.summary.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="text-muted-foreground">{uxWizard.summary.completeness}</p>
          <p className="font-medium">
            Krok {currentStep + 1} z {NUM_STEPS}
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-muted-foreground">{uxWizard.summary.missing}</p>
          <p className="font-medium">
            {missingCount === 0
              ? "Žádné blokující chyby ve vstupech (kroky 1–8)."
              : `${missingCount} krok(ů) s chybami nebo upozorněními validace`}
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-muted-foreground">{uxWizard.summary.resultsOk}</p>
          <p className="font-medium">
            {hasBaselineResult
              ? uxWizard.summary.resultsYes
              : uxWizard.summary.resultsNo}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {uxWizard.summary.resultsHint}
          </p>
        </div>
        <Separator />
        <div>
          <p className="text-muted-foreground">{uxWizard.summary.topWarnings}</p>
          {top.length === 0 ? (
            <p className="text-muted-foreground">{uxWizard.summary.none}</p>
          ) : (
            <ul className="mt-1 space-y-2">
              {top.map((w, i) => (
                <li key={i} className="text-xs leading-snug">
                  <span className="line-clamp-2 font-medium text-foreground">
                    {warningTitleLine(w)}
                  </span>
                  <span
                    className="mt-0.5 block text-[10px] text-muted-foreground"
                    title={`Kód: ${w.code}`}
                  >
                    {warningSeverityLabel(warningSeverity(w.code))}
                    <span className="sr-only">; kód {w.code}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {uncertain ? (
          <>
            <Separator />
            <div>
              <p className="text-muted-foreground">
                {uxWizard.summary.uncertainModule}
              </p>
              <p className="font-medium">{uncertain}</p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
});
