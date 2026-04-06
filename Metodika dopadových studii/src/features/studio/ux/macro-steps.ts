/** Mapování interního kroku 0–9 na viditelný makrokrok 0–5 (P1 + Fáze F). */

import { uxWizard } from "./studio-ux-copy";

/** První interní krok průvodce pro daný makrokrok (pro navigaci z lišty). */
export const MACRO_FIRST_WIZARD_STEP = [0, 1, 2, 3, 4, 8] as const;

export function firstWizardStepForMacro(macroIndex: number): number {
  if (macroIndex < 0 || macroIndex >= MACRO_FIRST_WIZARD_STEP.length) return 0;
  return MACRO_FIRST_WIZARD_STEP[macroIndex];
}

export function getMacroStepIndex(currentStep: number): number {

  if (currentStep === 0) return 0;

  if (currentStep === 1) return 1;

  if (currentStep === 2) return 2;

  if (currentStep === 3) return 3;

  if (currentStep >= 4 && currentStep <= 7) return 4;

  return 5;

}

/** Lidský název makrofáze pro daný interní krok (6 tematických bloků nahoře). */
export function macroPhaseLabelForWizardStep(currentStep: number): string {
  const idx = getMacroStepIndex(currentStep);
  const m = uxWizard.macroSteps[idx];
  return m?.label ?? "";
}

