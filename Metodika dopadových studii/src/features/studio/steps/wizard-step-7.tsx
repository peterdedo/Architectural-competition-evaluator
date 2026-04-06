"use client";

import { InfoTip } from "@/components/info-tip";
import { glossaryCs } from "@/content/glossary-cs";
import { WizardFieldGroup } from "../components/wizard-field-group";
import { useWizardStore } from "../wizard-store";
import { useWizardStep7Slice } from "../wizard-step-selectors";
import { P1BridgePanelEconomic } from "../components/P1BridgePanel";
import { cs } from "../studio-copy";
import { getDemoWizardReference } from "../demo-wizard-reference";
import {
  num,
  StepFields,
  WIZARD_SECTION_INTRO_CLASS,
  WIZARD_SECTION_TITLE_CLASS,
} from "../studio-wizard-shared";

export function WizardStep7({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const demo = getDemoWizardReference();
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep7Slice();

  const onFieldChange = (key: string, raw: string) =>
    patchState({ [key]: num(raw) } as never);

  return (
    <div className="space-y-6">
      <P1BridgePanelEconomic
        className="rounded-lg border border-border/60 bg-muted/15 p-4"
        flags={state.p1PipelineBridge}
        onPatch={(partial) =>
          patchState({
            p1PipelineBridge: { ...state.p1PipelineBridge, ...partial },
          })
        }
      />

      <header className="space-y-1.5">
        <h3 className={WIZARD_SECTION_TITLE_CLASS}>
          Ekonomika a veřejné rozpočty
        </h3>
        <p
          className={`flex flex-wrap items-center gap-1.5 ${WIZARD_SECTION_INTRO_CLASS}`}
        >
          <span>
            Vstupy pro výpočet HDP, daňových výnosů a příspěvků obcím z RUD.
          </span>
          <InfoTip text={glossaryCs.RUD} ariaLabel="Vysvětlení zkratky RUD" />
        </p>
      </header>

      <WizardFieldGroup title="HDP a manuální vstup">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "mvpManualDeltaHdpCzk",
              label: cs.wizard.deltaHdpField.label,
              helper: cs.wizard.deltaHdpField.helper,
              labelTitle: cs.wizard.deltaHdpField.labelTitle,
              value: String(state.mvpManualDeltaHdpCzk),
              number: true,
              demoValue: String(demo.mvpManualDeltaHdpCzk),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Nemovitosti a daň z nemovitostí">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "sStavbyM2",
              label: "Zastavěná plocha staveb záměru (m²)",
              helper:
                "Celková podlahová plocha staveb — vstup do výpočtu daně z nemovitostí.",
              value: String(state.sStavbyM2),
              number: true,
            },
            {
              key: "sPlochyM2",
              label: "Zpevněné plochy záměru (m²)",
              helper:
                "Parkoviště, příjezdové komunikace, zpevněné povrchy — vstup do daně z nemovitostí.",
              value: String(state.sPlochyM2),
              number: true,
            },
            {
              key: "sStavbyKcPerM2",
              label: "Daňová sazba ze staveb (Kč/m²)",
              helper:
                "Sazba daně z nemovitostí pro stavby dle místní vyhlášky obce.",
              value: String(state.sStavbyKcPerM2),
              number: true,
            },
            {
              key: "sPlochyKcPerM2",
              label: "Daňová sazba ze zpevněných ploch (Kč/m²)",
              helper: "Sazba daně z nemovitostí pro zpevněné plochy.",
              value: String(state.sPlochyKcPerM2),
              number: true,
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="RUD a příspěvek obci">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "kMistni",
              label: "Místní koeficient daně z nemovitostí",
              helper:
                "Koeficient dle místní vyhlášky obce (zpravidla 1–5). Metodický symbol: k_místní.",
              value: String(state.kMistni),
              number: true,
              demoValue: String(demo.kMistni),
            },
            {
              key: "kZakladni",
              label: "Základní koeficient přepočtu RUD",
              helper:
                "Koeficient přepočtu dle zákona o rozpočtovém určení daní — závisí na velikosti obce. Metodický symbol: k_základní.",
              infoTooltip: glossaryCs.Rp_RUD,
              value: String(state.kZakladni),
              number: true,
              demoValue: String(demo.kZakladni),
            },
            {
              key: "nNovaForPrud",
              label: "Noví obyvatelé pro výpočet příspěvku obci (RUD)",
              helper:
                "Počet nových přistěhovalých obyvatel, kteří se promítnou do příspěvku obci z RUD. Metodický symbol: N_nová.",
              infoTooltip: glossaryCs.RUD,
              value: String(state.nNovaForPrud),
              number: true,
              demoValue: String(demo.nNovaForPrud),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>
    </div>
  );
}
