"use client";

import { cn } from "@/lib/utils";
import type {
  MethodologyChapterCompleteness,
  MethodologyOutlineSubsection,
} from "../types";

export function methodologySubsectionAnchorId(subsectionId: string): string {
  return `metodika-pod-${subsectionId.replace(/\./g, "-")}`;
}

export function CompletenessChip({
  completeness,
  isPrint,
}: {
  completeness: MethodologyChapterCompleteness;
  isPrint: boolean;
}) {
  const label =
    completeness === "complete"
      ? "Kompletní"
      : completeness === "partial"
        ? "Částečné"
        : "Chybí data";
  const cls =
    completeness === "complete"
      ? isPrint
        ? "border-black bg-neutral-100 text-black"
        : "border-emerald-500/40 bg-emerald-500/10 text-emerald-900 dark:text-emerald-100"
      : completeness === "partial"
        ? isPrint
          ? "border-black bg-white text-black"
          : "border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100"
        : isPrint
          ? "border-dashed border-black text-black"
          : "border-dashed border-muted-foreground/60 text-muted-foreground";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
        cls,
      )}
    >
      {label}
    </span>
  );
}

/** Formální mezera — žádná vymyšlená data; doplnění mimo aplikaci nebo v další verzi vstupů. */
export function SubsectionFormalPlaceholder({
  isPrint,
  children,
}: {
  isPrint: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-md border border-dashed p-3 text-sm leading-relaxed",
        isPrint ? "border-black bg-white text-black" : "border-muted-foreground/50 bg-muted/15",
      )}
    >
      {children ?? (
        <p>
          Tato podkapitola není v aktuální verzi aplikace plně strukturovaně vyplněna. Údaje doplní zpracovatel
          finální dopadové studie, případně po rozšíření vstupního modelu.
        </p>
      )}
    </div>
  );
}

/**
 * Jedna podkapitola osnovy MHDSI — kotva, nadpis, metadatová poznámka a vlastní obsah.
 * `noteCs` / `dataSourceHintCs` z osnovy se zobrazují jako doplňkový kontext (ne jako jediný obsah).
 */
export function MethodologySubsectionShell({
  sub,
  isPrint,
  children,
}: {
  sub: MethodologyOutlineSubsection;
  isPrint: boolean;
  children: React.ReactNode;
}) {
  const id = methodologySubsectionAnchorId(sub.id);
  return (
    <section
      id={id}
      className={cn(
        "scroll-mt-20 space-y-3",
        isPrint && "print:break-inside-avoid",
      )}
    >
      <header className="space-y-1.5 border-b border-border/70 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <h3
            className={cn(
              "min-w-0 flex-1 text-lg font-semibold leading-snug tracking-tight",
              isPrint && "text-black",
            )}
          >
            <span
              className={cn(
                "mr-2 font-mono text-base",
                isPrint ? "text-black" : "text-muted-foreground",
              )}
            >
              {sub.id}
            </span>
            {sub.titleCs}
          </h3>
          <CompletenessChip completeness={sub.completeness} isPrint={isPrint} />
        </div>
        {sub.noteCs ? (
          <p
            className={cn(
              "text-xs leading-snug",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            <span className="font-medium text-foreground/90">Metodická poznámka: </span>
            {sub.noteCs}
          </p>
        ) : null}
        {sub.dataSourceHintCs ? (
          <p
            className={cn(
              "font-mono text-[10px] leading-snug",
              isPrint ? "text-black" : "text-muted-foreground/95",
            )}
          >
            Zdroj dat (audit): {sub.dataSourceHintCs}
          </p>
        ) : null}
      </header>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
