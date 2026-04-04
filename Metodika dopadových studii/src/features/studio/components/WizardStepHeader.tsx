"use client";

import { memo } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTip } from "@/components/info-tip";
import { uxWizard } from "../ux/studio-ux-copy";

export const WizardStepHeader = memo(function WizardStepHeader({
  stepIndex,
}: {
  stepIndex: number;
}) {
  const title = uxWizard.stepTitles[stepIndex] ?? "";
  const intro = uxWizard.stepIntros[stepIndex] ?? "";
  const ctxType = uxWizard.stepContextType[stepIndex];
  const ctxLabel = ctxType ? uxWizard.stepContextLabel[ctxType] : undefined;
  const ctxTip = ctxType ? uxWizard.stepContextTip[ctxType] : undefined;

  return (
    <>
      <div className="flex flex-wrap items-start gap-2">
        <CardTitle className="flex-1">{title}</CardTitle>
        {ctxLabel && ctxTip && (
          <div className="flex items-center gap-1 pt-0.5">
            <Badge variant="outline" className="text-[10px] font-normal">
              {ctxLabel}
            </Badge>
            <InfoTip text={ctxTip} side="right" />
          </div>
        )}
      </div>
      <CardDescription className="text-base leading-relaxed">{intro}</CardDescription>
      <details className="rounded-md border bg-muted/30 px-3 py-2">
        <summary className="cursor-pointer text-xs text-muted-foreground">
          {uxWizard.summary.expertNoteTitle}
        </summary>
        <p className="pt-2 text-xs leading-relaxed text-muted-foreground">
          {uxWizard.summary.expertNoteBody}
        </p>
      </details>
    </>
  );
});
