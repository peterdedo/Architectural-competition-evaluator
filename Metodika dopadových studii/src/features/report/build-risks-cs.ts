import type { FullCalculationPipelineResult } from "@/lib/mhdsi/calculations/run-pipeline";
import type { CivicDomain } from "@/lib/mhdsi/calculations/civic";
import type { EngineWarning } from "@/lib/mhdsi/calculations/types";
import type { ScenarioKind } from "@/features/studio/wizard-types";
import { openQuestionLabelCs } from "@/features/studio/open-question-labels";
import { warningMessageCs } from "@/features/studio/warning-messages";
import type { ReportMitigationItem, ReportRiskItem } from "./types";

function categoryFromWarning(w: EngineWarning): ReportRiskItem["category"] {
  const c = w.code.toUpperCase();
  if (c.includes("HOUSING") || c.includes("ZU")) return "housing";
  if (c.includes("CIVIC") || c.includes("MS") || c.includes("ZS"))
    return "civic";
  if (c.includes("ECON") || c.includes("TAX") || c.includes("HDP"))
    return "economic";
  if (c.includes("EMP") || c.includes("WORK") || c.includes("RZPS"))
    return "workforce";
  if (c.includes("MISSING") || c.includes("ASSUMPTION")) return "data_quality";
  return "methodology";
}

function severityFromWarning(w: EngineWarning): ReportRiskItem["severity"] {
  if (w.code === "MISSING_INPUT") return "high";
  if (w.code === "ASSUMPTION_FALLBACK") return "medium";
  return "low";
}

const DOMAIN_CS: Record<CivicDomain, string> = {
  kindergarten: "mateřské školy",
  elementary: "základní školy",
  healthcare: "zdravotnictví",
  leisure: "volný čas",
  safety: "bezpečnost",
};

let riskSeq = 0;
let mitSeq = 0;

function nextRiskId() {
  riskSeq += 1;
  return `R-${riskSeq}`;
}

function nextMitId() {
  mitSeq += 1;
  return `M-${mitSeq}`;
}

/**
 * Sestaví rizika z varování a OQ (baseline scénář).
 * Nepřidává nové výpočty — jen strukturuje existující engine výstupy.
 */
export function buildRisksFromBaseline(
  baseline: FullCalculationPipelineResult | null,
): ReportRiskItem[] {
  riskSeq = 0;
  if (!baseline) return [];

  const items: ReportRiskItem[] = [];
  baseline.allWarnings.forEach((w) => {
    items.push({
      id: nextRiskId(),
      category: categoryFromWarning(w),
      severity: severityFromWarning(w),
      titleCs: `${w.code}: ${warningMessageCs(w.code, w.message).slice(0, 120)}`,
      detailCs: warningMessageCs(w.code, w.message),
      source: "warning",
      ref: w.field,
    });
  });

  baseline.allOpenQuestions.forEach((oq) => {
    items.push({
      id: nextRiskId(),
      category: "methodology",
      severity: "medium",
      titleCs: `Otevřená otázka: ${oq}`,
      detailCs: openQuestionLabelCs(oq),
      source: "open_question",
      ref: oq,
    });
  });

  return items;
}

/**
 * Mitigace z civic výsledku (engine už vrací český suggestion).
 */
export function buildMitigationsFromCivic(
  baseline: FullCalculationPipelineResult | null,
): ReportMitigationItem[] {
  mitSeq = 0;
  if (!baseline) return [];
  const list = baseline.civic.result.mitigations;
  return list.map((m) => ({
    id: nextMitId(),
    relatedRiskId: undefined,
    titleCs: `Občanská vybavenost — ${DOMAIN_CS[m.domain]}`,
    detailCs: m.suggestion,
    source: "civic_engine" as const,
  }));
}

let heuristicSeq = 0;

/** Doplňkové heuristické mitigace podle počtu varování (bez nových čísel). ID prefix `H-` aby se nepletly s `M-` z civic. */
export function buildHeuristicMitigations(
  scenarioWarnings: Record<ScenarioKind, number>,
): ReportMitigationItem[] {
  heuristicSeq = 0;
  const out: ReportMitigationItem[] = [];
  if (scenarioWarnings.pessimistic > scenarioWarnings.optimistic + 2) {
    heuristicSeq += 1;
    out.push({
      id: `H-${heuristicSeq}`,
      titleCs: "Scénářová nejistota",
      detailCs:
        "Pesimistický scénář generuje více varování než optimistický — doporučujeme ověřit vstupy a předpoklady před rozhodnutím.",
      source: "heuristic",
    });
  }
  return out;
}
