"use client";

import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { EngineWarning } from "@/lib/mhdsi/calculations/types";
import { uxWizard } from "../ux/studio-ux-copy";
import { resolveWarningFieldNavigation } from "../warning-field-navigation";
import type { ScenarioKind } from "../wizard-types";
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
  onNavigateToWarningField,
  onGoToFirstInvalidStep,
}: {
  currentStep: number;
  missingCount: number;
  baselineWarnings: EngineWarning[];
  hasBaselineResult: boolean;
  onNavigateToWarningField?: (field: string) => void;
  onGoToFirstInvalidStep?: () => void;
}) {
  const top = baselineWarnings.slice(0, 3);
  const uncertain = inferUncertainAreaLabel(baselineWarnings);
  const navScenario: ScenarioKind = "baseline";

  return (
    <Card className="h-fit border-border/40 bg-muted/10 shadow-none lg:sticky lg:top-4">
      <CardHeader className="space-y-0 py-2.5 pb-2">
        <CardTitle className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {uxWizard.summary.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5 pb-4 pt-0 text-xs text-muted-foreground">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
            {uxWizard.summary.completeness}
          </p>
          <p className="mt-0.5 text-sm text-foreground/90">
            Krok {currentStep + 1} z {NUM_STEPS}
          </p>
        </div>

        <Separator className="bg-border/40" />

        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
            {uxWizard.summary.missing}
          </p>
          <p className="mt-0.5 text-sm text-foreground/85">
            {missingCount === 0
              ? "Žádné blokující chyby ve vstupech (kroky 1–8)."
              : `${missingCount} krok(ů) s chybami nebo upozorněními validace`}
          </p>
          {missingCount > 0 && onGoToFirstInvalidStep ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-2 h-7 w-full border-border/50 text-[11px] font-normal"
              onClick={onGoToFirstInvalidStep}
            >
              {uxWizard.summary.firstStepWithErrors}
            </Button>
          ) : null}
        </div>

        <Separator className="bg-border/40" />

        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
            {uxWizard.summary.resultsOk}
          </p>
          <p className="mt-0.5 text-sm text-foreground/85">
            {hasBaselineResult
              ? uxWizard.summary.resultsYes
              : uxWizard.summary.resultsNo}
          </p>
          <p className="mt-1 text-[11px] leading-snug text-muted-foreground/85">
            {uxWizard.summary.resultsHint}
          </p>
        </div>

        <Separator className="bg-border/40" />

        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
            {uxWizard.summary.topWarnings}
          </p>
          {top.length === 0 ? (
            <p className="mt-0.5 text-[11px]">{uxWizard.summary.none}</p>
          ) : (
            <ul className="mt-1.5 space-y-2.5">
              {top.map((w, i) => {
                const field = w.field;
                const canNav =
                  Boolean(field && onNavigateToWarningField) &&
                  Boolean(
                    field && resolveWarningFieldNavigation(field, navScenario),
                  );
                return (
                  <li key={i} className="text-[11px] leading-snug">
                    <span className="line-clamp-2 text-foreground/85">
                      {warningTitleLine(w)}
                    </span>
                    <span
                      className="mt-0.5 block text-[10px] text-muted-foreground/80"
                      title={`Kód: ${w.code}`}
                    >
                      {warningSeverityLabel(warningSeverity(w.code))}
                      <span className="sr-only">; kód {w.code}</span>
                    </span>
                    {canNav && field ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="mt-1.5 h-7 w-full border-border/50 text-[10px] font-normal"
                        onClick={() => onNavigateToWarningField?.(field)}
                      >
                        {uxWizard.summary.warningNavigateToField}
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {uncertain ? (
          <>
            <Separator className="bg-border/40" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                {uxWizard.summary.uncertainModule}
              </p>
              <p className="mt-0.5 text-sm text-foreground/85">{uncertain}</p>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
});
