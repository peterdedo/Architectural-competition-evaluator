"use client";

import { useMemo } from "react";
import { WizardFieldGroup } from "../components/wizard-field-group";
import { useWizardStore } from "../wizard-store";
import { useWizardStep5Slice } from "../wizard-step-selectors";
import {
  effectiveHousingRampYears,
  effectiveVacantForHousing,
  nKmenMigrationAdjustment,
} from "../p1-pipeline-derive";
import { P1BridgePanelHousing } from "../components/P1BridgePanel";
import { getDemoWizardReference } from "../demo-wizard-reference";
import {
  num,
  StepFields,
  WIZARD_METHOD_NOTE_CLASS,
  WIZARD_SECTION_INTRO_CLASS,
  WIZARD_SECTION_TITLE_CLASS,
} from "../studio-wizard-shared";

export function WizardStep5({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const demo = getDemoWizardReference();
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

  const housingRampEff = useMemo(
    () =>
      effectiveHousingRampYears({
        housingRampYears: state.housingRampYears,
        rampYearsGlobal: state.rampYearsGlobal,
        p1PipelineBridge: state.p1PipelineBridge,
      }),
    [state.housingRampYears, state.rampYearsGlobal, state.p1PipelineBridge],
  );

  const onFieldChange = (key: string, raw: string) => {
    if (key === "situation") {
      patchState({
        situation: raw === "B" ? "B" : "A",
      });
      return;
    }
    const n = num(raw);
    patchState({
      [key]:
        key === "housingRampYears" ? Math.max(1, Math.round(n)) : n,
    } as never);
  };

  return (
    <div className="space-y-6">
      <P1BridgePanelHousing
        flags={state.p1PipelineBridge}
        onPatch={(partial) =>
          patchState({
            p1PipelineBridge: { ...state.p1PipelineBridge, ...partial },
          })
        }
      />

      <details
        className={`rounded-md border border-dashed border-border/40 bg-transparent px-2.5 py-1.5 ${WIZARD_METHOD_NOTE_CLASS}`}
      >
        <summary className="cursor-pointer underline-offset-2 hover:text-muted-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          Výpočet použije tyto hodnoty (technický náhled)
        </summary>
        <p className="mt-1.5 leading-relaxed text-muted-foreground/65">
          Efektivní volné bytové jednotky:{" "}
          <span className="font-medium text-foreground/90">
            {vacPrev.vEffective.toFixed(1)}
          </span>{" "}
          (zadáno {state.vTVacant}
          {vacPrev.m2VacantUsed ? ", doplněno z AS-IS" : ""}) · Kmenové osoby
          k usazení:{" "}
          <span className="font-medium text-foreground/90">
            {(state.nKmen + mig).toFixed(1)}
          </span>{" "}
          (migrace {mig >= 0 ? "+" : ""}
          {mig.toFixed(1)}) · Náběh:{" "}
          <span className="font-medium text-foreground/90">
            {housingRampEff} let
          </span>
          {state.p1PipelineBridge.linkHousingToEmploymentM3 ? (
            <>
              {" "}
              · Propojení M3→M4 zapnuto — agentura a dojíždějící se přeberou z
              výsledků zaměstnanosti; pole níže slouží jako záloha.
            </>
          ) : null}{" "}
          · <span className="text-foreground/90">N_kmen</span> je samostatný
          vstup; po změně podílu kmenových zaměstnanců (k_inv) v kroku
          zaměstnanosti ověřte soulad ručně — engine k_inv automaticky
          nepřepočítává toto pole.
        </p>
        <p className="mt-2 border-t border-dashed border-border/40 pt-2 leading-relaxed text-muted-foreground/60">
          <span className="font-medium text-foreground/85">OU (M4) dle metodiky:</span>{" "}
          {state.situation === "A" ? (
            <>
              situace A — <span className="text-foreground/90">DRV-016</span>:{" "}
              OU = N_agentura + N_kmen × KH. Koeficient{" "}
              <span className="text-foreground/90">KH</span> se násobí pouze{" "}
              <span className="text-foreground/90">N_kmen</span>, ne agenturními
              pracovníky. <span className="text-foreground/90">N_pendler</span> do
              této rovnice v A nevstupuje.
            </>
          ) : (
            <>
              situace B — <span className="text-foreground/90">DRV-017</span>: OU =
              N_agentura + (N_kmen + N_relokace) × KH.
            </>
          )}{" "}
          {state.p1PipelineBridge.linkHousingToEmploymentM3
            ? "Při zapnutém M3→M4 se do rovnice dosazuje N_agentura z výstupu zaměstnanosti (DRV-014/015), ne číslo v poli výše."
            : null}
        </p>
      </details>

      <header className="space-y-1.5">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">
          Bydlení a obsazenost
        </h3>
        <p className="text-xs text-muted-foreground/90">
          Odhad bytové potřeby — kolik zaměstnanců se usadí v regionu a kolik bytů
          to vyžaduje.
        </p>
      </header>

      <WizardFieldGroup title="Pracovníci a usazení">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "situation",
              label: "Typ bytové situace v regionu (A nebo B)",
              helper:
                "A = standardní bytový trh, B = přetížený trh s omezenou nabídkou nových bytů.",
              value: state.situation,
              demoValue: demo.situation,
            },
            {
              key: "nKmen",
              label: "Kmenové zaměstnance — počet k usazení v regionu",
              helper:
                "Zaměstnanci, kteří se přistěhují a budou potřebovat bydlení v regionu. Metodický symbol: N_kmen.",
              value: String(state.nKmen),
              number: true,
              demoValue: String(demo.nKmen),
            },
            {
              key: "nAgentura",
              label: "Agenturní a dočasní pracovníci",
              helper:
                "Pracovníci bez trvalé potřeby bydlení — zpravidla ubytovny nebo krátkodobé nájmy. Metodický symbol: N_agentura.",
              value: String(state.nAgentura),
              number: true,
              demoValue: String(demo.nAgentura),
            },
            {
              key: "nPendler",
              label: "Dojíždějící pracovníci",
              helper:
                "Pracovníci dojíždějící z okolí — nevznikají nároky na nové bydlení v místě záměru. Metodický symbol: N_pendler.",
              value: String(state.nPendler),
              number: true,
              demoValue: String(demo.nPendler),
            },
            {
              key: "nRelokace",
              label: "Pracovníci přestěhovaní z jiného regionu",
              helper:
                "Odhadovaný počet pracovníků, kteří se přestěhují přímo kvůli záměru. Metodický symbol: N_relokace.",
              value: String(state.nRelokace),
              number: true,
              demoValue: String(demo.nRelokace),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Skladba zástavby a obsazenost domácností">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "shareByt",
              label: "Podíl bytů v nové zástavbě (0–1)",
              helper:
                "Kolik procent nové rezidenční výstavby tvoří byty v bytových domech (vs. rodinné domy).",
              value: String(state.shareByt),
              number: true,
              demoValue: String(demo.shareByt),
            },
            {
              key: "shareRodinny",
              label: "Podíl rodinných domů v nové zástavbě (0–1)",
              helper: "Zbylá část — rodinné domy a řadovky.",
              value: String(state.shareRodinny),
              number: true,
              demoValue: String(demo.shareRodinny),
            },
            {
              key: "occByt",
              label: "Průměrný počet osob na byt",
              helper:
                "Kolik osob v průměru obývá jeden byt — vstup do výpočtu počtu usazených obyvatel.",
              value: String(state.occByt),
              number: true,
              demoValue: String(demo.occByt),
            },
            {
              key: "occRodinny",
              label: "Průměrný počet osob na rodinný dům",
              helper: "Kolik osob v průměru obývá jeden rodinný dům.",
              value: String(state.occRodinny),
              number: true,
              demoValue: String(demo.occRodinny),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>

      <WizardFieldGroup title="Trh a volné jednotky">
        <StepFields
          errors={fieldErrors}
          fields={[
            {
              key: "lMarketByt",
              label: "Parametr dostupnosti trhu s byty (L_market)",
              helper:
                "Skalár pro segment bytů: v modelu se násobí předpokladem „market_coverage“ a přičítá se alokace volných jednotek (viz DRV-022). Nejde o povinný podíl 0–1 — vyšší hodnoty (např. desítky) odpovídají silnějšímu odhadu přístupnosti trhu v jednotkách modelu.",
              value: String(state.lMarketByt),
              number: true,
              demoValue: String(demo.lMarketByt),
            },
            {
              key: "lMarketRodinny",
              label: "Parametr dostupnosti trhu s rodinnými domy (L_market)",
              helper:
                "Stejná logika jako u bytů — skalár L_market pro rodinné domy, násobený market_coverage a doplněný o podíl volné nabídky.",
              value: String(state.lMarketRodinny),
              number: true,
              demoValue: String(demo.lMarketRodinny),
            },
            {
              key: "vTVacant",
              label: "Volné bytové jednotky v regionu",
              helper:
                "Stávající volné byty a domy na trhu — vstupuje do výpočtu jako nabídková rezerva. Metodický symbol: V_t vacant.",
              value: String(state.vTVacant),
              number: true,
              demoValue: String(demo.vTVacant),
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
              key: "housingRampYears",
              label: "Doba náběhu bydlení (roky)",
              helper:
                "Za kolik let se záměr plně projeví v bytových nárocích.",
              value: String(state.housingRampYears),
              number: true,
              int: true,
              demoValue: String(demo.housingRampYears),
            },
          ]}
          onChange={onFieldChange}
        />
      </WizardFieldGroup>
    </div>
  );
}
