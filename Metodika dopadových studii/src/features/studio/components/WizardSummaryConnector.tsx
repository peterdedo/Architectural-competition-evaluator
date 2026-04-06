"use client";

import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import { useWizardStore } from "../wizard-store";
import { validateWizardStep } from "../wizard-schema";
import type { StudioStore } from "../wizard-types";
import { EMPTY_WARNINGS } from "../wizard-ui-constants";
import { WizardSummaryPanel } from "./WizardSummaryPanel";

function countIncompleteSteps(state: StudioStore["state"]): number {
  let n = 0;
  for (let i = 0; i < 8; i++) {
    const v = validateWizardStep(i, state);
    if (!v.ok) n++;
  }
  return n;
}

/** Izolovaný subscribe — hlavní průvodce nemusí držet celý `state`. */
export function WizardSummaryConnector({
  onNavigateToWarningField,
  onGoToFirstInvalidStep,
}: {
  onNavigateToWarningField?: (field: string) => void;
  onGoToFirstInvalidStep?: () => void;
} = {}) {
  const { currentStep, state, baseline } = useWizardStore(
    useShallow((s) => ({
      currentStep: s.currentStep,
      state: s.state,
      baseline: s.results.baseline,
    })),
  );

  const missingCount = useMemo(
    () => countIncompleteSteps(state),
    [state],
  );

  const baselineWarnings = baseline?.allWarnings ?? EMPTY_WARNINGS;

  return (
    <WizardSummaryPanel
      currentStep={currentStep}
      missingCount={missingCount}
      baselineWarnings={baselineWarnings}
      hasBaselineResult={!!baseline}
      onNavigateToWarningField={onNavigateToWarningField}
      onGoToFirstInvalidStep={onGoToFirstInvalidStep}
    />
  );
}
