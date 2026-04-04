"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTip } from "@/components/info-tip";
import { mergeModuleAssumptionsUsed } from "../pipeline-result-helpers";
import { openQuestionLabelCs } from "../open-question-labels";
import { cs } from "../studio-copy";
import { tips } from "../ux/tooltips";
import { SCENARIO_ORDER, type StudioStore } from "../wizard-types";
import { useWizardStore } from "../wizard-store";
import { WarningCards } from "./WarningCards";

/** Mapa technických klíčů předpokladů na lidsky čitelné popisy. */
const ASSUMPTION_LABELS: Record<string, string> = {
  k_inv: "Podíl vlastních zaměstnanců investora",
  gamma: "Koeficient dostupnosti reg. pracovní síly",
  delta: "Koeficient kompetice na trhu práce",
  util_RZPS: "Využitelnost regionální pracovní síly",
  alpha_elast: "Elasticita pracovní síly",
  M_i: "Multiplikátor zaměstnanosti",
  p_pendler: "Podíl dojíždějících pracovníků",
  KH: "Průměrný počet osob na domácnost",
  N_relokace: "Relokovaní pracovníci (koeficient)",
  market_coverage: "Pokrytí trhem bydlení",
  std_MS_per_1000: "Norm. kapacita MŠ na 1 000 ob.",
  std_ZS_per_1000: "Norm. kapacita ZŠ na 1 000 ob.",
  free_cap_factor: "Koeficient volné kapacity",
  beds_per_1000: "Lůžka zdravotní péče na 1 000 ob.",
  MPC: "Mezní sklon ke spotřebě",
  M_spotreba: "Multiplikátor spotřeby",
  M_mista: "Multiplikátor pracovních míst",
  M_investice: "Multiplikátor investic",
  M_vlada: "Multiplikátor vládních výdajů",
  T_ref_years: "Referenční horizont (roky)",
  theta: "Efektivní daňová kvóta",
  p_stat: "Podíl daní státu",
  p_kraj: "Podíl daní kraje",
  p_obec: "Podíl daní obce",
  r_retence: "Míra retence pracovníků",
  include_XM: "Zahrnout export/import",
  alpha_obec: "Koeficient RUD (obec)",
  Rp_RUD: "Přepočtový koeficient RUD",
  v_RUD_per_cap: "RUD na obyvatele",
};

const SCENARIO_DELTA_LABELS: Record<string, string> = {
  util_RZPS: "Využitelnost lokální prac. síly",
  theta: "Efektivní daňová kvóta",
  p_pendler: "Podíl dojíždějících",
  k_inv: "Podíl vlastních zaměstnanců",
};

function humanLabel(key: string): string {
  return ASSUMPTION_LABELS[key] ?? key;
}

function humanScenarioDeltaLabel(key: string): string {
  return SCENARIO_DELTA_LABELS[key] ?? ASSUMPTION_LABELS[key] ?? key;
}

function AssumptionRow({ k, v }: { k: string; v: string | number | boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-0.5">
      <span className="text-muted-foreground">{humanLabel(k)}</span>
      <span className="shrink-0 font-medium tabular-nums text-foreground">
        {String(v)}
      </span>
    </div>
  );
}

export function AssumptionsPanelConnected({
  onNavigateToWarningField,
}: {
  onNavigateToWarningField?: (field: string) => void;
}) {
  const wizardState = useWizardStore((s) => s.state);
  const baseline = useWizardStore((s) => s.results.baseline);

  const mergedAssumptionsFromEngine = useMemo(
    () => mergeModuleAssumptionsUsed(baseline),
    [baseline],
  );

  return (
    <AssumptionsPanelInner
      wizardState={wizardState}
      mergedAssumptionsFromEngine={mergedAssumptionsFromEngine}
      baselineResult={baseline}
      onNavigateToWarningField={onNavigateToWarningField}
    />
  );
}

function AssumptionsPanelInner({
  wizardState,
  mergedAssumptionsFromEngine,
  baselineResult,
  onNavigateToWarningField,
}: {
  wizardState: StudioStore["state"];
  mergedAssumptionsFromEngine: Record<string, string | number | boolean>;
  baselineResult: StudioStore["results"]["baseline"];
  onNavigateToWarningField?: (field: string) => void;
}) {
  const sharedEntries = Object.entries(wizardState.sharedAssumptions);
  const assumptionEntries = Object.entries(mergedAssumptionsFromEngine);
  const oqIds = baselineResult?.allOpenQuestions ?? [];
  const warnings = baselineResult?.allWarnings ?? [];

  return (
    <div className="space-y-6">
      {/* Úvodní info */}
      <div className="rounded-md border border-border/50 bg-muted/30 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          Tento přehled ukazuje, na jakých hodnotách a předpokladech výpočet
          staví. Hodnoty pocházejí z průvodce nebo z výchozích hodnot metodiky.
          Otevřené otázky signalizují místa, kde metodika nemá uzavřenou odpověď.
        </p>
      </div>

      {/* Sdílené předpoklady z průvodce */}
      {sharedEntries.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">
              {cs.assumptionsPanel.sharedFromWizard}
            </h3>
            <InfoTip text={tips.assumptions} side="right" />
          </div>
          <p className="text-xs text-muted-foreground">
            Hodnoty platné pro všechny scénáře — zadané v průvodci nebo použitá výchozí hodnota metodiky.
          </p>
          <div className="rounded-lg border border-border/60 bg-card px-4 py-3 text-sm divide-y divide-border/40">
            {sharedEntries.map(([k, v]) => (
              <AssumptionRow key={k} k={k} v={v} />
            ))}
          </div>
        </section>
      )}

      {/* Scénářové odchylky */}
      <section className="space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">
            {cs.assumptionsPanel.scenarioDeltas}
          </h3>
          <InfoTip text={tips.scenarioParams} side="right" />
        </div>
        <p className="text-xs text-muted-foreground">
          Parametry, které se liší mezi optimistickým, středním a pesimistickým
          scénářem. Prázdná hodnota = použita shodná výchozí hodnota jako sdílený předpoklad.
        </p>
        <div className="grid gap-3 md:grid-cols-3">
          {SCENARIO_ORDER.map((kind) => {
            const deltas = Object.entries(
              wizardState.scenarioAssumptionDelta[kind] ?? {},
            );
            return (
              <Card key={kind} className="border-border/60">
                <CardHeader className="py-2">
                  <CardTitle className="text-sm">{cs.scenarios[kind]}</CardTitle>
                </CardHeader>
                <CardContent className="pb-3 text-sm">
                  {deltas.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Žádné odchylky — používají se sdílené předpoklady.
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {deltas.map(([k, v]) => (
                        <div key={k} className="flex items-baseline justify-between gap-2">
                          <span className="text-xs text-muted-foreground">
                            {humanScenarioDeltaLabel(k)}
                          </span>
                          <span className="shrink-0 text-xs font-medium tabular-nums">
                            {String(v)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Předpoklady použité ve výpočtu */}
      {assumptionEntries.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Předpoklady použité ve výpočtu (střední scénář)</h3>
            <InfoTip text={tips.assumptions} side="right" />
          </div>
          <p className="text-xs text-muted-foreground">
            Kompletní sada parametrů, se kterými počítalo jádro M3–M6 pro střední scénář.
            Zahrnuje hodnoty zadané v průvodci i výchozí hodnoty metodiky.
          </p>
          <div className="rounded-lg border border-border/60 bg-card px-4 py-3 text-sm divide-y divide-border/40">
            {assumptionEntries.map(([k, v]) => (
              <AssumptionRow key={k} k={k} v={v} />
            ))}
          </div>
        </section>
      )}

      {/* Otevřené otázky */}
      {oqIds.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{cs.dashboard.openQuestions}</h3>
            <InfoTip text={tips.openQuestions} side="right" />
          </div>
          <p className="text-xs text-muted-foreground">
            Metodika pro tato místa nemá uzavřený výpočetní vzorec nebo chybí dostatečná
            datová základna. Jejich přítomnost znamená vyšší nejistotu výsledků, ne chybu.
          </p>
          <div className="space-y-2">
            {oqIds.map((id) => (
              <div
                key={id}
                className="flex gap-3 rounded-md border border-amber-200/80 bg-amber-50/60 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-950/20"
              >
                <Badge variant="outline" className="shrink-0 text-[10px]">
                  {id}
                </Badge>
                <span className="text-sm">{openQuestionLabelCs(id)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upozornění */}
      {warnings.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">{cs.dashboard.warnings}</h3>
            <InfoTip text={tips.warning} side="right" />
          </div>
          <p className="text-xs text-muted-foreground">
            Upozornění vznikla tam, kde výpočet musel použít záložní hodnotu nebo
            kde metodika identifikovala otevřené místo. Výsledek je stále platný.
          </p>
          <WarningCards
            warnings={warnings}
            activeScenario="baseline"
            onNavigateToField={onNavigateToWarningField}
          />
        </section>
      )}

      {oqIds.length === 0 && warnings.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Žádné otevřené otázky ani upozornění — výpočet proběhl bez identifikovaných
          nejistot v datové základně.
        </p>
      )}
    </div>
  );
}
