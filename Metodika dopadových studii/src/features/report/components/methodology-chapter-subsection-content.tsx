"use client";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { AgencyShareRiskCallout } from "@/components/agency-share-risk-callout";
import { glossaryCs } from "@/content/glossary-cs";
import {
  baselineHasAgencyShareRisk,
  snapshotUnionHasAgencyShareRisk,
} from "@/features/report/agency-share-risk-snapshot";
import { openQuestionLabelCs } from "@/features/studio/open-question-labels";
import { SCENARIO_ORDER } from "@/features/studio/wizard-types";
import { warningMessageCs } from "@/features/studio/warning-messages";
import { cs as studioCs } from "@/features/studio/studio-copy";
import {
  compareWarningsForDisplay,
  warningTitleLine,
} from "@/features/studio/ux/warning-card-meta";
import { cn } from "@/lib/utils";
import type { LabeledBaselineNumber } from "@/domain/methodology/p1-layers";
import type { MethodologyReportSnapshot } from "../types";
import { reportCs } from "../report-copy-cs";
import { formatReportNumber } from "../report-format";
import { splitExecutiveSummaryForOutlineCh9 } from "../executive-summary-split";
import { ExplainabilitySummaryView } from "./ExplainabilitySummaryView";
import {
  ComparisonTable,
  ExecutiveBlock,
  Field,
  formatAuditForPrint,
  Kpi,
  LayerBadge,
  ModulePre,
  M7ConsolidationBlock,
  ReportSection,
  Section12AssumptionsUncertaintyBlock,
  type ReportSnapshotVariant,
  deltaHdpKpiSublabel,
  householdConsumptionKpiSublabel,
} from "./report-core-blocks";
import {
  MethodologySubsectionShell,
  SubsectionFormalPlaceholder,
} from "./methodology-subsection-shell";

const fmt = formatReportNumber;

function M2LabeledField({
  label,
  nb,
  isPrint,
}: {
  label: string;
  nb: LabeledBaselineNumber;
  isPrint: boolean;
}) {
  const bits = [fmt(nb.value), nb.kind !== "raw_input" ? `druh: ${nb.kind}` : null, nb.note || null]
    .filter(Boolean)
    .join(" · ");
  return <Field label={label} value={bits} isPrint={isPrint} />;
}

function TechnicalJsonAnnex({
  title,
  data,
  isPrint,
}: {
  title: string;
  data: unknown;
  isPrint: boolean;
}) {
  const pre = (
    <pre
      className={cn(
        "max-h-56 overflow-auto rounded-md border p-3 text-xs leading-snug",
        isPrint ? "border-black bg-white print-pre" : "border-muted bg-muted/20",
      )}
    >
      {JSON.stringify(data, null, 2)}
    </pre>
  );
  if (isPrint) {
    return (
      <div className="space-y-1">
        <p className={cn("text-[10pt] font-medium", "text-black")}>{title}</p>
        {pre}
      </div>
    );
  }
  return (
    <details className="rounded-md border border-border/60 bg-muted/10">
      <summary className="cursor-pointer p-2 text-xs font-medium">{title}</summary>
      <div className="px-2 pb-2">{pre}</div>
    </details>
  );
}

function renderSubsectionInner(
  chapter: number,
  subsectionId: string,
  snapshot: MethodologyReportSnapshot,
  isPrint: boolean,
  variant: ReportSnapshotVariant,
  auditOpen: boolean,
  setAuditOpen: (v: boolean) => void,
): React.ReactNode {
  const b = snapshot.primaryKpiAndModules.baseline;
  const m0 = snapshot.p1_layers.m0;
  const m1 = snapshot.p1_layers.m1;
  const m2 = snapshot.p1_layers.m2AsIs;
  const s01 = snapshot.section01_project;
  const s02 = snapshot.section02_investor;
  const s03 = snapshot.section03_territory;
  const s05 = snapshot.section05_asIs;

  const key = `${chapter}-${subsectionId}`;

  switch (key) {
    /* --- Kapitola 1 --- */
    case "1-1.1":
      return (
        <Field
          label="Název projektu / záměru"
          value={s01.projectName.trim() || "—"}
          isPrint={isPrint}
        />
      );
    case "1-1.2":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Field
              label="Místo realizace (volný text z průvodce)"
              value={s01.locationDescription.trim() || "—"}
              isPrint={isPrint}
            />
            <Field
              label="Definiční bod / štítek (M1)"
              value={m1.definitionPointLabel.trim() || "—"}
              isPrint={isPrint}
            />
            <Field
              label="Obec / město"
              value={m1.municipality.trim() || "—"}
              isPrint={isPrint}
            />
            <Field label="Kraj" value={m1.region.trim() || "—"} isPrint={isPrint} />
            <Field
              label="AOI — textový popis jednotek"
              value={m1.aoiUnitsLabel.trim() || "—"}
              isPrint={isPrint}
            />
          </div>
          <p
            className={cn(
              "text-xs leading-snug",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Přesné GIS hranice AOIVuz / AOIDadm nejsou v této verzi generovány — slouží strukturovaný text a definiční bod.
          </p>
        </div>
      );
    case "1-1.3":
      return (
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field
            label="Předpokládané souhrnné investiční náklady (CAPEX)"
            value={`${fmt(s01.capexTotalCzk, 0)} Kč`}
            isPrint={isPrint}
          />
          <Field label="Referenční rok záměru (T0)" value={s03.t0 || "—"} isPrint={isPrint} />
          <Field
            label="Horizont (roky)"
            value={String(s03.rampYearsGlobal)}
            isPrint={isPrint}
          />
          <Field label="Počet pracovních míst (N_inv)" value={String(s01.nInv)} isPrint={isPrint} glossaryTooltip={glossaryCs.PMJ} />
          <p
            className={cn(
              "sm:col-span-2 text-xs leading-snug",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Etapizace investice je v modelu vyjádřena kombinací CAPEX, T0 a horizontu; detailní milníky viz projektové období (1.4).
          </p>
        </div>
      );
    case "1-1.4":
      return (
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field
            label="Zahájení výstavby (text, M0)"
            value={m0.schedule.constructionStart.trim() || "—"}
            isPrint={isPrint}
          />
          <Field
            label="Plánovaný plný provoz (text, M0)"
            value={m0.schedule.fullOperationPlanned.trim() || "—"}
            isPrint={isPrint}
          />
          <p
            className={cn(
              "sm:col-span-2 text-xs leading-snug",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Strukturovaná časová osa (Gantt) není v aplikaci — fáze příprava / výstavba / provoz vyplňte v textu finální studie podle těchto štítků.
          </p>
        </div>
      );

    /* --- Kapitola 2 --- */
    case "2-2.1":
      return (
        <div className="grid gap-3 text-sm">
          <Field
            label="Profil investora"
            value={s02.investorProfile.trim() || "—"}
            isPrint={isPrint}
          />
          <Field label="Právní forma" value={s02.legalForm.trim() || "—"} isPrint={isPrint} />
        </div>
      );
    case "2-2.2":
      return (
        <SubsectionFormalPlaceholder isPrint={isPrint}>
          <p>
            Základní údaje o zpracovateli dopadové studie (organizace, IČO, odpovědná osoba) nejsou strukturovaným výstupem této aplikace.
            Doplní zpracovatel finálního dokumentu.
          </p>
        </SubsectionFormalPlaceholder>
      );
    case "2-2.3":
      return (
        <SubsectionFormalPlaceholder isPrint={isPrint}>
          <p>
            Popis role zpracovatele a způsobu spolupráce se zadavatelem a investorem není v aktuální verzi zachycen ve strukturovaných polích — doplní se v textu finální studie.
          </p>
        </SubsectionFormalPlaceholder>
      );

    /* --- Kapitola 3 --- */
    case "3-3.1":
      return (
        <div className="space-y-3 text-sm">
          <Field
            label="Slovní popis kapacity a rozsahu"
            value={m0.capacityNarrative.trim() || "—"}
            isPrint={isPrint}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field
              label="Podlahová plocha záměru (m²)"
              value={fmt(m0.scopeCapacity.floorAreaM2, 0)}
              isPrint={isPrint}
            />
            <Field
              label="Plocha areálu (m²)"
              value={fmt(m0.scopeCapacity.siteAreaM2, 0)}
              isPrint={isPrint}
            />
            <Field
              label="Propustnost / technologický kontext"
              value={m0.scopeCapacity.throughputNote.trim() || "—"}
              isPrint={isPrint}
            />
            <Field
              label="PMJ — směny a popis"
              value={m0.pmjPortfolio.shiftsDescription.trim() || "—"}
              isPrint={isPrint}
            />
            <Field
              label="Ekvivalent úvazků (FTE)"
              value={fmt(m0.pmjPortfolio.fteEquivalent, 2)}
              isPrint={isPrint}
            />
            <Field
              label="Špička zátěže / poznámka"
              value={m0.pmjPortfolio.peakLoadNote.trim() || "—"}
              isPrint={isPrint}
            />
          </div>
          <TechnicalJsonAnnex title="Úplná strukturovaná vrstva M0 (JSON)" data={m0} isPrint={isPrint} />
        </div>
      );
    case "3-3.2":
      return (
        <div className="space-y-3">
          <Field
            label="Strategické vazby (průvodce)"
            value={s02.strategicLinks.trim() || "—"}
            isPrint={isPrint}
          />
          {m0.strategicDocuments.length ? (
            <ul className="list-disc space-y-2 pl-5 text-sm">
              {m0.strategicDocuments.map((d, i) => (
                <li key={i}>
                  <span className="font-medium">{d.title || "—"}</span>
                  {d.relevance ? (
                    <span className={cn(isPrint ? "text-black" : "text-muted-foreground")}>
                      {" "}
                      — {d.relevance}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className={cn("text-sm", isPrint ? "text-black" : "text-muted-foreground")}>
              Nejsou vyplněny odkazy na strategické dokumenty ve vrstvě M0.
            </p>
          )}
        </div>
      );
    case "3-3.3":
      return (
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="CZ-NACE (hlavní vstup)" value={s01.czNace.trim() || "—"} isPrint={isPrint} />
          <Field
            label="Doplňkové CZ-NACE (M0)"
            value={m0.secondaryNace.trim() || "—"}
            isPrint={isPrint}
          />
          <p
            className={cn(
              "sm:col-span-2 text-xs leading-snug",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Profesní klasifikace (CZ-ISCO) a formální typ investice jako samostatná pole v MVP nejsou — doplní analytik v textu studie.
          </p>
        </div>
      );
    case "3-3.4":
      return (
        <div className="space-y-2 text-sm">
          {m0.capacityNarrative.trim() ? (
            <Field
              label="Kontext potřebnosti (částečně z popisu záměru)"
              value={m0.capacityNarrative.trim()}
              isPrint={isPrint}
            />
          ) : (
            <SubsectionFormalPlaceholder isPrint={isPrint}>
              <p>
                Samostatná kapitola „stávající stav vs. potřebnost“ není ve strukturovaných datech. Doplňte odůvodnění v textu finální dopadové studie.
              </p>
            </SubsectionFormalPlaceholder>
          )}
        </div>
      );
    case "3-3.5":
      return (
        <SubsectionFormalPlaceholder isPrint={isPrint}>
          <p>
            Vazby na jiné investiční projekty v území, synergie a odlišnosti nejsou v této verzi zachyceny ve strukturovaných vstupech.
          </p>
        </SubsectionFormalPlaceholder>
      );

    /* --- Kapitola 4 --- */
    case "4-4.1":
      return (
        <div className="space-y-3 text-sm">
          <Field
            label="Vlastní území záměru — definiční bod"
            value={m1.definitionPointLabel.trim() || "—"}
            isPrint={isPrint}
          />
          <Field
            label="Poznámka k hranicím / vymezení"
            value={m1.boundaryNote.trim() || "—"}
            isPrint={isPrint}
          />
          <TechnicalJsonAnnex
            title="GeoJSON / technický text (volitelný vstup)"
            data={m1.geoJsonText ? { geoJsonText: m1.geoJsonText } : { geoJsonText: "" }}
            isPrint={isPrint}
          />
        </div>
      );
    case "4-4.2":
      return (
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <Field label="Obec" value={m1.municipality.trim() || "—"} isPrint={isPrint} />
          <Field label="Kraj" value={m1.region.trim() || "—"} isPrint={isPrint} />
          <Field label="Katastrální území" value={m1.cadastralArea.trim() || "—"} isPrint={isPrint} />
          <Field label="AOI — administrativní štítky" value={m1.aoiUnitsLabel.trim() || "—"} isPrint={isPrint} />
        </div>
      );
    case "4-4.3":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <Field
              label="Poslední míle (km)"
              value={String(s03.dLastMileKm)}
              isPrint={isPrint}
            />
            <Field
              label="DIAD preferovaná / akceptovatelná (min)"
              value={`${s03.diadPrMinutes} / ${s03.diadAkMinutes}`}
              isPrint={isPrint}
            />
            <Field label="T_infr (min)" value={String(s03.tinfrMinutes)} isPrint={isPrint} />
            <Field
              label="Režim isochron (M1)"
              value={
                m1.isochronesMode === "manual_same_as_diad"
                  ? "Stejné jako DIAD"
                  : m1.isochronesMode === "manual_custom"
                    ? "Vlastní poznámka"
                    : "Nepočítáno v aplikaci"
              }
              isPrint={isPrint}
            />
          </div>
          <Field
            label="Poznámka ke spádovému území / isochronám"
            value={m1.isochronesManualNote.trim() || "—"}
            isPrint={isPrint}
          />
        </div>
      );
    case "4-4.4":
      return (
        <div className="space-y-2 text-sm leading-relaxed">
          <p className={isPrint ? "text-black" : "text-muted-foreground"}>
            Spádové území podle doby dojížďky je v aplikaci evidováno textově a režimem isochron; automatický výpočet isochron z GIS není součástí výstupu.
          </p>
          <TechnicalJsonAnnex title="Strukturovaná vrstva M1 (JSON)" data={m1} isPrint={isPrint} />
        </div>
      );

    /* --- Kapitola 5 AS-IS --- */
    case "5-5.1":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <M2LabeledField
              label="Obyvatelstvo"
              nb={m2.demographics.population}
              isPrint={isPrint}
            />
            <Field
              label="Rok referenčních demografických dat"
              value={String(m2.demographics.year)}
              isPrint={isPrint}
            />
            <M2LabeledField label="Věk 0–14 (%)" nb={m2.ageShares.age014} isPrint={isPrint} />
            <M2LabeledField label="Věk 15–64 (%)" nb={m2.ageShares.age1564} isPrint={isPrint} />
            <M2LabeledField label="Věk 65+ (%)" nb={m2.ageShares.age65Plus} isPrint={isPrint} />
          </div>
        </div>
      );
    case "5-5.2":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <M2LabeledField
              label="Míra nezaměstnanosti"
              nb={m2.laborMarket.unemploymentRate}
              isPrint={isPrint}
            />
            <M2LabeledField
              label="Míra zaměstnanosti"
              nb={m2.laborMarket.employmentRate}
              isPrint={isPrint}
            />
            <M2LabeledField label="Průměrná mzda (Kč)" nb={m2.laborMarket.avgWageCzk} isPrint={isPrint} />
            <M2LabeledField
              label="Čistá migrace (obyv./rok)"
              nb={m2.migration.netPerYear}
              isPrint={isPrint}
            />
          </div>
          <TechnicalJsonAnnex
            title="Vstupy zaměstnanosti do modelu (section05 — employment)"
            data={s05.employmentInputsSummary}
            isPrint={isPrint}
          />
        </div>
      );
    case "5-5.3":
      return (
        <div className="space-y-2 text-sm">
          <p className={isPrint ? "text-black" : "text-muted-foreground"}>
            Dostupnost a infrastruktura: metrické vstupy (poslední míle, DIAD, T_infr) jsou uvedeny v podkapitole 4.3; technická infrastruktura (sítě) jako plná tabulka v MVP není.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Poslední míle (km)" value={String(s03.dLastMileKm)} isPrint={isPrint} />
            <Field
              label="DIAD (min)"
              value={`${s03.diadPrMinutes} / ${s03.diadAkMinutes}`}
              isPrint={isPrint}
            />
          </div>
        </div>
      );
    case "5-5.4":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 text-sm sm:grid-cols-2">
            <M2LabeledField
              label="Volné bytové jednotky"
              nb={m2.housing.vacantUnits}
              isPrint={isPrint}
            />
            <M2LabeledField label="Průměrný nájem (Kč)" nb={m2.housing.avgRentCzk} isPrint={isPrint} />
          </div>
          <TechnicalJsonAnnex
            title="Vstupy bydlení do modelu (section05 — housing)"
            data={s05.housingInputsSummary}
            isPrint={isPrint}
          />
        </div>
      );
    case "5-5.5":
      return (
        <div className="space-y-3">
          <M2LabeledField
            label="Obvodní lékaři na 1000 obyv."
            nb={m2.civic.gpPer1000}
            isPrint={isPrint}
          />
          <TechnicalJsonAnnex
            title="Vstupy občanské vybavenosti (section05 — civic)"
            data={s05.civicInputsSummary}
            isPrint={isPrint}
          />
        </div>
      );
    case "5-5.6":
      return (
        <div className="space-y-3">
          <M2LabeledField
            label="Rozpočet obce na obyvatele (Kč)"
            nb={m2.publicFinance.municipalBudgetPerCapitaCzk}
            isPrint={isPrint}
          />
          <Field
            label="Fiskální poznámka (baseline)"
            value={m2.publicFinance.fiscalNote.trim() || "—"}
            isPrint={isPrint}
          />
          <TechnicalJsonAnnex
            title="Efektivní ekonomický baseline (section05 — M6 contract)"
            data={s05.economicInputsSummary}
            isPrint={isPrint}
          />
          <TechnicalJsonAnnex
            title="Kompletní datová vrstva M2 — baseline území (JSON)"
            data={m2}
            isPrint={isPrint}
          />
        </div>
      );
    case "5-5.7":
      return (
        <div className="space-y-2">
          <SubsectionFormalPlaceholder isPrint={isPrint}>
            <p>
              Samostatná strukturovaná část bezpečnosti a životního prostředí v AS-IS není v aplikaci generována.
            </p>
          </SubsectionFormalPlaceholder>
          {m2.trends.notes.trim() ? (
            <Field
              label="Poznámky k trendům / kontextu (M2)"
              value={m2.trends.notes.trim()}
              isPrint={isPrint}
            />
          ) : null}
        </div>
      );

    /* --- Kapitola 6 TO-BE --- */
    case "6-6.1":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              label="Pracovní místa celkem"
              sublabel="přímá i navazující — baseline scénář"
              value={fmt(b.employment.nCelkem, 0)}
              isPrint={isPrint}
            />
            <Kpi
              label="Využití regionální pracovní síly (RZPS)"
              value={fmt(b.employment.rzps)}
              isPrint={isPrint}
            />
            <Kpi
              label="Mezera na trhu práce"
              value={fmt(b.employment.nMezera, 0)}
              isPrint={isPrint}
            />
          </div>
          <ModulePre
            title={reportCs.sections.s06}
            note={reportCs.labels.moduleJsonNote}
            json={b.employment}
            isPrint={isPrint}
            layer="module_results"
          />
        </div>
      );
    case "6-6.2":
      return (
        <div className="space-y-3 text-sm">
          <p className={isPrint ? "text-black" : "text-muted-foreground"}>
            Mobilita a konektivita vstupují do modelu přes parametry území a času (kapitola 4). Samostatný dopravní model není výstupem aplikace.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Poslední míle (km)" value={String(s03.dLastMileKm)} isPrint={isPrint} />
            <Field
              label="DIAD pref. / akcept. (min)"
              value={`${s03.diadPrMinutes} / ${s03.diadAkMinutes}`}
              isPrint={isPrint}
            />
            <Field label="T_infr (min)" value={String(s03.tinfrMinutes)} isPrint={isPrint} />
          </div>
          <p className="text-xs text-muted-foreground">
            Scénářové odchylky vstupů jsou v kapitole 7; zde baseline z průvodce.
          </p>
        </div>
      );
    case "6-6.3":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Kpi
              label="Noví obyvatelé k usazení (OU)"
              sublabel="odhad z bytové potřeby"
              value={fmt(b.housing.ou)}
              isPrint={isPrint}
            />
            <Kpi
              label="Agregovaný deficit kapacity"
              value={fmt(b.housing.aggregateDeficit)}
              isPrint={isPrint}
            />
          </div>
          <ModulePre
            title={reportCs.sections.s07}
            note={reportCs.labels.moduleJsonNote}
            json={b.housing}
            isPrint={isPrint}
            layer="module_results"
          />
        </div>
      );
    case "6-6.4":
      return (
        <ModulePre
          title={reportCs.sections.s08}
          note={reportCs.labels.moduleJsonNote}
          json={b.civic}
          isPrint={isPrint}
          layer="module_results"
        />
      );
    case "6-6.5":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Kpi
              label="Orientační daňový výnos (ročně)"
              sublabel="efektivní kvóta × ΔHDP"
              value={`${fmt(b.economic.taxYield, 0)} Kč`}
              isPrint={isPrint}
            />
            <Kpi
              label="Daňové výnosy — stát / kraj / obec"
              value={`${fmt(b.economic.publicBudgetStat, 0)} / ${fmt(b.economic.publicBudgetKraj, 0)} / ${fmt(b.economic.publicBudgetObec, 0)} Kč`}
              isPrint={isPrint}
            />
            <Kpi
              label="Daň z nemovitostí záměru (ročně)"
              value={`${fmt(b.economic.dznmAnnual, 0)} Kč`}
              isPrint={isPrint}
            />
            <Kpi
              label="Příspěvek obci z RUD (ročně)"
              sublabel="orientační"
              value={`${fmt(b.economic.prudAnnual, 0)} Kč`}
              isPrint={isPrint}
              glossaryTooltip={glossaryCs.RUD}
            />
          </div>
          <ModulePre
            title={`${reportCs.sections.s09} — výňatek (fiskální ukazatele)`}
            note="Plný výstup ekonomického modulu je v JSON; zde stejná jedna pravda jako v průvodci."
            json={{
              taxYield: b.economic.taxYield,
              publicBudgetStat: b.economic.publicBudgetStat,
              publicBudgetKraj: b.economic.publicBudgetKraj,
              publicBudgetObec: b.economic.publicBudgetObec,
              dznmAnnual: b.economic.dznmAnnual,
              prudAnnual: b.economic.prudAnnual,
              cumulativeTaxYield: b.economic.cumulativeTaxYield,
            }}
            isPrint={isPrint}
            layer="module_results"
          />
        </div>
      );
    case "6-6.6":
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Kpi
              label="Spotřeba domácností (ročně)"
              sublabel={householdConsumptionKpiSublabel(
                b.economic.householdConsumptionSource,
                b.economic.deltaHdpSource,
              )}
              value={`${fmt(b.economic.householdConsumptionAnnual, 0)} Kč`}
              isPrint={isPrint}
            />
            <Kpi
              label="Spotřeba v regionu (po retenci)"
              value={`${fmt(b.economic.consumptionRetained, 0)} Kč`}
              isPrint={isPrint}
            />
          </div>
          {b.economic.deltaHdpBreakdown ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Kpi
                label="Příspěvek investiční fáze k ΔHDP (ročně)"
                value={`${fmt(b.economic.deltaHdpBreakdown.investmentPhaseAnnual, 0)} Kč`}
                isPrint={isPrint}
              />
              <Kpi
                label="Příspěvek provozní fáze k ΔHDP (ročně)"
                value={`${fmt(b.economic.deltaHdpBreakdown.operationalPhaseAnnual, 0)} Kč`}
                isPrint={isPrint}
              />
            </div>
          ) : null}
          <ModulePre
            title="Ekonomický modul — plný výstup (JSON)"
            note={reportCs.labels.moduleJsonNote}
            json={b.economic}
            isPrint={isPrint}
            layer="module_results"
          />
        </div>
      );
    case "6-6.7":
      return (
        <div className="space-y-3">
          <p
            className={cn(
              "text-sm leading-relaxed",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Níže souhrnné KPI baseline scénáře — stejná čísla jako v předchozích podkapitolách 6.1–6.6, přehledně na jednom místě pro závěrečné čtení.
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi label="ΔHDP (ročně)" sublabel={deltaHdpKpiSublabel(b.economic.deltaHdpSource)} value={`${fmt(b.economic.deltaHdp, 0)} Kč`} isPrint={isPrint} />
            <Kpi label="Pracovní místa celkem" value={fmt(b.employment.nCelkem, 0)} isPrint={isPrint} />
            <Kpi label="OU (noví obyvatelé)" value={fmt(b.housing.ou)} isPrint={isPrint} />
            <Kpi label="Varování (baseline)" value={String(b.warnings.length)} isPrint={isPrint} />
          </div>
        </div>
      );

    /* --- Kapitola 7 --- */
    case "7-7.1":
      return (
        <Card className={isPrint ? "border-black print:break-inside-avoid" : ""}>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">{studioCs.scenarios.optimistic}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <pre className={cn("whitespace-pre-wrap break-all", isPrint && "print-pre")}>
              {JSON.stringify(snapshot.section04_scenarios.scenarioDeltas.optimistic, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
    case "7-7.2":
      return (
        <Card className={isPrint ? "border-black print:break-inside-avoid" : ""}>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">{studioCs.scenarios.baseline}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <pre className={cn("whitespace-pre-wrap break-all", isPrint && "print-pre")}>
              {JSON.stringify(snapshot.section04_scenarios.scenarioDeltas.baseline, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
    case "7-7.3":
      return (
        <Card className={isPrint ? "border-black print:break-inside-avoid" : ""}>
          <CardHeader className="py-2">
            <CardTitle className="text-sm">{studioCs.scenarios.pessimistic}</CardTitle>
          </CardHeader>
          <CardContent className="text-xs">
            <pre className={cn("whitespace-pre-wrap break-all", isPrint && "print-pre")}>
              {JSON.stringify(snapshot.section04_scenarios.scenarioDeltas.pessimistic, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
    case "7-7.4":
      return (
        <div className="space-y-4">
          <ReportSection
            title={reportCs.sections.s11}
            headingLevel="h3"
            isPrint={isPrint}
            layerBadge={<LayerBadge layer="scenarios" isPrint={isPrint} />}
          >
            <div className="overflow-x-auto print:overflow-visible">
              <ComparisonTable snapshot={snapshot} isPrint={isPrint} />
            </div>
          </ReportSection>
          <ReportSection
            title={reportCs.sections.m7}
            headingLevel="h3"
            isPrint={isPrint}
            layerBadge={<LayerBadge layer="scenarios" isPrint={isPrint} />}
          >
            <M7ConsolidationBlock snapshot={snapshot} isPrint={isPrint} />
          </ReportSection>
          <p className={cn("text-xs", isPrint ? "text-black" : "text-muted-foreground")}>
            Sdílené symboly ve wizardu:{" "}
            <span className="break-all">
              {snapshot.section04_scenarios.sharedAssumptionKeys.join(", ") || "—"}
            </span>
          </p>
        </div>
      );

    /* --- Kapitola 8 --- */
    case "8-8.1":
      return (
        <div className="space-y-4">
          <section className="space-y-2">
            <h4 className={cn("text-sm font-semibold", isPrint && "text-black")}>
              Strukturovaná rizika (sekce 10)
            </h4>
            {snapshot.section10_risks.length ? (
              <ul className="space-y-2">
                {snapshot.section10_risks.map((r) => (
                  <li
                    key={r.id}
                    className={cn(
                      "rounded-md p-3 text-sm",
                      isPrint
                        ? "print-box-risk"
                        : "border border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/30",
                    )}
                  >
                    <Badge variant="outline" className={cn("mr-2", isPrint && "border-black")}>
                      {r.severity}
                    </Badge>
                    <span className="font-medium">{r.titleCs}</span>
                    <p className={cn("mt-1", isPrint ? "text-black" : "text-muted-foreground")}>
                      {r.detailCs}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">Žádná strukturovaná rizika nejsou vygenerována.</p>
            )}
          </section>
          <section className="space-y-2">
            <h4 className={cn("text-sm font-semibold", isPrint && "text-black")}>
              Varování z výpočtu baseline (engine)
            </h4>
            {baselineHasAgencyShareRisk(snapshot) ? (
              <div className={cn(isPrint && "print:break-inside-avoid")}>
                <AgencyShareRiskCallout density="compact" isPrint={isPrint} />
              </div>
            ) : null}
            <ul className="space-y-2 text-sm">
              {[...b.warnings].sort(compareWarningsForDisplay).map((w, i) => (
                <li key={`${w.code}-${i}`} className={cn(isPrint ? "text-black" : "text-foreground")}>
                  <span className="font-medium">{warningTitleLine(w)}</span>{" "}
                  <span className={cn("text-xs", !isPrint && "text-muted-foreground")}>
                    (<code>{w.code}</code>)
                  </span>
                  <span className="block leading-snug">
                    {warningMessageCs(w.code, w.message)}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      );
    case "8-8.2":
      return (
        <SubsectionFormalPlaceholder isPrint={isPrint}>
          <p>
            Časový profil rizik a kvantifikovaná významnost nejsou v generovaném výstupu strukturovány. Doplní analytik v textu studie nebo při rozšíření modelu.
          </p>
        </SubsectionFormalPlaceholder>
      );
    case "8-8.3":
      return (
        <section className="space-y-2">
          <h4 className={cn("text-sm font-semibold", isPrint && "text-black")}>
            {reportCs.sections.s10m}
          </h4>
          {snapshot.section10_mitigations.length ? (
            <ul className="space-y-2">
              {snapshot.section10_mitigations.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "rounded-md border p-3 text-sm",
                    isPrint && "border-black",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{m.titleCs}</span>
                    <Badge
                      variant={m.source === "heuristic" ? "secondary" : "outline"}
                      className={isPrint ? "border-black" : undefined}
                    >
                      {m.source === "heuristic"
                        ? reportCs.labels.mitigationSourceHeuristic
                        : reportCs.labels.mitigationSourceCivic}
                    </Badge>
                  </div>
                  <p className={cn("mt-1", isPrint ? "text-black" : "text-muted-foreground")}>
                    {m.detailCs}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <SubsectionFormalPlaceholder isPrint={isPrint}>
              <p>Nejsou vygenerována mitigační opatření.</p>
            </SubsectionFormalPlaceholder>
          )}
        </section>
      );

    /* --- Kapitola 9 --- */
    case "9-9.1": {
      const { section91 } = splitExecutiveSummaryForOutlineCh9(snapshot.executiveSummaryCs);
      if (!section91.trim()) {
        return (
          <SubsectionFormalPlaceholder isPrint={isPrint}>
            <p>Generované shrnutí zatím neobsahuje text — doplní se po výpočtu nebo v editoru.</p>
          </SubsectionFormalPlaceholder>
        );
      }
      return <ExecutiveBlock text={section91} variant={variant} />;
    }
    case "9-9.2": {
      const { section92 } = splitExecutiveSummaryForOutlineCh9(snapshot.executiveSummaryCs);
      if (!section92.trim()) {
        return (
          <div className="space-y-3 text-sm">
            <SubsectionFormalPlaceholder isPrint={isPrint}>
              <p>
                Samostatný blok pro bod 9.2 (celkové zhodnocení dopadů a přínosů) se v tomto běhu nepodařilo oddělit —
                v textu generovaného shrnutí chybí očekávaný nadpis „Co závisí na předpokladech“. Celý text shrnutí je
                proto uveden v podkapitole 9.1; ve finální studii oddělte body osnovy ručně doplněním struktury.
              </p>
            </SubsectionFormalPlaceholder>
            <p className={cn("text-xs", isPrint ? "text-black" : "text-muted-foreground")}>
              <a className="font-medium text-primary underline" href="#metodika-pod-9-1">
                Přejít na § 9.1
              </a>
            </p>
          </div>
        );
      }
      return (
        <div className="space-y-2">
          <p
            className={cn(
              "text-xs leading-snug",
              isPrint ? "text-black" : "text-muted-foreground",
            )}
          >
            Následující text je vnitřně rozdělen z generovaného shrnutí (stejný zdroj jako 9.1) od nadpisu „Co závisí na předpokladech“
            — jedna pravda datového modelu, formálně oddělené podkapitoly.
          </p>
          <ExecutiveBlock text={section92} variant={variant} />
        </div>
      );
    }
    case "9-9.3":
      return (
        <SubsectionFormalPlaceholder isPrint={isPrint}>
          <p>
            Strukturovaná doporučení pro rozhodnutí zadavatele nejsou oddělena od generovaného shrnutí — doplní zpracovatel finální dokumentace.
          </p>
        </SubsectionFormalPlaceholder>
      );

    /* --- Kapitola 10 --- */
    case "10-10.1":
      return (
        <div className="space-y-3">
          {snapshot.explainability_summary.length ? (
            <ExplainabilitySummaryView
              sections={snapshot.explainability_summary}
              isPrint={isPrint}
              variant="embedded"
            />
          ) : (
            <p className="text-sm text-muted-foreground">Explainability blok není k dispozici.</p>
          )}
          <p className={cn("text-xs", isPrint ? "text-black" : "text-muted-foreground")}>
            Metodické odkazy a slovníček: interní texty aplikace; přesné citace externích metodik doplní zpracovatel studie.
          </p>
        </div>
      );
    case "10-10.2":
      return (
        <div className="space-y-6">
          <TechnicalJsonAnnex title="P1 → M3/M4 most" data={snapshot.p1_m3_m4_bridge} isPrint={isPrint} />
          <TechnicalJsonAnnex title="P1 → M5 most" data={snapshot.p1_m5_bridge} isPrint={isPrint} />
          <TechnicalJsonAnnex title="P1 → M6 most" data={snapshot.p1_m6_bridge} isPrint={isPrint} />
          <TechnicalJsonAnnex title="Shrnutí vstupů AS-IS pro moduly (section05)" data={s05} isPrint={isPrint} />
          <Section12AssumptionsUncertaintyBlock snapshot={snapshot} isPrint={isPrint} />
        </div>
      );
    case "10-10.3":
      return (
        <SubsectionFormalPlaceholder isPrint={isPrint}>
          <p>
            Mapové přílohy (AOI, isochrony) nejsou součástí automatického výstupu. Podklady z GIS doplní zpracovatel mimo tuto aplikaci.
          </p>
        </SubsectionFormalPlaceholder>
      );
    case "10-10.4":
      return (
        <div className="space-y-4">
          <p className={cn("text-sm", isPrint ? "text-black" : "text-muted-foreground")}>
            Hlavní tabulkové a textové srovnání scénářů je uvedeno v{" "}
            <a className="font-medium text-primary underline" href="#metodika-kap-7">
              kapitole 7 (podkapitola 7.4)
            </a>
            {" "}
            — jedna pravda datového modelu, bez duplicitního opakování tabulek zde.
          </p>
          <ReportSection
            title="Auditní stopa výpočtu (technická příloha)"
            headingLevel="h3"
            isPrint={isPrint}
            layerBadge={<LayerBadge layer="assumptions_oq_fallback" isPrint={isPrint} />}
          >
            <p className={cn("text-sm", isPrint ? "text-black" : "text-muted-foreground")}>
              {reportCs.labels.traceNote}
            </p>
            {isPrint ? (
              <pre className="print-pre max-h-[220mm] overflow-hidden rounded-md border border-black bg-white p-3 text-black">
                {formatAuditForPrint(snapshot)}
              </pre>
            ) : (
              <Collapsible open={auditOpen} onOpenChange={setAuditOpen}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium">
                  {auditOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {reportCs.labels.auditTraceToggle}
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <pre className="max-h-96 overflow-auto rounded-md border bg-muted/30 p-3 text-xs">
                    {JSON.stringify(snapshot.section13_audit, null, 2)}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </ReportSection>
          {snapshotUnionHasAgencyShareRisk(snapshot) ? (
            <AgencyShareRiskCallout density="compact" isPrint={isPrint} />
          ) : null}
        </div>
      );

    default:
      return (
        <p className="text-sm text-amber-700">
          Obsah podkapitoly {subsectionId} není v mapovači propojen — zkontrolujte verzi reportu.
        </p>
      );
  }
}

export function MethodologyChapterSubsectionContent({
  chapter,
  snapshot,
  isPrint,
  variant,
  auditOpen,
  setAuditOpen,
}: {
  chapter: number;
  snapshot: MethodologyReportSnapshot;
  isPrint: boolean;
  variant: ReportSnapshotVariant;
  /** Pouze kapitola 10.4 — audit trace collapsible na obrazovce */
  auditOpen: boolean;
  setAuditOpen: (open: boolean) => void;
}) {
  const meta = snapshot.methodology_outline_1_10?.chapters.find((c) => c.chapter === chapter);
  if (!meta?.subsections.length) {
    return (
      <p className="text-sm text-muted-foreground">
        Pro tuto kapitolu chybí metadatová osnova — obsah se zobrazí níže pouze pokud je vložen legacy blokem.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {meta.subsections.map((sub) => (
        <MethodologySubsectionShell key={sub.id} sub={sub} isPrint={isPrint}>
          {renderSubsectionInner(
            chapter,
            sub.id,
            snapshot,
            isPrint,
            variant,
            auditOpen,
            setAuditOpen,
          )}
        </MethodologySubsectionShell>
      ))}
    </div>
  );
}
