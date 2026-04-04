"use client";

import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { EngineWarning } from "@/lib/mhdsi/calculations/types";
import { WARNING_CODE_AGENCY_SHARE_RISK } from "@/lib/mhdsi/calculations/employment";
import { cn } from "@/lib/utils";
import { warningMessageCs } from "../warning-messages";
import { resolveWarningFieldNavigation } from "../warning-field-navigation";
import type { ScenarioKind } from "../wizard-types";
import { cs } from "../studio-copy";
import {
  compareWarningsForDisplay,
  warningImpactHint,
  warningRecommendedAction,
  warningSeverity,
  warningSeverityLabel,
  warningTitleLine,
} from "../ux/warning-card-meta";

export function WarningCards({
  warnings,
  activeScenario,
  onNavigateToField,
}: {
  warnings: EngineWarning[];
  activeScenario: ScenarioKind;
  onNavigateToField?: (field: string) => void;
}) {
  if (!warnings.length) {
    return (
      <p className="text-sm text-muted-foreground">{cs.dashboard.noWarnings}</p>
    );
  }

  const ordered = [...warnings].sort(compareWarningsForDisplay);

  return (
    <div className="space-y-3" role="region" aria-label={cs.dashboard.warnings}>
      <ul className="space-y-3">
        {ordered.map((w, i) => {
          const sev = warningSeverity(w.code);
          const agencyRisk = w.code === WARNING_CODE_AGENCY_SHARE_RISK;
          const canGo =
            Boolean(w.field) &&
            Boolean(onNavigateToField) &&
            resolveWarningFieldNavigation(w.field!, activeScenario) !== null;
          return (
            <li
              key={`${w.code}-${i}`}
              className={cn(
                "rounded-lg border p-3",
                agencyRisk
                  ? "border-orange-500/70 bg-orange-50/95 shadow-sm dark:border-orange-400/50 dark:bg-orange-950/35"
                  : "border-amber-500/50 bg-amber-50/90 dark:border-amber-500/30 dark:bg-amber-950/30",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-medium leading-snug">
                    {warningTitleLine(w)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Závažnost: {warningSeverityLabel(sev)} · Dopad:{" "}
                    {warningImpactHint(w.code)}
                  </p>
                  <p className="mt-1 text-xs text-foreground">
                    Doporučená akce:{" "}
                    {warningRecommendedAction(canGo, w.code)}
                  </p>
                </div>
                <Badge variant="warning" className="shrink-0">
                  {warningSeverityLabel(sev)}
                </Badge>
              </div>
              <Collapsible className="mt-2">
                <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ChevronDown className="h-3 w-3" />
                  Technický detail (kód, pole)
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 space-y-1 text-xs text-muted-foreground">
                  <p>
                    <code>{w.code}</code>
                    {w.field ? (
                      <>
                        {" "}
                        · pole: <code>{w.field}</code>
                      </>
                    ) : null}
                  </p>
                  <p className="italic">
                    {warningMessageCs(w.code, w.message)}
                  </p>
                </CollapsibleContent>
              </Collapsible>
              {canGo && w.field && onNavigateToField ? (
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => onNavigateToField(w.field!)}
                  >
                    {cs.dashboard.warningGoToField}
                  </Button>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
