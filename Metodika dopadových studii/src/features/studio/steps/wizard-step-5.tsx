"use client";

import { useMemo } from "react";
import { useWizardStore } from "../wizard-store";
import { useWizardStep5Slice } from "../wizard-step-selectors";
import {
  effectiveHousingRampYears,
  effectiveVacantForHousing,
  nKmenMigrationAdjustment,
} from "../p1-pipeline-derive";
import { P1BridgePanelHousing } from "../components/P1BridgePanel";
import { num, StepFields } from "../studio-wizard-shared";

export function WizardStep5({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep5Slice();

  const vacPrev = useMemo(
    () =>
      effectiveVacantForHousing(
        state.vTVacant,
        state.layerM2,
        state.p1PipelineBridge,
      ),
    [state.vTVacant, state.layerM2, state.p1PipelineBridge],
  );

  const mig = useMemo(
    () => nKmenMigrationAdjustment(state.layerM2, state.p1PipelineBridge),
    [state.layerM2, state.p1PipelineBridge],
  );

  const housingRampEff = useMemo(() => {
    const st = useWizardStore.getState().state;
    return effectiveHousingRampYears(st);
  }, [
    state.housingRampYears,
    state.rampYearsGlobal,
    state.p1PipelineBridge.alignHousingRampToProjectHorizon,
  ]);

  return (
    <div className="space-y-8">
      <P1BridgePanelHousing
        flags={state.p1PipelineBridge}
        onPatch={(partial) =>
          patchState({
            p1PipelineBridge: { ...state.p1PipelineBridge, ...partial },
          })
        }
      />

      <details className="rounded-md border border-dashed border-muted-foreground/25 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <summary className="cursor-pointer font-medium text-foreground">
          Výpočet použije tyto hodnoty (technický náhled)
        </summary>
        <p className="mt-2 leading-snug">
          Efektivní volné bytové jednotky:{" "}
          <strong>{vacPrev.vEffective.toFixed(1)}</strong> (zadáno{" "}
          {state.vTVacant}
          {vacPrev.m2VacantUsed ? ", doplněno z AS-IS" : ""}) · Kmenové
          osoby k usazení:{" "}
          <strong>{(state.nKmen + mig).toFixed(1)}</strong> (migrace{" "}
          {mig >= 0 ? "+" : ""}
          {mig.toFixed(1)}) · Náběh:{" "}
          <strong>{housingRampEff} let</strong>
          {state.p1PipelineBridge.linkHousingToEmploymentM3 ? (
            <> · Propojení M3→M4 zapnuto — agentura a dojíždějící se přeberou z výsledků zaměstnanosti; pole níže slouží jako záloha.</>
          ) : null}
          {" "}
          · <span className="text-foreground/90">N_kmen</span> je samostatný
          vstup; po změně podílu kmenových zaměstnanců (k_inv) v kroku
          zaměstnanosti ověřte soulad ručně — engine k_inv automaticky
          nepřepočítává toto pole.
        </p>
      </details>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Bydlení a obsazenost
        </h3>
        <p className="text-xs text-muted-foreground">
          Odhad bytové potřeby — kolik zaměstnanců se usadí v regionu a kolik
          bytů to vyžaduje.
        </p>

        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "situation",
              label: "Typ bytové situace v regionu (A nebo B)",
              helper: "A = standardní bytový trh, B = přetížený trh s omezenou nabídkou nových bytů.",
              value: state.situation,
            },
            {
              key: "nKmen",
              label: "Kmenové zaměstnance — počet k usazení v regionu",
              helper: "Zaměstnanci, kteří se přistěhují a budou potřebovat bydlení v regionu. Metodický symbol: N_kmen.",
              value: String(state.nKmen),
              number: true,
            },
            {
              key: "nAgentura",
              label: "Agenturní a dočasní pracovníci",
              helper: "Pracovníci bez trvalé potřeby bydlení — zpravidla ubytovny nebo krátkodobé nájmy. Metodický symbol: N_agentura.",
              value: String(state.nAgentura),
              number: true,
            },
            {
              key: "nPendler",
              label: "Dojíždějící pracovníci",
              helper: "Pracovníci dojíždějící z okolí — nevznikají nároky na nové bydlení v místě záměru. Metodický symbol: N_pendler.",
              value: String(state.nPendler),
              number: true,
            },
            {
              key: "nRelokace",
              label: "Pracovníci přestěhovaní z jiného regionu",
              helper: "Odhadovaný počet pracovníků, kteří se přestěhují přímo kvůli záměru. Metodický symbol: N_relokace.",
              value: String(state.nRelokace),
              number: true,
            },
            {
              key: "shareByt",
              label: "Podíl bytů v nové zástavbě (0–1)",
              helper: "Kolik procent nové rezidenční výstavby tvoří byty v bytových domech (vs. rodinné domy).",
              value: String(state.shareByt),
              number: true,
            },
            {
              key: "shareRodinny",
              label: "Podíl rodinných domů v nové zástavbě (0–1)",
              helper: "Zbylá část — rodinné domy a řadovky.",
              value: String(state.shareRodinny),
              number: true,
            },
            {
              key: "occByt",
              label: "Průměrný počet osob na byt",
              helper: "Kolik osob v průměru obývá jeden byt — vstup do výpočtu počtu usazených obyvatel.",
              value: String(state.occByt),
              number: true,
            },
            {
              key: "occRodinny",
              label: "Průměrný počet osob na rodinný dům",
              helper: "Kolik osob v průměru obývá jeden rodinný dům.",
              value: String(state.occRodinny),
              number: true,
            },
            {
              key: "lMarketByt",
              label: "Parametr dostupnosti trhu s byty (L_market)",
              helper:
                "Skalár pro segment bytů: v modelu se násobí předpokladem „market_coverage“ a přičítá se alokace volných jednotek (viz DRV-022). Nejde o povinný podíl 0–1 — vyšší hodnoty (např. desítky) odpovídají silnějšímu odhadu přístupnosti trhu v jednotkách modelu.",
              value: String(state.lMarketByt),
              number: true,
            },
            {
              key: "lMarketRodinny",
              label: "Parametr dostupnosti trhu s rodinnými domy (L_market)",
              helper:
                "Stejná logika jako u bytů — skalár L_market pro rodinné domy, násobený market_coverage a doplněný o podíl volné nabídky.",
              value: String(state.lMarketRodinny),
              number: true,
            },
            {
              key: "vTVacant",
              label: "Volné bytové jednotky v regionu",
              helper: "Stávající volné byty a domy na trhu — vstupuje do výpočtu jako nabídková rezerva. Metodický symbol: V_t vacant.",
              value: String(state.vTVacant),
              number: true,
            },
            {
              key: "housingRampYears",
              label: "Doba náběhu bydlení (roky)",
              helper: "Za kolik let se záměr plně projeví v bytových nárocích.",
              value: String(state.housingRampYears),
              number: true,
              int: true,
            },
          ]}
          onChange={(key, raw) => {
            if (key === "situation") {
              patchState({
                situation: raw === "B" ? "B" : "A",
              });
              return;
            }
            const n = num(raw);
            patchState({
              [key]:
                key === "housingRampYears"
                  ? Math.max(1, Math.round(n))
                  : n,
            } as never);
          }}
        />
      </section>
    </div>
  );
}
