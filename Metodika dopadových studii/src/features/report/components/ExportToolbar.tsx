"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import type { WizardState } from "@/features/studio/wizard-types";
import type { ScenarioKind } from "@/features/studio/wizard-types";
import type { MethodologyReportSnapshot } from "../types";
import { reportCs } from "../report-copy-cs";
import {
  downloadPipelineResultsJson,
  downloadReportSnapshotJson,
  downloadScenarioComparisonJson,
  downloadWizardInputsJson,
  downloadWizardStateJson,
} from "../report-exports";

export function ExportToolbar({
  state,
  results,
  snapshot,
}: {
  state: WizardState;
  results: Record<ScenarioKind, FullCalculationPipelineResult | null>;
  snapshot: MethodologyReportSnapshot;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{reportCs.exports.title}</CardTitle>
        <CardDescription>
          Stejná data jako na obrazovce — pro archiv nebo předání IT oddělení.
          Formát je strukturovaný strojový výstup.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={reportCs.exportsAria.inputs}
          onClick={() => downloadWizardInputsJson(state)}
        >
          {reportCs.exports.inputs}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={reportCs.exportsAria.wizardState}
          onClick={() => downloadWizardStateJson(state)}
        >
          {reportCs.exports.wizardState}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={reportCs.exportsAria.results}
          onClick={() => downloadPipelineResultsJson(results)}
        >
          {reportCs.exports.results}
        </Button>
        <Button
          type="button"
          variant="default"
          size="sm"
          aria-label={reportCs.exportsAria.snapshot}
          onClick={() => downloadReportSnapshotJson(snapshot)}
        >
          {reportCs.exports.snapshot}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-label={reportCs.exportsAria.comparison}
          onClick={() => downloadScenarioComparisonJson(snapshot)}
        >
          {reportCs.exports.comparison}
        </Button>
      </CardContent>
    </Card>
  );
}
