import { baselineHasAgencyShareRisk } from "./agency-share-risk-snapshot";
import type { MethodologyReportSnapshot } from "./types";

function fmt(n: number, maxFrac = 1): string {
  return new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: maxFrac }).format(
    n,
  );
}

/**
 * Manažerské shrnutí — pouze interpretace čísel ze snapshotu, žádné nové výpočty.
 */
export function buildExecutiveSummaryCs(
  s: MethodologyReportSnapshot,
): string {
  const b = s.primaryKpiAndModules.baseline;
  const wCount = b.warnings.length;
  const oqCount = b.openQuestions.length;
  const comp = s.m7_scenario_consolidation.scenarioMetrics.rows;

  const lines: string[] = [];

  lines.push("### Hlavní závěry");
  lines.push("");
  const dhs = b.economic.deltaHdpSource;
  const deltaNarrative =
    dhs === "computed_profile"
      ? `**odhad změny HDP (ΔHDP) ${fmt(b.economic.deltaHdp, 0)} Kč** z profilu M6 (CAPEX, výstup M3 a konfigurovatelné multiplikátory § 2.4 — detail v auditní stopě a v sekci P1→M6). Jedná se o zjednodušený rámec (bez plného (X−M), bez NPV — OQ-05, OQ-11), nikoli o uzavřený makro výsledek.`
      : dhs === "manual_fallback"
        ? `**odhad změny HDP (ΔHDP) ${fmt(b.economic.deltaHdp, 0)} Kč** z ručního pole průvodce, protože automatický profil M6 nebyl použit nebo byl neplatný (viz varování a stopa M6).`
        : `**odhad změny HDP (ΔHDP) ${fmt(b.economic.deltaHdp, 0)} Kč** z ručního pole průvodce (MVP bridge). Pro odvod z profilu zapněte v průvodci P1 volbu „M6 — profil ΔHDP“.`;
  lines.push(
    `Projekt **${s.metadata.title}** — výpočet metodiky MHDSI (baseline / střední scénář) uvádí celkovou potřebu pracovních míst **${fmt(b.employment.nCelkem, 0)}** a ${deltaNarrative} Další ekonomické ukazatele (včetně θ×ΔHDP) vycházejí z této báze — interpretujte je jako orientační, nikoli jako jisté číslo bez kontextu předpokladů.`,
  );
  lines.push("");
  lines.push("#### Co je v tomto shrnutí potvrzené");
  lines.push(
    `- Hodnoty vycházejí přímo z výpočetního jádra (moduly zaměstnanost, bydlení, občanská vybavenost, ekonomika).`,
  );
  lines.push(
    `- Klíčové ukazatele baseline: RZPS ${fmt(b.employment.rzps)}, obyvatelé k usazení (OU) ${fmt(b.housing.ou)}, daňový výnos (θ×ΔHDP) ${fmt(b.economic.taxYield, 0)} Kč/rok (orientačně).`,
  );
  lines.push("");
  lines.push("#### Co závisí na předpokladech");
  lines.push(
    `- Ekonomické a fiskální ukazatele používají konfigurovatelné symboly (θ, MPC, alokace rozpočtů) — viz sekce předpokladů.`,
  );
  lines.push(
    `- Scénářové rozdíly (optimistický / pesimistický) mění vstupní symboly; interpretujte je jako rozptyl, nikoli jako jistý interval.`,
  );
  lines.push("");
  lines.push("#### Nejistoty a otevřené otázky");
  lines.push(
    `- Počet aktivovaných otevřených otázek metodiky (baseline): **${oqCount}**.`,
  );
  lines.push(
    `- Počet varování z výpočtu (baseline): **${wCount}** — mohou signalizovat substituce, výchozí předpoklady nebo chybějící vstupy.`,
  );
  if (baselineHasAgencyShareRisk(s)) {
    lines.push(
      `- **Rizikový signál (M3):** podíl agenturních pracovníků vůči potřebě PMJ překračuje metodickou hranici (> 5 %) — stejný text je v rozhraní výsledků, v interpretaci reportu a v sekci varování; jde o signál pro rozhodování, nikoli o chybu aplikace.`,
    );
  }
  lines.push("");
  if (comp.length >= 3) {
    const opt = comp.find((r) => r.scenario === "optimistic");
    const pes = comp.find((r) => r.scenario === "pessimistic");
    if (opt && pes) {
      lines.push("#### Scénářová citlivost (stručně)");
      lines.push(
        `- Potřeba PMJ: optimistický ${fmt(opt.employment.nCelkem, 0)} vs. pesimistický ${fmt(pes.employment.nCelkem, 0)}.`,
      );
      const sameDelta =
        opt.economic.deltaHdp === pes.economic.deltaHdp &&
        opt.economic.deltaHdp === b.economic.deltaHdp;
      if (sameDelta) {
        lines.push(
          `- Odhad změny HDP (ΔHDP): **${fmt(opt.economic.deltaHdp, 0)} Kč** u všech tří scénářů v tomto běhu (stejná výsledná hodnota ve sloupci srovnání — typicky při shodných vstupech do M6 nebo ručním MVP bez rozdílu mezi scénáři).`,
        );
      } else {
        lines.push(
          `- Odhad změny HDP (ΔHDP): optimistický ${fmt(opt.economic.deltaHdp, 0)} vs. pesimistický ${fmt(pes.economic.deltaHdp, 0)} Kč (zdroj dle sloupce: ${opt.economic.deltaHdpSource} / ${pes.economic.deltaHdpSource}).`,
        );
      }
      const sameTax =
        opt.economic.taxYield === pes.economic.taxYield &&
        opt.economic.taxYield === b.economic.taxYield;
      if (sameTax) {
        lines.push(
          `- Výnos daní (θ×ΔHDP): stejná hodnota ve všech scénářích (${fmt(b.economic.taxYield, 0)} Kč/rok v tomto běhu).`,
        );
      } else {
        lines.push(
          `- Výnos daní (θ×ΔHDP): optimistický ${fmt(opt.economic.taxYield, 0)} vs. pesimistický ${fmt(pes.economic.taxYield, 0)} Kč/rok.`,
        );
      }
      const sameHhc =
        opt.economic.householdConsumptionAnnual ===
          pes.economic.householdConsumptionAnnual &&
        opt.economic.householdConsumptionAnnual ===
          b.economic.householdConsumptionAnnual;
      if (sameHhc) {
        lines.push(
          `- Proxy spotřeba domácností (C): stejná ve všech scénářích (${fmt(b.economic.householdConsumptionAnnual, 0)} Kč/rok); zdroj výpočtu: ${b.economic.householdConsumptionSource}.`,
        );
      } else {
        lines.push(
          `- Proxy spotřeba domácností (C): optimistický ${fmt(opt.economic.householdConsumptionAnnual, 0)} vs. pesimistický ${fmt(pes.economic.householdConsumptionAnnual, 0)} Kč/rok (zdroj: payroll z M3 vs. škála k ΔHDP — viz stopa M6).`,
        );
      }
    }
  }

  const m7 = s.m7_scenario_consolidation;
  lines.push("");
  lines.push("#### M7 — scénářová konsolidace (bez nových výpočtů)");
  for (const note of m7.sensitivitySummary.notesCs) {
    lines.push(`- ${note}`);
  }
  if (m7.consolidatedRisks.fallbackSignals.length > 0) {
    lines.push(
      `- Signály fallback / bridge v ekonomickém modulu (napříč běhy): **${m7.consolidatedRisks.fallbackSignals.length}** — detail v poli \`m7_scenario_consolidation.consolidatedRisks\` snapshotu / exportu.`,
    );
  }
  lines.push(
    `- Sjednocené kódy varování (unie scénářů): **${m7.consolidatedRisks.warningCodesUnion.length}**; OQ (unie): **${m7.consolidatedRisks.openQuestionsUnion.length}**.`,
  );

  lines.push("");
  lines.push(
    "*Toto shrnutí nenahrazuje metodický text ani právní posouzení; slouží jako řídicí přehled pro další kroky.*",
  );

  return lines.join("\n");
}
