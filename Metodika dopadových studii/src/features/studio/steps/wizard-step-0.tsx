"use client";



import { glossaryCs } from "@/content/glossary-cs";

import { Button } from "@/components/ui/button";

import { Separator } from "@/components/ui/separator";

import { useWizardStore } from "../wizard-store";

import { useWizardStep0Slice } from "../wizard-step-selectors";

import { num, StepFields } from "../studio-wizard-shared";



function SectionTitle({ children }: { children: React.ReactNode }) {

  return (

    <h3 className="text-sm font-semibold tracking-tight text-foreground">

      {children}

    </h3>

  );

}



export function WizardStep0({

  fieldErrors,

}: {

  fieldErrors: Record<string, string>;

}) {

  const patchState = useWizardStore((s) => s.patchState);

  const state = useWizardStep0Slice();

  const m0 = state.layerM0;



  const setM0 = (partial: Partial<typeof m0>) => {

    patchState({ layerM0: { ...m0, ...partial } });

  };



  const setScope = (partial: Partial<typeof m0.scopeCapacity>) => {

    patchState({

      layerM0: {

        ...m0,

        scopeCapacity: { ...m0.scopeCapacity, ...partial },

      },

    });

  };



  const setSchedule = (partial: Partial<typeof m0.schedule>) => {

    patchState({

      layerM0: {

        ...m0,

        schedule: { ...m0.schedule, ...partial },

      },

    });

  };



  const setPmj = (partial: Partial<typeof m0.pmjPortfolio>) => {

    patchState({

      layerM0: {

        ...m0,

        pmjPortfolio: { ...m0.pmjPortfolio, ...partial },

      },

    });

  };



  const addDoc = () => {

    setM0({

      strategicDocuments: [...m0.strategicDocuments, { title: "", relevance: "" }],

    });

  };



  const updateDoc = (i: number, key: "title" | "relevance", v: string) => {

    const next = m0.strategicDocuments.map((d, j) =>

      j === i ? { ...d, [key]: v } : d,

    );

    setM0({ strategicDocuments: next });

  };



  const removeDoc = (i: number) => {

    setM0({

      strategicDocuments: m0.strategicDocuments.filter((_, j) => j !== i),

    });

  };



  return (

    <div className="space-y-8">

      <div className="space-y-3">

        <SectionTitle>Základ záměru</SectionTitle>

        <StepFields

          errors={fieldErrors}

          fields={[

            {

              key: "projectName",

              label: "Název / pracovní název záměru",

              value: state.projectName,

            },

            {

              key: "locationDescription",

              label: "Lokalita (kraj, obec, stručný popis)",

              value: state.locationDescription,

            },

            { key: "czNace", label: "Hlavní CZ-NACE", value: state.czNace },

            {

              key: "capexTotalCzk",

              label: "CAPEX celkem (Kč)",

              value: String(state.capexTotalCzk),

              number: true,

            },

            {

              key: "nInv",

              label: "Plánovaný počet PMJ v plném provozu",

              value: String(state.nInv),

              number: true,

              int: true,

              infoTooltip: glossaryCs.PMJ,

              helper:

                "Počet pracovních míst u investora — vstup do výpočtu zaměstnanosti (M3).",

            },

            {

              key: "t0",

              label: "Rozhodný okamžik T0 (rok nebo datum)",

              value: state.t0,

              helper:

                "Okamžik, ke kterému porovnáváte výchozí stav a dopady záměru.",

            },

          ]}

          onChange={(key, raw) => {

            if (key === "capexTotalCzk") patchState({ capexTotalCzk: num(raw) });

            else if (key === "nInv") patchState({ nInv: Math.round(num(raw)) });

            else patchState({ [key]: raw } as never);

          }}

        />

      </div>



      <Separator />



      <div className="space-y-3">

        <SectionTitle>Investor a právní rámec</SectionTitle>

        <StepFields

          errors={fieldErrors}

          fields={[

            {

              key: "investorProfile",

              label: "Kdo investuje — profil a kontext",

              value: state.investorProfile,

              helper: "Stručně: zkušenosti, skupina, relevantní reference.",

            },

            { key: "legalForm", label: "Právní forma", value: state.legalForm },

            {

              key: "strategicLinks",

              label: "Vazby na strategické dokumenty (volitelné, volný text)",

              value: state.strategicLinks,

              helper:

                "Doplňuje tabulku dokumentů níže — můžete uvést obecný soulad.",

            },

          ]}

          onChange={(key, raw) => patchState({ [key]: raw } as never)}

        />

      </div>



      <Separator />



      <div className="space-y-3">

        <SectionTitle>Identifikace a sektor</SectionTitle>

        <StepFields

          errors={{}}

          fields={[

            {

              key: "projectCode",

              label: "Interní kód / zkratka projektu (volitelné)",

              value: m0.projectCode,

            },

            {

              key: "investorDisplayName",

              label: "Zobrazovaný název investora",

              value: m0.investorDisplayName,

            },

            {

              key: "secondaryNace",

              label: "Další CZ-NACE (oddělte čárkou)",

              value: m0.secondaryNace,

            },

          ]}

          onChange={(key, raw) => setM0({ [key]: raw } as never)}

        />

      </div>



      <div className="space-y-2">

        <SectionTitle>Rozsah a kapacita záměru</SectionTitle>

        <p className="text-xs text-muted-foreground leading-snug">

          Strukturovaný popis rozsahu — doplní kontext k číslům CAPEX a PMJ.

        </p>

        <textarea

          className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

          value={m0.capacityNarrative}

          onChange={(e) => setM0({ capacityNarrative: e.target.value })}

          placeholder="Co přesně má záměr obsahovat (provozy, technologie, fáze)…"

        />

        <div className="grid gap-4 sm:grid-cols-2">

          <StepFields

            errors={{}}

            fields={[

              {

                key: "floorAreaM2",

                label: "Podlahová plocha staveb (m², orientačně)",

                value: String(m0.scopeCapacity.floorAreaM2),

                number: true,

              },

              {

                key: "siteAreaM2",

                label: "Plocha areálu / pozemku (m²)",

                value: String(m0.scopeCapacity.siteAreaM2),

                number: true,

              },

            ]}

            onChange={(key, raw) => {

              const n = num(raw);

              if (key === "floorAreaM2") setScope({ floorAreaM2: n });

              else setScope({ siteAreaM2: n });

            }}

          />

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium" htmlFor="throughputNote">

            Propustnost / výkon (slovně)

          </label>

          <InputLikeTextarea

            id="throughputNote"

            value={m0.scopeCapacity.throughputNote}

            onChange={(v) => setScope({ throughputNote: v })}

          />

        </div>

      </div>



      <div className="space-y-3">

        <SectionTitle>Harmonogram</SectionTitle>

        <StepFields

          errors={{}}

          fields={[

            {

              key: "constructionStart",

              label: "Zahájení stavby / realizace (text)",

              value: m0.schedule.constructionStart,

            },

            {

              key: "fullOperationPlanned",

              label: "Plánovaný plný provoz",

              value: m0.schedule.fullOperationPlanned,

            },

          ]}

          onChange={(key, raw) => setSchedule({ [key]: raw } as never)}

        />

      </div>



      <div className="space-y-3">

        <SectionTitle>Pracovní místa — struktura a provoz</SectionTitle>

        <StepFields

          errors={{}}

          fields={[

            {

              key: "fteEquivalent",

              label: "Ekvivalent úvazků (FTE) v plném provozu",

              value: String(m0.pmjPortfolio.fteEquivalent),

              number: true,

              helper: "Může se lišit od počtu PMJ — např. směnnost.",

            },

          ]}

          onChange={(key, raw) => {

            if (key === "fteEquivalent")

              setPmj({ fteEquivalent: num(raw) });

          }}

        />

        <div className="space-y-2">

          <label className="text-sm font-medium">Směnnost a režim</label>

          <textarea

            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

            value={m0.pmjPortfolio.shiftsDescription}

            onChange={(e) =>

              setPmj({ shiftsDescription: e.target.value })

            }

          />

        </div>

        <div className="space-y-2">

          <label className="text-sm font-medium">Špičky a sezónnost</label>

          <textarea

            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

            value={m0.pmjPortfolio.peakLoadNote}

            onChange={(e) => setPmj({ peakLoadNote: e.target.value })}

          />

        </div>

      </div>



      <div className="space-y-3">

        <div className="flex flex-wrap items-center justify-between gap-2">

          <SectionTitle>Strategické dokumenty</SectionTitle>

          <Button type="button" variant="outline" size="sm" onClick={addDoc}>

            Přidat řádek

          </Button>

        </div>

        <p className="text-xs text-muted-foreground">

          Uveďte název dokumentu a stručně vztah k záměru (report je zobrazí

          strukturovaně).

        </p>

        {m0.strategicDocuments.length === 0 ? (

          <p className="text-sm text-muted-foreground">Zatím žádné položky.</p>

        ) : (

          <ul className="space-y-3">

            {m0.strategicDocuments.map((d, i) => (

              <li

                key={i}

                className="rounded-md border border-border/80 bg-muted/20 p-3 space-y-2"

              >

                <div className="flex justify-end">

                  <Button

                    type="button"

                    variant="ghost"

                    size="sm"

                    className="text-destructive h-8"

                    onClick={() => removeDoc(i)}

                  >

                    Odebrat

                  </Button>

                </div>

                <input

                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"

                  value={d.title}

                  onChange={(e) => updateDoc(i, "title", e.target.value)}

                  placeholder="Název dokumentu"

                />

                <textarea

                  className="flex min-h-[56px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

                  value={d.relevance}

                  onChange={(e) => updateDoc(i, "relevance", e.target.value)}

                  placeholder="Vztah / relevance k záměru"

                />

              </li>

            ))}

          </ul>

        )}

      </div>

    </div>

  );

}



function InputLikeTextarea({

  id,

  value,

  onChange,

}: {

  id: string;

  value: string;

  onChange: (v: string) => void;

}) {

  return (

    <textarea

      id={id}

      className="flex min-h-[64px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"

      value={value}

      onChange={(e) => onChange(e.target.value)}

    />

  );

}


