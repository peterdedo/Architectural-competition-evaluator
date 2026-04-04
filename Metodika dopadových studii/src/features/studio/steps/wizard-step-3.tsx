"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  SCENARIO_DELTA_INPUT_META,
  scenarioDeltaFieldErrorPath,
} from "@/content/scenario-delta-bounds";
import { InfoTip, InfoPanel } from "@/components/info-tip";
import { useWizardStore } from "../wizard-store";
import { cs } from "../studio-copy";
import { ScenarioNum, num, StepFields } from "../studio-wizard-shared";
import { useWizardStep3Slice } from "../wizard-step-selectors";
import { SCENARIO_ORDER } from "../wizard-types";
import { uxWizard } from "../ux/studio-ux-copy";

/** Shodné se Zod (0–1) — vysvětluje charakter vstupu, ne metodický vzorec. */
const SCENARIO_DELTA_VALUE_HINT =
  "Rozsah 0–1 — odchylka předpokladu pro tento scénář, ne jediná „správná“ hodnota záměru.";

export function WizardStep3({
  fieldErrors,
}: {
  fieldErrors: Record<string, string>;
}) {
  const patchState = useWizardStore((s) => s.patchState);
  const state = useWizardStep3Slice();

  return (
    <div className="space-y-6">
      <StepFields
        errors={fieldErrors}
        fields={[
          {
            key: "rampYearsGlobal",
            label: "Referenční horizont (roky, přehled)",
            value: String(state.rampYearsGlobal),
            number: true,
            int: true,
            helper:
              "T0 je v kroku „Záměr a popis“ — zde nastavujete horizont pro přehled a srovnání.",
          },
        ]}
        onChange={(key, raw) => {
          if (key === "rampYearsGlobal")
            patchState({
              rampYearsGlobal: Math.max(1, Math.round(num(raw))),
            });
        }}
      />
      <Separator />
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          Odchylky oproti sdíleným předpokladům — u každého pole je metodický symbol v tooltipu
          (najeďte na popisek). Čísla v kartách níže mají stejné meze jako validace průvodce (0–1).
        </p>
        <InfoPanel trigger="Co jsou scénářové parametry a proč se liší?">
          <strong>Tři scénáře</strong> (optimistický, střední, pesimistický) se liší hodnotami
          těchto parametrů — například jak velký podíl pracovníků bude dojíždět nebo jak vysoká
          bude efektivní daňová kvóta. Každý scénář modeluje jiný předpoklad o budoucím vývoji.
          Pokud pole ponecháte prázdné, výpočet použije předvolenou hodnotu z registru předpokladů
          (tzv. fallback) a vydá upozornění.
        </InfoPanel>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {SCENARIO_ORDER.map((kind) => (
          <Card key={kind}>
            <CardHeader className="py-3">
              <CardTitle className="text-base">{cs.scenarios[kind]}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScenarioNum
                id={`scenario-${kind}-util_RZPS`}
                label={uxWizard.scenarioDeltaFields[0].human}
                expertHint={uxWizard.scenarioDeltaFields[0].expert}
                helperText={SCENARIO_DELTA_VALUE_HINT}
                {...SCENARIO_DELTA_INPUT_META.util_RZPS}
                fieldError={
                  fieldErrors[scenarioDeltaFieldErrorPath(kind, "util_RZPS")]
                }
                value={
                  state.scenarioAssumptionDelta[kind]?.util_RZPS ?? ""
                }
                onChange={(v) =>
                  patchState({
                    scenarioAssumptionDelta: {
                      ...state.scenarioAssumptionDelta,
                      [kind]: {
                        ...state.scenarioAssumptionDelta[kind],
                        util_RZPS: v,
                      },
                    },
                  })
                }
              />
              <ScenarioNum
                id={`scenario-${kind}-theta`}
                label={uxWizard.scenarioDeltaFields[1].human}
                expertHint={uxWizard.scenarioDeltaFields[1].expert}
                helperText={SCENARIO_DELTA_VALUE_HINT}
                {...SCENARIO_DELTA_INPUT_META.theta}
                fieldError={
                  fieldErrors[scenarioDeltaFieldErrorPath(kind, "theta")]
                }
                value={state.scenarioAssumptionDelta[kind]?.theta ?? ""}
                onChange={(v) =>
                  patchState({
                    scenarioAssumptionDelta: {
                      ...state.scenarioAssumptionDelta,
                      [kind]: {
                        ...state.scenarioAssumptionDelta[kind],
                        theta: v,
                      },
                    },
                  })
                }
              />
              <ScenarioNum
                id={`scenario-${kind}-p_pendler`}
                label={uxWizard.scenarioDeltaFields[2].human}
                expertHint={uxWizard.scenarioDeltaFields[2].expert}
                helperText={SCENARIO_DELTA_VALUE_HINT}
                {...SCENARIO_DELTA_INPUT_META.p_pendler}
                fieldError={
                  fieldErrors[scenarioDeltaFieldErrorPath(kind, "p_pendler")]
                }
                value={
                  state.scenarioAssumptionDelta[kind]?.p_pendler ?? ""
                }
                onChange={(v) =>
                  patchState({
                    scenarioAssumptionDelta: {
                      ...state.scenarioAssumptionDelta,
                      [kind]: {
                        ...state.scenarioAssumptionDelta[kind],
                        p_pendler: v,
                      },
                    },
                  })
                }
              />
              <ScenarioNum
                id={`scenario-${kind}-k_inv`}
                label={uxWizard.scenarioDeltaFields[3].human}
                expertHint={uxWizard.scenarioDeltaFields[3].expert}
                helperText={SCENARIO_DELTA_VALUE_HINT}
                {...SCENARIO_DELTA_INPUT_META.k_inv}
                fieldError={
                  fieldErrors[scenarioDeltaFieldErrorPath(kind, "k_inv")]
                }
                value={state.scenarioAssumptionDelta[kind]?.k_inv ?? ""}
                onChange={(v) =>
                  patchState({
                    scenarioAssumptionDelta: {
                      ...state.scenarioAssumptionDelta,
                      [kind]: {
                        ...state.scenarioAssumptionDelta[kind],
                        k_inv: v,
                      },
                    },
                  })
                }
              />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
