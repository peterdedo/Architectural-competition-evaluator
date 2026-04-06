"use client";

import { memo } from "react";
import { InfoTip } from "@/components/info-tip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { WarningFieldNavigation } from "./warning-field-navigation";
import { numbersMatchDemo, valuesMatchDemoDisplay } from "./field-demo-match";

export function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Sekční nadpis uvnitř kroku průvodce */
export const WIZARD_SECTION_TITLE_CLASS =
  "text-base font-semibold tracking-tight text-foreground";

/** Úvodní odstavec pod sekcí — nižší priorita než labely */
export const WIZARD_SECTION_INTRO_CLASS =
  "text-xs leading-relaxed text-muted-foreground/70";

/** Krátká nápověda pod popiskem pole */
export const WIZARD_HELPER_TEXT_CLASS =
  "text-xs leading-relaxed text-muted-foreground/60";

/** Metodická / technická poznámka (ještě tišší) */
export const WIZARD_METHOD_NOTE_CLASS =
  "text-[11px] leading-snug text-muted-foreground/50";

export function wizardInputSurfaceClass({
  hasError,
  isSampleUnchanged,
  multiline,
}: {
  hasError?: boolean;
  isSampleUnchanged?: boolean;
  multiline?: boolean;
}): string {
  return cn(
    "w-full rounded-md border px-3 text-sm text-foreground transition-[box-shadow,background-color,border-color]",
    multiline ? "min-h-[80px] py-2" : "h-10 py-2",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "placeholder:text-muted-foreground/50",
    hasError && "border-amber-500",
    isSampleUnchanged
      ? "border-muted-foreground/25 bg-muted/40 shadow-none"
      : "border-input bg-background shadow-sm",
  );
}

export function WizardSampleBadge() {
  return (
    <span
      className="inline-flex max-w-full shrink-0 items-center rounded border border-border/50 bg-muted/30 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
      title="Hodnota odpovídá výchozí ukázce — můžete ji upravit."
    >
      Ukázka
    </span>
  );
}

export function scrollToWizardField(
  nav: WarningFieldNavigation,
  setStep: (n: number) => void,
) {
  setStep(nav.step);
  window.setTimeout(() => {
    const el = document.getElementById(nav.elementId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (
      el instanceof HTMLInputElement ||
      el instanceof HTMLTextAreaElement
    ) {
      el.focus({ preventScroll: true });
      el.classList.add("ring-2", "ring-amber-500", "ring-offset-2");
      window.setTimeout(() => {
        el.classList.remove("ring-2", "ring-amber-500", "ring-offset-2");
      }, 2200);
    }
  }, 120);
}

export function ScenarioNum({
  id,
  label,
  expertHint,
  value,
  onChange,
  min = 0,
  max = 1,
  step = "any",
  fieldError,
  helperText,
  demoNumeric,
}: {
  id?: string;
  label: string;
  expertHint?: string;
  value: number | "";
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: string;
  fieldError?: string;
  /** Krátká nápověda pod popiskem (např. rozsah 0–1). */
  helperText?: string;
  /** Hodnota z ukázkového stavu pro stejné pole (stejný scénář). */
  demoNumeric?: number;
}) {
  const errId = id ? `${id}-error` : undefined;
  const hasErr = Boolean(fieldError);
  const isSample =
    demoNumeric !== undefined && numbersMatchDemo(value, demoNumeric);
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Label
          {...(id ? { htmlFor: id } : {})}
          title={expertHint ? `Metodika: ${expertHint}` : undefined}
          className={cn(
            "text-sm font-medium text-foreground",
            expertHint && "cursor-help",
          )}
        >
          {label}
        </Label>
        {isSample ? <WizardSampleBadge /> : null}
      </div>
      {helperText ? (
        <p className={WIZARD_METHOD_NOTE_CLASS}>{helperText}</p>
      ) : null}
      <Input
        id={id}
        type="number"
        step={step}
        min={min}
        max={max}
        inputMode="decimal"
        value={value === "" ? "" : value}
        onChange={(e) => onChange(num(e.target.value))}
        className={wizardInputSurfaceClass({
          hasError: hasErr,
          isSampleUnchanged: isSample,
        })}
        aria-invalid={hasErr}
        aria-describedby={hasErr ? errId : undefined}
      />
      {hasErr && errId ? (
        <p id={errId} className="text-xs text-amber-700" role="alert">
          {fieldError}
        </p>
      ) : null}
    </div>
  );
}

export const StepFields = memo(function StepFields({
  fields,
  onChange,
  errors,
}: {
  fields: {
    key: string;
    label: string;
    value: string;
    number?: boolean;
    int?: boolean;
    /** Krátká nápověda pod popiskem (např. význam vstupu). */
    helper?: string;
    /** Tooltip na popisku (title). */
    labelTitle?: string;
    /** Slovníček — krátká nápověda u popisku (přístupnost + konzistence). */
    infoTooltip?: string;
    /** Řetězec stejný jako v inputu — pro odlišení ukázkové hodnoty. */
    demoValue?: string;
  }[];
  onChange: (key: string, raw: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const errId = `${f.key}-error`;
        const hasErr = Boolean(errors[f.key]);
        const isSample = valuesMatchDemoDisplay(f.value, f.demoValue);
        return (
          <div key={f.key} className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Label
                htmlFor={f.key}
                title={f.labelTitle}
                className="text-sm font-medium text-foreground"
              >
                {f.label}
              </Label>
              {f.infoTooltip ? (
                <InfoTip
                  text={f.infoTooltip}
                  ariaLabel={`Vysvětlení: ${f.label}`}
                />
              ) : null}
              {isSample ? <WizardSampleBadge /> : null}
            </div>
            {f.helper ? (
              <p className={WIZARD_HELPER_TEXT_CLASS}>{f.helper}</p>
            ) : null}
            <Input
              id={f.key}
              type={f.number ? "number" : "text"}
              step={f.int ? "1" : "any"}
              inputMode={f.number ? "decimal" : undefined}
              value={f.value}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={wizardInputSurfaceClass({
                hasError: hasErr,
                isSampleUnchanged: isSample,
              })}
              aria-invalid={hasErr}
              aria-describedby={hasErr ? errId : undefined}
            />
            {hasErr ? (
              <p id={errId} className="text-xs text-amber-700" role="alert">
                {errors[f.key]}
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
});
