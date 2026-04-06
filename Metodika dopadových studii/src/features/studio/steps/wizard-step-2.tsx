"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type {
  LabeledBaselineNumber,
  BaselineValueKind,
} from "@/domain/methodology/p1-layers";
import { getDemoWizardReference } from "../demo-wizard-reference";
import { labeledBaselineMatchesDemo } from "../field-demo-match";
import { useWizardStore } from "../wizard-store";
import { useWizardStep2Slice } from "../wizard-step-selectors";
import {
  WIZARD_HELPER_TEXT_CLASS,
  WIZARD_METHOD_NOTE_CLASS,
  WIZARD_SECTION_INTRO_CLASS,
  WIZARD_SECTION_TITLE_CLASS,
  wizardInputSurfaceClass,
  WizardSampleBadge,
} from "../studio-wizard-shared";

function updateLabeled(
  field: LabeledBaselineNumber,
  patch: Partial<LabeledBaselineNumber>,
): LabeledBaselineNumber {
  return { ...field, ...patch };
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className={WIZARD_SECTION_TITLE_CLASS}>{children}</h3>;
}

function DisclosureTrigger({
  open,
  label,
}: {
  open: boolean;
  label: string;
}) {
  return (
    <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border border-border/35 bg-muted/10 px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      {open ? (
        <ChevronDown className="h-4 w-4 shrink-0" aria-hidden />
      ) : (
        <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />
      )}
      {label}
    </CollapsibleTrigger>
  );
}

function num(v: string): number {
  return parseFloat(v.replace(",", ".")) || 0;
}

function LabeledField({
  idPrefix,
  label,
  helper,
  field,
  onChange,
  demoField,
}: {
  idPrefix: string;
  label: string;
  helper?: string;
  field: LabeledBaselineNumber;
  onChange: (next: LabeledBaselineNumber) => void;
  demoField?: LabeledBaselineNumber;
}) {
  const isSample = labeledBaselineMatchesDemo(field, demoField);
  const valSample = isSample;
  const noteSample = isSample;

  return (
    <div className="space-y-1.5 rounded-md border border-border/30 bg-muted/[0.06] p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Label htmlFor={`${idPrefix}-val`} className="text-sm font-medium">
            {label}
          </Label>
          {isSample ? <WizardSampleBadge /> : null}
        </div>
        <select
          id={`${idPrefix}-kind`}
          className={cn(
            "h-8 rounded-md border border-input bg-background px-2 text-xs text-foreground",
            isSample && "border-muted-foreground/25 bg-muted/35",
          )}
          value={field.kind}
          onChange={(e) =>
            onChange(
              updateLabeled(field, {
                kind: e.target.value as BaselineValueKind,
              }),
            )
          }
        >
          <option value="raw_input">Ruční vstup</option>
          <option value="reference_baseline">Z referenčních dat / zdroje</option>
        </select>
      </div>
      {helper ? <p className={WIZARD_HELPER_TEXT_CLASS}>{helper}</p> : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_minmax(140px,1fr)]">
        <input
          id={`${idPrefix}-val`}
          type="number"
          step="any"
          className={wizardInputSurfaceClass({
            isSampleUnchanged: valSample,
          })}
          value={field.value === 0 ? "" : field.value}
          placeholder="0 = zatím nevyplněno"
          onChange={(e) => {
            const v = e.target.value.trim();
            onChange(updateLabeled(field, { value: v === "" ? 0 : num(v) }));
          }}
        />
        <input
          id={`${idPrefix}-note`}
          type="text"
          className={wizardInputSurfaceClass({
            isSampleUnchanged: noteSample,
          })}
          value={field.note}
          placeholder="Zdroj dat (volitelné)"
          onChange={(e) =>
            onChange(updateLabeled(field, { note: e.target.value }))
          }
        />
      </div>
    </div>
  );
}

const SUBBLOCK_HEADING =
  "text-[11px] font-medium uppercase tracking-wider text-muted-foreground/65";

export function WizardStep2({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const demo = getDemoWizardReference();
  const d2 = demo.layerM2;
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep2Slice();
  const m2 = state.layerM2;

  const setM2 = (next: typeof m2) => {
    patchState({ layerM2: next });
  };

  const rootErr = fieldErrors._root;

  const [migrationOpen, setMigrationOpen] = useState(false);
  const [laborOpen, setLaborOpen] = useState(false);
  const [econHousingOpen, setEconHousingOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);

  const yearSample = m2.demographics.year === d2.demographics.year;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionTitle>Výchozí stav území před záměrem</SectionTitle>
        <p className={WIZARD_SECTION_INTRO_CLASS}>
          Tato data popisují území tak, jak vypadá dnes — před realizací záměru.
          Slouží jako referenční bod pro posouzení dopadu, nikoliv jako vstup do výpočtu.
          Vyplňte je pro transparentnost a pro srovnání v reportu. Základní demografie je
          nahoře; další oblasti jsou ve sbalitelných blocích.
        </p>
      </div>

      {rootErr ? (
        <p
          className="text-sm font-medium text-amber-800 dark:text-amber-200"
          role="alert"
        >
          {rootErr}
        </p>
      ) : null}

      <div className="space-y-3">
        <SectionTitle>Obyvatelstvo a věková struktura</SectionTitle>
        <p className={WIZARD_METHOD_NOTE_CLASS}>
          Referenční rok a počet obyvatel v hodnoceném území.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Label htmlFor="pop-year" className="text-sm font-medium">
                Rok referenčních demografických dat
              </Label>
              {yearSample ? <WizardSampleBadge /> : null}
            </div>
            <input
              id="pop-year"
              type="number"
              className={wizardInputSurfaceClass({
                isSampleUnchanged: yearSample,
              })}
              value={m2.demographics.year}
              onChange={(e) =>
                setM2({
                  ...m2,
                  demographics: {
                    ...m2.demographics,
                    year: Math.round(num(e.target.value)) || m2.demographics.year,
                  },
                })
              }
            />
          </div>
        </div>

        <LabeledField
          idPrefix="demo-pop"
          label="Počet obyvatel v hodnoceném území"
          helper="Celkový počet obyvatel v oblasti zájmu. Zadejte číslo a označte zdroj dat."
          field={m2.demographics.population}
          demoField={d2.demographics.population}
          onChange={(population) =>
            setM2({
              ...m2,
              demographics: { ...m2.demographics, population },
            })
          }
        />

        <p className={cn(WIZARD_METHOD_NOTE_CLASS, "font-medium")}>
          Podíly věkových skupin (součet má být 1, nebo všechny ponechte 0)
        </p>

        <LabeledField
          idPrefix="age-014"
          label="Podíl dětské složky 0–14 let"
          field={m2.ageShares.age014}
          demoField={d2.ageShares.age014}
          onChange={(age014) =>
            setM2({
              ...m2,
              ageShares: { ...m2.ageShares, age014 },
            })
          }
        />
        <LabeledField
          idPrefix="age-1564"
          label="Podíl produktivní složky 15–64 let"
          field={m2.ageShares.age1564}
          demoField={d2.ageShares.age1564}
          onChange={(age1564) =>
            setM2({
              ...m2,
              ageShares: { ...m2.ageShares, age1564 },
            })
          }
        />
        <LabeledField
          idPrefix="age-65"
          label="Podíl seniorů 65 a více let"
          field={m2.ageShares.age65Plus}
          demoField={d2.ageShares.age65Plus}
          onChange={(age65Plus) =>
            setM2({
              ...m2,
              ageShares: { ...m2.ageShares, age65Plus },
            })
          }
        />
      </div>

      <Separator />

      <Collapsible open={migrationOpen} onOpenChange={setMigrationOpen}>
        <DisclosureTrigger open={migrationOpen} label="Migrace" />
        <CollapsibleContent className="space-y-3 pt-3 data-[state=closed]:hidden">
          <LabeledField
            idPrefix="mig"
            label="Čisté migrační saldo (osoby za rok, orientačně)"
            helper="Kladná hodnota = území lidi přibírá, záporná = odchází. Vstupuje do úprav odhadu bytové potřeby."
            field={m2.migration.netPerYear}
            demoField={d2.migration.netPerYear}
            onChange={(netPerYear) =>
              setM2({
                ...m2,
                migration: { netPerYear },
              })
            }
          />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={laborOpen} onOpenChange={setLaborOpen}>
        <DisclosureTrigger open={laborOpen} label="Trh práce a mzdy" />
        <CollapsibleContent className="space-y-3 pt-3 data-[state=closed]:hidden">
          <p className={WIZARD_METHOD_NOTE_CLASS}>
            Aktuální situace na regionálním trhu práce před záměrem. Míra
            nezaměstnanosti vstupuje do odhadu dostupnosti pracovní síly.
          </p>
          <LabeledField
            idPrefix="unemp"
            label="Míra nezaměstnanosti (0–1)"
            helper="Např. 0,035 pro 3,5 %. Vstupuje do odhadu dostupnosti regionální pracovní síly."
            field={m2.laborMarket.unemploymentRate}
            demoField={d2.laborMarket.unemploymentRate}
            onChange={(unemploymentRate) =>
              setM2({
                ...m2,
                laborMarket: { ...m2.laborMarket, unemploymentRate },
              })
            }
          />
          <LabeledField
            idPrefix="emp-rate"
            label="Míra zaměstnanosti (0–1)"
            helper="Podíl zaměstnaných na obyvatelstvu v produktivním věku."
            field={m2.laborMarket.employmentRate}
            demoField={d2.laborMarket.employmentRate}
            onChange={(employmentRate) =>
              setM2({
                ...m2,
                laborMarket: { ...m2.laborMarket, employmentRate },
              })
            }
          />
          <LabeledField
            idPrefix="wage"
            label="Průměrná hrubá mzda v regionu (Kč za měsíc)"
            helper="Aktuální regionální průměrná mzda — referenční hodnota pro posouzení atraktivity záměru."
            field={m2.laborMarket.avgWageCzk}
            demoField={d2.laborMarket.avgWageCzk}
            onChange={(avgWageCzk) =>
              setM2({
                ...m2,
                laborMarket: { ...m2.laborMarket, avgWageCzk },
              })
            }
          />
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={econHousingOpen} onOpenChange={setEconHousingOpen}>
        <DisclosureTrigger
          open={econHousingOpen}
          label="Hospodářství, bydlení a občanská vybavenost"
        />
        <CollapsibleContent className="space-y-4 pt-3 data-[state=closed]:hidden">
          <div className="space-y-3">
            <p className={SUBBLOCK_HEADING}>Hospodářský profil</p>
            <LabeledField
              idPrefix="hdp-cap"
              label="HDP na obyvatele v regionu (Kč za rok)"
              helper="Regionální HDP na obyvatele — referenční ekonomická hodnota před záměrem."
              field={m2.economicProfile.regionalHdpPerCapitaCzk}
              demoField={d2.economicProfile.regionalHdpPerCapitaCzk}
              onChange={(regionalHdpPerCapitaCzk) =>
                setM2({
                  ...m2,
                  economicProfile: { regionalHdpPerCapitaCzk },
                })
              }
            />
          </div>
          <div className="space-y-3">
            <p className={SUBBLOCK_HEADING}>Bydlení před záměrem</p>
            <LabeledField
              idPrefix="vac"
              label="Volné bytové jednotky (odhad)"
              helper="Odhad počtu volných bytů a domů na trhu. Vstupuje jako nabídková rezerva do výpočtu bytové potřeby."
              field={m2.housing.vacantUnits}
              demoField={d2.housing.vacantUnits}
              onChange={(vacantUnits) =>
                setM2({
                  ...m2,
                  housing: { ...m2.housing, vacantUnits },
                })
              }
            />
            <LabeledField
              idPrefix="rent"
              label="Orientační nájem (Kč za m² za měsíc)"
              helper="Aktuální průměrná nájemní cena v území — referenční hodnota pro posouzení trhu."
              field={m2.housing.avgRentCzk}
              demoField={d2.housing.avgRentCzk}
              onChange={(avgRentCzk) =>
                setM2({
                  ...m2,
                  housing: { ...m2.housing, avgRentCzk },
                })
              }
            />
          </div>
          <div className="space-y-3">
            <p className={SUBBLOCK_HEADING}>Občanská vybavenost</p>
            <LabeledField
              idPrefix="gp"
              label="Kapacita praktických lékařů pro dospělé na 1 000 obyvatel"
              helper="Počet praktických lékařů pro dospělé (PLDD) na 1 000 obyvatel — referenční hodnota pro posouzení kapacity zdravotnictví."
              field={m2.civic.gpPer1000}
              demoField={d2.civic.gpPer1000}
              onChange={(gpPer1000) =>
                setM2({
                  ...m2,
                  civic: { gpPer1000 },
                })
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={financeOpen} onOpenChange={setFinanceOpen}>
        <DisclosureTrigger
          open={financeOpen}
          label="Veřejné finance a kontextové poznámky"
        />
        <CollapsibleContent className="space-y-3 pt-3 data-[state=closed]:hidden">
          <LabeledField
            idPrefix="budg"
            label="Průměrné veřejné výdaje na obyvatele (Kč za rok)"
            helper="Průměrné roční výdaje obecních rozpočtů na jednoho obyvatele — referenční hodnota."
            field={m2.publicFinance.municipalBudgetPerCapitaCzk}
            demoField={d2.publicFinance.municipalBudgetPerCapitaCzk}
            onChange={(municipalBudgetPerCapitaCzk) =>
              setM2({
                ...m2,
                publicFinance: {
                  ...m2.publicFinance,
                  municipalBudgetPerCapitaCzk,
                },
              })
            }
          />
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Label htmlFor="fiscal-note" className="text-sm font-medium">
                Poznámka k finanční situaci obce (volitelné)
              </Label>
              {m2.publicFinance.fiscalNote.trim() ===
              d2.publicFinance.fiscalNote.trim() ? (
                <WizardSampleBadge />
              ) : null}
            </div>
            <textarea
              id="fiscal-note"
              className={cn(
                wizardInputSurfaceClass({
                  isSampleUnchanged:
                    m2.publicFinance.fiscalNote.trim() ===
                    d2.publicFinance.fiscalNote.trim(),
                  multiline: true,
                }),
                "min-h-[72px]",
              )}
              value={m2.publicFinance.fiscalNote}
              onChange={(e) =>
                setM2({
                  ...m2,
                  publicFinance: {
                    ...m2.publicFinance,
                    fiscalNote: e.target.value,
                  },
                })
              }
            />
          </div>
          <div className="space-y-1.5 border-t border-border/40 pt-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <p className={WIZARD_METHOD_NOTE_CLASS}>
                Stručně: vývoj území, migrační trendy, klíčová rizika dat.
              </p>
              {m2.trends.notes.trim() === d2.trends.notes.trim() ? (
                <WizardSampleBadge />
              ) : null}
            </div>
            <textarea
              className={cn(
                wizardInputSurfaceClass({
                  isSampleUnchanged:
                    m2.trends.notes.trim() === d2.trends.notes.trim(),
                  multiline: true,
                }),
                "min-h-[88px]",
              )}
              value={m2.trends.notes}
              onChange={(e) =>
                setM2({
                  ...m2,
                  trends: { notes: e.target.value },
                })
              }
              placeholder="Např. území dlouhodobě ztrácí obyvatele, trh práce je napjatý, data z roku 20XX..."
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
