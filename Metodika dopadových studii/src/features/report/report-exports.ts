import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import type { WizardState } from "@/features/studio/wizard-types";
import type { ScenarioKind } from "@/features/studio/wizard-types";
import { SCENARIO_ORDER } from "@/features/studio/wizard-types";
import {
  buildMethodologyReportSnapshot,
  buildPipelineInputsExport,
} from "./build-report-snapshot";
import { stableStringify, downloadJsonFile } from "./stable-json";
import type { MethodologyReportSnapshot } from "./types";

export function serializeWizardState(state: WizardState): string {
  return stableStringify(state);
}

export function serializePipelineResults(
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
): string {
  const payload: Record<string, FullCalculationPipelineResult | null> = {};
  for (const k of SCENARIO_ORDER) {
    payload[k] = results[k];
  }
  return stableStringify(payload);
}

export function serializeReportSnapshot(
  snapshot: MethodologyReportSnapshot,
): string {
  return stableStringify(snapshot);
}

export function serializeScenarioComparisonOnly(
  snapshot: MethodologyReportSnapshot,
): string {
  const m7 = snapshot.m7_scenario_consolidation;
  return stableStringify({
    schemaVersion: snapshot.metadata.schemaVersion,
    m7_scenario_consolidation: {
      scenarioMetrics: m7.scenarioMetrics,
      sensitivitySummary: m7.sensitivitySummary,
      classification: m7.classification,
      consolidatedRisks: m7.consolidatedRisks,
      auditLinks: m7.auditLinks,
    },
  });
}

export function downloadWizardInputsJson(state: WizardState): void {
  const data = buildPipelineInputsExport(state);
  downloadJsonFile(
    `mhdsi-pipeline-inputs-${dateStamp()}.json`,
    stableStringify(data),
  );
}

/** Kompletní `WizardState` (persistovaný stav formuláře) — doplněk k pipeline vstupům. */
export function downloadWizardStateJson(state: WizardState): void {
  downloadJsonFile(
    `mhdsi-wizard-state-${dateStamp()}.json`,
    serializeWizardState(state),
  );
}

export function downloadPipelineResultsJson(
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
): void {
  downloadJsonFile(
    `mhdsi-pipeline-results-${dateStamp()}.json`,
    serializePipelineResults(results),
  );
}

export function downloadReportSnapshotJson(
  snapshot: MethodologyReportSnapshot,
): void {
  downloadJsonFile(
    `mhdsi-report-snapshot-${dateStamp()}.json`,
    serializeReportSnapshot(snapshot),
  );
}

export function downloadScenarioComparisonJson(
  snapshot: MethodologyReportSnapshot,
): void {
  downloadJsonFile(
    `mhdsi-scenario-comparison-${dateStamp()}.json`,
    serializeScenarioComparisonOnly(snapshot),
  );
}

function dateStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}`;
}

/**
 * Sestaví snapshot a stáhne všechny čtyři JSON exporty po řadě.
 *
 * @param preBuiltSnapshot - Pokud je předán (např. ze screen stránky přes useMemo),
 * použije se přímo — exportovaný snapshot bude mít stejné ID a timestamp jako
 * zobrazená stránka. Bez tohoto parametru se snapshot sestaví znovu (nové UUID/timestamp).
 */
export function downloadAllReportExports(
  state: WizardState,
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>,
  preBuiltSnapshot?: MethodologyReportSnapshot,
): void {
  downloadWizardInputsJson(state);
  downloadWizardStateJson(state);
  downloadPipelineResultsJson(results);
  const snap = preBuiltSnapshot ?? buildMethodologyReportSnapshot(state, results);
  if (snap) {
    downloadReportSnapshotJson(snap);
    downloadScenarioComparisonJson(snap);
  }
}
