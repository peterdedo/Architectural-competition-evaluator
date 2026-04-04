import { baselineHasAgencyShareRisk } from "@/features/report/agency-share-risk-snapshot";
import type { MethodologyReportSnapshot } from "@/features/report/types";
import {
  resolveTrustFraming,
  TRUST_DECISION_NEUTRAL,
  type TrustDecisionBullets,
  type TrustLevel,
} from "@/content/trust-framing-cs";

function fmt(n: number, maxFrac = 0): string {
  return new Intl.NumberFormat("cs-CZ", {
    maximumFractionDigits: maxFrac,
  }).format(n);
}

function fmtCzk(n: number): string {
  if (Math.abs(n) >= 1_000_000_000) {
    return `${fmt(n / 1_000_000_000, 1)} mld. Kč`;
  }
  if (Math.abs(n) >= 1_000_000) {
    return `${fmt(n / 1_000_000, 1)} mil. Kč`;
  }
  return `${fmt(n)} Kč`;
}

export type ConfidenceLevel = TrustLevel;

export type DecisionScreenCopy = {
  /** Jedna věta — číselný souhrn středního scénáře */
  conclusion: string;
  headline: string;
  nextSteps: string[];
  confidenceLevel: ConfidenceLevel;
  confidenceSummary: string;
  confidenceDetail: string;
  decisionFraming: string;
  decisionBullets: TrustDecisionBullets;
};

export function buildDecisionScreenCopy(
  s: MethodologyReportSnapshot,
): DecisionScreenCopy {
  const b = s.primaryKpiAndModules.baseline;
  const wCount = b.warnings.length;
  const oqCount = b.openQuestions.length;
  const varyingKeys =
    s.m7_scenario_consolidation.sensitivitySummary.varyingAssumptionKeys
      .length;

  const trust = resolveTrustFraming(wCount, oqCount, varyingKeys);

  const nMist = fmt(b.employment.nCelkem, 0);
  const deltaHdpStr = fmtCzk(b.economic.deltaHdp);
  const taxStr = fmtCzk(b.economic.taxYield);
  const title = s.metadata.title;

  const headline = `${nMist} pracovních míst · odhad změny HDP ${deltaHdpStr} · ${
    oqCount > 0 ? `${oqCount} otevřených otázek` : "bez otevřených otázek"
  }`;

  const deltaHdpNote =
    b.economic.deltaHdpSource === "manual_mvp"
      ? " (HDP z průvodce; lze zapnout automatický odhad v části ekonomika)"
      : b.economic.deltaHdpSource === "manual_fallback"
        ? " (záložní hodnota z průvodce)"
        : "";

  const conclusion =
    `Střední scénář pro „${title}“: ${nMist} pracovních míst, ` +
    `odhad změny HDP ${deltaHdpStr}${deltaHdpNote}, orientační daňové dopady ${taxStr} ročně.`;

  const nextSteps: string[] = [];

  if (baselineHasAgencyShareRisk(s)) {
    nextSteps.push(
      "Vyhodnotit rizikový signál vysokého podílu agenturních pracovníků (shrnutí pod rozhodovacím blokem) — upravit scénář zaměstnanosti v kroku Scénáře a přepočítat, případně doplnit zmírňující opatření do podkladů pro jednání.",
    );
  }

  nextSteps.push("Otevřít report (horní lišta) — tisk, export i stejná logika jistoty.");

  if (trust.level === "sensitive" || trust.level === "uncertain") {
    nextSteps.push(
      "Projít předpoklady a upozornění níže a ověřit je vůči vlastním datům.",
    );
  }

  if (varyingKeys > 1) {
    nextSteps.push("Porovnat všechny tři scénáře v tabulce pod tímto blokem.");
  }

  if (wCount > 0 && trust.level === "moderate") {
    nextSteps.push(`Přečíst ${wCount} upozornění — každé navrhuje nápravu.`);
  }

  if (oqCount > 0 && trust.level !== "uncertain") {
    nextSteps.push("Neignorovat otevřené otázky — snižují jistotu interpretace.");
  }

  if (trust.level === "stable") {
    nextSteps.push("Uložit nebo vytisknout výstup pro jednání.");
  }

  return {
    conclusion,
    headline,
    nextSteps,
    confidenceLevel: trust.level,
    confidenceSummary: trust.summary,
    confidenceDetail: trust.detail,
    decisionFraming: TRUST_DECISION_NEUTRAL,
    decisionBullets: trust.decisionBullets,
  };
}
