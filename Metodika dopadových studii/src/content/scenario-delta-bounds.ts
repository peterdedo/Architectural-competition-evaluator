import type { ScenarioKind } from "@/features/studio/wizard-types";

/**
 * Klíče scénářových odchylek, které engine a průvodce očekávají.
 * M_i je v demo/persist, i když v kroku 3 není ve formuláři — stále validovat 0–1.
 */
export const SCENARIO_DELTA_ALLOWED_KEYS = new Set<string>([
  "util_RZPS",
  "theta",
  "p_pendler",
  "k_inv",
  "M_i",
]);

/** Klíče zobrazené v kroku 3 — shodné s `uxWizard.scenarioDeltaFields`. */
export const SCENARIO_DELTA_UI_KEYS = [
  "util_RZPS",
  "theta",
  "p_pendler",
  "k_inv",
] as const;

export type ScenarioDeltaUiKey = (typeof SCENARIO_DELTA_UI_KEYS)[number];

/** Min/max/step pro HTML input — musí odpovídat Zod (0–1) u všech povolených klíčů. */
export const SCENARIO_DELTA_INPUT_META: Record<
  ScenarioDeltaUiKey | "M_i",
  { min: number; max: number; step: string }
> = {
  util_RZPS: { min: 0, max: 1, step: "0.01" },
  theta: { min: 0, max: 1, step: "0.001" },
  p_pendler: { min: 0, max: 1, step: "0.001" },
  k_inv: { min: 0, max: 1, step: "0.01" },
  M_i: { min: 0, max: 1, step: "0.01" },
};

export function scenarioDeltaFieldErrorPath(
  kind: ScenarioKind,
  param: string,
): string {
  return `scenarioAssumptionDelta.${kind}.${param}`;
}
