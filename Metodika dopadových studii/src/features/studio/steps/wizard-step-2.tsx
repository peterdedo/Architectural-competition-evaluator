"use client";

import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useWizardStore } from "../wizard-store";
import { useWizardStep2Slice } from "../wizard-step-selectors";
import type { LabeledBaselineNumber, BaselineValueKind } from "@/domain/methodology/p1-layers";

function updateLabeled(
  field: LabeledBaselineNumber,
  patch: Partial<LabeledBaselineNumber>,
): LabeledBaselineNumber {
  return { ...field, ...patch };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold text-foreground">{children}</h3>
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
}: {
  idPrefix: string;
  label: string;
  helper?: string;
  field: LabeledBaselineNumber;
  onChange: (next: LabeledBaselineNumber) => void;
}) {
  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/15 p-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label htmlFor={`${idPrefix}-val`} className="text-sm font-medium">
          {label}
        </Label>
        <select
          id={`${idPrefix}-kind`}
          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
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
      {helper ? (
        <p className="text-xs text-muted-foreground leading-snug">{helper}</p>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_minmax(140px,1fr)]">
        <input
          id={`${idPrefix}-val`}
          type="number"
          step="any"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
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
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
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

export function WizardStep2({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep2Slice();
  const m2 = state.layerM2;

  const setM2 = (next: typeof m2) => {
    patchState({ layerM2: next });
  };

  const rootErr = fieldErrors._root;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <SectionTitle>Výchozí stav území před záměrem</SectionTitle>
        <p className="text-sm text-muted-foreground leading-snug">
          Tato data popisují území tak, jak vypadá dnes — před realizací záměru.
          Slouží jako referenční bod pro posouzení dopadu, nikoliv jako vstup do výpočtu.
          Vyplňte je pro transparentnost a pro srovnání v reportu.
        </p>
      </div>

      {rootErr ? (
        <p className="text-sm text-amber-700">{rootErr}</p>
      ) : null}

      <div className="space-y-3">
        <SectionTitle>Obyvatelstvo a věková struktura</SectionTitle>
        <p className="text-xs text-muted-foreground">
          Referenční rok a počet obyvatel v hodnoceném území.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pop-year">Rok referenčních demografických dat</Label>
            <input
              id="pop-year"
              type="number"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
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
          onChange={(population) =>
            setM2({
              ...m2,
              demographics: { ...m2.demographics, population },
            })
          }
        />

        <p className="text-xs font-medium text-muted-foreground">
          Podíly věkových skupin (součet má být 1, nebo všechny ponechte 0)
        </p>

        <LabeledField
          idPrefix="age-014"
          label="Podíl dětské složky 0–14 let"
          field={m2.ageShares.age014}
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
          onChange={(age65Plus) =>
            setM2({
              ...m2,
              ageShares: { ...m2.ageShares, age65Plus },
            })
          }
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Migrace</SectionTitle>
        <LabeledField
          idPrefix="mig"
          label="Čisté migrační saldo (osoby za rok, orientačně)"
          helper="Kladná hodnota = území lidi přibírá, záporná = odchází. Vstupuje do úprav odhadu bytové potřeby."
          field={m2.migration.netPerYear}
          onChange={(netPerYear) =>
            setM2({
              ...m2,
              migration: { netPerYear },
            })
          }
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Trh práce</SectionTitle>
        <p className="text-xs text-muted-foreground">
          Aktuální situace na regionálním trhu práce před záměrem.
          Míra nezaměstnanosti vstupuje do odhadu dostupnosti pracovní síly.
        </p>

        <LabeledField
          idPrefix="unemp"
          label="Míra nezaměstnanosti (0–1)"
          helper="Např. 0,035 pro 3,5 %. Vstupuje do odhadu dostupnosti regionální pracovní síly."
          field={m2.laborMarket.unemploymentRate}
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
          onChange={(avgWageCzk) =>
            setM2({
              ...m2,
              laborMarket: { ...m2.laborMarket, avgWageCzk },
            })
          }
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Hospodářský profil území</SectionTitle>
        <LabeledField
          idPrefix="hdp-cap"
          label="HDP na obyvatele v regionu (Kč za rok)"
          helper="Regionální HDP na obyvatele — referenční ekonomická hodnota před záměrem."
          field={m2.economicProfile.regionalHdpPerCapitaCzk}
          onChange={(regionalHdpPerCapitaCzk) =>
            setM2({
              ...m2,
              economicProfile: { regionalHdpPerCapitaCzk },
            })
          }
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Bydlení v území před záměrem</SectionTitle>
        <LabeledField
          idPrefix="vac"
          label="Volné bytové jednotky (odhad)"
          helper="Odhad počtu volných bytů a domů na trhu. Vstupuje jako nabídková rezerva do výpočtu bytové potřeby."
          field={m2.housing.vacantUnits}
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
          onChange={(avgRentCzk) =>
            setM2({
              ...m2,
              housing: { ...m2.housing, avgRentCzk },
            })
          }
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Občanská vybavenost před záměrem</SectionTitle>
        <LabeledField
          idPrefix="gp"
          label="Kapacita praktických lékařů pro dospělé na 1 000 obyvatel"
          helper="Počet praktických lékařů pro dospělé (PLDD) na 1 000 obyvatel — referenční hodnota pro posouzení kapacity zdravotnictví."
          field={m2.civic.gpPer1000}
          onChange={(gpPer1000) =>
            setM2({
              ...m2,
              civic: { gpPer1000 },
            })
          }
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Veřejné finance před záměrem</SectionTitle>
        <LabeledField
          idPrefix="budg"
          label="Průměrné veřejné výdaje na obyvatele (Kč za rok)"
          helper="Průměrné roční výdaje obecních rozpočtů na jednoho obyvatele — referenční hodnota."
          field={m2.publicFinance.municipalBudgetPerCapitaCzk}
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

        <div className="space-y-2">
          <Label htmlFor="fiscal-note">Poznámka k finanční situaci obce (volitelné)</Label>
          <textarea
            id="fiscal-note"
            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
      </div>

      <Separator />

      <div className="space-y-2">
        <SectionTitle>Trendy a kontextové poznámky</SectionTitle>
        <p className="text-xs text-muted-foreground">
          Stručně: vývoj území, migrační trendy, klíčová rizika dat.
        </p>
        <textarea
          className="flex min-h-[88px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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
    </div>
  );
}
