import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import type { CivicInputs } from "@/lib/mhdsi/calculations/civic";
import type { HousingInputs } from "@/lib/mhdsi/calculations/housing";
import { explainabilityFramingCs } from "@/content/explainability-framing-cs";
import type {
  ReportExplainabilityRow,
  ReportExplainabilitySection,
  ReportExplainabilitySummary,
} from "@/features/report/types";
import type { ScenarioKind, WizardState } from "./wizard-types";

const EPS = 1e-5;

function fmt(n: number, maxFrac = 2): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  }).format(n);
}

function housingInputsUsed(
  r: FullCalculationPipelineResult,
): HousingInputs & Record<string, unknown> {
  return r.housing.inputsUsed as HousingInputs & Record<string, unknown>;
}

function civicInputsUsed(
  r: FullCalculationPipelineResult,
): CivicInputs & Record<string, unknown> {
  return r.civic.inputsUsed as CivicInputs & Record<string, unknown>;
}

function ouTraceLines(
  r: FullCalculationPipelineResult,
): string[] {
  const t = r.housing.trace.find((x) => x.id === "DRV-016" || x.id === "DRV-017");
  const v = t?.value;
  if (v && typeof v === "object" && v !== null && "ou" in v) {
    const o = v as Record<string, unknown>;
    const lines: string[] = [];
    if (typeof o.formulaCs === "string") lines.push(String(o.formulaCs));
    if (typeof o.nAgentura === "number") lines.push(`N_agentura v M4: ${fmt(o.nAgentura)}`);
    if (typeof o.nKmen === "number") lines.push(`N_kmen v M4: ${fmt(o.nKmen)}`);
    if (typeof o.kH === "number") lines.push(`KH: ${fmt(o.kH, 3)}`);
    if (typeof o.nRelokace === "number") lines.push(`N_relokace: ${fmt(o.nRelokace)}`);
    if (typeof o.ou === "number") lines.push(`OU (výstup): ${fmt(o.ou, 1)}`);
    if (typeof o.nPendlerNoteCs === "string") lines.push(String(o.nPendlerNoteCs));
    return lines;
  }
  return [`OU (výstup M4): ${fmt(r.housing.result.ou, 1)}`];
}

function deltaHdpLabel(source: string): string {
  switch (source) {
    case "computed_profile":
      return explainabilityFramingCs.deltaHdpComputed;
    case "manual_fallback":
      return explainabilityFramingCs.deltaHdpManualFallback;
    default:
      return explainabilityFramingCs.deltaHdpManualMvp;
  }
}

/**
 * Jedna pravda: strukturovaný lidský přehled pro UI i report snapshot.
 * Žádné nové výpočty — jen čtení inputsUsed / trace / výsledků.
 */
export function buildPipelineExplainabilitySummary(
  state: WizardState,
  scenario: ScenarioKind,
  r: FullCalculationPipelineResult,
): ReportExplainabilitySummary {
  const hi = housingInputsUsed(r);
  const ci = civicInputsUsed(r);
  const scenarioLabel =
    scenario === "baseline"
      ? "střední (baseline)"
      : scenario === "optimistic"
        ? "optimistický"
        : "pesimistický";

  const sections: ReportExplainabilitySection[] = [];

  sections.push({
    id: "terminology",
    titleCs: explainabilityFramingCs.glossaryTitle,
    bulletsCs: [
      explainabilityFramingCs.rawInput,
      explainabilityFramingCs.effectiveInput,
      explainabilityFramingCs.derivedOutput,
      explainabilityFramingCs.bridgeNote,
    ],
  });

  const m4Rows: ReportExplainabilityRow[] = [];
  const pushRow = (
    metric: string,
    w: number,
    e: number,
    whyCs: string | null,
  ) => {
    m4Rows.push({
      metric,
      wizardValueCs: fmt(w),
      engineValueCs: fmt(e),
      whyCs:
        Math.abs(w - e) < EPS
          ? "Shodné s průvodcem."
          : whyCs ??
            "Rozdíl oproti průvodci — detail v technické stopě modulu (export JSON).",
    });
  };

  const linkM3 = Boolean(hi.linkToEmploymentM3);
  pushRow(
    "N_kmen (M4)",
    state.nKmen,
    Number(hi.nKmen),
    Math.abs(state.nKmen - Number(hi.nKmen)) >= EPS
      ? explainabilityFramingCs.whyMigration
      : null,
  );
  pushRow(
    "N_agentura (M4)",
    state.nAgentura,
    Number(hi.nAgentura),
    !linkM3
      ? null
      : Math.abs(state.nAgentura - Number(hi.nAgentura)) >= EPS
        ? explainabilityFramingCs.whyM3toM4
        : "Propojení M3→M4 zapnuto; hodnota odpovídá výstupu M3.",
  );
  pushRow(
    "N_pendler (audit M4)",
    state.nPendler,
    Number(hi.nPendler),
    !linkM3
      ? null
      : Math.abs(state.nPendler - Number(hi.nPendler)) >= EPS
        ? explainabilityFramingCs.whyM3toM4
        : "Propojení M3→M4 — do OU v situaci A N_pendler nepatří; hodnota slouží k párování s M3.",
  );
  pushRow(
    "V_t vacant (M4)",
    state.vTVacant,
    Number(hi.vTVacant),
    Math.abs(state.vTVacant - Number(hi.vTVacant)) >= EPS
      ? explainabilityFramingCs.whyVacant
      : null,
  );

  sections.push({
    id: "m3_m4_inputs",
    titleCs: `Vstupy modulu bydlení (M4) — scénář ${scenarioLabel}`,
    introCs:
      "Sloupce: co je v průvodci vs. co engine použil. Rozdíl znamená most P1 nebo M3→M4.",
    rows: m4Rows,
  });

  sections.push({
    id: "m4_ou",
    titleCs: "Obyvatelé k usazení (OU) — odvození M4",
    bulletsCs: ouTraceLines(r),
  });

  const m5Rows: ReportExplainabilityRow[] = [];
  const ouW = state.ou;
  const ouE = Number(ci.ou);
  const ncW = state.nCelkemM3;
  const ncE = Number(ci.nCelkemM3);
  const p1b = ci.p1Bridge;

  m5Rows.push({
    metric: "OU (M5)",
    wizardValueCs: fmt(ouW),
    engineValueCs: fmt(ouE),
    whyCs:
      p1b?.ouCanonical === "m4_output"
        ? explainabilityFramingCs.whyOuM4
        : "OU převzato z pole průvodce (most M4→M5 vypnutý).",
  });
  m5Rows.push({
    metric: "N_celkem M3 (M5 bezpečnost)",
    wizardValueCs: fmt(ncW),
    engineValueCs: fmt(ncE),
    whyCs:
      p1b?.nCelkemCanonical === "m3_output"
        ? explainabilityFramingCs.whyNCelkemM3
        : "Převzato z pole průvodce (most vypnutý).",
  });

  sections.push({
    id: "m5_civic",
    titleCs: "Občanská vybavenost (M5) — kanonické vstupy",
    rows: m5Rows,
  });

  const econ = r.economic.result;
  sections.push({
    id: "m6_economic",
    titleCs: "Ekonomika (M6) — zdroj hlavních agregátů",
    bulletsCs: [
      deltaHdpLabel(econ.deltaHdpSource),
      `Δ roční HDP (výstup): ${fmt(econ.deltaHdp, 0)} Kč`,
      `Domácnostní spotřeba — zdroj: ${
        econ.householdConsumptionSource === "payroll_proxy"
          ? "odvozeno od mezd (proxy)"
          : "jiný zdroj dle M6"
      }`,
    ],
  });

  return sections;
}
