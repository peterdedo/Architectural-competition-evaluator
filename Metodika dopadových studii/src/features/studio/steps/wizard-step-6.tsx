"use client";

import { useWizardStore } from "../wizard-store";
import { useWizardStep6Slice } from "../wizard-step-selectors";
import { num, StepFields } from "../studio-wizard-shared";

export function WizardStep6({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep6Slice();

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Občanská vybavenost
        </h3>
        <p className="text-xs text-muted-foreground">
          Nároky na školy, zdravotnictví, bezpečnost a volnočasová zařízení
          odvozené z počtu nových obyvatel záměru.
        </p>

        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "ou",
              label: "Odhadovaný počet nových usazených obyvatel",
              helper: "Celkový počet obyvatel, kteří se usadí v regionu v důsledku záměru — vstup do výpočtu občanské vybavenosti. Metodický symbol: OU.",
              value: String(state.ou),
              number: true,
            },
            {
              key: "capRegMs",
              label: "Kapacita mateřských škol v území (rejstřík)",
              helper: "Celková zapsaná kapacita MŠ v dostupném území záměru.",
              value: String(state.capRegMs),
              number: true,
            },
            {
              key: "capRegZs",
              label: "Kapacita základních škol v území (rejstřík)",
              helper: "Celková zapsaná kapacita ZŠ v dostupném území.",
              value: String(state.capRegZs),
              number: true,
            },
            {
              key: "enrolledMs",
              label: "Aktuálně zapsaní žáci v MŠ",
              helper: "Současné obsazení — pro výpočet zbývající volné kapacity MŠ.",
              value: String(state.enrolledMs),
              number: true,
            },
            {
              key: "enrolledZs",
              label: "Aktuálně zapsaní žáci v ZŠ",
              helper: "Současné obsazení — pro výpočet zbývající volné kapacity ZŠ.",
              value: String(state.enrolledZs),
              number: true,
            },
            {
              key: "pxSpecialistsAggregate",
              label: "Průměrná obsazenost ambulancí specialistů (0–1)",
              helper: "Průměrná vytíženost ambulantní péče v území — vstup do výpočtu tlaku na zdravotnictví. Metodický symbol: PX.",
              value: String(state.pxSpecialistsAggregate),
              number: true,
            },
            {
              key: "kstandardLeisure",
              label: "Koeficient standardu volnočasové vybavenosti",
              helper: "Normalizovaný koeficient pro výpočet nároků na volnočasová zařízení (sportovní haly, kultura). Metodický symbol: K_leisure.",
              value: String(state.kstandardLeisure),
              number: true,
            },
            {
              key: "nCelkemM3",
              label: "Celkový počet pracovních míst záměru (pro bezpečnost)",
              helper: "Vstup z výpočtu zaměstnanosti (M3), nebo ručně zadaná hodnota — pro odhad nároků na veřejnou bezpečnost. Metodický symbol: N_celkem.",
              value: String(state.nCelkemM3),
              number: true,
            },
            {
              key: "nAgentCizinci",
              label: "Z toho agenturní pracovníci — cizinci",
              helper: "Počet cizinců mezi agenturními pracovníky — vstup do výpočtu bezpečnostních nároků.",
              value: String(state.nAgentCizinci),
              number: true,
            },
            {
              key: "fteSecurityPer1000",
              label: "Norma bezpečnostních pracovníků (FTE / 1 000 obyvatel)",
              helper: "Metodická norma — kolik bezpečnostních FTE připadá na 1 000 obyvatel. Metodický symbol: FTE_security.",
              value: String(state.fteSecurityPer1000),
              number: true,
            },
            {
              key: "acuteBedsCapacity",
              label: "Kapacita akutních lůžek v dostupném území (volitelně)",
              helper: "Počet akutních lůžek v nemocnicích v dostupném zázemí záměru. Pokud nevyplníte, výpočet použije normativní hodnoty.",
              value: String(state.acuteBedsCapacity),
              number: true,
            },
            {
              key: "leisureCapacityUnits",
              label: "Kapacita volnočasových zařízení (volitelně)",
              helper: "Celkový počet kapacitních jednotek sportovišť a kulturních center v dostupném území. Volitelné.",
              value: String(state.leisureCapacityUnits),
              number: true,
            },
            {
              key: "civicRampYears",
              label: "Doba náběhu — občanská vybavenost (roky)",
              helper: "Za kolik let se nové bydlení plně projeví v nárocích na občanskou vybavenost.",
              value: String(state.civicRampYears),
              number: true,
              int: true,
            },
          ]}
          onChange={(key, raw) => {
            const n = num(raw);
            patchState({
              [key]:
                key === "civicRampYears"
                  ? Math.max(1, Math.round(n))
                  : n,
            } as never);
          }}
        />
      </section>
    </div>
  );
}
