"use client";

import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * Inline info ikonka (ⓘ) s tooltipom.
 * Krátke vysvetlenie pojmu — max 2-3 vety.
 */
export function InfoTip({
  text,
  side = "top",
  align = "center",
  sideOffset = 6,
  collisionPadding = 12,
  contentClassName,
  className,
  ariaLabel = "Vysvětlení pojmu",
}: {
  text: string;
  side?: "top" | "bottom" | "left" | "right";
  /** Zarovnání vůči spoušti — u hlavičky průvodce často „end“, aby obsah zůstal ve sloupci karty. */
  align?: "start" | "center" | "end";
  sideOffset?: number;
  /** Odstup od okrajů viewportu při collision (Radix). */
  collisionPadding?: number;
  className?: string;
  contentClassName?: string;
  /** Popisek pro čtečky obrazovky (např. „Vysvětlení: PMJ“). */
  ariaLabel?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          className={cn(
            "inline-flex h-4 w-4 items-center justify-center rounded-full",
            "text-muted-foreground hover:text-foreground focus-visible:outline-none",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
            "transition-colors",
            className,
          )}
        >
          <Info className="h-3.5 w-3.5" aria-hidden />
        </button>
      </TooltipTrigger>
      <TooltipContent
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={collisionPadding}
        className={contentClassName}
      >
        <p className="max-w-[min(20rem,calc(100vw-2rem))] leading-relaxed">
          {text}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * Rozbaľovací info panel pre väčšie vysvetlenie bloku.
 * Spúšťa sa cez "Ako to čítať?" / "Čo je toto?" link.
 */
export function InfoPanel({
  trigger,
  children,
  className,
}: {
  trigger: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <details className={cn("group", className)}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1">
        <Info className="h-3 w-3" aria-hidden />
        {trigger}
      </summary>
      <div className="mt-2 rounded-md border border-border/50 bg-muted/40 px-3 py-2 text-sm leading-relaxed text-muted-foreground">
        {children}
      </div>
    </details>
  );
}
