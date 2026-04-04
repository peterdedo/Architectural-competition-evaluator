import { agencyShareRiskCs } from "@/content/agency-share-risk-cs";
import { WARNING_CODE_AGENCY_SHARE_RISK } from "@/lib/mhdsi/calculations/employment";
import type { EngineWarning } from "@/lib/mhdsi/calculations/types";
import { resolveWarningFieldNavigation } from "../warning-field-navigation";
import type { ScenarioKind } from "../wizard-types";

export type WarningSeverity = "high" | "medium" | "low";

export function warningSeverity(code: string): WarningSeverity {
  if (code === "MISSING_INPUT") return "high";
  if (code === WARNING_CODE_AGENCY_SHARE_RISK) return "high";
  if (code === "ASSUMPTION_FALLBACK") return "medium";
  if (code.startsWith("SUBSTITUTION")) return "low";
  return "medium";
}

const severityLabel: Record<WarningSeverity, string> = {
  high: "Vysoká",
  medium: "Střední",
  low: "Nízká",
};

export function warningSeverityLabel(s: WarningSeverity): string {
  return severityLabel[s];
}

/** Krátký dopad pro kartu — bez nových výpočtů, jen interpretace kódu. */
export function warningImpactHint(code: string): string {
  switch (code) {
    case "MISSING_INPUT":
      return "Může zkreslit výsledky modulu, kterého se pole týká.";
    case WARNING_CODE_AGENCY_SHARE_RISK:
      return "Zvyšuje personální a integrační nejistotu; oslabuje důvěryhodnost dlouhodobých odhadů dopadů v území.";
    case "ASSUMPTION_FALLBACK":
      return "Použit výchozí číselný předpoklad — ověřte vůči studii.";
    case "SUBSTITUTION_BASE":
      return "Citlivost na mzdu v regionu — výsledek je podmíněný vstupy.";
    case "SUBSTITUTION_COMPETITION":
      return "Citlivost na trh práce — výsledek je podmíněný vstupy.";
    default:
      return "Ověřte souvislosti v návazných vstupech a v reportu.";
  }
}

export function warningTitleLine(w: EngineWarning): string {
  if (w.code === WARNING_CODE_AGENCY_SHARE_RISK) {
    return agencyShareRiskCs.title;
  }
  return w.message?.trim() || w.code;
}

/** Krátká doporučená akce — bez nových výpočtů, jen UX navigace. */
export function warningRecommendedAction(
  canNavigateToField: boolean,
  code?: string,
): string {
  if (code === WARNING_CODE_AGENCY_SHARE_RISK) {
    return canNavigateToField
      ? "Upravit scénář zaměstnanosti (krok Scénáře — např. podíl dojíždějících nebo využitelnost RZPS) a znovu přepočítat výsledky."
      : agencyShareRiskCs.recommendation;
  }
  if (canNavigateToField) {
    return "Upravit související vstup v průvodci (tlačítko níže).";
  }
  return "Ověřit předpoklady v reportu nebo doplnit související vstupy podle popisu varování.";
}

/** Řazení: rozhodovací signály před obecnými upozorněními. */
export function compareWarningsForDisplay(
  a: EngineWarning,
  b: EngineWarning,
): number {
  const rank = (c: string) => {
    if (c === WARNING_CODE_AGENCY_SHARE_RISK) return 0;
    if (c === "MISSING_INPUT") return 1;
    return 2;
  };
  const d = rank(a.code) - rank(b.code);
  if (d !== 0) return d;
  return a.code.localeCompare(b.code);
}

/** Heuristika „nejisté oblasti“ z kroků navigace varování (baseline). */
export function inferUncertainAreaLabel(
  warnings: EngineWarning[],
): string | null {
  const modules = new Set<string>();
  for (const w of warnings) {
    if (!w.field) continue;
    const nav = resolveWarningFieldNavigation(w.field, "baseline");
    if (!nav) continue;
    const s = nav.step;
    if (s === 4) modules.add("Zaměstnanost");
    else if (s === 5) modules.add("Bydlení");
    else if (s === 6) modules.add("Občanská vybavenost");
    else if (s === 7) modules.add("Ekonomika");
    else if (s === 3) modules.add("Scénáře");
    else if (s <= 2) modules.add("Záměr / území");
  }
  if (modules.size === 0) return null;
  return [...modules].join(", ");
}
