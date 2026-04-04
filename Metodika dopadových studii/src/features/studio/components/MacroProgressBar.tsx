"use client";

import { memo, useCallback } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { uxWizard } from "../ux/studio-ux-copy";
import {
  firstWizardStepForMacro,
  getMacroStepIndex,
} from "../ux/macro-steps";
import { useWizardStore } from "../wizard-store";

export const MacroProgressBar = memo(function MacroProgressBar({
  currentStep,
}: {
  currentStep: number;
}) {
  const setStep = useWizardStore((s) => s.setStep);
  const active = getMacroStepIndex(currentStep);
  const total = uxWizard.macroSteps.length;

  const goToMacroStart = useCallback(
    (macroIdx: number) => {
      if (macroIdx > active) return;
      setStep(firstWizardStepForMacro(macroIdx));
    },
    [active, setStep],
  );

  return (
    <nav
      aria-label="Průběh průvodce — u již zpracovaných fází můžete kliknout a vrátit se na jejich začátek"
      className="space-y-1"
    >
      <p className="text-[10px] text-muted-foreground sm:text-xs">
        U dokončených fází klikněte pro návrat na začátek této části.
      </p>
      {/* Mobilní: compact chips */}
      <ul className="m-0 flex list-none gap-1.5 p-0 sm:hidden">
        {uxWizard.macroSteps.map((m, i) => {
          const done = i < active;
          const current = i === active;
          const clickable = i <= active;
          return (
            <li key={m.id} className="min-w-0 flex-1">
            <button
              type="button"
              title={
                clickable
                  ? `${m.label}: přejít na začátek této části`
                  : `${m.label}: ${m.hint}`
              }
              aria-current={current ? "step" : undefined}
              aria-disabled={!clickable}
              disabled={!clickable}
              onClick={() => goToMacroStart(i)}
              className={cn(
                "h-2 flex-1 rounded-full transition-all",
                clickable && "cursor-pointer hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                done
                  ? "bg-primary"
                  : current
                    ? "bg-primary/60"
                    : "bg-muted",
                !clickable && "cursor-not-allowed opacity-60",
              )}
            />
            </li>
          );
        })}
      </ul>

      {/* Desktop: rozepsané kroky */}
      <ol className="hidden gap-2 sm:flex">
        {uxWizard.macroSteps.map((m, i) => {
          const done = i < active;
          const current = i === active;
          const clickable = i <= active;

          return (
            <li key={m.id} className="min-w-0 flex-1">
              <button
                type="button"
                aria-current={current ? "step" : undefined}
                aria-disabled={!clickable}
                disabled={!clickable}
                onClick={() => goToMacroStart(i)}
                title={
                  clickable
                    ? `${m.label}: přejít na začátek této části`
                    : m.hint
                }
                className={cn(
                  "flex w-full min-w-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all",
                  clickable &&
                    "cursor-pointer hover:border-primary/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
                  done
                    ? "border-primary/30 bg-primary/5 text-primary"
                    : current
                      ? "border-primary/50 bg-primary/10 shadow-sm"
                      : "border-muted bg-muted/20 text-muted-foreground",
                  !clickable && "cursor-not-allowed opacity-70",
                )}
              >
                {/* Číslo / checkmark */}
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    done
                      ? "bg-primary text-primary-foreground"
                      : current
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted-foreground/20 text-muted-foreground",
                  )}
                >
                  {done ? <Check className="h-3 w-3" /> : i + 1}
                </span>

                {/* Text */}
                <div className="min-w-0">
                  <p
                    className={cn(
                      "truncate text-xs font-semibold leading-tight",
                      current
                        ? "text-foreground"
                        : done
                          ? "text-primary/90"
                          : "text-muted-foreground",
                    )}
                  >
                    {m.label}
                  </p>
                  {current && (
                    <p className="truncate text-[10px] leading-tight text-muted-foreground">
                      {m.hint}
                    </p>
                  )}
                </div>

                {/* Spojovací čára (ne za posledním) */}
                {i < total - 1 && (
                  <span
                    className={cn(
                      "ml-auto hidden h-px w-4 shrink-0 xl:block",
                      done ? "bg-primary/40" : "bg-border",
                    )}
                  />
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
});
