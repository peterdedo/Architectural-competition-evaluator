import { useCallback, useState } from 'react';
import { computeDerivedField, floorsTotal, roomsGrandTotal, offerPriceTotal } from '../utils/balanceCalculations.js';
import { callOpenAiChatJson } from '../utils/aiChat.js';

// AI evaluační komentář: FAKTICKÉ shrnutí rozdílů mezi návrhy na základě bilančních dat
// a poroty zvoleného skóre (pokud existuje). Výslovně NENAHRAZUJE posouzení kritérií
// a) kvalita architektonického/urbanistického návrhu a b) provozní řešení – ta jsou dle
// soutěžních podmínek plně v kompetenci poroty a appka je nekvantifikuje.

function summarizeProposal(p, scored) {
  const d = p.data || {};
  const bilance = computeDerivedField('bilance_celkem', d);
  const hpp = floorsTotal(d.hpp);
  const uzitna = floorsTotal(d.uzitna);
  const mistnosti = roomsGrandTotal(d.mistnosti);
  const cena = offerPriceTotal(d.nabidkovaCena);
  const cenaZaM2Hpp = cena !== null && hpp ? Math.round(cena / hpp) : null;

  const lines = [
    `Návrh „${p.nazev}":`,
    `- Bilance ploch celkem: ${bilance ?? '—'} m²`,
    `- HPP celkem: ${hpp ?? '—'} m², užitná plocha celkem: ${uzitna ?? '—'} m², bilance místností celkem: ${mistnosti ?? '—'} m²`,
    `- Nabídková cena celkem: ${cena ?? '—'} Kč${cenaZaM2Hpp ? ` (≈ ${cenaZaM2Hpp} Kč/m² HPP)` : ''}`,
  ];
  if (scored && scored.indicatorScores.length > 0) {
    lines.push(`- Skóre dle porotou zvolených ukazatelů: ${scored.weightedScore?.toFixed(1) ?? '—'} b. (${scored.indicatorScores.length} ukazatelů)`);
    scored.indicatorScores.forEach((s) => {
      lines.push(`  · ${s.nazev}: ${s.value} ${s.jednotka} (normalizováno ${s.normalized.toFixed(0)} %, směr ${s.direction === 'lower' ? 'nižší lepší' : 'vyšší lepší'})`);
    });
  }
  return lines.join('\n');
}

function buildPrompt(scoredProposals) {
  const summaries = scoredProposals.map((p) => summarizeProposal(p, p)).join('\n\n');

  const system = `Jsi asistent poroty architektonické soutěže. Píšeš STRUČNÉ FAKTICKÉ shrnutí rozdílů mezi bilančními daty soutěžních návrhů – ne hodnocení kvality architektury.

PRAVIDLA:
1. Vycházej POUZE z čísel, která dostaneš – nic si nedomýšlej.
2. Nehodnoť kvalitu architektonického/urbanistického návrhu ani provozní řešení – to je dle soutěžních podmínek výhradně v kompetenci poroty a z bilančních čísel to nejde posoudit.
3. Piš česky, věcně, 3–5 krátkých odstavců (jeden souhrnný + jeden až dva k pozoruhodným rozdílům + jeden ke cenové/ekonomické efektivitě, pokud jsou data).
4. Na konci jednou větou připomeň, že jde o podklad, ne hotové hodnocení – rozhodnutí je na porotě.
5. Vrať POUZE JSON: {"komentar": "text komentáře"}`;

  const user = `Zde jsou bilanční data porovnávaných návrhů:\n\n${summaries}\n\nNapiš shrnutí rozdílů.`;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

export const useEvaluationCommentary = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (scoredProposals) => {
    setIsLoading(true);
    setError(null);
    try {
      const messages = buildPrompt(scoredProposals);
      const raw = await callOpenAiChatJson({ messages, maxTokens: 1200, temperature: 0.4 });
      const komentar = typeof raw?.komentar === 'string' ? raw.komentar : '';
      if (!komentar.trim()) {
        throw new Error('Model nevrátil žádný text komentáře.');
      }
      return { success: true, komentar };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Evaluation commentary error:', err);
      setError(message);
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { generate, isLoading, error };
};
