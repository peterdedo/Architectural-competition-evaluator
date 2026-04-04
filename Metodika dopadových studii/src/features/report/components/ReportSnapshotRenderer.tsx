"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { InfoTip } from "@/components/info-tip";
import { AgencyShareRiskCallout } from "@/components/agency-share-risk-callout";
import { glossaryCs } from "@/content/glossary-cs";
import {
  baselineHasAgencyShareRisk,
  snapshotUnionHasAgencyShareRisk,
} from "@/features/report/agency-share-risk-snapshot";
import { openQuestionLabelCs } from "@/features/studio/open-question-labels";
import { SCENARIO_ORDER } from "@/features/studio/wizard-types";
import { warningMessageCs } from "@/features/studio/warning-messages";
import { cs as studioCs } from "@/features/studio/studio-copy";
import {
  compareWarningsForDisplay,
  warningTitleLine,
} from "@/features/studio/ux/warning-card-meta";
import { cn } from "@/lib/utils";
import type {
  EconomicModuleReportSlice,
  M8ContentLayer,
  MethodologyReportSnapshot,
} from "../types";
import { reportCs } from "../report-copy-cs";
import {
  resolveTrustFraming,
  TRUST_DECISION_BULLETS_FALLBACK,
  TRUST_DECISION_NEUTRAL,
  TRUST_NUMBERS_FOOTNOTE,
  TRUST_SCENARIOS_PRIMARY,
  TRUST_SCENARIOS_SECONDARY,
} from "@/content/trust-framing-cs";

const AUDIT_PRINT_MAX_CHARS = 12_000;

// --- M8 vrstvové štítky a osnova ---

const LAYER_SCREEN_COLORS: Record<M8ContentLayer, string> = {
  inputs: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  baseline: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  module_results: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  scenarios: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  assumptions_oq_fallback: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

function LayerBadge({
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

function M8OutlineBlock({
  snapshot,
  isPrint,
}: {
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
}) {
  const { outline, annexes } = snapshot.m8_report_completeness;
  const mainPoints = outline.filter((item) => item.id.startsWith("bod-"));
  const annexItems = outline.filter((item) => item.id.startsWith("priloha-"));

  if (isPrint) {
    return (
      <div className="space-y-2 rounded-md border border-black p-3 text-[9pt] text-black print:break-inside-avoid">
        <p className="font-semibold">{reportCs.m8.outlineTitle}</p>
        <p className="text-xs">{reportCs.m8.outlineNote}</p>
        <table className="w-full border-collapse text-[9pt]">
          <thead>
            <tr>
              <th className="border border-black bg-neutral-100 p-1 text-left print:bg-neutral-200">Ref</th>
              <th className="border border-black bg-neutral-100 p-1 text-left print:bg-neutral-200">Sekce</th>
              <th className="border border-black bg-neutral-100 p-1 text-left print:bg-neutral-200">Vrstva</th>
            </tr>
          </thead>
          <tbody>
            {mainPoints.map((item) => (
              <tr key={item.id}>
                <td className="border border-black p-1 font-mono">{item.methodologyRef}</td>
                <td className="border border-black p-1">{item.titleCs}</td>
                <td className="border border-black p-1 font-mono text-[8pt]">
                  {reportCs.m8.layers[item.contentLayer]}
                </td>
              </tr>
            ))}
            {annexItems.map((item) => (
              <tr key={item.id} className="italic">
                <td className="border border-black p-1 font-mono">{item.methodologyRef}</td>
                <td className="border border-black p-1">{item.titleCs}</td>
                <td className="border border-black p-1 font-mono text-[8pt]">
                  {reportCs.m8.layers[item.contentLayer]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[8pt]">
          {reportCs.m8.annexesNote} ({annexes.filter((a) => a.availableInJsonExport).length} příloh v JSON exportu)
        </p>
      </div>
    );
  }

  return (
    <details className="rounded-md border bg-muted/20 p-3 text-sm">
      <summary className="cursor-pointer font-medium">
        {reportCs.m8.outlineToggle} — {reportCs.m8.outlineTitle}
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-xs text-muted-foreground">{reportCs.m8.outlineNote}</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-muted">
                <th className="p-1.5 text-left font-medium">Ref</th>
                <th className="p-1.5 text-left font-medium">Sekce</th>
                <th className="p-1.5 text-left font-medium">Vrstva</th>
                <th className="p-1.5 text-left font-medium">Snapshot path</th>
              </tr>
            </thead>
            <tbody>
              {outline.map((item) => (
                <tr key={item.id} className="border-b border-muted/50">
                  <td className="p-1.5 font-mono text-muted-foreground">{item.methodologyRef}</td>
                  <td className="p-1.5">{item.titleCs}</td>
                  <td className="p-1.5">
                    <span
                      className={cn(
                        "rounded border px-1 py-0.5 font-mono text-[10px] font-medium",
                        LAYER_SCREEN_COLORS[item.contentLayer],
                      )}
                    >
                      {reportCs.m8.layers[item.contentLayer]}
                    </span>
                  </td>
                  <td className="p-1.5 font-mono text-[10px] text-muted-foreground break-all">
                    {item.snapshotPath}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">{reportCs.m8.annexesNote}</p>
      </div>
    </details>
  );
}

export type ReportSnapshotVariant = "screen" | "print";

function ReportInterpretationBlock({
  snapshot,
  isPrint,
}: {
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
}) {
  const b = snapshot.primaryKpiAndModules.baseline;
  const wCount = b.warnings.length;
  const oqCount = b.openQuestions.length;
  const varyingKeys =
    snapshot.m7_scenario_consolidation.sensitivitySummary.varyingAssumptionKeys
      .length;

  const trust = resolveTrustFraming(wCount, oqCount, varyingKeys);
  const bullets =
    trust.decisionBullets?.length === 3
      ? trust.decisionBullets
      : TRUST_DECISION_BULLETS_FALLBACK;

  if (isPrint) {
    return (
      <div className="rounded-md border border-black p-3 text-[9pt] text-black print:break-inside-avoid">
        <p className="font-semibold">Rozhodovací podklad: {trust.summary}</p>
        <p className="mt-1">{trust.detail}</p>
        {trust.documentExtra ? <p className="mt-1">{trust.documentExtra}</p> : null}
        {baselineHasAgencyShareRisk(snapshot) ? (
          <div className="mt-3">
            <AgencyShareRiskCallout density="compact" isPrint />
          </div>
        ) : null}
        <p className="mt-2 font-medium">{TRUST_DECISION_NEUTRAL}</p>
        <ul className="mt-1 list-disc space-y-0.5 pl-4">
          {bullets.map((b) => (
            <li key={b.slice(0, 40)}>{b}</li>
          ))}
        </ul>
        <p className="mt-2 text-[8pt]">{TRUST_NUMBERS_FOOTNOTE}</p>
        <p className="mt-1">{TRUST_SCENARIOS_PRIMARY}</p>
        <p className="mt-0.5">{TRUST_SCENARIOS_SECONDARY}</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border/60 bg-card p-5 shadow-sm space-y-3">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Co tento dokument znamená pro rozhodnutí
        </h2>
        <p className="mt-1 text-sm font-medium text-foreground">{trust.summary}</p>
      </div>
      {baselineHasAgencyShareRisk(snapshot) ? (
        <AgencyShareRiskCallout density="default" />
      ) : null}
      <p className="text-sm leading-relaxed text-muted-foreground">{trust.detail}</p>
      {trust.documentExtra ? (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {trust.documentExtra}
        </p>
      ) : null}
      <p className="text-sm text-muted-foreground">{TRUST_DECISION_NEUTRAL}</p>
      <ul className="space-y-1.5 text-sm leading-snug text-foreground/90">
        {bullets.map((b) => (
          <li key={b.slice(0, 48)} className="flex gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">{TRUST_NUMBERS_FOOTNOTE}</p>
      <div className="rounded-md bg-muted/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
        <span className="font-medium text-foreground">Scénáře: </span>
        {TRUST_SCENARIOS_PRIMARY} {TRUST_SCENARIOS_SECONDARY}
      </div>
    </div>
  );
}

function fmt(n: number, maxFrac = 1): string {
  return new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: maxFrac,
  }).format(n);
}

function M7ConsolidationBlock({
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
        <h3 className={cn("font-semibold mb-1", isPrint && "text-black")}>
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
        <h3 className={cn("font-semibold mb-1", isPrint && "text-black")}>
          Assumptions vs. otevřené otázky vs. fallback
        </h3>
        <ul className={cn("list-disc space-y-1 pl-5", box)}>
          <li>
            Efektivní předpoklady po scénářích: sekce 12; symboly s odlišnou hodnotou mezi scénáři:{" "}
            {varying.length ? (
              <span className="break-all">{varying.join(", ")}</span>
            ) : (
              "— (v tomto běhu žádný takový symbol po sloučení M3–M6)"
            )}
            .
          </li>
          <li>
            Otevřené otázky: unie napříč scénáři v M7 —{" "}
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
                Rizikový signál agenturních pracovníků (M3)
              </span>
              {" — "}
              v alespoň jednom scénáři překročil model podíl práce přes agentury metodickou hranici (&gt; 5 % vůči N_celkem). Stejný signál je rozveden u interpretace dokumentu a v sekci varování (baseline); nejde o chybu aplikace.
            </li>
          ) : null}
        </ul>
      </div>
      <div>
        <h3 className={cn("font-semibold mb-1", isPrint && "text-black")}>Citlivost (text M7)</h3>
        <ul className={cn("list-disc space-y-1 pl-5", box)}>
          {m7.sensitivitySummary.notesCs.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      </div>
      <details className={cn("rounded-md border p-2", isPrint && "border-black")}>
        <summary className={cn("cursor-pointer text-xs font-medium", isPrint && "text-black")}>
          Klasifikace M7 (JSON)
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

function deltaHdpKpiSublabel(
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

function householdConsumptionKpiSublabel(
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

function shortDeltaHdpSource(
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


function formatAuditForPrint(snapshot: MethodologyReportSnapshot): string {
  const full = JSON.stringify(snapshot.section13_audit, null, 2);
  if (full.length <= AUDIT_PRINT_MAX_CHARS) return full;
  return (
    full.slice(0, AUDIT_PRINT_MAX_CHARS) +
    `\n\n… ${reportCs.print.auditTruncatedNote}`
  );
}

function ExecutiveBlock({
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

function PrintBreak({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  if (!enabled) return <>{children}</>;
  return (
    <div className="print:break-before-page print:pt-2">{children}</div>
  );
}

function ComparisonTable({
  snapshot,
  isPrint,
}: {
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
}) {
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

export function ReportSnapshotRenderer({
  snapshot,
  variant,
}: {
  snapshot: MethodologyReportSnapshot;
  variant: ReportSnapshotVariant;
}) {
  const isPrint = variant === "print";
  const [auditOpen, setAuditOpen] = useState(false);
  const b = snapshot.primaryKpiAndModules.baseline;

  const shell = isPrint
    ? "mx-auto max-w-[190mm] space-y-6 px-2 py-4 text-black"
    : "mx-auto max-w-4xl space-y-8 p-4 pb-24";

  return (
    <div className={shell}>
      <header
        className={cn(
          "space-y-2 border-b pb-6",
          isPrint && "print:break-after-avoid",
        )}
      >
        <h1
          className={cn(
            "font-bold tracking-tight",
            isPrint ? "text-2xl" : "text-3xl",
          )}
        >
          {isPrint ? reportCs.print.documentTitle : reportCs.pageTitle}
        </h1>
        <p className={isPrint ? "text-sm text-black" : "text-muted-foreground"}>
          {isPrint ? reportCs.print.documentSubtitle : reportCs.pageSubtitle}
        </p>
        <p
          className={cn(
            "text-xs",
            isPrint ? "text-black" : "text-muted-foreground",
          )}
        >
          Vytvořeno: {snapshot.metadata.generatedAt} · záměr:{" "}
          {snapshot.metadata.title}
        </p>
        {!isPrint ? (
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">
              Technické údaje dokumentu
            </summary>
            <p className="mt-1 pl-1">
              ID: {snapshot.metadata.id} · verze výstupu {snapshot.metadata.schemaVersion}
            </p>
          </details>
        ) : (
          <p className="text-[8pt] text-black">
            ID: {snapshot.metadata.id} · verze {snapshot.metadata.schemaVersion}
          </p>
        )}
      </header>

      <ReportInterpretationBlock snapshot={snapshot} isPrint={isPrint} />

      {/* Doplňková navigace v dokumentu — sekundární vrstva */}
      {!isPrint && (
        <details className="rounded-md border border-border/50 bg-muted/30 px-4 py-3 text-sm">
          <summary className="cursor-pointer font-medium text-foreground">
            Jak je dokument postavený?
          </summary>
          <div className="mt-3 space-y-2 leading-relaxed text-muted-foreground">
            <p>
              Texty vycházejí ze stejných dat jako obrazovka výsledků v průvodci.
              Části jsou seřazené podle typu informace:
            </p>
            <ul className="ml-4 list-disc space-y-1 text-xs">
              <li><strong>Vstupy</strong> — co jste zadali (záměr, území, výchozí stav).</li>
              <li><strong>Výchozí stav území</strong> — popis před záměrem; slouží k kontextu, ne jako vstup dopadů.</li>
              <li><strong>Dopady</strong> — odhady pro zaměstnanost, bydlení, vybavenost a finance u každého scénáře.</li>
              <li><strong>Scénáře</strong> — srovnání tří variant předpokladů; {TRUST_SCENARIOS_PRIMARY}</li>
              <li><strong>Předpoklady a upozornění</strong> — na čem odhad závisí a kde je třeba být obezřetný.</li>
            </ul>
            <p className="text-xs">
              Barevné štítky u některých nadpisů označují typ bloku. Čísla jsou orientační pro zadané vstupy.
            </p>
          </div>
        </details>
      )}
      {isPrint && (
        <div className="rounded-md border border-black p-3 text-[9pt] text-black print:break-inside-avoid">
          <p className="font-semibold">Struktura dokumentu</p>
          <p className="mt-1">
            Vstupy z průvodce, výchozí stav území, dopady podle oblastí, srovnání tří scénářů
            (varianty předpokladů, ne interval jistoty), předpoklady a upozornění. Výsledky jsou orientační.
          </p>
        </div>
      )}

      <M8OutlineBlock snapshot={snapshot} isPrint={isPrint} />

      <section className={cn("space-y-3", isPrint && "print:break-inside-avoid")}>
        <h2 className="text-xl font-semibold">{reportCs.sections.executive}</h2>
        <ExecutiveBlock
          text={snapshot.executiveSummaryCs}
          variant={variant}
        />
      </section>

      <section className={cn("space-y-3", isPrint && "print:break-inside-avoid")}>
        <h2 className="text-xl font-semibold">{reportCs.sections.kpi}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi label="Pracovní místa celkem" sublabel="přímá i navazující — baseline scénář" value={fmt(b.employment.nCelkem, 0)} isPrint={isPrint} />
          <Kpi label="Využití regionální pracovní síly" sublabel="RZPS — koeficient pokrytí" value={fmt(b.employment.rzps)} isPrint={isPrint} />
          <Kpi label="Noví obyvatelé k usazení" sublabel="odhad z bytové potřeby" value={fmt(b.housing.ou)} isPrint={isPrint} />
          <Kpi
            label={reportCs.labels.kpi.deltaHdp}
            sublabel={deltaHdpKpiSublabel(b.economic.deltaHdpSource)}
            value={`${fmt(b.economic.deltaHdp, 0)} Kč`}
            isPrint={isPrint}
          />
          <Kpi label="Orientační daňový výnos (ročně)" sublabel="výpočet: efektivní daňová kvóta × ΔHDP" value={`${fmt(b.economic.taxYield, 0)} Kč`} isPrint={isPrint} />
          <Kpi
            label="Spotřeba domácností (orientačně, ročně)"
            sublabel={householdConsumptionKpiSublabel(
              b.economic.householdConsumptionSource,
              b.economic.deltaHdpSource,
            )}
            value={`${fmt(b.economic.householdConsumptionAnnual, 0)} Kč`}
            isPrint={isPrint}
          />
          {b.economic.deltaHdpBreakdown ? (
            <>
              <Kpi
                label="Příspěvek investiční fáze k ΔHDP (ročně)"
                sublabel="investiční impulz + indukované vládní výdaje — orientační (OQ)"
                value={`${fmt(b.economic.deltaHdpBreakdown.investmentPhaseAnnual, 0)} Kč`}
                isPrint={isPrint}
              />
              <Kpi
                label="Příspěvek provozní fáze k ΔHDP (ročně)"
                sublabel="mzdový proxy efekt — orientační (OQ-05)"
                value={`${fmt(b.economic.deltaHdpBreakdown.operationalPhaseAnnual, 0)} Kč`}
                isPrint={isPrint}
              />
            </>
          ) : (
            <Kpi
              label="Složení ΔHDP (investice / provoz)"
              sublabel="k dispozici pouze při zapnutém výpočtovém profilu P1→M6"
              value="—"
              isPrint={isPrint}
            />
          )}
          <Kpi
            label="Daňové výnosy pro veřejné rozpočty (ročně)"
            sublabel="rozdělení: stát / kraj / obec"
            value={`stát ${fmt(b.economic.publicBudgetStat, 0)} · kraj ${fmt(b.economic.publicBudgetKraj, 0)} · obec ${fmt(b.economic.publicBudgetObec, 0)} Kč`}
            isPrint={isPrint}
          />
          <Kpi label="Daň z nemovitostí záměru (ročně)" sublabel="odhad na základě plochy a sazby" value={`${fmt(b.economic.dznmAnnual, 0)} Kč`} isPrint={isPrint} />
          <Kpi
            label="Spotřeba domácností v regionu (po retenci)"
            sublabel="část spotřeby, která zůstane v lokální ekonomice"
            value={`${fmt(b.economic.consumptionRetained, 0)} Kč`}
            isPrint={isPrint}
          />
          <Kpi
            label="Příspěvek obci z RUD (ročně)"
            sublabel="orientační výpočet dle počtu nových obyvatel"
            value={`${fmt(b.economic.prudAnnual, 0)} Kč`}
            isPrint={isPrint}
            glossaryTooltip={glossaryCs.RUD}
          />
        </div>
      </section>

      <PrintBreak enabled={isPrint}>
        <ReportSection title={reportCs.sections.p1} isPrint={isPrint}>
          <p
            className={cn(
              "text-sm mb-3",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Strukturovaná metodická příprava (M0–M2). Výchozí stav území (AS-IS) je v bloku „M2“ —
            odděleně od vstupů do výpočtu dopadů v sekcích M3–M6 níže.
          </p>
          <div className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">M0 — strukturovaný popis záměru</h3>
              <pre
                className={cn(
                  "max-h-56 overflow-auto rounded-md border p-3 text-xs",
                  isPrint ? "border-black bg-white print-pre" : "border-muted bg-muted/20",
                )}
              >
                {JSON.stringify(snapshot.p1_layers.m0, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-1">M1 — území a dostupnost (kontext)</h3>
              <pre
                className={cn(
                  "max-h-56 overflow-auto rounded-md border p-3 text-xs",
                  isPrint ? "border-black bg-white print-pre" : "border-muted bg-muted/20",
                )}
              >
                {JSON.stringify(snapshot.p1_layers.m1, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-1">M2 — AS-IS baseline území</h3>
              <pre
                className={cn(
                  "max-h-64 overflow-auto rounded-md border p-3 text-xs",
                  isPrint ? "border-black bg-white print-pre" : "border-muted bg-muted/20",
                )}
              >
                {JSON.stringify(snapshot.p1_layers.m2AsIs, null, 2)}
              </pre>
            </div>
          </div>
        </ReportSection>
        <ReportSection title={reportCs.sections.p1m34} isPrint={isPrint}>
          <p
            className={cn(
              "text-sm mb-3",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Stejné odvození jako při výpočtu M3/M4 — baseline vstupy a příznaky mostu z průvodce.
          </p>
          <pre
            className={cn(
              "max-h-72 overflow-auto rounded-md border p-3 text-xs",
              isPrint ? "border-black bg-white print-pre" : "border-muted bg-muted/20",
            )}
          >
            {JSON.stringify(snapshot.p1_m3_m4_bridge, null, 2)}
          </pre>
        </ReportSection>
        <ReportSection title={reportCs.sections.p1m5} isPrint={isPrint}>
          <p
            className={cn(
              "text-sm mb-3",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Stejné odvození jako při výpočtu M5 — příznaky mostu, kanonické zdroje a baseline hodnoty
            skutečně použité v jádře (odpovídá stopě M5 v auditní příloze).
          </p>
          <pre
            className={cn(
              "max-h-72 overflow-auto rounded-md border p-3 text-xs",
              isPrint ? "border-black bg-white print-pre" : "border-muted bg-muted/20",
            )}
          >
            {JSON.stringify(snapshot.p1_m5_bridge, null, 2)}
          </pre>
        </ReportSection>
        <ReportSection title={reportCs.sections.p1m6} isPrint={isPrint}>
          <p
            className={cn(
              "text-sm mb-3",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Přínosy M6: zda se ΔHDP odvozuje z profilu (CAPEX, N_celkem z M3, multiplikátory) nebo zůstává
            ruční MVP; baseline hodnoty odpovídají stopě M6 v auditní příloze.
          </p>
          <pre
            className={cn(
              "max-h-72 overflow-auto rounded-md border p-3 text-xs",
              isPrint ? "border-black bg-white print-pre" : "border-muted bg-muted/20",
            )}
          >
            {JSON.stringify(snapshot.p1_m6_bridge, null, 2)}
          </pre>
        </ReportSection>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <ReportSection
          title={reportCs.sections.s01}
          layerBadge={<LayerBadge layer="inputs" isPrint={isPrint} />}
          isPrint={isPrint}
        >
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Název" value={snapshot.section01_project.projectName} isPrint={isPrint} />
            <Field label="Lokalita" value={snapshot.section01_project.locationDescription} isPrint={isPrint} />
            <Field label="CZ-NACE" value={snapshot.section01_project.czNace} isPrint={isPrint} />
            <Field label="CAPEX" value={`${fmt(snapshot.section01_project.capexTotalCzk, 0)} Kč`} isPrint={isPrint} />
            <Field
              label="N_inv (PMJ)"
              value={String(snapshot.section01_project.nInv)}
              isPrint={isPrint}
              glossaryTooltip={glossaryCs.PMJ}
            />
          </div>
        </ReportSection>
        <ReportSection
          title={reportCs.sections.s02}
          layerBadge={<LayerBadge layer="inputs" isPrint={isPrint} />}
          isPrint={isPrint}
        >
          <div className="grid gap-3 text-sm">
            <Field label="Profil investora" value={snapshot.section02_investor.investorProfile} isPrint={isPrint} />
            <Field label="Právní forma" value={snapshot.section02_investor.legalForm} isPrint={isPrint} />
            <Field label="Strategické vazby" value={snapshot.section02_investor.strategicLinks || "—"} isPrint={isPrint} />
          </div>
        </ReportSection>
        <ReportSection
          title={reportCs.sections.s03}
          layerBadge={<LayerBadge layer="inputs" isPrint={isPrint} />}
          isPrint={isPrint}
        >
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Field label="Poslední míle d (km)" value={String(snapshot.section03_territory.dLastMileKm)} isPrint={isPrint} />
            <Field label="DIAD pref. / akcept. (min)" value={`${snapshot.section03_territory.diadPrMinutes} / ${snapshot.section03_territory.diadAkMinutes}`} isPrint={isPrint} />
            <Field label="Tinfr (min)" value={String(snapshot.section03_territory.tinfrMinutes)} isPrint={isPrint} />
            <Field label="T0" value={snapshot.section03_territory.t0} isPrint={isPrint} />
            <Field label="Horizont (roky)" value={String(snapshot.section03_territory.rampYearsGlobal)} isPrint={isPrint} />
          </div>
        </ReportSection>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <ReportSection
          title={reportCs.sections.s04}
          layerBadge={<LayerBadge layer="scenarios" isPrint={isPrint} />}
          isPrint={isPrint}
        >
          <p className={isPrint ? "text-sm text-black" : "text-sm text-muted-foreground"}>
            Sdílené symboly (klíče):{" "}
            {snapshot.section04_scenarios.sharedAssumptionKeys.join(", ") || "—"}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            {SCENARIO_ORDER.map((kind) => (
              <Card key={kind} className={isPrint ? "border-black print:break-inside-avoid" : ""}>
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">{studioCs.scenarios[kind]}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs">
                  <pre className={cn("whitespace-pre-wrap break-all", isPrint && "print-pre")}>
                    {JSON.stringify(snapshot.section04_scenarios.scenarioDeltas[kind], null, 2)}
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </ReportSection>
        <ReportSection
          title={reportCs.sections.s05}
          layerBadge={<LayerBadge layer="baseline" isPrint={isPrint} />}
          isPrint={isPrint}
        >
          <pre className={cn("max-h-48 overflow-auto rounded-md border bg-muted/20 p-3 text-xs", isPrint && "print-pre max-h-none border-black bg-white")}>
            {JSON.stringify(snapshot.section05_asIs, null, 2)}
          </pre>
        </ReportSection>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <ModulePre title={reportCs.sections.s06} note={reportCs.labels.moduleJsonNote} json={b.employment} isPrint={isPrint} layer="module_results" />
        <ModulePre title={reportCs.sections.s07} note={reportCs.labels.moduleJsonNote} json={b.housing} isPrint={isPrint} layer="module_results" />
        <ModulePre title={reportCs.sections.s08} note={reportCs.labels.moduleJsonNote} json={b.civic} isPrint={isPrint} layer="module_results" />
        <ModulePre title={reportCs.sections.s09} note={reportCs.labels.moduleJsonNote} json={b.economic} isPrint={isPrint} layer="module_results" />
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <section className="space-y-3">
          <h2 className="flex flex-wrap items-center text-xl font-semibold">
            {reportCs.sections.s10r}
            <LayerBadge layer="assumptions_oq_fallback" isPrint={isPrint} />
          </h2>
          <ul className="space-y-2">
            {snapshot.section10_risks.map((r) => (
              <li
                key={r.id}
                className={cn(
                  "rounded-md p-3 text-sm",
                  isPrint
                    ? "print-box-risk"
                    : "border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/30",
                )}
              >
                <Badge variant="outline" className={cn("mr-2", isPrint && "border-black")}>
                  {r.severity}
                </Badge>
                <span className="font-medium">{r.titleCs}</span>
                <p className={cn("mt-1", isPrint ? "text-black" : "text-muted-foreground")}>
                  {r.detailCs}
                </p>
              </li>
            ))}
          </ul>
        </section>
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">{reportCs.sections.s10m}</h2>
          <ul className="space-y-2">
            {snapshot.section10_mitigations.map((m) => (
              <li
                key={m.id}
                className={cn(
                  "rounded-md border p-3 text-sm",
                  isPrint && "border-black",
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{m.titleCs}</span>
                  <Badge
                    variant={m.source === "heuristic" ? "secondary" : "outline"}
                    className={isPrint ? "border-black" : undefined}
                  >
                    {m.source === "heuristic"
                      ? reportCs.labels.mitigationSourceHeuristic
                      : reportCs.labels.mitigationSourceCivic}
                  </Badge>
                </div>
                <p className={cn("mt-1", isPrint ? "text-black" : "text-muted-foreground")}>
                  {m.detailCs}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </PrintBreak>

      {/* ── PŘÍLOHY ──────────────────────────────────────────────────────── */}
      <div className={cn(
        "flex items-center gap-3 py-2",
        isPrint ? "border-t border-black" : "border-t",
      )}>
        <h2 className={cn(
          "text-lg font-bold tracking-wide",
          isPrint ? "text-black" : "text-muted-foreground",
        )}>
          {reportCs.m8.annexesHeader}
        </h2>
        <span className={cn(
          "text-xs",
          isPrint ? "text-black" : "text-muted-foreground",
        )}>
          {reportCs.m8.annexesNote}
        </span>
      </div>

      <PrintBreak enabled={isPrint}>
        <ReportSection
          title={reportCs.sections.s11}
          layerBadge={<LayerBadge layer="scenarios" isPrint={isPrint} />}
          isPrint={isPrint}
        >
          <div className="overflow-x-auto print:overflow-visible">
            <ComparisonTable snapshot={snapshot} isPrint={isPrint} />
          </div>
        </ReportSection>
        <ReportSection
          title={reportCs.sections.m7}
          layerBadge={<LayerBadge layer="scenarios" isPrint={isPrint} />}
          isPrint={isPrint}
        >
          <M7ConsolidationBlock snapshot={snapshot} isPrint={isPrint} />
        </ReportSection>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <ReportSection
          title={reportCs.sections.s12}
          layerBadge={<LayerBadge layer="assumptions_oq_fallback" isPrint={isPrint} />}
          isPrint={isPrint}
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
                    snapshot.section12_assumptionsUncertainty
                      .assumptionsMergedByScenario[kind];
                  return (
                    <div
                      key={kind}
                      className={cn(
                        isPrint && "print:break-inside-avoid",
                      )}
                    >
                      <div className="mb-1 text-xs font-medium">{studioCs.scenarios[kind]}</div>
                      <pre className={cn("max-h-40 overflow-auto rounded-md border p-2 text-xs", isPrint ? "print-pre border-black bg-white" : "border bg-blue-50/50 dark:bg-blue-950/30")}>
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
                    snapshot.section12_assumptionsUncertainty
                      .openQuestionsByScenario[kind];
                  return (
                    <div
                      key={kind}
                      className={cn(isPrint && "print:break-inside-avoid")}
                    >
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
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <section className="space-y-2 print:break-inside-auto">
          <h2 className="flex flex-wrap items-center text-xl font-semibold">
            {reportCs.sections.s13}
            <LayerBadge layer="assumptions_oq_fallback" isPrint={isPrint} />
          </h2>
          <p className={cn("text-sm", isPrint ? "text-black" : "text-muted-foreground")}>
            {reportCs.labels.traceNote}
          </p>
          {isPrint ? (
            <pre className="print-pre max-h-[220mm] overflow-hidden rounded-md border border-black bg-white p-3 text-black">
              {formatAuditForPrint(snapshot)}
            </pre>
          ) : (
            <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                {auditOpen ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
                {reportCs.labels.auditTraceToggle}
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                  {JSON.stringify(snapshot.section13_audit, null, 2)}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </section>
      </PrintBreak>
    </div>
  );
}

function ModulePre({
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
      isPrint={isPrint}
      layerBadge={layer ? <LayerBadge layer={layer} isPrint={isPrint} /> : undefined}
    >
      <p className="mb-2 text-xs text-muted-foreground">{note}</p>
      <pre className={cn("rounded-md border bg-muted/20 p-3 text-sm", isPrint && "print-pre border-black bg-white")}>
        {JSON.stringify(json, null, 2)}
      </pre>
    </ReportSection>
  );
}

function ReportSection({
  title,
  children,
  isPrint,
  layerBadge,
}: {
  title: string;
  children: React.ReactNode;
  isPrint: boolean;
  layerBadge?: React.ReactNode;
}) {
  return (
    <section className={cn("space-y-2", isPrint && "print:break-inside-avoid")}>
      <h2 className="flex flex-wrap items-center text-xl font-semibold">
        {title}
        {layerBadge}
      </h2>
      {children}
    </section>
  );
}

function Kpi({
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
  /** Na obrazovce — slovníček u KPI; tisk bez ikony (text zůstává v sublabel). */
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

function Field({
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
