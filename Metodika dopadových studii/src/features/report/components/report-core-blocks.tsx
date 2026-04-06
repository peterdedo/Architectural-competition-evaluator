"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InfoTip } from "@/components/info-tip";
import { AgencyShareRiskCallout } from "@/components/agency-share-risk-callout";
import {
  baselineHasAgencyShareRisk,
  snapshotUnionHasAgencyShareRisk,
} from "@/features/report/agency-share-risk-snapshot";
import { cs as studioCs } from "@/features/studio/studio-copy";
import { SCENARIO_ORDER } from "@/features/studio/wizard-types";
import { warningMessageCs } from "@/features/studio/warning-messages";
import {
  compareWarningsForDisplay,
  warningTitleLine,
} from "@/features/studio/ux/warning-card-meta";
import { openQuestionLabelCs } from "@/features/studio/open-question-labels";
import { cn } from "@/lib/utils";
import type {
  EconomicModuleReportSlice,
  M8ContentLayer,
  MethodologyReportSnapshot,
} from "../types";
import { reportCs } from "../report-copy-cs";
import { formatReportNumber } from "../report-format";

const LAYER_SCREEN_COLORS: Record<M8ContentLayer, string> = {
  inputs: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  baseline: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  module_results: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  scenarios: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  assumptions_oq_fallback: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

export function LayerBadge({
  layer,
  isPrint,
}: {
  layer: M8ContentLayer;
  isPrint: boolean;
}) {
  const label = reportCs.m8.layers[layer];
  if (isPrint) {
    return (
      <span className="ml-2 rounded border border-black px-1 py-0.5 text-[9pt] font-mono font-medium text-black">
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "ml-2 rounded border px-1.5 py-0.5 text-[10px] font-mono font-medium",
        LAYER_SCREEN_COLORS[layer],
      )}
    >
      {label}
    </span>
  );
}

export const AUDIT_PRINT_MAX_CHARS = 12_000;

export function deltaHdpKpiSublabel(
  source: EconomicModuleReportSlice["deltaHdpSource"],
): string {
  switch (source) {
    case "computed_profile":
      return "Profil M6 (CAPEX + M3 + multiplikátory § 2.4) — zjednodušený rámec, viz OQ-05 / OQ-11";
    case "manual_fallback":
      return "Ruční ΔHDP (záloha po neplatném nebo nulovém profilu M6) — není automatický profil";
    default:
      return "Ruční ΔHDP MVP — pro profil zapněte P1 → M6";
  }
}

export function householdConsumptionKpiSublabel(
  source: EconomicModuleReportSlice["householdConsumptionSource"],
  deltaSrc: EconomicModuleReportSlice["deltaHdpSource"],
): string {
  if (source === "payroll_proxy") {
    return "Vypočteno z M3 (N_celkem × M_region) × MPC × M_spotreba — není škála k ΔHDP";
  }
  return deltaSrc === "manual_fallback"
    ? "FALLBACK: škála k záložnímu / ručnímu ΔHDP — ne payroll z M3"
    : "Škála k použitému ΔHDP (ruční MVP) — OPEN_QUESTION_BRIDGE";
}

export function shortDeltaHdpSource(
  source: EconomicModuleReportSlice["deltaHdpSource"],
): string {
  switch (source) {
    case "computed_profile":
      return "Profil";
    case "manual_fallback":
      return "Záloha";
    default:
      return "Ruční";
  }
}

export function formatAuditForPrint(
  snapshot: MethodologyReportSnapshot,
): string {
  const full = JSON.stringify(snapshot.section13_audit, null, 2);
  if (full.length <= AUDIT_PRINT_MAX_CHARS) return full;
  return (
    full.slice(0, AUDIT_PRINT_MAX_CHARS) +
    `\n\n… ${reportCs.print.auditTruncatedNote}`
  );
}

export type ReportSnapshotVariant = "screen" | "print";

export function ReportSection({
  title,
  children,
  isPrint,
  layerBadge,
  headingLevel = "h2",
}: {
  title: string;
  children: React.ReactNode;
  isPrint: boolean;
  layerBadge?: React.ReactNode;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const headingClass =
    headingLevel === "h2"
      ? "text-xl font-semibold"
      : cn("text-lg font-semibold", isPrint && "text-black");
  return (
    <section className={cn("space-y-2", isPrint && "print:break-inside-avoid")}>
      <Heading className={cn("flex flex-wrap items-center", headingClass)}>
        {title}
        {layerBadge}
      </Heading>
      {children}
    </section>
  );
}

export function ModulePre({
  title,
  note,
  json,
  isPrint,
  layer,
}: {
  title: string;
  note: string;
  json: unknown;
  isPrint: boolean;
  layer?: M8ContentLayer;
}) {
  return (
    <ReportSection
      title={title}
      headingLevel="h3"
      isPrint={isPrint}
      layerBadge={layer ? <LayerBadge layer={layer} isPrint={isPrint} /> : undefined}
    >
      <p className="mb-2 text-xs text-muted-foreground">{note}</p>
      <pre
        className={cn(
          "rounded-md border bg-muted/20 p-3 text-sm",
          isPrint && "print-pre border-black bg-white",
        )}
      >
        {JSON.stringify(json, null, 2)}
      </pre>
    </ReportSection>
  );
}

export function Kpi({
  label,
  value,
  isPrint,
  sublabel,
  glossaryTooltip,
}: {
  label: string;
  value: string;
  isPrint: boolean;
  sublabel?: string;
  glossaryTooltip?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        isPrint ? "border-black bg-white" : "border bg-card",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 text-xs",
          isPrint ? "text-black" : "text-muted-foreground",
        )}
      >
        <span>{label}</span>
        {!isPrint && glossaryTooltip ? (
          <InfoTip
            text={glossaryTooltip}
            ariaLabel={`Vysvětlení: ${label}`}
            className="shrink-0"
          />
        ) : null}
      </div>
      {sublabel ? (
        <div
          className={cn(
            "mt-0.5 text-[11px] leading-snug",
            isPrint ? "text-black" : "text-muted-foreground",
          )}
        >
          {sublabel}
        </div>
      ) : null}
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export function Field({
  label,
  value,
  isPrint,
  glossaryTooltip,
}: {
  label: string;
  value: string;
  isPrint: boolean;
  glossaryTooltip?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md border p-3",
        isPrint ? "border-black bg-neutral-50" : "border bg-muted/20",
      )}
    >
      <div
        className={cn(
          "flex flex-wrap items-center gap-1 text-xs",
          isPrint ? "text-black" : "text-muted-foreground",
        )}
      >
        <span>{label}</span>
        {!isPrint && glossaryTooltip ? (
          <InfoTip
            text={glossaryTooltip}
            ariaLabel={`Vysvětlení: ${label}`}
            className="shrink-0"
          />
        ) : null}
      </div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

export function ComparisonTable({
  snapshot,
  isPrint,
}: {
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
}) {
  const fmt = formatReportNumber;
  const thCell = (align: "left" | "right") =>
    cn(
      "p-1.5 font-medium",
      align === "left" ? "text-left" : "text-right",
      isPrint
        ? "border border-black bg-neutral-100 print:bg-neutral-200"
        : "border-b border-muted bg-muted/50",
    );
  const tdCell = (extra?: string) =>
    cn(
      "p-1.5",
      isPrint ? "border border-black" : "border-b border-muted",
      extra,
    );

  return (
    <>
      <table
        className={cn(
          "w-full border-collapse text-sm",
          isPrint ? "border border-black print:text-[9pt]" : "border border-muted",
        )}
      >
        <thead>
          <tr>
            <th className={thCell("left")}>{reportCs.labels.comparisonTable.scenario}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.nCelkem}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.nMezera}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.ou}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.housingDeficit}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.deltaHdp}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.deltaHdpSourceShort}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.taxYield}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.householdC}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.dznm}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.warnings}</th>
            <th className={thCell("right")}>{reportCs.labels.comparisonTable.oq}</th>
          </tr>
        </thead>
        <tbody>
          {snapshot.section11_comparison.rows.map((row) => (
            <tr key={row.scenario}>
              <td className={tdCell("font-medium text-left")}>
                {studioCs.scenarios[row.scenario]}
              </td>
              <td className={tdCell("text-right")}>{fmt(row.employment.nCelkem, 0)}</td>
              <td className={tdCell("text-right")}>{fmt(row.employment.nMezera, 0)}</td>
              <td className={tdCell("text-right")}>{fmt(row.housing.ou)}</td>
              <td className={tdCell("text-right")}>{fmt(row.housing.aggregateDeficit)}</td>
              <td className={tdCell("text-right")}>{fmt(row.economic.deltaHdp, 0)}</td>
              <td className={tdCell("text-right")}>{shortDeltaHdpSource(row.economic.deltaHdpSource)}</td>
              <td className={tdCell("text-right")}>{fmt(row.economic.taxYield, 0)}</td>
              <td className={tdCell("text-right")}>{fmt(row.economic.householdConsumptionAnnual, 0)}</td>
              <td className={tdCell("text-right")}>{fmt(row.economic.dznmAnnual, 0)}</td>
              <td className={tdCell("text-right")}>{row.warningsCount}</td>
              <td className={tdCell("text-right")}>{row.openQuestionsCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p
        className={cn(
          "mt-2 text-xs leading-snug",
          isPrint ? "text-black" : "text-muted-foreground",
        )}
      >
        {reportCs.labels.comparisonTable.deltaHdpFootnote}
      </p>
    </>
  );
}

export function M7ConsolidationBlock({
  snapshot,
  isPrint,
}: {
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
}) {
  const m7 = snapshot.m7_scenario_consolidation;
  const box = isPrint ? "text-black" : "text-muted-foreground";
  const varying = m7.sensitivitySummary.varyingAssumptionKeys;
  return (
    <div className="space-y-4 text-sm">
      <p className={cn("leading-snug", box)}>
        Tabulka níže shrnuje stejná čísla jako srovnání scénářů v průvodci — jeden přehled pro všechny tři varianty.
      </p>
      <div>
        <h3 className={cn("mb-1 font-semibold", isPrint && "text-black")}>
          Co je sdílené vs. scénářová delta
        </h3>
        <ul className={cn("list-disc space-y-1 pl-5", box)}>
          <li>
            <span className="font-medium text-foreground">Sdílený vstup</span> — popis projektu, území,
            společné symboly ve wizardu; viz také sekce 1–4 a klasifikaci níže.
          </li>
          <li>
            <span className="font-medium text-foreground">Scénářová delta</span> — parametry lišící se mezi scénáři
            {m7.sensitivitySummary.scenarioDeltaKeysPresent.length
              ? `: ${m7.sensitivitySummary.scenarioDeltaKeysPresent.join(", ")}`
              : " (žádné — všechny scénáře používají sdílené předpoklady)"}
            .
          </li>
          <li>
            <span className="font-medium text-foreground">Odvozené výstupy</span> — čísla v tabulce
            pocházejí z toho samého výpočtu jako v průvodci; zde jsou jen přehledně seřazená.
          </li>
        </ul>
      </div>
      <div>
        <h3 className={cn("mb-1 font-semibold", isPrint && "text-black")}>
          Předpoklady, otevřené otázky a záložní vstupy
        </h3>
        <ul className={cn("list-disc space-y-1 pl-5", box)}>
          <li>
            Efektivní předpoklady po scénářích: příloha předpokladů; symboly s odlišnou efektivní hodnotou mezi scénáři:{" "}
            {varying.length ? (
              <span className="break-all">{varying.join(", ")}</span>
            ) : (
              "— (v tomto běhu žádný takový symbol po sloučení výstupů jednotlivých oblastí)"
            )}
            .
          </li>
          <li>
            Otevřené otázky — unie napříč scénáři:{" "}
            {m7.consolidatedRisks.openQuestionsUnion.join(", ") || "—"}.
          </li>
          <li>
            Záložní vstupy (ekonomika):{" "}
            {m7.consolidatedRisks.fallbackSignals.length
              ? `${m7.consolidatedRisks.fallbackSignals.length} záložní vstup — výpočet použil výchozí nebo ručně zadanou hodnotu místo automatického profilu. Detail je v JSON exportu.`
              : "žádný záložní vstup v tomto záměru."}
          </li>
          {snapshotUnionHasAgencyShareRisk(snapshot) ? (
            <li>
              <span className="font-medium text-foreground">
                Rizikový signál agenturních pracovníků
              </span>
              {" — "}
              v alespoň jednom scénáři překročil model podíl práce přes agentury metodickou hranici (&gt; 5 % vůči celkovému počtu pracovních míst). Stejný signál je uveden u interpretace dokumentu a u varování baseline; nejde o chybu aplikace.
            </li>
          ) : null}
        </ul>
      </div>
      <div>
        <h3 className={cn("mb-1 font-semibold", isPrint && "text-black")}>Citlivost — textové shrnutí</h3>
        <ul className={cn("list-disc space-y-1 pl-5", box)}>
          {m7.sensitivitySummary.notesCs.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
      <details className={cn("rounded-md border p-2", isPrint && "border-black")}>
        <summary className={cn("cursor-pointer text-xs font-medium", isPrint && "text-black")}>
          Klasifikace vstupů a výstupů (technický JSON)
        </summary>
        <pre
          className={cn(
            "mt-2 max-h-56 overflow-auto text-xs",
            isPrint && "print-pre border-black bg-white",
          )}
        >
          {JSON.stringify(m7.classification, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export function Section12AssumptionsUncertaintyBlock({
  snapshot,
  isPrint,
}: {
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
}) {
  const b = snapshot.primaryKpiAndModules.baseline;
  return (
    <ReportSection
      title={reportCs.sections.s12}
      headingLevel="h3"
      isPrint={isPrint}
      layerBadge={<LayerBadge layer="assumptions_oq_fallback" isPrint={isPrint} />}
    >
      <div className="space-y-6">
        <div
          className={cn(
            isPrint && "print-box-warn rounded-md",
            !isPrint && "rounded-md",
          )}
        >
          <h3
            className={cn(
              "text-sm font-semibold",
              !isPrint && "text-amber-900 dark:text-amber-100",
            )}
          >
            {reportCs.labels.warningsBlock}
          </h3>
          <p
            className={cn(
              "mt-1 text-xs",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            {reportCs.labels.baselineWarningsNote}
          </p>
          {baselineHasAgencyShareRisk(snapshot) ? (
            <div className={cn("mt-3", isPrint && "print:break-inside-avoid")}>
              <AgencyShareRiskCallout density="compact" isPrint={isPrint} />
            </div>
          ) : null}
          <ul className="mt-3 space-y-2 text-sm">
            {[...b.warnings].sort(compareWarningsForDisplay).map((w, i) => (
              <li
                key={`${w.code}-${i}`}
                className={cn(isPrint ? "text-black" : "text-foreground")}
              >
                <span className="font-medium">{warningTitleLine(w)}</span>
                <span className={cn("text-xs", !isPrint && "text-muted-foreground")}>
                  {" "}
                  (<code>{w.code}</code>)
                </span>
                <span className="block text-sm leading-snug">
                  {warningMessageCs(w.code, w.message)}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <Separator className={isPrint ? "bg-black" : undefined} />
        <div className={cn(isPrint && "print-box-assum rounded-md")}>
          <h3
            className={cn(
              "text-sm font-semibold",
              !isPrint && "text-blue-900 dark:text-blue-100",
            )}
          >
            {reportCs.labels.assumptionsBlock}
          </h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {SCENARIO_ORDER.map((kind) => {
              const ass =
                snapshot.section12_assumptionsUncertainty.assumptionsMergedByScenario[
                  kind
                ];
              return (
                <div
                  key={kind}
                  className={cn(isPrint && "print:break-inside-avoid")}
                >
                  <div className="mb-1 text-xs font-medium">{studioCs.scenarios[kind]}</div>
                  <pre
                    className={cn(
                      "max-h-40 overflow-auto rounded-md border p-2 text-xs",
                      isPrint
                        ? "print-pre border-black bg-white"
                        : "border bg-blue-50/50 dark:bg-blue-950/30",
                    )}
                  >
                    {ass ? JSON.stringify(ass, null, 2) : "—"}
                  </pre>
                </div>
              );
            })}
          </div>
          {snapshot.section12_assumptionsUncertainty.m7VaryingEffectiveAssumptionKeys
            ?.length ? (
            <p
              className={cn(
                "mt-3 text-xs leading-snug",
                isPrint ? "text-black" : "text-muted-foreground",
              )}
            >
              <span className="font-medium">M7 index:</span> symboly s odlišnou efektivní hodnotou
              mezi scénáři (shodné se sekcí M7):{" "}
              <span className="break-all">
                {snapshot.section12_assumptionsUncertainty.m7VaryingEffectiveAssumptionKeys.join(
                  ", ",
                )}
              </span>
            </p>
          ) : null}
        </div>
        <Separator className={isPrint ? "bg-black" : undefined} />
        <div>
          <h3
            className={cn(
              "text-sm font-semibold",
              isPrint ? "print-box-oq" : "text-violet-900 dark:text-violet-100",
            )}
          >
            {reportCs.labels.oqBlock}
          </h3>
          <div className="mt-3 grid gap-4 md:grid-cols-3">
            {SCENARIO_ORDER.map((kind) => {
              const oqs =
                snapshot.section12_assumptionsUncertainty.openQuestionsByScenario[kind];
              return (
                <div key={kind} className={cn(isPrint && "print:break-inside-avoid")}>
                  <div className="mb-1 text-xs font-medium">{studioCs.scenarios[kind]}</div>
                  <ul className="list-disc space-y-1 pl-4 text-sm">
                    {oqs.length ? (
                      oqs.map((id) => (
                        <li key={id}>
                          <strong>{id}</strong> — {openQuestionLabelCs(id)}
                        </li>
                      ))
                    ) : (
                      <li className="list-none text-muted-foreground">—</li>
                    )}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </ReportSection>
  );
}

export function ExecutiveBlock({
  text,
  variant,
}: {
  text: string;
  variant: ReportSnapshotVariant;
}) {
  const box =
    variant === "print"
      ? "border border-black bg-white p-3 text-black"
      : "space-y-2 rounded-md border bg-muted/30 p-4 text-sm leading-relaxed";
  return (
    <div className={box}>
      {text.split("\n").map((line, i) => {
        const t = line.trim();
        if (t.startsWith("### ")) {
          return (
            <h3
              key={i}
              className={cn(
                "pt-2 font-semibold first:pt-0",
                variant === "print" ? "text-base" : "text-base",
              )}
            >
              {t.slice(4)}
            </h3>
          );
        }
        if (t.startsWith("#### ")) {
          return (
            <h4
              key={i}
              className={cn(
                "text-sm font-semibold",
                variant === "print" ? "text-black" : "text-muted-foreground",
              )}
            >
              {t.slice(5)}
            </h4>
          );
        }
        if (t.startsWith("- ")) {
          return (
            <li key={i} className="ml-4 list-disc">
              {t.slice(2).replace(/\*\*(.+?)\*\*/g, "$1")}
            </li>
          );
        }
        if (t === "") return <br key={i} />;
        return (
          <p
            key={i}
            className={variant === "print" ? "text-black" : "text-muted-foreground"}
          >
            {line.replace(/\*\*(.+?)\*\*/g, "$1")}
          </p>
        );
      })}
    </div>
  );
}
