"use client";

import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useWizardStore } from "../wizard-store";
import { useWizardStep1Slice } from "../wizard-step-selectors";
import { num, StepFields } from "../studio-wizard-shared";
import type { LayerM1Territory } from "@/domain/methodology/p1-layers";

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-semibold tracking-tight text-foreground">
      {children}
    </h3>
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

export function WizardStep1({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep1Slice();
  const m1 = state.layerM1;

  const setM1 = (partial: Partial<LayerM1Territory>) => {
    patchState({ layerM1: { ...m1, ...partial } });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <SectionTitle>Umisteni a vymezeni uzemi</SectionTitle>
        <p className="text-sm text-muted-foreground leading-snug">
          Kde presne lezi zamer a jak je vymezeno hodnocene uzemi.
          Souradnice a GeoJSON jsou volitelne a slozi jako priloha pro rozhodovani.
          Modelove vstupy dostupnosti zadavate nize.
        </p>
      </div>

      <StepFields
        errors={fieldErrors}
        fields={[
          {
            key: "definitionPointLabel",
            label: "Misto zameru (adresa nebo popis lokality)",
            helper: "Kde presne lezi zamer (napr. stred arealu, krizovatkova adresa, nazev katastralni lokality).",
            value: m1.definitionPointLabel,
          },
          {
            key: "municipality",
            label: "Obec",
            value: m1.municipality,
          },
          {
            key: "region",
            label: "Kraj",
            value: m1.region,
          },
          {
            key: "cadastralArea",
            label: "Katastralni uzemi",
            value: m1.cadastralArea,
          },
        ]}
        onChange={(key, raw) => setM1({ [key]: raw } as never)}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="lat">Zemepisna sirka (WGS84, volitelne)</Label>
          <input
            id="lat"
            type="number"
            step="any"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={m1.lat === null ? "" : m1.lat}
            onChange={(e) => {
              const v = e.target.value.trim();
              setM1({ lat: v === "" ? null : num(v) });
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lon">Zemepisna delka (WGS84, volitelne)</Label>
          <input
            id="lon"
            type="number"
            step="any"
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={m1.lon === null ? "" : m1.lon}
            onChange={(e) => {
              const v = e.target.value.trim();
              setM1({ lon: v === "" ? null : num(v) });
            }}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="boundaryNote">Vymezeni uzemi (slovni popis)</Label>
        <p className="text-xs text-muted-foreground">
          Popiste rozsah hodnoceneho uzemi (napr. ORP, sprajovane obce, dojezdova zona).
        </p>
        <textarea
          id="boundaryNote"
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          value={m1.boundaryNote}
          onChange={(e) => setM1({ boundaryNote: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="aoiUnitsLabel">Typ uzemi zajmu (napr. ORP, obec, ZU)</Label>
        <p className="text-xs text-muted-foreground">
          Textove oznaceni uzemnich jednotek — bez napojen na ciselniky.
        </p>
        <input
          id="aoiUnitsLabel"
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={m1.aoiUnitsLabel}
          onChange={(e) => setM1({ aoiUnitsLabel: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="geoJsonText">GeoJSON hranice (volitelne)</Label>
        <p className="text-xs text-muted-foreground">
          Vlozit validni GeoJSON (Feature, FeatureCollection, Polygon nebo MultiPolygon).
          Prazdne pole znamena bez geometrie.
        </p>
        <textarea
          id="geoJsonText"
          className={`flex min-h-[120px] w-full rounded-md border bg-background px-3 py-2 font-mono text-xs ${
            fieldErrors.geoJsonText ? "border-amber-500" : "border-input"
          }`}
          value={m1.geoJsonText}
          onChange={(e) => setM1({ geoJsonText: e.target.value })}
        />
        {fieldErrors.geoJsonText ? (
          <p className="text-xs text-amber-700">{fieldErrors.geoJsonText}</p>
        ) : null}
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Dostupnost zameru</SectionTitle>
        <p className="text-sm text-muted-foreground leading-snug">
          Jak daleko je zamer od pracovniku v regionu — cas dojezdu ovlivnuje,
          kolik lidi z okoli zamer realistically zasahne.
          Automaticke vypocty isochrony nejsou v teto verzi k dispozici.
        </p>

        <div className="space-y-2">
          <Label>Rezim zadani dostupnosti</Label>
          <select
            className="flex h-9 w-full max-w-lg rounded-md border border-input bg-background px-3 py-1 text-sm"
            value={m1.isochronesMode}
            onChange={(e) =>
              setM1({
                isochronesMode: e.target.value as LayerM1Territory["isochronesMode"],
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

        <div className="space-y-2">
          <Label htmlFor="isochronesManualNote">Poznamka k dostupnosti</Label>
          <textarea
            id="isochronesManualNote"
            className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={m1.isochronesManualNote}
            onChange={(e) =>
              setM1({ isochronesManualNote: e.target.value })
            }
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <SectionTitle>Cas dojezdu a posledni mile (vstup vypoctu)</SectionTitle>
        <p className="text-xs text-muted-foreground leading-snug">
          Tyto hodnoty vstupuji primo do vypocetniho jadra jako metricky vstup dostupnosti.
          Metodicke symboly: DIAD preferovana / akceptovatelna, Tinfr (korekce infrastruktury).
        </p>

        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "dLastMileKm",
              label: "Vzdalenost posledni mile od zastavky / krizovatky (km)",
              helper: "Jak daleko je vstupni brana zameru od nejblizsiho verejneho napojeni.",
              value: String(state.dLastMileKm),
              number: true,
            },
            {
              key: "diadPrMinutes",
              label: "Preferovany cas dojezdu (minuty)",
              helper: "Cas dojezdu, ktery zamestnanci preferuji — vstupuje do vypoctu dostupnosti pracovni sily. Metodicky symbol: DIAD preferovana.",
              value: String(state.diadPrMinutes),
              number: true,
            },
            {
              key: "diadAkMinutes",
              label: "Akceptovatelny cas dojezdu (minuty)",
              helper: "Maximalni cas dojezdu, ktery je zamestnanci jeste ochotni tolerovat. Metodicky symbol: DIAD akceptovatelna.",
              value: String(state.diadAkMinutes),
              number: true,
            },
            {
              key: "tinfrMinutes",
              label: "Korekce casu dojezdu pro infrastrukturni bariery (minuty)",
              helper: "Pridany cas kvuli barieram (privozy, objizdy, chybejici napojeni). Metodicky symbol: Tinfr.",
              value: String(state.tinfrMinutes),
              number: true,
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
    </div>
  );
}
