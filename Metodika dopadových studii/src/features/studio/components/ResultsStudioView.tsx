"use client";

import { useCallback, useMemo, useState, memo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { AgencyShareRiskCallout } from "@/components/agency-share-risk-callout";
import { baselineHasAgencyShareRisk } from "@/features/report/agency-share-risk-snapshot";
import { buildMethodologyReportSnapshot } from "@/features/report/build-report-snapshot";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildDecisionScreenCopy, type ConfidenceLevel } from "../ux/decision-screen-copy";
import { uxWizard } from "../ux/studio-ux-copy";
import { tips } from "../ux/tooltips";
import { mergeModuleAssumptionsUsed } from "../pipeline-result-helpers";
import { buildPipelineExplainabilitySummary } from "../pipeline-explainability";
import { ExplainabilitySummaryView } from "@/features/report/components/ExplainabilitySummaryView";
import { InfoTip } from "@/components/info-tip";
import { glossaryCs } from "@/content/glossary-cs";
import {
  TRUST_DECISION_BULLETS_FALLBACK,
  TRUST_SCENARIOS_PRIMARY,
  TRUST_SCENARIOS_SECONDARY,
  TRUST_OQ_PRIMARY,
  TRUST_OQ_DECISION,
  TRUST_NUMBERS_FOOTNOTE,
} from "@/content/trust-framing-cs";
import { openQuestionLabelCs } from "../open-question-labels";
import { runAllScenarioPipelines } from "../run-all-scenarios";
import { useShallow } from "zustand/react/shallow";
import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import { useWizardStore } from "../wizard-store";
import {
  SCENARIO_ORDER,
  type ScenarioKind,
  type StudioStore,
} from "../wizard-types";
import { cs } from "../studio-copy";
import { WarningCards } from "./WarningCards";
import { cn } from "@/lib/utils";

// --- Formatování ---

function fmt(n: number | undefined, maxFrac = 0) {
  if (n === undefined) return "—";
  return new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: maxFrac,
  }).format(n);
}

function fmtCzk(n: number | undefined) {
  if (n === undefined) return "—";
  if (Math.abs(n) >= 1_000_000_000)
    return `${fmt(n / 1_000_000_000, 1)} mld. Kč`;
  if (Math.abs(n) >= 1_000_000) return `${fmt(n / 1_000_000, 1)} mil. Kč`;
  return `${fmt(n)} Kč`;
}

// --- Lidsky čitelné popisky předpokladů ---

const ASSUMPTION_LABELS: Record<string, string> = {
  k_inv: "Podíl kmenových zaměstnanců u investora",
  gamma: "Koeficient γ (dostupnost RZPS)",
  delta: "Koeficient δ (kompetice na trhu)",
  util_RZPS: "Využitelnost regionální pracovní síly",
  alpha_elast: "Elasticita pracovní síly",
  M_i: "Multiplikátor zaměstnanosti",
  p_pendler: "Podíl dojíždějících pracovníků",
  KH: "Počet osob na domácnost",
  N_relokace: "Relokovaní pracovníci (koeficient)",
  market_coverage: "Pokrytí trhem bydlení",
  std_MS_per_1000: "Norm. kapacita MŠ (na 1000 ob.)",
  std_ZS_per_1000: "Norm. kapacita ZŠ (na 1000 ob.)",
  free_cap_factor: "Koeficient volné kapacity",
  beds_per_1000: "Lůžka zdravotní péče (na 1000 ob.)",
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
  include_XM: "Zahrnout export/import (XM)",
  alpha_obec: "Koeficient RUD (obec)",
  Rp_RUD: "Přepočtový koeficient RUD",
  v_RUD_per_cap: "RUD na obyvatele",
};

function humanAssumptionLabel(key: string): string {
  return ASSUMPTION_LABELS[key] ?? key;
}

function glossaryTextForAssumptionKey(key: string): string | undefined {
  if (key in glossaryCs) {
    return glossaryCs[key as keyof typeof glossaryCs];
  }
  return undefined;
}

// --- Confidence chip ---

const CONFIDENCE_STYLES: Record<
  ConfidenceLevel,
  { bg: string; text: string; dot: string }
> = {
  stable: {
    bg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800",
    text: "text-emerald-800 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  moderate: {
    bg: "bg-sky-50 border-sky-200 dark:bg-sky-950/30 dark:border-sky-800",
    text: "text-sky-800 dark:text-sky-300",
    dot: "bg-sky-500",
  },
  sensitive: {
    bg: "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800",
    text: "text-amber-800 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  uncertain: {
    bg: "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800",
    text: "text-red-800 dark:text-red-300",
    dot: "bg-red-500",
  },
};

function ConfidenceChip({
  level,
  summary,
  detail,
}: {
  level: ConfidenceLevel;
  summary: string;
  detail: string;
}) {
  const s = CONFIDENCE_STYLES[level];
  return (
    <div
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        s.bg,
      )}
    >
      <span
        className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", s.dot)}
        aria-hidden
      />
      <div>
        <span className={cn("font-medium", s.text)}>{summary}</span>
        <span className="ml-1 text-muted-foreground">&mdash; {detail}</span>
      </div>
    </div>
  );
}

// --- KPI karta ---

function KpiCard({
  title,
  value,
  hint,
  tooltip,
  primary,
}: {
  title: string;
  value: string;
  hint?: string;
  tooltip?: string;
  primary?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        primary
          ? "border-primary/25 bg-primary/5 shadow-sm"
          : "border-border/60 bg-card",
      )}
    >
      <p
        className={cn(
          "flex items-center gap-1 text-xs font-medium uppercase tracking-wide",
          primary ? "text-primary/80" : "text-muted-foreground",
        )}
      >
        {title}
        {tooltip && <InfoTip text={tooltip} side="top" />}
      </p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold tabular-nums tracking-tight",
          primary ? "text-primary" : "text-foreground",
        )}
      >
        {value}
      </p>
      {hint && (
        <p className="mt-1 text-[11px] leading-snug text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

// --- Řada KPI pro scénář ---

const ScenarioKpiRow = memo(function ScenarioKpiRow({
  result,
  isPrimary,
}: {
  result: StudioStore["results"][ScenarioKind];
  isPrimary?: boolean;
}) {
  if (!result) {
    return (
      <p className="text-sm text-muted-foreground">
        {cs.dashboard.emptyResultsHint}
      </p>
    );
  }
  const deltaHdpSrc = result.economic.result.deltaHdpSource;
  const deltaHdpHint =
    deltaHdpSrc === "manual_mvp"
      ? "Zadaná hodnota z průvodce"
      : deltaHdpSrc === "manual_fallback"
        ? "Záložní hodnota z průvodce"
        : "Odvozeno z investice a pracovních míst (automatický profil)";

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard
        title={cs.dashboard.kpiEmployment}
        value={fmt(result.employment.result.nCelkem)}
        hint="přímých i navazujících pracovních míst"
        tooltip={tips.kpiEmployment}
        primary={isPrimary}
      />
      <KpiCard
        title={cs.dashboard.kpiHousingOu}
        value={fmt(result.housing.result.ou)}
        hint="odhadovaný počet nových obyvatel k usazení"
        tooltip={tips.kpiHousingOu}
      />
      <KpiCard
        title={cs.dashboard.kpiDeltaHdp}
        value={fmtCzk(result.economic.result.deltaHdp)}
        hint={deltaHdpHint}
        tooltip={tips.kpiDeltaHdp}
      />
      <KpiCard
        title={cs.dashboard.kpiTax}
        value={fmtCzk(result.economic.result.taxYield)}
        hint="orientační roční daňový výnos"
        tooltip={tips.kpiTaxYield}
      />
    </div>
  );
});

// --- Hlavní komponenta ---

export function ResultsStudioView({
  expandedIntermediate,
  setExpandedIntermediate,
  onNavigateToWarningField,
}: {
  expandedIntermediate: boolean;
  setExpandedIntermediate: (v: boolean) => void;
  onNavigateToWarningField: (field: string, scenario: ScenarioKind) => void;
}) {
  const { state, results, resultsMayBeStale } = useWizardStore(
    useShallow((s) => ({
      state: s.state,
      results: s.results,
      resultsMayBeStale: s.resultsMayBeStale,
    })),
  );

  const [activeScenarioTab, setActiveScenarioTab] =
    useState<ScenarioKind>("baseline");
  const [recalcBusy, setRecalcBusy] = useState(false);
  const [explainOpen, setExplainOpen] = useState(false);

  const snapshot = useMemo(() => {
    if (!results.baseline) return null;
    return buildMethodologyReportSnapshot(state, results);
  }, [state, results]);

  const decision = useMemo(() => {
    if (!snapshot) return null;
    return buildDecisionScreenCopy(snapshot);
  }, [snapshot]);

  const baseline = results.baseline;
  const totalWarnings = SCENARIO_ORDER.reduce(
    (sum, k) => sum + (results[k]?.allWarnings.length ?? 0),
    0,
  );

  const recalculate = useCallback(() => {
    setRecalcBusy(true);
    window.setTimeout(() => {
      const st = useWizardStore.getState();
      st.setResults(runAllScenarioPipelines(st.state));
      setRecalcBusy(false);
    }, 0);
  }, []);

  return (
    <div className="space-y-8">
      {baseline && resultsMayBeStale ? (
        <div
          className="rounded-lg border border-amber-500/50 bg-amber-50/90 px-4 py-3 dark:border-amber-600/50 dark:bg-amber-950/35"
          role="status"
          aria-live="polite"
        >
          <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">
            {uxWizard.resultsStale.title}
          </p>
          <p className="mt-1 text-sm leading-snug text-amber-950/90 dark:text-amber-50/90">
            {uxWizard.resultsStale.body}
          </p>
        </div>
      ) : null}

      {/* Prázdný stav */}
      {!baseline && (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 py-12 text-center">
          <RefreshCw className="h-8 w-8 text-muted-foreground/50" />
          <div>
            <p className="font-semibold text-foreground">
              {cs.resultsView.noBaselineTitle}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {cs.resultsView.noBaselineBody}
            </p>
          </div>
          <Button
            onClick={recalculate}
            size="lg"
            className="gap-2"
            disabled={recalcBusy}
            aria-busy={recalcBusy}
          >
            <RefreshCw
              className={cn("h-4 w-4", recalcBusy && "animate-spin")}
              aria-hidden
            />
            {recalcBusy ? cs.wizard.calculating : cs.wizard.recalculate}
          </Button>
        </div>
      )}

      {/* Decision block — hlavní závěr */}
      {decision && snapshot && (
        <section
          className="space-y-5 rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.07] via-muted/30 to-background p-6 shadow-sm"
          aria-labelledby="decision-heading"
        >
          <h3
            id="decision-heading"
            className="text-sm font-semibold uppercase tracking-wide text-muted-foreground"
          >
            {uxWizard.decision.title}
          </h3>

          <p className="text-2xl font-semibold leading-snug tracking-tight text-foreground sm:text-[1.65rem]">
            {decision.headline}
          </p>

          <ConfidenceChip
            level={decision.confidenceLevel}
            summary={decision.confidenceSummary}
            detail={decision.confidenceDetail}
          />

          {baselineHasAgencyShareRisk(snapshot) ? (
            <AgencyShareRiskCallout density="default" />
          ) : null}

          <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {uxWizard.decision.decisionBulletsTitle}
            </p>
            <ul className="space-y-2 text-sm leading-snug text-foreground/90">
              {(decision.decisionBullets?.length === 3
                ? decision.decisionBullets
                : TRUST_DECISION_BULLETS_FALLBACK
              ).map((line) => (
                <li key={line.slice(0, 48)} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/70" />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-sm text-muted-foreground">{decision.decisionFraming}</p>

          <div className="rounded-lg bg-background/80 p-4 shadow-sm ring-1 ring-border/40">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              {uxWizard.decision.conclusion}
            </p>
            <p className="text-base leading-relaxed text-foreground">
              {decision.conclusion}
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {uxWizard.decision.topKpi}
            </p>
            <ScenarioKpiRow result={baseline} isPrimary />
            <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
              {TRUST_NUMBERS_FOOTNOTE}
            </p>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {uxWizard.decision.nextSteps}
            </p>
            <ul className="space-y-1.5">
              {decision.nextSteps.map((r, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="text-primary">→</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link href="/report">Otevřít celý report</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Přepočíst CTA */}
      {baseline && (
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
          <Button
            type="button"
            onClick={recalculate}
            className="gap-2 shrink-0"
            variant="default"
            disabled={recalcBusy}
            aria-busy={recalcBusy}
          >
            <RefreshCw
              className={cn("h-4 w-4", recalcBusy && "animate-spin")}
              aria-hidden
            />
            {recalcBusy ? cs.wizard.calculating : cs.wizard.recalculate}
          </Button>
          <p className="text-xs leading-snug text-foreground/85">
            {uxWizard.resultsStale.shortHint}
          </p>
        </div>
      )}

      {/* Srovnání scénářů */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">
            {cs.dashboard.comparisonTitle}
          </h3>
          <InfoTip text={tips.scenarios} side="right" />
        </div>
        <div className="rounded-lg border-l-4 border-primary bg-primary/[0.06] px-4 py-3 text-sm leading-relaxed">
          <p className="font-medium text-foreground">Tři varianty předpokladů</p>
          <p className="mt-1 text-muted-foreground">
            {TRUST_SCENARIOS_PRIMARY} {TRUST_SCENARIOS_SECONDARY}
          </p>
        </div>

        {/* Tab srovnání */}
        <Tabs
          value={activeScenarioTab}
          onValueChange={(v) => setActiveScenarioTab(v as ScenarioKind)}
        >
          <TabsList aria-label="Výběr scénáře pro přehled ukazatelů">
            {SCENARIO_ORDER.map((k) => (
              <TabsTrigger key={k} value={k}>
                {cs.scenarios[k]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <div className="mt-2">
          <ScenarioKpiRow
            result={results[activeScenarioTab]}
            isPrimary={activeScenarioTab === "baseline"}
          />
        </div>

        {/* Side-by-side karty */}
        <div className="grid gap-4 md:grid-cols-3">
          {SCENARIO_ORDER.map((kind) => {
            const r = results[kind];
            const isBase = kind === "baseline";
            return (
              <Card
                key={kind}
                className={cn(
                  "shadow-sm",
                  isBase
                    ? "border-primary/25 ring-1 ring-primary/10"
                    : "border-border/70",
                )}
              >
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="flex items-center justify-between text-sm">
                    {cs.scenarios[kind]}
                    {isBase && (
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-[10px]">
                          Reference
                        </Badge>
                        <InfoTip text={tips.baseline} side="top" />
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pb-4 text-sm">
                  <MetricRow
                    label={cs.dashboard.kpiEmployment}
                    value={fmt(r?.employment.result.nCelkem)}
                    unit="míst"
                  />
                  <MetricRow
                    label={cs.dashboard.kpiHousingOu}
                    value={fmt(r?.housing.result.ou)}
                    unit="ob."
                  />
                  <MetricRow
                    label={cs.dashboard.kpiDeltaHdp}
                    value={fmtCzk(r?.economic.result.deltaHdp)}
                  />
                  <MetricRow
                    label={cs.dashboard.kpiTax}
                    value={fmtCzk(r?.economic.result.taxYield)}
                    unit="/rok"
                  />
                  <MetricRow
                    label={cs.dashboard.kpiPrud}
                    value={fmtCzk(r?.economic.result.prudAnnual)}
                    unit="/rok"
                  />
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Upozornění */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">
            {cs.dashboard.warnings}
          </h3>
          {totalWarnings > 0 && (
            <Badge variant="warning">{totalWarnings}</Badge>
          )}
          <InfoTip text={tips.warning} side="right" />
        </div>
        <div className="space-y-4">
          {SCENARIO_ORDER.map((kind) => (
            <div key={kind}>
              <p className="mb-2 text-sm font-medium text-muted-foreground">
                {cs.scenarios[kind]}
              </p>
              <WarningCards
                warnings={results[kind]?.allWarnings ?? []}
                activeScenario={kind}
                onNavigateToField={(field) =>
                  onNavigateToWarningField(field, kind)
                }
              />
            </div>
          ))}
        </div>
      </section>

      {/* Předpoklady a otevřené otázky */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold">
            Předpoklady a otevřené otázky
          </h3>
          <InfoTip text={tips.assumptions} side="right" />
        </div>
        <p className="text-sm text-muted-foreground">
          Přehled klíčových předpokladů, se kterými výpočet pracoval. Hodnoty
          pocházejí z průvodce nebo z výchozích hodnot metodiky.
        </p>
        <HumanAssumptionsBlock result={baseline} />
        <OpenQuestionsBlock ids={baseline?.allOpenQuestions ?? []} />
      </section>

      {/* Explainability — lidský přehled před JSON */}
      {results[activeScenarioTab] ? (
        <Collapsible open={explainOpen} onOpenChange={setExplainOpen}>
          <CollapsibleTrigger className="flex w-full items-center gap-2 rounded-md border border-primary/25 bg-primary/[0.04] px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-primary/[0.07]">
            {explainOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0" />
            )}
            Jak aplikace došla k číslům — efektivní vstupy ({cs.scenarios[activeScenarioTab]})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 data-[state=closed]:animate-none">
            <p className="mb-2 text-xs text-muted-foreground">
              {uxWizard.decision.explainabilityIntro}
            </p>
            <ExplainabilitySummaryView
              sections={buildPipelineExplainabilitySummary(
                state,
                activeScenarioTab,
                results[activeScenarioTab]!,
              )}
              isPrint={false}
              variant="embedded"
            />
          </CollapsibleContent>
        </Collapsible>
      ) : null}

      {/* Technický detail — sbalený */}
      <Collapsible
        open={expandedIntermediate}
        onOpenChange={setExpandedIntermediate}
      >
        <CollapsibleTrigger className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/30 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          {expandedIntermediate ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          {uxWizard.decision.expertJson}
        </CollapsibleTrigger>
        <CollapsibleContent
          id="expert-json-panel"
          role="region"
          aria-labelledby="expert-json-trigger"
          className="mt-2 rounded-md border bg-muted/20 p-3"
        >
          {expandedIntermediate && <ExpertJsonTabs results={results} />}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

// --- Pomocné komponenty ---

function MetricRow({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium tabular-nums">
        {value}
        {unit && (
          <span className="ml-0.5 text-[10px] text-muted-foreground">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}

function HumanAssumptionsBlock({
  result,
}: {
  result: StudioStore["results"]["baseline"];
}) {
  const assumptions = mergeModuleAssumptionsUsed(result);
  const entries = Object.entries(assumptions);
  if (!entries.length) return null;

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center gap-1.5">
        <h4 className="text-sm font-semibold">{cs.dashboard.assumptions}</h4>
        <InfoTip text={tips.assumptions} side="top" />
      </div>
      <div className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {entries.map(([k, v]) => {
          const gt = glossaryTextForAssumptionKey(k);
          return (
            <div key={k} className="flex items-baseline justify-between gap-2">
              <span className="flex flex-wrap items-center gap-1 text-muted-foreground">
                {humanAssumptionLabel(k)}
                {gt ? (
                  <InfoTip
                    text={gt}
                    ariaLabel={`Slovníček: ${humanAssumptionLabel(k)}`}
                  />
                ) : null}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-foreground">
                {String(v)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OpenQuestionsBlock({ ids }: { ids: string[] }) {
  if (!ids.length) return null;
  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/60 p-4 dark:border-amber-800/40 dark:bg-amber-950/20">
      <div className="mb-2 flex items-center gap-1.5">
        <h4 className="text-sm font-semibold">{cs.dashboard.openQuestions}</h4>
        <InfoTip text={tips.openQuestions} side="top" />
      </div>
      <p className="mb-1 text-xs text-muted-foreground">{TRUST_OQ_PRIMARY}</p>
      <p className="mb-3 text-xs font-medium text-amber-800 dark:text-amber-300">
        {TRUST_OQ_DECISION}
      </p>
      <ul className="space-y-2">
        {ids.map((id) => (
          <li key={id} className="flex gap-2 text-sm">
            <Badge variant="outline" className="shrink-0 text-[10px]">
              {id}
            </Badge>
            <span className="text-foreground">{openQuestionLabelCs(id)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ExpertJsonTabs({
  results,
}: {
  results: StudioStore["results"];
}) {
  const [tab, setTab] = useState<ScenarioKind>("baseline");
  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as ScenarioKind)}>
      <TabsList className="mb-2">
        {SCENARIO_ORDER.map((k) => (
          <TabsTrigger key={k} value={k} className="text-xs">
            {cs.scenarios[k]}
          </TabsTrigger>
        ))}
      </TabsList>
      <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap text-xs">
        {results[tab]
          ? JSON.stringify(
              {
                employment: results[tab]!.employment.intermediateValues,
                housing: results[tab]!.housing.intermediateValues,
                civic: results[tab]!.civic.intermediateValues,
                economic: results[tab]!.economic.intermediateValues,
              },
              null,
              2,
            )
          : "—"}
      </pre>
    </Tabs>
  );
}
