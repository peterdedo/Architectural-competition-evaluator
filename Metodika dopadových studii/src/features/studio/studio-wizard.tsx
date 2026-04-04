"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { runAllScenarioPipelines } from "./run-all-scenarios";
import { validateWizardStep } from "./wizard-schema";
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

  const progressPct = ((currentStep + 1) / NUM_STEPS) * 100;

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

  return (
    <div className="studio-shell mx-auto min-h-screen max-w-6xl space-y-6 px-4 pb-24 pt-6">
      <WizardHeader />

      {/* Banner — pouze info, bez blokování pohledu */}
      <p className="rounded-md border border-dashed border-muted-foreground/25 bg-muted/30 px-3 py-2 text-xs text-muted-foreground leading-snug">
        {cs.usability.studioBanner}
      </p>

      <div className="space-y-3">
        <MacroProgressBar currentStep={currentStep} />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            {cs.wizard.progress(currentStep + 1, NUM_STEPS)}
          </span>
          <Progress value={progressPct} className="h-1.5 flex-1 max-w-[200px]" />
          <span className="text-xs font-medium text-foreground">
            {Math.round(progressPct)} %
          </span>
        </div>
        {showRestoredInputsHint && currentStep === 0 ? (
          <p className="text-xs text-muted-foreground/90 leading-snug">
            {cs.usability.restoredInputsHint}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(260px,300px)] lg:items-start">
        <Card className="min-w-0 border-border/80 shadow-sm">
          <CardHeader className="space-y-1 pb-2">
            <WizardStepHeader stepIndex={currentStep} />
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
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

        <WizardSummaryConnector />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border/60 pt-4">
        <Button
          type="button"
          variant="ghost"
          disabled={currentStep === 0 || pipelineBusy}
          onClick={goBack}
        >
          ← {cs.wizard.back}
        </Button>
        {currentStep < NUM_STEPS - 1 ? (
          <div className="flex flex-col items-end gap-1">
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
              <p className="max-w-xs text-right text-xs text-muted-foreground">
                {cs.wizard.calculatingHint}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
