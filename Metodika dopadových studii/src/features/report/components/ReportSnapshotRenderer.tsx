"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { M8ContentLayer, MethodologyOutlineChapter, MethodologyReportSnapshot } from "../types";
import { reportCs } from "../report-copy-cs";
import { MethodologyChapterSubsectionContent } from "./methodology-chapter-subsection-content";
import {
  CompletenessChip,
  methodologySubsectionAnchorId,
} from "./methodology-subsection-shell";
import { AgencyShareRiskCallout } from "@/components/agency-share-risk-callout";
import { baselineHasAgencyShareRisk } from "@/features/report/agency-share-risk-snapshot";
import {
  LayerBadge,
  type ReportSnapshotVariant,
} from "./report-core-blocks";
import {
  resolveTrustFraming,
  TRUST_DECISION_BULLETS_FALLBACK,
  TRUST_DECISION_NEUTRAL,
  TRUST_NUMBERS_FOOTNOTE,
  TRUST_SCENARIOS_PRIMARY,
  TRUST_SCENARIOS_SECONDARY,
} from "@/content/trust-framing-cs";

export type { ReportSnapshotVariant };

// --- M8 vrstvové štítky a osnova ---

const LAYER_SCREEN_COLORS: Record<M8ContentLayer, string> = {
  inputs: "bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800",
  baseline: "bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800",
  module_results: "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
  scenarios: "bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800",
  assumptions_oq_fallback: "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
};

function M8OutlineBlock({
  snapshot,
  isPrint,
}: {
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
}) {
  const { outline, annexes } = snapshot.m8_report_completeness;
  const mainPoints = outline.filter(
    (item) => item.id.startsWith("kap-") || item.id.startsWith("bod-"),
  );
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

function resolveChapterMeta(
  snapshot: MethodologyReportSnapshot,
  chapter: number,
  fallbackTitle: string,
): MethodologyOutlineChapter {
  const found = snapshot.methodology_outline_1_10?.chapters.find(
    (c) => c.chapter === chapter,
  );
  if (found) return found;
  return {
    chapter,
    titleCs: fallbackTitle,
    completeness: "partial",
    coverageNoteCs:
      "V této verzi snapshotu chybí metadatová osnova kapitoly — zobrazen obsah ze strukturovaných dat reportu.",
    subsections: [],
  };
}

function MethodologyChapterShell({
  meta,
  isPrint,
  children,
}: {
  meta: MethodologyOutlineChapter;
  isPrint: boolean;
  children: React.ReactNode;
}) {
  const id = `metodika-kap-${meta.chapter}`;
  return (
    <section
      id={id}
      className={cn("space-y-4 scroll-mt-24", isPrint && "print:break-inside-avoid")}
    >
      <header
        className={cn("border-b pb-3", isPrint ? "border-black" : "border-border")}
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={cn(
              "text-xl font-bold tracking-tight",
              isPrint && "text-black",
            )}
          >
            {meta.chapter}. {meta.titleCs}
          </h2>
          <CompletenessChip completeness={meta.completeness} isPrint={isPrint} />
        </div>
        {meta.coverageNoteCs ? (
          <p
            className={cn(
              "mt-2 text-sm leading-snug",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            {meta.coverageNoteCs}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

function MethodologyTocBlock({
  snapshot,
  isPrint,
}: {
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
}) {
  const chapters = snapshot.methodology_outline_1_10?.chapters ?? [];
  if (!chapters.length) return null;
  if (isPrint) {
    return (
      <div className="rounded-md border border-black p-3 text-[9pt] text-black print:break-inside-avoid">
        <p className="font-semibold">Obsah (kapitoly 1–10)</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          {chapters.map((c) => (
            <li key={c.chapter}>
              <span>
                {c.chapter}. {c.titleCs}{" "}
                <span className="text-[8pt] text-neutral-600">
                  (
                  {c.completeness === "complete"
                    ? "kompletní"
                    : c.completeness === "partial"
                      ? "částečně"
                      : "chybí / nezmapováno"}
                  )
                </span>
              </span>
              <span className="mt-1 block pl-4 text-[8pt] leading-snug text-neutral-700">
                {c.subsections.map((s) => `§${s.id}`).join(" · ")}
              </span>
            </li>
          ))}
        </ol>
        <p className="mt-2 text-[8pt] text-neutral-700">
          Podkapitoly 1.1–10.4 jsou v těle dokumentu jako vlastní sekce s obsahem; uvedeny jsou i metodické poznámky a audit zdrojů dat. Kotvy fungují pro kapitoly i podkapitoly.
        </p>
      </div>
    );
  }
  return (
    <nav
      className="rounded-lg border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm"
      aria-label="Obsah reportu dle metodické osnovy 1–10"
    >
      <p className="text-sm font-semibold text-foreground">
        Obsah — kapitoly 1–10
      </p>
      <ol className="mt-3 space-y-3 text-sm">
        {chapters.map((c) => (
          <li key={c.chapter}>
            <div className="flex flex-wrap items-center gap-2">
              <a
                className="font-medium text-primary hover:underline"
                href={`#metodika-kap-${c.chapter}`}
              >
                {c.chapter}. {c.titleCs}
              </a>
              <CompletenessChip completeness={c.completeness} isPrint={false} />
            </div>
            <ol className="mt-2 space-y-1 border-l border-border/70 pl-3 text-xs">
              {c.subsections.map((sub) => (
                <li key={sub.id}>
                  <a
                    className="text-muted-foreground hover:text-primary hover:underline"
                    href={`#${methodologySubsectionAnchorId(sub.id)}`}
                  >
                    {sub.id} {sub.titleCs}
                  </a>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  );
}

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

export function ReportSnapshotRenderer({
  snapshot,
  variant,
}: {
  snapshot: MethodologyReportSnapshot;
  variant: ReportSnapshotVariant;
}) {
  const isPrint = variant === "print";
  const [auditOpen, setAuditOpen] = useState(false);
  const ch = (n: number, fallback: string) =>
    resolveChapterMeta(snapshot, n, fallback);

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
      <MethodologyTocBlock snapshot={snapshot} isPrint={isPrint} />

      <PrintBreak enabled={isPrint}>
        <MethodologyChapterShell meta={ch(1, "Základní údaje o projektu")} isPrint={isPrint}>
          <MethodologyChapterSubsectionContent chapter={1} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
        <MethodologyChapterShell meta={ch(2, "Informace o investorovi a zpracovateli dopadové studie")} isPrint={isPrint}>
          <MethodologyChapterSubsectionContent chapter={2} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
        <MethodologyChapterShell meta={ch(3, "Charakteristika investičního záměru")} isPrint={isPrint}>
          <MethodologyChapterSubsectionContent chapter={3} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <MethodologyChapterShell meta={ch(4, "Vymezení řešeného území")} isPrint={isPrint}>
          <MethodologyChapterSubsectionContent chapter={4} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
        <MethodologyChapterShell meta={ch(5, "Analytická část (AS-IS)")} isPrint={isPrint}>
          <MethodologyChapterSubsectionContent chapter={5} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <MethodologyChapterShell meta={ch(6, "Výpočtová část (TO-BE)")} isPrint={isPrint}>
          <MethodologyChapterSubsectionContent chapter={6} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <MethodologyChapterShell meta={ch(7, "Scénářová analýza")} isPrint={isPrint}>
          <div className={cn("mb-4 space-y-2 rounded-md border p-3 text-sm", isPrint ? "border-black" : "border-border/60 bg-muted/10")}>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn("font-semibold", isPrint && "text-black")}>{reportCs.sections.s04}</span>
              <LayerBadge layer="scenarios" isPrint={isPrint} />
            </div>
            <p className={isPrint ? "text-black" : "text-muted-foreground"}>
              Sdílené symboly (klíče):{" "}
              <span className="break-all font-mono text-xs">
                {snapshot.section04_scenarios.sharedAssumptionKeys.join(", ") || "—"}
              </span>
            </p>
          </div>
          <MethodologyChapterSubsectionContent chapter={7} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <MethodologyChapterShell meta={ch(8, "Riziková analýza a mitigace")} isPrint={isPrint}>
          <MethodologyChapterSubsectionContent chapter={8} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <MethodologyChapterShell meta={ch(9, "Závěry a doporučení")} isPrint={isPrint}>
          <MethodologyChapterSubsectionContent chapter={9} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
      </PrintBreak>

      <PrintBreak enabled={isPrint}>
        <MethodologyChapterShell meta={ch(10, "Přílohy")} isPrint={isPrint}>
          <div
            className={cn(
              "flex flex-wrap items-center gap-3 py-2",
              isPrint ? "border-t border-black" : "border-t",
            )}
          >
            <h3 className={cn("text-base font-bold tracking-wide", isPrint ? "text-black" : "text-muted-foreground")}>
              {reportCs.m8.annexesHeader}
            </h3>
            <span className={cn("text-xs", isPrint ? "text-black" : "text-muted-foreground")}>
              {reportCs.m8.annexesNote}
            </span>
          </div>
          <MethodologyChapterSubsectionContent chapter={10} snapshot={snapshot} isPrint={isPrint} variant={variant} auditOpen={auditOpen} setAuditOpen={setAuditOpen} />
        </MethodologyChapterShell>
      </PrintBreak>
    </div>
  );
}
