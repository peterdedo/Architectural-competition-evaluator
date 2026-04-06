"use client";

import { glossaryCs } from "@/content/glossary-cs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { getDemoWizardReference } from "../demo-wizard-reference";
import { valuesMatchDemoDisplay } from "../field-demo-match";
import { useWizardStore } from "../wizard-store";
import { useWizardStep0Slice } from "../wizard-step-selectors";
import {
  num,
  StepFields,
  WIZARD_HELPER_TEXT_CLASS,
  WIZARD_SECTION_INTRO_CLASS,
  WIZARD_SECTION_TITLE_CLASS,
  wizardInputSurfaceClass,
  WizardSampleBadge,
} from "../studio-wizard-shared";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className={WIZARD_SECTION_TITLE_CLASS}>{children}</h3>;
}

export function WizardStep0({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const demo = getDemoWizardReference();
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

  const demoDoc0 = demo.layerM0.strategicDocuments[0];

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
              demoValue: demo.projectName,
            },
            {
              key: "locationDescription",
              label: "Lokalita (kraj, obec, stručný popis)",
              value: state.locationDescription,
              demoValue: demo.locationDescription,
            },
            {
              key: "czNace",
              label: "Hlavní CZ-NACE",
              value: state.czNace,
              demoValue: demo.czNace,
            },
            {
              key: "capexTotalCzk",
              label: "CAPEX celkem (Kč)",
              value: String(state.capexTotalCzk),
              number: true,
              demoValue: String(demo.capexTotalCzk),
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
              demoValue: String(demo.nInv),
            },
            {
              key: "t0",
              label: "Rozhodný okamžik T0 (rok nebo datum)",
              value: state.t0,
              helper:
                "Okamžik, ke kterému porovnáváte výchozí stav a dopady záměru.",
              demoValue: demo.t0,
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
              demoValue: demo.investorProfile,
            },
            {
              key: "legalForm",
              label: "Právní forma",
              value: state.legalForm,
              demoValue: demo.legalForm,
            },
            {
              key: "strategicLinks",
              label: "Vazby na strategické dokumenty (volitelné, volný text)",
              value: state.strategicLinks,
              helper:
                "Doplňuje tabulku dokumentů níže — můžete uvést obecný soulad.",
              demoValue: demo.strategicLinks,
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
              demoValue: demo.layerM0.projectCode,
            },
            {
              key: "investorDisplayName",
              label: "Zobrazovaný název investora",
              value: m0.investorDisplayName,
              demoValue: demo.layerM0.investorDisplayName,
            },
            {
              key: "secondaryNace",
              label: "Další CZ-NACE (oddělte čárkou)",
              value: m0.secondaryNace,
              demoValue: demo.layerM0.secondaryNace,
            },
          ]}
          onChange={(key, raw) => setM0({ [key]: raw } as never)}
        />
      </div>

      <div className="space-y-2">
        <SectionTitle>Rozsah a kapacita záměru</SectionTitle>
        <p className={WIZARD_SECTION_INTRO_CLASS}>
          Strukturovaný popis rozsahu — doplní kontext k číslům CAPEX a PMJ.
        </p>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <label
            className="text-sm font-medium text-foreground"
            htmlFor="capacityNarrative"
          >
            Popis rozsahu a kapacity
          </label>
          {valuesMatchDemoDisplay(
            m0.capacityNarrative,
            demo.layerM0.capacityNarrative,
          ) ? (
            <WizardSampleBadge />
          ) : null}
        </div>
        <textarea
          id="capacityNarrative"
          className={cn(
            wizardInputSurfaceClass({
              isSampleUnchanged: valuesMatchDemoDisplay(
                m0.capacityNarrative,
                demo.layerM0.capacityNarrative,
              ),
              multiline: true,
            }),
            "min-h-[88px]",
          )}
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
                demoValue: String(demo.layerM0.scopeCapacity.floorAreaM2),
              },
              {
                key: "siteAreaM2",
                label: "Plocha areálu / pozemku (m²)",
                value: String(m0.scopeCapacity.siteAreaM2),
                number: true,
                demoValue: String(demo.layerM0.scopeCapacity.siteAreaM2),
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
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <label
              className="text-sm font-medium text-foreground"
              htmlFor="throughputNote"
            >
              Propustnost / výkon (slovně)
            </label>
            {valuesMatchDemoDisplay(
              m0.scopeCapacity.throughputNote,
              demo.layerM0.scopeCapacity.throughputNote,
            ) ? (
              <WizardSampleBadge />
            ) : null}
          </div>
          <InputLikeTextarea
            id="throughputNote"
            value={m0.scopeCapacity.throughputNote}
            onChange={(v) => setScope({ throughputNote: v })}
            isSampleUnchanged={valuesMatchDemoDisplay(
              m0.scopeCapacity.throughputNote,
              demo.layerM0.scopeCapacity.throughputNote,
            )}
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
              demoValue: demo.layerM0.schedule.constructionStart,
            },
            {
              key: "fullOperationPlanned",
              label: "Plánovaný plný provoz",
              value: m0.schedule.fullOperationPlanned,
              demoValue: demo.layerM0.schedule.fullOperationPlanned,
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
              demoValue: String(demo.layerM0.pmjPortfolio.fteEquivalent),
            },
          ]}
          onChange={(key, raw) => {
            if (key === "fteEquivalent")
              setPmj({ fteEquivalent: num(raw) });
          }}
        />
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <label className="text-sm font-medium text-foreground">
              Směnnost a režim
            </label>
            {valuesMatchDemoDisplay(
              m0.pmjPortfolio.shiftsDescription,
              demo.layerM0.pmjPortfolio.shiftsDescription,
            ) ? (
              <WizardSampleBadge />
            ) : null}
          </div>
          <textarea
            className={cn(
              wizardInputSurfaceClass({
                isSampleUnchanged: valuesMatchDemoDisplay(
                  m0.pmjPortfolio.shiftsDescription,
                  demo.layerM0.pmjPortfolio.shiftsDescription,
                ),
                multiline: true,
              }),
              "min-h-[72px]",
            )}
            value={m0.pmjPortfolio.shiftsDescription}
            onChange={(e) =>
              setPmj({ shiftsDescription: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <label className="text-sm font-medium text-foreground">
              Špičky a sezónnost
            </label>
            {valuesMatchDemoDisplay(
              m0.pmjPortfolio.peakLoadNote,
              demo.layerM0.pmjPortfolio.peakLoadNote,
            ) ? (
              <WizardSampleBadge />
            ) : null}
          </div>
          <textarea
            className={cn(
              wizardInputSurfaceClass({
                isSampleUnchanged: valuesMatchDemoDisplay(
                  m0.pmjPortfolio.peakLoadNote,
                  demo.layerM0.pmjPortfolio.peakLoadNote,
                ),
                multiline: true,
              }),
              "min-h-[72px]",
            )}
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
        <p className={WIZARD_HELPER_TEXT_CLASS}>
          Uveďte název dokumentu a stručně vztah k záměru (report je zobrazí
          strukturovaně).
        </p>
        {m0.strategicDocuments.length === 0 ? (
          <p className="text-sm text-muted-foreground/80">
            Zatím žádné položky.
          </p>
        ) : (
          <ul className="space-y-3">
            {m0.strategicDocuments.map((d, i) => (
              <li
                key={i}
                className="space-y-2 rounded-md border border-border/50 bg-muted/10 p-3"
              >
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-destructive"
                    onClick={() => removeDoc(i)}
                  >
                    Odebrat
                  </Button>
                </div>
                <input
                  className={wizardInputSurfaceClass({
                    isSampleUnchanged:
                      m0.strategicDocuments.length === 1 &&
                      demoDoc0 !== undefined &&
                      valuesMatchDemoDisplay(d.title, demoDoc0.title),
                  })}
                  value={d.title}
                  onChange={(e) => updateDoc(i, "title", e.target.value)}
                  placeholder="Název dokumentu"
                />
                <textarea
                  className={cn(
                    wizardInputSurfaceClass({
                      isSampleUnchanged:
                        m0.strategicDocuments.length === 1 &&
                        demoDoc0 !== undefined &&
                        valuesMatchDemoDisplay(d.relevance, demoDoc0.relevance),
                      multiline: true,
                    }),
                    "min-h-[56px]",
                  )}
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
  isSampleUnchanged,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  isSampleUnchanged?: boolean;
}) {
  return (
    <textarea
      id={id}
      className={cn(
        wizardInputSurfaceClass({ isSampleUnchanged, multiline: true }),
        "min-h-[64px]",
      )}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
