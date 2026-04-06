"use client";

import { useMemo } from "react";
import { WizardFieldGroup } from "../components/wizard-field-group";
import { useWizardStore } from "../wizard-store";
import { useWizardStep4Slice } from "../wizard-step-selectors";
import {
  effectiveEmploymentRampYears,
  effectiveNInvForEmployment,
} from "../p1-pipeline-derive";
import { P1BridgePanelEmployment } from "../components/P1BridgePanel";
import { getDemoWizardReference } from "../demo-wizard-reference";
import {
  num,
  StepFields,
  WIZARD_METHOD_NOTE_CLASS,
  WIZARD_SECTION_INTRO_CLASS,
  WIZARD_SECTION_TITLE_CLASS,
} from "../studio-wizard-shared";

export function WizardStep4({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const demo = getDemoWizardReference();
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

  const empRampEff = useMemo(
    () =>
      effectiveEmploymentRampYears({
        employmentRampYears: state.employmentRampYears,
        rampYearsGlobal: state.rampYearsGlobal,
        p1PipelineBridge: state.p1PipelineBridge,
      }),
    [state.employmentRampYears, state.rampYearsGlobal, state.p1PipelineBridge],
  );

  const onFieldChange = (key: string, raw: string) => {
    const n = num(raw);
    patchState({
      [key]:
        key === "employmentRampYears" ? Math.max(1, Math.round(n)) : n,
    } as never);
  };

  return (
    <div className="space-y-6">
      <P1BridgePanelEmployment
        flags={state.p1PipelineBridge}
        onPatch={(partial) =>
          patchState({
            p1PipelineBridge: { ...state.p1PipelineBridge, ...partial },
          })
        }
      />

      <details
        className={`rounded-md border border-dashed border-border/40 bg-transparent px-2.5 py-1.5 ${WIZARD_METHOD_NOTE_CLASS}`}
      >
        <summary className="cursor-pointer underline-offset-2 hover:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Výpočet použije tyto hodnoty (technický náhled)
        </summary>
        <p className="mt-1.5 leading-relaxed text-muted-foreground/65">
          Efektivní počet pracovních míst:{" "}
          <span className="font-medium text-foreground/90">
            {nInvEff.nInvEffective.toFixed(1)}
          </span>{" "}
          (zadáno {state.nInv}, faktor {nInvEff.fteFactor.toFixed(3)}) · Doba
          náběhu:{" "}
          <span className="font-medium text-foreground/90">
            {empRampEff} let
          </span>{" "}
          (globální horizont {state.rampYearsGlobal} let)
        </p>
      </details>

      <header className="space-y-1.5">
        <h3 className={WIZARD_SECTION_TITLE_CLASS}>
          Zaměstnanost a trh práce
        </h3>
        <p className={WIZARD_SECTION_INTRO_CLASS}>
          Rozdělení pracovních míst a mzdové parametry — vstupují do výpočtu
          potřeby regionální pracovní síly.
        </p>
      </header>

      <WizardFieldGroup title="Struktura pracovních míst">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "kInv",
              label: "Podíl vlastních (kmenových) zaměstnanců investora",
              helper:
                "Hodnota 0–1. Kolik zaměstnanců pochází přímo od investora; zbytek jsou agenturní a dočasní pracovníci. Metodický symbol: k_inv.",
              value: String(state.kInv),
              number: true,
            },
            {
              key: "aUp",
              label: "Pracovní místa skupiny A — hlavní provoz",
              helper:
                "Rutinní provozní a výrobní místa záměru. Klasifikace dle územního plánování.",
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
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Mzdy a atraktivita záměru">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "mNew",
              label: "Průměrná hrubá mzda u investora (Kč/měsíc)",
              helper:
                "Průměrná hrubá měsíční mzda nových zaměstnanců záměru. Metodický symbol: M_new.",
              value: String(state.mNew),
              number: true,
              demoValue: String(demo.mNew),
            },
            {
              key: "mRegion",
              label: "Mediánová mzda v regionu (Kč/měsíc)",
              helper:
                "Aktuální regionální mediánová mzda — vstup do výpočtu atraktivity záměru. Metodický symbol: M_region.",
              value: String(state.mRegion),
              number: true,
              demoValue: String(demo.mRegion),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Navazující zaměstnanost a substituce">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "npVm",
              label: "Nepřímá pracovní místa na jedno přímé místo",
              helper:
                "Koeficient navazující zaměstnanosti — kolik nepřímých míst vznikne na každé přímé pracovní místo záměru. Metodický symbol: NP_vm.",
              value: String(state.npVm),
              number: true,
            },
            {
              key: "npTotal",
              label: "Celkový odhad nepřímých pracovních míst",
              helper:
                "Celkový počet navazujících míst v dodavatelském řetězci a službách. Metodický symbol: NP_total.",
              value: String(state.npTotal),
              number: true,
            },
            {
              key: "zI",
              label: "Záchytná kapacita regionu (koeficient)",
              helper:
                "Jakou část potřeby pracovní síly dokáže pokrýt region z vlastních zdrojů. Metodický symbol: Z_i.",
              value: String(state.zI),
              number: true,
            },
            {
              key: "mI",
              label: "Multiplikátor zaměstnanosti",
              helper:
                "Celkový efekt záměru na regionální zaměstnanost — přímá + navazující místa. Metodický symbol: M_i.",
              value: String(state.mI),
              number: true,
            },
            {
              key: "nSub",
              label: "Substituovaná místa — odhad počtu",
              helper:
                "Pracovní místa, která záměr přetáhne nebo nahradí u jiných zaměstnavatelů v regionu. Metodický symbol: N_sub.",
              value: String(state.nSub),
              number: true,
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Časový rámec">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "employmentRampYears",
              label: "Doba náběhu zaměstnanosti (roky)",
              helper:
                "Za kolik let se záměr dostane do plného provozu — ovlivňuje délku přechodného období.",
              value: String(state.employmentRampYears),
              number: true,
              int: true,
              demoValue: String(demo.employmentRampYears),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>
    </div>
  );
}
