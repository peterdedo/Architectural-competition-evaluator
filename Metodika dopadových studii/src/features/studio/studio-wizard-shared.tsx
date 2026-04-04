"use client";

import { memo } from "react";
import { InfoTip } from "@/components/info-tip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { WarningFieldNavigation } from "./warning-field-navigation";

export function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
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
}) {
  const errId = id ? `${id}-error` : undefined;
  const hasErr = Boolean(fieldError);
  return (
    <div className="space-y-2">
      <Label
        {...(id ? { htmlFor: id } : {})}
        title={expertHint ? `Metodika: ${expertHint}` : undefined}
        className={expertHint ? "cursor-help" : undefined}
      >
        {label}
      </Label>
      {helperText ? (
        <p className="text-xs leading-snug text-muted-foreground">{helperText}</p>
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
        className={hasErr ? "border-amber-500" : ""}
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
  }[];
  onChange: (key: string, raw: string) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const errId = `${f.key}-error`;
        const hasErr = Boolean(errors[f.key]);
        return (
          <div key={f.key} className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Label htmlFor={f.key} title={f.labelTitle}>
                {f.label}
              </Label>
              {f.infoTooltip ? (
                <InfoTip text={f.infoTooltip} ariaLabel={`Vysvětlení: ${f.label}`} />
              ) : null}
            </div>
            {f.helper ? (
              <p className="text-xs leading-snug text-muted-foreground">
                {f.helper}
              </p>
            ) : null}
            <Input
              id={f.key}
              type={f.number ? "number" : "text"}
              step={f.int ? "1" : "any"}
              inputMode={f.number ? "decimal" : undefined}
              value={f.value}
              onChange={(e) => onChange(f.key, e.target.value)}
              className={hasErr ? "border-amber-500" : ""}
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
