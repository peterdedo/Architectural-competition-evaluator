"use client";

import { memo } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InfoTip } from "@/components/info-tip";
import { macroPhaseLabelForWizardStep } from "../ux/macro-steps";
import { uxWizard } from "../ux/studio-ux-copy";

const NUM_STEPS = 10;

export const WizardStepHeader = memo(function WizardStepHeader({
  stepIndex,
}: {
  stepIndex: number;
}) {
  const title = uxWizard.stepTitles[stepIndex] ?? "";
  const intro = uxWizard.stepIntros[stepIndex] ?? "";
  const phase = macroPhaseLabelForWizardStep(stepIndex);
  const ctxType = uxWizard.stepContextType[stepIndex];
  const ctxLabel = ctxType ? uxWizard.stepContextLabel[ctxType] : undefined;
  const ctxTip = ctxType ? uxWizard.stepContextTip[ctxType] : undefined;

  return (
    <>
      <p
        className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground"
        aria-live="polite"
      >
        Krok {stepIndex + 1} z {NUM_STEPS}
        {phase ? (
          <>
            {" "}
            · <span className="normal-case text-foreground/80">{phase}</span>
          </>
        ) : null}
      </p>
      <div className="flex flex-wrap items-start gap-2">
        <CardTitle className="flex-1 text-xl font-semibold tracking-tight text-foreground md:text-2xl">
          {title}
        </CardTitle>
        {ctxLabel && ctxTip && (
          <div className="flex items-center gap-1 pt-1">
            <Badge
              variant="outline"
              className="border-border/60 text-[10px] font-normal text-muted-foreground"
            >
              {ctxLabel}
            </Badge>
            <InfoTip
              text={ctxTip}
              side="bottom"
              align="end"
              sideOffset={8}
              collisionPadding={16}
              ariaLabel={`Vysvětlení: ${ctxLabel}`}
            />
          </div>
        )}
      </div>
      <CardDescription className="text-sm leading-relaxed text-muted-foreground">
        {intro}
      </CardDescription>
      <details className="rounded-md border border-dashed border-border/50 bg-transparent px-2.5 py-1.5">
        <summary className="cursor-pointer text-[11px] text-muted-foreground/90 underline-offset-2 hover:text-muted-foreground">
          {uxWizard.summary.expertNoteTitle}
        </summary>
        <p className="pt-1.5 text-[11px] leading-relaxed text-muted-foreground/85">
          {uxWizard.summary.expertNoteBody}
        </p>
      </details>
    </>
  );
});
