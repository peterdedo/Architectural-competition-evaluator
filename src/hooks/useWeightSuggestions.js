import { useCallback, useState } from 'react';
import { SCORING_INDICATORS } from '../data/scoringIndicators.js';
import { callOpenAiChatJson } from '../utils/aiChat.js';

// AI návrh směru a váhy pro bilanční ukazatele. Vrací pouze NÁVRH – nikdy sám nic
// nezapisuje do skutečného nastavení hodnocení. Porota návrhy vidí, může vybrat, které
// přijme, a teprve poté se propíšou do ScoringSettingsPanel (viz handleApply v komponentě).

function buildPrompt(proposals) {
  const indicatorLines = SCORING_INDICATORS.map((ind) => {
    const values = proposals
      .map((p) => ind.getValue(p.data || {}))
      .filter((v) => v !== null && Number.isFinite(v));
    const range = values.length > 0 ? `pozorované hodnoty napříč návrhy: ${values.join(', ')} ${ind.jednotka}` : 'zatím bez dat';
    return `- id: "${ind.id}", název: "${ind.nazev}" (sekce ${ind.sectionCode}), jednotka: ${ind.jednotka}, ${range}`;
  }).join('\n');

  const system = `Jsi zkušený architekt a člen poroty architektonické soutěže. Dostaneš seznam bilančních ukazatelů návrhů (plochy, objemy, obálka budovy, prosklení) a máš NAVRHNOUT, u kterých z nich dává smysl hodnotit směr (vyšší/nižší je lepší) a jakou orientační váhu by mohly mít v porovnání návrhů.

DŮLEŽITÉ:
- Toto je jen návrh pro porotu – porota má vždy poslední slovo a může cokoli změnit nebo odmítnout.
- U ukazatelů, kde směr skutečně závisí na konkrétním záměru/zadání (např. celková HPP, počet místností) a nedá se objektivně říct "víc je vždy lépe", navrhni direction: null a v důvodu napiš proč (appka takový ukazatel nezapočítá do skóre, dokud si směr nezvolí porota sama).
- Váha je orientační číslo 1–100, relativní k ostatním ukazatelům, ne absolutní pravda.
- Důvod piš stručně, jednou větou, česky.

Vrať POUZE JSON ve tvaru:
{
  "id_ukazatele": {"direction": "higher" | "lower" | null, "weight": číslo_1_az_100, "duvod": "krátké zdůvodnění"},
  ...
}
Zahrň všechny tyto ukazatele:
${indicatorLines}`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: 'Navrhni směr a váhu pro všechny uvedené ukazatele.' },
  ];
}

export const useWeightSuggestions = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const suggest = useCallback(async (proposals) => {
    setIsLoading(true);
    setError(null);
    try {
      const messages = buildPrompt(proposals);
      const raw = await callOpenAiChatJson({ messages, maxTokens: 3000, temperature: 0.3 });

      const suggestions = {};
      SCORING_INDICATORS.forEach((ind) => {
        const entry = raw?.[ind.id];
        if (!entry) return;
        const direction = entry.direction === 'higher' || entry.direction === 'lower' ? entry.direction : null;
        const weightNum = Number(entry.weight);
        suggestions[ind.id] = {
          direction,
          weight: Number.isFinite(weightNum) ? Math.min(100, Math.max(1, Math.round(weightNum))) : 10,
          duvod: entry.duvod ? String(entry.duvod) : '',
        };
      });

      return { success: true, suggestions };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Weight suggestion error:', err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { suggest, isLoading, error };
};
