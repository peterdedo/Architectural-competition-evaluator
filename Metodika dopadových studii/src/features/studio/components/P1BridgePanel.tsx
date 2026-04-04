"use client";

import { InfoTip } from "@/components/info-tip";
import { glossaryCs } from "@/content/glossary-cs";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { P1PipelineBridgeFlags } from "@/domain/methodology/p1-pipeline-bridge";

function BridgeCheckbox({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint: string;
}) {
  const hintId = `${id}-hint`;
  return (
    <div className="flex gap-3 rounded-md border border-border/70 bg-muted/20 p-3">
      <input
        id={id}
        type="checkbox"
        className="mt-1 h-4 w-4 shrink-0 rounded border-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        aria-describedby={hintId}
      />
      <div className="min-w-0 space-y-1">
        <Label htmlFor={id} className="cursor-pointer font-medium leading-snug">
          {label}
        </Label>
        <p id={hintId} className="text-xs text-muted-foreground leading-snug">
          {hint}
        </p>
      </div>
    </div>
  );
}

export function P1BridgePanelEmployment({
  flags,
  onPatch,
  className,
}: {
  flags: P1PipelineBridgeFlags;
  onPatch: (partial: Partial<P1PipelineBridgeFlags>) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Propojení s vrstvou P1 (M0 / M2 / horizont)
        </h4>
        <InfoTip
          text="Volitelné přepínače propojují vstupy z jiných kroků průvodce (portfolium PMJ, AS-IS baseline, horizont) do tohoto modulu. Zapněte je, pokud chcete, aby výpočet automaticky využil data, která jste zadali dříve — jinak použijí se jen manuálně vyplněná pole níže."
          side="right"
        />
      </div>
      <BridgeCheckbox
        id="p1-emp-fte"
        checked={flags.applyM0FteToEmployment}
        onChange={(v) => onPatch({ applyM0FteToEmployment: v })}
        label="FTE z PMJ portfolia (M0) → efektivní N_inv před výpočtem potřeby práce"
        hint="Zapněte, pokud má FTE v kroku „Záměr“ vypovídat o skutečném náběru oproti hrubému počtu PMJ."
      />
      <div className="flex gap-3 rounded-md border border-border/70 bg-muted/20 p-3">
        <input
          id="p1-emp-u"
          type="checkbox"
          className="mt-1 h-4 w-4 shrink-0 rounded border-input"
          checked={flags.applyM2UnemploymentToUtilRzps}
          onChange={(e) => onPatch({ applyM2UnemploymentToUtilRzps: e.target.checked })}
          aria-describedby="p1-emp-u-hint"
        />
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Label htmlFor="p1-emp-u" className="cursor-pointer font-medium leading-snug">
              Míra nezaměstnanosti z AS-IS (M2) → měkká úprava util_RZPS
            </Label>
            <InfoTip
              text={glossaryCs.RZPS}
              ariaLabel="Vysvětlení RZPS a využitelnosti pracovní síly"
            />
          </div>
          <p id="p1-emp-u-hint" className="text-xs text-muted-foreground leading-snug">
            Heuristická návaznost na lokální trh — výsledek je v auditní stopě (P1-M2-U).
          </p>
        </div>
      </div>
      <BridgeCheckbox
        id="p1-emp-ramp"
        checked={flags.alignEmploymentRampToProjectHorizon}
        onChange={(v) => onPatch({ alignEmploymentRampToProjectHorizon: v })}
        label="Omezit náběh zaměstnanosti na horizont projektu (min s globálním horizontem)"
        hint="Použije menší z hodnot „Ramp zaměstnanost“ a „Referenční horizont“ ze scénářů."
      />
    </div>
  );
}

export function P1BridgePanelHousing({
  flags,
  onPatch,
  className,
}: {
  flags: P1PipelineBridgeFlags;
  onPatch: (partial: Partial<P1PipelineBridgeFlags>) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Propojení s vrstvou P1 (M2 / horizont)
        </h4>
        <InfoTip
          text="Propojuje bydlení s daty z výchozího stavu území (AS-IS) a s výsledkem výpočtu zaměstnanosti. Nechte výchozí, pokud nechcete automatické návaznosti."
          side="right"
        />
      </div>
      <BridgeCheckbox
        id="p1-h-vac"
        checked={flags.applyM2VacantToHousingSupply}
        onChange={(v) => onPatch({ applyM2VacantToHousingSupply: v })}
        label="Volné jednotky z AS-IS (M2) → max s polem V_t vacant (nabídka)"
        hint="Efektivní nabídka = max(MVP vstup, baseline z M2), pokud je baseline kladná."
      />
      <BridgeCheckbox
        id="p1-h-mig"
        checked={flags.applyM2MigrationToKmen}
        onChange={(v) => onPatch({ applyM2MigrationToKmen: v })}
        label="Migrační saldo (M2) → drobná úprava N_kmen pro OU"
        hint="Proxy korekce (4 % migračního salda, ±50 osob) — transparentní fallback."
      />
      <BridgeCheckbox
        id="p1-h-ramp"
        checked={flags.alignHousingRampToProjectHorizon}
        onChange={(v) => onPatch({ alignHousingRampToProjectHorizon: v })}
        label="Omezit náběh bydlení na horizont projektu"
        hint="min(ramp bydlení, globální horizont)."
      />
      <BridgeCheckbox
        id="p1-h-m3"
        checked={flags.linkHousingToEmploymentM3}
        onChange={(v) => onPatch({ linkHousingToEmploymentM3: v })}
        label="N_agentura a N_pendler z výsledku zaměstnanosti (M3)"
        hint="Zapněte, aby se bydlení nepoužívalo odděleně od mezery na trhu práce; pole N_agentura / N_pendler níže pak slouží jen jako záloha pro ruční scénáře."
      />
    </div>
  );
}

export function P1BridgePanelEconomic({
  flags,
  onPatch,
  className,
}: {
  flags: P1PipelineBridgeFlags;
  onPatch: (partial: Partial<P1PipelineBridgeFlags>) => void;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Propojení s modulem M6 (přínosy)
        </h4>
        <InfoTip
          text="Pokud zapnete výpočtový profil DELTA_HDP, hodnota se automaticky odvodí z CAPEX a počtu pracovních míst. Ručně zadané pole DELTA_HDP pak slouží jen jako záloha."
          side="right"
        />
      </div>
      <BridgeCheckbox
        id="p1-m6-delta"
        checked={flags.useComputedM6DeltaHdp}
        onChange={(v) => onPatch({ useComputedM6DeltaHdp: v })}
        label="Profil ΔHDP z CAPEX a výstupu M3 (multiplikátory § 2.4)"
        hint="Zapnuto: roční ΔHDP se skládá z investičního impulsu (CAPEX / rampa × M_investice), mezdového proxy (N_celkem × M_region × 12 × M_mista, OQ-05) a indukovaného G z investice. Ruční pole ΔHDP zůstává jako záloha při neplatném profilu. Vypnuto: čistý ruční MVP vstup."
      />
    </div>
  );
}
