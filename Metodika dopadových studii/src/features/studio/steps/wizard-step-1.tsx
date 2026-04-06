"use client";

import { useEffect, useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import type { LayerM1Territory } from "@/domain/methodology/p1-layers";
import { getDemoWizardReference } from "../demo-wizard-reference";
import { valuesMatchDemoDisplay } from "../field-demo-match";
import { useWizardStore } from "../wizard-store";
import { useWizardStep1Slice } from "../wizard-step-selectors";
import {
  num,
  StepFields,
  WIZARD_HELPER_TEXT_CLASS,
  WIZARD_METHOD_NOTE_CLASS,
  WIZARD_SECTION_INTRO_CLASS,
  WIZARD_SECTION_TITLE_CLASS,
  wizardInputSurfaceClass,
  WizardSampleBadge,
} from "../studio-wizard-shared";

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

const ISOCHRONE_OPTIONS: {
  value: LayerM1Territory["isochronesMode"];
  label: string;
}[] = [
  {
    value: "manual_same_as_diad",
    label: "Odhaduji same hodnoty jako cas dojezdu nize (doporuceno)",
  },
  {
    value: "manual_custom",
    label: "Vlastni odhad dostupnosti (poznamka)",
  },
  { value: "not_computed", label: "Zatim nezadano" },
];

function coordString(v: number | null): string {
  return v === null ? "" : String(v);
}

export function WizardStep1({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const demo = getDemoWizardReference();
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep1Slice();
  const m1 = state.layerM1;
  const dm1 = demo.layerM1;

  const [optionalGeoOpen, setOptionalGeoOpen] = useState(false);
  const [isochroneOpen, setIsochroneOpen] = useState(false);

  useEffect(() => {
    if (fieldErrors.geoJsonText) setOptionalGeoOpen(true);
  }, [fieldErrors.geoJsonText]);

  const setM1 = (partial: Partial<LayerM1Territory>) => {
    patchState({ layerM1: { ...m1, ...partial } });
  };

  const latSample =
    valuesMatchDemoDisplay(coordString(m1.lat), coordString(dm1.lat));
  const lonSample =
    valuesMatchDemoDisplay(coordString(m1.lon), coordString(dm1.lon));
  const geoJsonSample = valuesMatchDemoDisplay(m1.geoJsonText, dm1.geoJsonText);
  const isoModeSample = m1.isochronesMode === dm1.isochronesMode;
  const isoNoteSample = valuesMatchDemoDisplay(
    m1.isochronesManualNote,
    dm1.isochronesManualNote,
  );

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SectionTitle>Umisteni a vymezeni uzemi</SectionTitle>
        <p className={WIZARD_SECTION_INTRO_CLASS}>
          Kde presne lezi zamer a jak je vymezeno hodnocene uzemi. Nize jsou
          povinne metricke vstupy do vypoctu; souradnice, GeoJSON a rezim
          isochron jsou doplnkove.
        </p>
      </div>

      <StepFields
        errors={fieldErrors}
        fields={[
          {
            key: "definitionPointLabel",
            label: "Misto zameru (adresa nebo popis lokality)",
            helper:
              "Kde presne lezi zamer (napr. stred arealu, krizovatkova adresa, nazev katastralni lokality).",
            value: m1.definitionPointLabel,
            demoValue: dm1.definitionPointLabel,
          },
          {
            key: "municipality",
            label: "Obec",
            value: m1.municipality,
            demoValue: dm1.municipality,
          },
          {
            key: "region",
            label: "Kraj",
            value: m1.region,
            demoValue: dm1.region,
          },
          {
            key: "cadastralArea",
            label: "Katastralni uzemi",
            value: m1.cadastralArea,
            demoValue: dm1.cadastralArea,
          },
        ]}
        onChange={(key, raw) => setM1({ [key]: raw } as never)}
      />

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Label htmlFor="boundaryNote" className="text-sm font-medium">
            Vymezeni uzemi (slovni popis)
          </Label>
          {valuesMatchDemoDisplay(m1.boundaryNote, dm1.boundaryNote) ? (
            <WizardSampleBadge />
          ) : null}
        </div>
        <p className={WIZARD_HELPER_TEXT_CLASS}>
          Popiste rozsah hodnoceneho uzemi (napr. ORP, sprajovane obce,
          dojezdova zona).
        </p>
        <textarea
          id="boundaryNote"
          className={cn(
            wizardInputSurfaceClass({
              isSampleUnchanged: valuesMatchDemoDisplay(
                m1.boundaryNote,
                dm1.boundaryNote,
              ),
              multiline: true,
            }),
            "min-h-[80px]",
          )}
          value={m1.boundaryNote}
          onChange={(e) => setM1({ boundaryNote: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <Label htmlFor="aoiUnitsLabel" className="text-sm font-medium">
            Typ uzemi zajmu (napr. ORP, obec, ZU)
          </Label>
          {valuesMatchDemoDisplay(m1.aoiUnitsLabel, dm1.aoiUnitsLabel) ? (
            <WizardSampleBadge />
          ) : null}
        </div>
        <p className={WIZARD_HELPER_TEXT_CLASS}>
          Textove oznaceni uzemnich jednotek — bez napojen na ciselniky.
        </p>
        <input
          id="aoiUnitsLabel"
          className={wizardInputSurfaceClass({
            isSampleUnchanged: valuesMatchDemoDisplay(
              m1.aoiUnitsLabel,
              dm1.aoiUnitsLabel,
            ),
          })}
          value={m1.aoiUnitsLabel}
          onChange={(e) => setM1({ aoiUnitsLabel: e.target.value })}
        />
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Cas dojezdu a posledni mile (vstup vypoctu)</SectionTitle>
        <p className={WIZARD_METHOD_NOTE_CLASS}>
          Tyto hodnoty vstupuji primo do vypocetniho jadra jako metricky vstup
          dostupnosti. Metodicke symboly: DIAD preferovana / akceptovatelna,
          Tinfr (korekce infrastruktury).
        </p>

        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "dLastMileKm",
              label: "Vzdalenost posledni mile od zastavky / krizovatky (km)",
              helper:
                "Jak daleko je vstupni brana zameru od nejblizsiho verejneho napojeni.",
              value: String(state.dLastMileKm),
              number: true,
              demoValue: String(demo.dLastMileKm),
            },
            {
              key: "diadPrMinutes",
              label: "Preferovany cas dojezdu (minuty)",
              helper:
                "Cas dojezdu, ktery zamestnanci preferuji — vstupuje do vypoctu dostupnosti pracovni sily. Metodicky symbol: DIAD preferovana.",
              value: String(state.diadPrMinutes),
              number: true,
              demoValue: String(demo.diadPrMinutes),
            },
            {
              key: "diadAkMinutes",
              label: "Akceptovatelny cas dojezdu (minuty)",
              helper:
                "Maximalni cas dojezdu, ktery je zamestnanci jeste ochotni tolerovat. Metodicky symbol: DIAD akceptovatelna.",
              value: String(state.diadAkMinutes),
              number: true,
              demoValue: String(demo.diadAkMinutes),
            },
            {
              key: "tinfrMinutes",
              label:
                "Korekce casu dojezdu pro infrastrukturni bariery (minuty)",
              helper:
                "Pridany cas kvuli barieram (privozy, objizdy, chybejici napojeni). Metodicky symbol: Tinfr.",
              value: String(state.tinfrMinutes),
              number: true,
              demoValue: String(demo.tinfrMinutes),
            },
          ]}
          onChange={(key, raw) => {
            const n = num(raw);
            patchState({
              [key]: key === "dLastMileKm" ? n : Math.round(n),
            } as never);
          }}
        />
      </div>

      <Separator />

      <Collapsible open={optionalGeoOpen} onOpenChange={setOptionalGeoOpen}>
        <DisclosureTrigger
          open={optionalGeoOpen}
          label="Volitelne: souradnice WGS84 a GeoJSON hranice"
        />
        <CollapsibleContent className="space-y-4 pt-3 data-[state=closed]:hidden">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Label htmlFor="lat" className="text-sm font-medium">
                  Zemepisna sirka (WGS84)
                </Label>
                {latSample ? <WizardSampleBadge /> : null}
              </div>
              <input
                id="lat"
                type="number"
                step="any"
                className={wizardInputSurfaceClass({
                  isSampleUnchanged: latSample,
                })}
                value={m1.lat === null ? "" : m1.lat}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setM1({ lat: v === "" ? null : num(v) });
                }}
              />
            </div>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <Label htmlFor="lon" className="text-sm font-medium">
                  Zemepisna delka (WGS84)
                </Label>
                {lonSample ? <WizardSampleBadge /> : null}
              </div>
              <input
                id="lon"
                type="number"
                step="any"
                className={wizardInputSurfaceClass({
                  isSampleUnchanged: lonSample,
                })}
                value={m1.lon === null ? "" : m1.lon}
                onChange={(e) => {
                  const v = e.target.value.trim();
                  setM1({ lon: v === "" ? null : num(v) });
                }}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Label htmlFor="geoJsonText" className="text-sm font-medium">
                GeoJSON hranice
              </Label>
              {geoJsonSample ? <WizardSampleBadge /> : null}
            </div>
            <p className={WIZARD_HELPER_TEXT_CLASS}>
              Vlozit validni GeoJSON (Feature, FeatureCollection, Polygon nebo
              MultiPolygon). Prazdne pole znamena bez geometrie.
            </p>
            <textarea
              id="geoJsonText"
              className={cn(
                wizardInputSurfaceClass({
                  hasError: Boolean(fieldErrors.geoJsonText),
                  isSampleUnchanged: geoJsonSample,
                  multiline: true,
                }),
                "min-h-[120px] font-mono text-xs",
              )}
              value={m1.geoJsonText}
              onChange={(e) => setM1({ geoJsonText: e.target.value })}
              aria-invalid={Boolean(fieldErrors.geoJsonText)}
              aria-describedby={
                fieldErrors.geoJsonText ? "geoJsonText-err" : undefined
              }
            />
            {fieldErrors.geoJsonText ? (
              <p
                id="geoJsonText-err"
                className="text-xs text-amber-800 dark:text-amber-200"
              >
                {fieldErrors.geoJsonText}
              </p>
            ) : null}
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Collapsible open={isochroneOpen} onOpenChange={setIsochroneOpen}>
        <DisclosureTrigger
          open={isochroneOpen}
          label="Doplnkove: rezim dostupnosti a poznamka k isochronam"
        />
        <CollapsibleContent className="space-y-3 pt-3 data-[state=closed]:hidden">
          <p className={WIZARD_METHOD_NOTE_CLASS}>
            Jak daleko je zamer od pracovniku v regionu — doplnkova vrstva pro
            dokumentaci. Automaticke vypocty isochron nejsou v teto verzi k
            dispozici.
          </p>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Label className="text-sm font-medium">
                Rezim zadani dostupnosti
              </Label>
              {isoModeSample ? <WizardSampleBadge /> : null}
            </div>
            <select
              className={wizardInputSurfaceClass({
                isSampleUnchanged: isoModeSample,
              })}
              value={m1.isochronesMode}
              onChange={(e) =>
                setM1({
                  isochronesMode: e.target
                    .value as LayerM1Territory["isochronesMode"],
                })
              }
            >
              {ISOCHRONE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Label htmlFor="isochronesManualNote" className="text-sm font-medium">
                Poznamka k dostupnosti
              </Label>
              {isoNoteSample ? <WizardSampleBadge /> : null}
            </div>
            <textarea
              id="isochronesManualNote"
              className={cn(
                wizardInputSurfaceClass({
                  isSampleUnchanged: isoNoteSample,
                  multiline: true,
                }),
                "min-h-[72px]",
              )}
              value={m1.isochronesManualNote}
              onChange={(e) =>
                setM1({ isochronesManualNote: e.target.value })
              }
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
