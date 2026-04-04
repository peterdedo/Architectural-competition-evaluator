"use client";

import { useMemo } from "react";
import { useWizardStore } from "../wizard-store";
import { useWizardStep4Slice } from "../wizard-step-selectors";
import {
  effectiveEmploymentRampYears,
  effectiveNInvForEmployment,
} from "../p1-pipeline-derive";
import { P1BridgePanelEmployment } from "../components/P1BridgePanel";
import { num, StepFields } from "../studio-wizard-shared";

export function WizardStep4({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep4Slice();

  const nInvEff = useMemo(
    () =>
      effectiveNInvForEmployment(
        state.nInv,
        state.layerM0,
        state.p1PipelineBridge,
      ),
    [state.nInv, state.layerM0, state.p1PipelineBridge],
  );

  const empRampEff = useMemo(() => {
    const st = useWizardStore.getState().state;
    return effectiveEmploymentRampYears(st);
  }, [
    state.employmentRampYears,
    state.rampYearsGlobal,
    state.p1PipelineBridge.alignEmploymentRampToProjectHorizon,
  ]);

  return (
    <div className="space-y-8">
      <P1BridgePanelEmployment
        flags={state.p1PipelineBridge}
        onPatch={(partial) =>
          patchState({
            p1PipelineBridge: { ...state.p1PipelineBridge, ...partial },
          })
        }
      />

      <details className="rounded-md border border-dashed border-muted-foreground/25 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">
          Výpočet použije tyto hodnoty (technický náhled)
        </summary>
        <p className="mt-2 leading-snug">
          Efektivní počet pracovních míst:{" "}
          <strong>{nInvEff.nInvEffective.toFixed(1)}</strong> (zadáno{" "}
          {state.nInv}, faktor {nInvEff.fteFactor.toFixed(3)}) · Doba náběhu:{" "}
          <strong>{empRampEff} let</strong> (globální horizont{" "}
          {state.rampYearsGlobal} let)
        </p>
      </details>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Zaměstnanost a trh práce
        </h3>
        <p className="text-xs text-muted-foreground">
          Rozdělení pracovních míst a mzdové parametry — vstupují do výpočtu
          potřeby regionální pracovní síly.
        </p>

        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "kInv",
              label: "Podíl vlastních (kmenových) zaměstnanců investora",
              helper: "Hodnota 0–1. Kolik zaměstnanců pochází přímo od investora; zbytek jsou agenturní a dočasní pracovníci. Metodický symbol: k_inv.",
              value: String(state.kInv),
              number: true,
            },
            {
              key: "aUp",
              label: "Pracovní místa skupiny A — hlavní provoz",
              helper: "Rutinní provozní a výrobní místa záměru. Klasifikace dle územního plánování.",
              value: String(state.aUp),
              number: true,
            },
            {
              key: "bUp",
              label: "Pracovní místa skupiny B — odborná a řídící",
              helper: "Technické, manažerské a administrativní pozice.",
              value: String(state.bUp),
              number: true,
            },
            {
              key: "cUp",
              label: "Pracovní místa skupiny C — podpůrné funkce",
              helper: "Pomocné a podpůrné funkce (úklid, ostraha, logistika).",
              value: String(state.cUp),
              number: true,
            },
            {
              key: "mNew",
              label: "Průměrná hrubá mzda u investora (Kč/měsíc)",
              helper: "Průměrná hrubá měsíční mzda nových zaměstnanců záměru. Metodický symbol: M_new.",
              value: String(state.mNew),
              number: true,
            },
            {
              key: "mRegion",
              label: "Mediánová mzda v regionu (Kč/měsíc)",
              helper: "Aktuální regionální mediánová mzda — vstup do výpočtu atraktivity záměru. Metodický symbol: M_region.",
              value: String(state.mRegion),
              number: true,
            },
            {
              key: "npVm",
              label: "Nepřímá pracovní místa na jedno přímé místo",
              helper: "Koeficient navazující zaměstnanosti — kolik nepřímých míst vznikne na každé přímé pracovní místo záměru. Metodický symbol: NP_vm.",
              value: String(state.npVm),
              number: true,
            },
            {
              key: "npTotal",
              label: "Celkový odhad nepřímých pracovních míst",
              helper: "Celkový počet navazujících míst v dodavatelském řetězci a službách. Metodický symbol: NP_total.",
              value: String(state.npTotal),
              number: true,
            },
            {
              key: "zI",
              label: "Záchytná kapacita regionu (koeficient)",
              helper: "Jakou část potřeby pracovní síly dokáže pokrýt region z vlastních zdrojů. Metodický symbol: Z_i.",
              value: String(state.zI),
              number: true,
            },
            {
              key: "mI",
              label: "Multiplikátor zaměstnanosti",
              helper: "Celkový efekt záměru na regionální zaměstnanost — přímá + navazující místa. Metodický symbol: M_i.",
              value: String(state.mI),
              number: true,
            },
            {
              key: "nSub",
              label: "Substituovaná místa — odhad počtu",
              helper: "Pracovní místa, která záměr přetáhne nebo nahradí u jiných zaměstnavatelů v regionu. Metodický symbol: N_sub.",
              value: String(state.nSub),
              number: true,
            },
            {
              key: "employmentRampYears",
              label: "Doba náběhu zaměstnanosti (roky)",
              helper: "Za kolik let se záměr dostane do plného provozu — ovlivňuje délku přechodného období.",
              value: String(state.employmentRampYears),
              number: true,
              int: true,
            },
          ]}
          onChange={(key, raw) => {
            const n = num(raw);
            patchState({
              [key]:
                key === "employmentRampYears"
                  ? Math.max(1, Math.round(n))
                  : n,
            } as never);
          }}
        />
      </section>
    </div>
  );
}
