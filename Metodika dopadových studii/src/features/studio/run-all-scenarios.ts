import { runFullCalculationPipeline } from "@/lib/mhdsi/calculations/run-pipeline";
import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import { wizardStateToPipelineInput } from "./map-to-pipeline";
import { SCENARIO_ORDER, type ScenarioKind, type WizardState } from "./wizard-types";

/** Spustí pipeline pro všechny tři scénáře — pouze volání jádra. */
export function runAllScenarioPipelines(
  state: WizardState,
): Record<ScenarioKind, FullCalculationPipelineResult> {
  const out = {} as Record<ScenarioKind, FullCalculationPipelineResult>;
  for (const kind of SCENARIO_ORDER) {
    out[kind] = runFullCalculationPipeline(
      wizardStateToPipelineInput(state, kind),
    );
  }
  return out;
}
