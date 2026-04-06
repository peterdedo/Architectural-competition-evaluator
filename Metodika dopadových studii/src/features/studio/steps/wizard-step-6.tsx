"use client";

import { WizardFieldGroup } from "../components/wizard-field-group";
import { useWizardStore } from "../wizard-store";
import { useWizardStep6Slice } from "../wizard-step-selectors";
import { getDemoWizardReference } from "../demo-wizard-reference";
import {
  num,
  StepFields,
  WIZARD_METHOD_NOTE_CLASS,
  WIZARD_SECTION_INTRO_CLASS,
  WIZARD_SECTION_TITLE_CLASS,
} from "../studio-wizard-shared";

export function WizardStep6({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const demo = getDemoWizardReference();
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep6Slice();
  const p1 = useWizardStore((s) => s.state.p1PipelineBridge);

  const onFieldChange = (key: string, raw: string) => {
    const n = num(raw);
    patchState({
      [key]: key === "civicRampYears" ? Math.max(1, Math.round(n)) : n,
    } as never);
  };

  return (
    <div className="space-y-6">
      <header className="space-y-1.5">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Občanská vybavenost
        </h3>
        <p className="text-xs text-muted-foreground/90">
          Nároky na školy, zdravotnictví, bezpečnost a volnočasová zařízení
          odvozené z počtu nových obyvatel záměru. Vyplňte bloky v pořadí podle
          vašich dat.
        </p>
      </header>

      <WizardFieldGroup title="Odhad obyvatel (vstup do M5)">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "ou",
              label: "Odhadovaný počet nových usazených obyvatel",
              helper:
                "Celkový počet obyvatel, kteří se usadí v regionu v důsledku záměru — vstup do výpočtu občanské vybavenosti. Metodický symbol: OU.",
              value: String(state.ou),
              number: true,
            },
          ]}
          onChange={onFieldChange}
        />
        <details
          className={`mt-2 rounded-md border border-dashed border-border/40 bg-transparent px-2.5 py-1.5 ${WIZARD_METHOD_NOTE_CLASS}`}
        >
          <summary className="cursor-pointer underline-offset-2 hover:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
            Efektivní OU vs. pole výše (technický náhled)
          </summary>
          <p className="mt-1.5 leading-relaxed text-muted-foreground/65">
            {p1.linkCivicOuToM4Ou ? (
              <>
                Most <span className="font-medium text-foreground/90">M4→M5</span>{" "}
                je zapnutý — do M5 se po přepočtu dosadí{" "}
                <span className="font-medium text-foreground/90">OU z modulu
                bydlení</span> (M4), ne nutně číslo v poli výše. Pole slouží jako
                záloha / kontrola, pokud most vypnete.
              </>
            ) : (
              <>
                Most M4→M5 je vypnutý — engine použije přímo hodnotu z pole výše
                jako vstup OU do M5.
              </>
            )}{" "}
            Po přepočtu najdete srovnání v sekci výsledků pod „Jak aplikace došla k
            číslům“.
          </p>
        </details>
      </WizardFieldGroup>

      <WizardFieldGroup title="Školství">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "capRegMs",
              label: "Kapacita mateřských škol v území (rejstřík)",
              helper: "Celková zapsaná kapacita MŠ v dostupném území záměru.",
              value: String(state.capRegMs),
              number: true,
              demoValue: String(demo.capRegMs),
            },
            {
              key: "capRegZs",
              label: "Kapacita základních škol v území (rejstřík)",
              helper: "Celková zapsaná kapacita ZŠ v dostupném území.",
              value: String(state.capRegZs),
              number: true,
              demoValue: String(demo.capRegZs),
            },
            {
              key: "enrolledMs",
              label: "Aktuálně zapsaní žáci v MŠ",
              helper:
                "Současné obsazení — pro výpočet zbývající volné kapacity MŠ.",
              value: String(state.enrolledMs),
              number: true,
              demoValue: String(demo.enrolledMs),
            },
            {
              key: "enrolledZs",
              label: "Aktuálně zapsaní žáci v ZŠ",
              helper:
                "Současné obsazení — pro výpočet zbývající volné kapacity ZŠ.",
              value: String(state.enrolledZs),
              number: true,
              demoValue: String(demo.enrolledZs),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Zdravotnictví">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "pxSpecialistsAggregate",
              label:
                "Agregovaný vstup PX — specialistická ambulantní péče (OQ-08)",
              helper:
                "Metodika počítá NX = OU / PX. Zadejte kladné číslo (souhrnný nebo zprůměrovaný vstup PX dle metodiky INP-508), ne podíl 0–1. Ukázková hodnota 180 k OU 210 dává orientační NX ≈ 1,17.",
              value: String(state.pxSpecialistsAggregate),
              number: true,
              demoValue: String(demo.pxSpecialistsAggregate),
            },
            {
              key: "acuteBedsCapacity",
              label: "Kapacita akutních lůžek v dostupném území (volitelně)",
              helper:
                "Počet akutních lůžek v nemocnicích v dostupném zázemí záměru. Pokud nevyplníte, výpočet použije normativní hodnoty.",
              value: String(state.acuteBedsCapacity),
              number: true,
              demoValue: String(demo.acuteBedsCapacity),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Bezpečnost">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "nCelkemM3",
              label: "Celkový počet pracovních míst záměru (pro bezpečnost)",
              helper:
                "Vstup z výpočtu zaměstnanosti (M3), nebo ručně zadaná hodnota — pro odhad nároků na veřejnou bezpečnost. Metodický symbol: N_celkem.",
              value: String(state.nCelkemM3),
              number: true,
              demoValue: String(demo.nCelkemM3),
            },
            {
              key: "nAgentCizinci",
              label: "Z toho agenturní pracovníci — cizinci",
              helper:
                "Počet cizinců mezi agenturními pracovníky — vstup do výpočtu bezpečnostních nároků.",
              value: String(state.nAgentCizinci),
              number: true,
              demoValue: String(demo.nAgentCizinci),
            },
            {
              key: "fteSecurityPer1000",
              label: "Norma bezpečnostních pracovníků (FTE / 1 000 obyvatel)",
              helper:
                "Metodická norma — kolik bezpečnostních FTE připadá na 1 000 obyvatel. Metodický symbol: FTE_security.",
              value: String(state.fteSecurityPer1000),
              number: true,
              demoValue: String(demo.fteSecurityPer1000),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Volný čas">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "kstandardLeisure",
              label: "Koeficient standardu volnočasové vybavenosti",
              helper:
                "Normalizovaný koeficient pro výpočet nároků na volnočasová zařízení (sportovní haly, kultura). Metodický symbol: K_leisure.",
              value: String(state.kstandardLeisure),
              number: true,
              demoValue: String(demo.kstandardLeisure),
            },
            {
              key: "leisureCapacityUnits",
              label: "Kapacita volnočasových zařízení (volitelně)",
              helper:
                "Celkový počet kapacitních jednotek sportovišť a kulturních center v dostupném území. Volitelné.",
              value: String(state.leisureCapacityUnits),
              number: true,
              demoValue: String(demo.leisureCapacityUnits),
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
              key: "civicRampYears",
              label: "Doba náběhu — občanská vybavenost (roky)",
              helper:
                "Za kolik let se nové bydlení plně projeví v nárocích na občanskou vybavenost.",
              value: String(state.civicRampYears),
              number: true,
              int: true,
              demoValue: String(demo.civicRampYears),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>
    </div>
  );
}
