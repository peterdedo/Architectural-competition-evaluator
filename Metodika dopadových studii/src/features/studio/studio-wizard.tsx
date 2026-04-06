"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { runAllScenarioPipelines } from "./run-all-scenarios";
import { firstInvalidWizardStepIndex, validateWizardStep } from "./wizard-schema";
import {
  hasPersistedWizardStateInBrowserStorage,
  useWizardStore,
} from "./wizard-store";
import { cs } from "./studio-copy";
import { resolveWarningFieldNavigation } from "./warning-field-navigation";
import type { ScenarioKind } from "./wizard-types";
import { scrollToWizardField } from "./studio-wizard-shared";
import { AssumptionsPanelConnected } from "./components/AssumptionsPanel";
import { MacroProgressBar } from "./components/MacroProgressBar";
import { WizardHeader } from "./components/WizardHeader";
import { WizardStepHeader } from "./components/WizardStepHeader";
import { WizardSummaryConnector } from "./components/WizardSummaryConnector";
import { uxWizard } from "./ux/studio-ux-copy";
import { WizardStep0 } from "./steps/wizard-step-0";
import { WizardStep1 } from "./steps/wizard-step-1";
import { WizardStep2 } from "./steps/wizard-step-2";
import { WizardStep3 } from "./steps/wizard-step-3";
import { WizardStep4 } from "./steps/wizard-step-4";
import { WizardStep5 } from "./steps/wizard-step-5";
import { WizardStep6 } from "./steps/wizard-step-6";
import { WizardStep7 } from "./steps/wizard-step-7";

const ResultsStudioViewLazy = dynamic(
  () =>
    import("./components/ResultsStudioView").then((m) => ({
      default: m.ResultsStudioView,
    })),
  {
    ssr: false,
    loading: () => (
      <p className="text-sm text-muted-foreground">Načítám obrazovku výsledků…</p>
    ),
  },
);

const NUM_STEPS = 10;

export function StudioWizard() {
  const currentStep = useWizardStore((s) => s.currentStep);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [expandedIntermediate, setExpandedIntermediate] = useState(false);
  const [showRestoredInputsHint, setShowRestoredInputsHint] = useState(false);
  const [pipelineBusy, setPipelineBusy] = useState(false);

  useEffect(() => {
    const applyHint = () => {
      if (useWizardStore.getState().currentStep !== 0) return;
      if (!hasPersistedWizardStateInBrowserStorage()) return;
      setShowRestoredInputsHint(true);
    };
    const unsub = useWizardStore.persist.onFinishHydration(applyHint);
    if (useWizardStore.persist.hasHydrated()) applyHint();
    return unsub;
  }, []);

  const goNext = useCallback(() => {
    const st = useWizardStore.getState();
    if (pipelineBusy) return;
    if (st.currentStep < 8) {
      const v = validateWizardStep(st.currentStep, st.state);
      setFieldErrors(v.fieldErrors);
      if (!v.ok) return;
    }
    if (st.currentStep === 7) {
      setPipelineBusy(true);
      window.setTimeout(() => {
        const s = useWizardStore.getState();
        const r = runAllScenarioPipelines(s.state);
        s.setResults(r);
        s.setStep(8);
        setPipelineBusy(false);
      }, 0);
      return;
    }
    st.setStep(st.currentStep + 1);
  }, [pipelineBusy]);

  const goBack = useCallback(() => {
    const s = useWizardStore.getState();
    s.setStep(s.currentStep - 1);
  }, []);

  const onNavigateToWarningField = useCallback(
    (field: string, scenario: ScenarioKind) => {
      const nav = resolveWarningFieldNavigation(field, scenario);
      if (!nav) return;
      scrollToWizardField(nav, (n) => useWizardStore.getState().setStep(n));
    },
    [],
  );

  const onNavigateFromAssumptions = useCallback((field: string) => {
    const nav = resolveWarningFieldNavigation(field, "baseline");
    if (nav) {
      scrollToWizardField(nav, (n) => useWizardStore.getState().setStep(n));
    }
  }, []);

  const onSummaryNavigateWarning = useCallback(
    (field: string) => {
      onNavigateToWarningField(field, "baseline");
    },
    [onNavigateToWarningField],
  );

  const onGoToFirstInvalidStep = useCallback(() => {
    const st = useWizardStore.getState();
    const idx = firstInvalidWizardStepIndex(st.state);
    if (idx !== null) st.setStep(idx);
  }, []);

  return (
    <div className="studio-shell mx-auto min-h-screen max-w-6xl space-y-5 px-4 pb-28 pt-5">
      <WizardHeader />

      <details className="group rounded-md border border-border/40 bg-muted/10 text-muted-foreground">
        <summary className="cursor-pointer list-none rounded-md px-3 py-2 text-[11px] font-medium text-muted-foreground marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
          <span className="underline-offset-2 group-open:underline">
            {cs.usability.studioBannerSummary}
          </span>
        </summary>
        <p className="border-t border-border/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground/90">
          {cs.usability.studioBanner}
        </p>
      </details>

      <div className="space-y-2">
        <MacroProgressBar currentStep={currentStep} />
        {showRestoredInputsHint && currentStep === 0 ? (
          <p className="text-[11px] leading-snug text-muted-foreground">
            {cs.usability.restoredInputsHint}
          </p>
        ) : null}
      </div>

      <div className="grid gap-7 lg:grid-cols-[1fr_minmax(240px,280px)] lg:items-start lg:gap-8">
        <Card className="min-w-0 border-border/60 bg-card shadow-sm ring-1 ring-border/30">
          <CardHeader className="space-y-2 border-b border-border/40 bg-muted/5 pb-4 pt-5">
            <WizardStepHeader stepIndex={currentStep} />
          </CardHeader>
          <CardContent className="space-y-6 px-5 pb-6 pt-5 sm:px-6">
            {currentStep === 0 && <WizardStep0 fieldErrors={fieldErrors} />}
            {currentStep === 1 && <WizardStep1 fieldErrors={fieldErrors} />}
            {currentStep === 2 && <WizardStep2 fieldErrors={fieldErrors} />}
            {currentStep === 3 && <WizardStep3 fieldErrors={fieldErrors} />}
            {currentStep === 4 && <WizardStep4 fieldErrors={fieldErrors} />}
            {currentStep === 5 && <WizardStep5 fieldErrors={fieldErrors} />}
            {currentStep === 6 && <WizardStep6 fieldErrors={fieldErrors} />}
            {currentStep === 7 && <WizardStep7 fieldErrors={fieldErrors} />}
            {currentStep === 8 && (
              <ResultsStudioViewLazy
                expandedIntermediate={expandedIntermediate}
                setExpandedIntermediate={setExpandedIntermediate}
                onNavigateToWarningField={onNavigateToWarningField}
              />
            )}
            {currentStep === 9 && (
              <AssumptionsPanelConnected
                onNavigateToWarningField={onNavigateFromAssumptions}
              />
            )}
          </CardContent>
        </Card>

        <WizardSummaryConnector
          onNavigateToWarningField={onSummaryNavigateWarning}
          onGoToFirstInvalidStep={onGoToFirstInvalidStep}
        />
      </div>

      <div
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/80 bg-background/95 shadow-[0_-6px_24px_rgba(0,0,0,0.06)] backdrop-blur supports-[backdrop-filter]:bg-background/85 dark:shadow-[0_-6px_28px_rgba(0,0,0,0.35)]"
        role="navigation"
        aria-label="Navigace mezi kroky průvodce"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Button
            type="button"
            variant="ghost"
            disabled={currentStep === 0 || pipelineBusy}
            onClick={goBack}
          >
            ← {cs.wizard.back}
          </Button>
          {currentStep < NUM_STEPS - 1 ? (
            <div className="flex flex-col items-end gap-1 rounded-md bg-primary/[0.04] p-1 pl-2">
              <Button
                type="button"
                size="default"
                onClick={goNext}
                disabled={pipelineBusy}
                aria-busy={pipelineBusy}
              >
                {pipelineBusy && currentStep === 7
                  ? cs.wizard.calculating
                  : currentStep === 7
                    ? "Vypočítat výsledky →"
                    : `${cs.wizard.next} →`}
              </Button>
              {pipelineBusy && currentStep === 7 ? (
                <p className="max-w-xs text-right text-xs text-foreground/80">
                  {cs.wizard.calculatingHint}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
