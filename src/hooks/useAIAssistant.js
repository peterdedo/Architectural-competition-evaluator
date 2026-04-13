import { useState, useCallback } from 'react';
import { openAiProxyUrl, postOpenAiChatCompletions } from '../utils/openaiProxy';

const API_UNAVAILABLE_MSG =
  'AI analýza není momentálně dostupná. Zkontrolujte připojení nebo konfiguraci API.';
const EMPTY_OUTPUT_MSG = 'AI nevrátila žádný výstup.';
const isDev = import.meta.env.DEV;

/** AI volania idú cez backend proxy (/api/openai/chat), nie priamo z klienta. */
const useAIAssistant = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const sanitizeProposalName = (name) =>
    String(name || 'Neznámý návrh')
      .replace(/[^\p{L}\p{N}\s._\-()/]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  const sanitizeAiReportText = (input) => {
    if (!input) return '';

    let text = String(input);

    // Odstránenie markdown/code fence vrátane ```html
    text = text.replace(/```[\w]*\s*[\s\S]*?```/g, '');

    // Odstráni HTML a meta komentáre o HTML výstupe
    text = text
      .replace(/<!doctype[\s\S]*?>/gi, '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/Tento HTML kód[^\n]*/gi, '')
      .replace(/formátuj[^\n]*HTML[^\n]*/gi, '');

    text = text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return text;
  };

  const ensureReportSections = (text) => {
    const required = [
      '# Shrnutí',
      '# Srovnání návrhů',
      '# Silné stránky',
      '# Slabé stránky',
      '# Doporučení pro výběr varianty',
      '# Limity dat',
    ];

    const missing = required.filter((section) => !text.includes(section));
    if (missing.length === 0) return text;

    return `${required.join('\n\n')}\n\n${text}`.trim();
  };

  const buildScoreConsistencyNote = (proposals) => {
    if (!proposals || proposals.length === 0) return '';
    const scores = proposals.map((p) => Number(p.totalScore ?? p.weightedScore ?? 0));
    const allEqual = scores.every((score) => score === scores[0]);
    if (!allEqual) return '';

    if (scores[0] === 0) {
      return proposals.length === 2
        ? 'Oba návrhy dosáhly stejného výsledku podle aktuálního bodového hodnocení.'
        : 'Všechny návrhy dosáhly stejného výsledku podle aktuálního bodového hodnocení.';
    }
    return 'Na základě aktuálních dat nelze určit jednoznačně lepší návrh.';
  };

  const buildComparisonDataPayload = (data, proposalsWithScores, context) => {
    const vahy = data.vahy || {};
    return {
      kontext: context || 'Obecná urbanistická soutěž',
      vahyIndikatoru: vahy,
      vahyKategorii: data.categoryWeights || {},
      kriteria: (data.indikatory || []).map((i) => ({
        id: i.id,
        nazev: i.nazev,
        vaha: vahy[i.id] ?? i.vaha ?? 10,
        kategorie: i.kategorie,
        typ: i.typ
      })),
      navrhy: proposalsWithScores.map((p) => ({
        nazev: sanitizeProposalName(p.nazev || p.name),
        celkoveSkore: Number(p.totalScore ?? p.weightedScore ?? 0),
        dokoncenost: p.completionRate,
        vyplneneIndikatory: p.filledIndicators,
        celkemIndikatoru: p.totalIndicators,
        kategorieSkore: p.categoryScores || {},
        indikatoroveSkore: p.indicatorScores || {},
        data: p.data || {}
      }))
    };
  };

  const parseJsonSafely = (text) => {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  };

  const buildReadableError = (status, rawBody) => {
    const parsed = parseJsonSafely(rawBody);
    const errorMessage =
      parsed?.error?.message ||
      parsed?.error ||
      parsed?.message ||
      (rawBody ? String(rawBody).slice(0, 300) : '');
    const detailsMessage =
      parsed?.error?.details?.hint ||
      parsed?.details ||
      parsed?.error?.code ||
      '';

    const combined = [errorMessage, detailsMessage].filter(Boolean).join(' ');
    if (!combined) {
      return `${API_UNAVAILABLE_MSG} (HTTP ${status})`;
    }
    return `${combined} (HTTP ${status})`;
  };

  // Analýza porovnání návrhů
  const analyzeComparison = useCallback(async (data, context = '') => {
    setIsAnalyzing(true);

    try {
      const proposalsWithScores =
        data.navrhy?.map((navrh) => {
          const scores = navrh.scores || {};
          const totalFromScores = scores.total;
          const totalScore = Number(
            totalFromScores != null && totalFromScores !== ''
              ? totalFromScores
              : navrh.weightedScore ?? navrh.totalScore ?? 0
          );
          return {
            ...navrh,
            totalScore,
            categoryScores: scores.categories || {},
            indicatorScores: scores.indicators || {}
          };
        }) || [];

      const dataJson = JSON.stringify(
        buildComparisonDataPayload(data, proposalsWithScores, context),
        null,
        2
      );

      const prompt = `Analyzuj následující architektonické návrhy pouze na základě dostupných dat.

Pravidla:
- nevymýšlej vlastnosti, které nejsou v datech,
- pokud data chybí, explicitně to uveď,
- pokud mají návrhy stejné skóre, neurčuj vítěze,
- používej pouze češtinu,
- nevrať HTML, XML ani komentáře k formátu,
- nepoužívej markdown code fences (žádné \`\`\`),
- nepoužívej emoji,
- nevymýšlej kvalitativní urbanistické soudy bez podpory v číselných indikátorech.
- nepopisuj jen rozdíly v číslech; interpretuj jejich význam pro rozhodnutí.
- používej formulace typu „výhodou návrhu je…“ a „slabinou návrhu je…“.
- vždy vysvětli dopad tvrzení (např. na kvalitu života, udržitelnost, ekonomiku), jen pokud je podložen daty.
- pokud jsou data nejednoznačná nebo chybí, explicitně to napiš.
- v sekci „Srovnání návrhů“ vypiš pouze 5 až 7 nejrelevantnějších rozdílů s nejvyšším dopadem na rozhodnutí.
- neuváděj dlouhé mechanické seznamy indikátorů s minimálním významem.

Struktura výstupu (použij přesně tyto nadpisy):
# Shrnutí
# Srovnání návrhů
# Silné stránky
# Slabé stránky
# Doporučení pro výběr varianty
# Limity dat

Obsahové požadavky:
- V sekci „Srovnání návrhů“ popisuj pouze rozdíly podložené čísly z dat.
- V sekci „Silné stránky“ použij formát:
  ## Návrh A
  - ...
  ## Návrh B
  - ...
  (pro všechny dostupné návrhy analogicky)
- V sekci „Slabé stránky“ použij stejný formát po návrzích a upozorni na rizika/nevýhody.
- V sekci „Doporučení pro výběr varianty“ uveď trade-offy a podmíněná doporučení:
  - Pokud je prioritou X → doporučen návrh ...
  - Pokud je prioritou Y → doporučen návrh ...
  - Nakonec přidej krátké finální shrnutí: „Celkově je vhodnější návrh X, protože…“
- Nikdy nevybírej návrh bez zdůvodnění daty.
- Pokud jsou návrhy vyrovnané, řekni to explicitně.

Data:
${dataJson}`;

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        max_tokens: 2000,
        top_p: 0.9,
        frequency_penalty: 0.1
      });

      if (isDev) {
        console.info('[AI] analyzeComparison request', {
          endpoint: openAiProxyUrl('/api/openai/chat'),
          proposals: proposalsWithScores.length,
          indicators: data.indikatory?.length || 0,
        });
      }

      if (!response.ok) {
        const rawErrorBody = await response.text();
        const readableError = buildReadableError(response.status, rawErrorBody);
        if (isDev) {
          console.error('[AI] analyzeComparison HTTP error', {
            endpoint: openAiProxyUrl('/api/openai/chat'),
            status: response.status,
            body: rawErrorBody?.slice(0, 1000),
            hasApiBaseUrl: Boolean(import.meta.env.VITE_API_BASE_URL),
          });
        }
        return { success: false, error: readableError };
      }

      const rawSuccessBody = await response.text();
      const result = parseJsonSafely(rawSuccessBody);
      if (!result) {
        if (isDev) {
          console.error('[AI] analyzeComparison invalid JSON response', {
            endpoint: openAiProxyUrl('/api/openai/chat'),
            body: rawSuccessBody?.slice(0, 1000),
          });
        }
        return {
          success: false,
          error: 'Backend vrátil neplatnou odpověď (očekáván JSON).',
        };
      }
      const raw = result.choices?.[0]?.message?.content || '';
      const consistencyNote = buildScoreConsistencyNote(proposalsWithScores);
      let analysisText = sanitizeAiReportText(raw);
      if (!analysisText.trim()) {
        analysisText = EMPTY_OUTPUT_MSG;
      } else {
        analysisText = ensureReportSections(analysisText);
        if (consistencyNote && !analysisText.includes(consistencyNote)) {
          analysisText = `${analysisText.trim()}\n\n${consistencyNote}`;
        }
      }

      setLastAnalysis(analysisText);

      return {
        success: true,
        analysis: analysisText
      };
    } catch (error) {
      if (isDev) {
        console.error('[AI] analyzeComparison network/runtime error', {
          endpoint: openAiProxyUrl('/api/openai/chat'),
          error: error instanceof Error ? error.message : String(error),
          hasApiBaseUrl: Boolean(import.meta.env.VITE_API_BASE_URL),
        });
      } else {
        console.error('AI Analysis Error:', error);
      }
      return {
        success: false,
        error: API_UNAVAILABLE_MSG
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Návrh vah pro kategorie
  const suggestCategoryWeights = useCallback(async (categories, context) => {
    setIsAnalyzing(true);

    try {
      const prompt = `
You are an expert urban planner evaluating design competitions. Based on the context "${context}", suggest appropriate category weights (must sum to 100%) for the following categories.

Categories:
${categories?.map(c => `- ${c.nazev} (Current Weight: ${c.currentWeight || 33}%)`).join('\n')}

Consider:
- Urban planning priorities for this type of project
- Local development goals
- Sustainability requirements
- Community needs

Return your response as a JSON object with this structure:
{
  "categoryWeights": {
    "category_id": {
      "weight": 40,
      "reason": "Brief explanation for this weight"
    }
  },
  "totalWeight": 100,
  "reasoning": "Overall explanation for the weight distribution"
}

Only return valid JSON, no additional text.
      `;

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 600
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const responseText = result.choices[0]?.message?.content || '{}';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        success: true,
        suggestions: suggestions
      };
    } catch (error) {
      console.error('AI Suggest Category Weights Error:', error);
      return {
        success: false,
        error: error.message || 'Chyba při návrhu vah kategorií',
        suggestions: {}
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Návrh vah pro indikátory
  const suggestWeights = useCallback(async (criteria, context) => {
    setIsAnalyzing(true);

    try {
      const prompt = `
You are an expert evaluator for urban design competitions. Based on the context "${context}", suggest appropriate weights (0-50) for the following indicators.

Current Indicators:
${criteria?.map(c => `- ${c.nazev} (Category: ${c.kategorie}, Current Weight: ${c.vaha || 10})`).join('\n')}

Return your response as a JSON object with this structure:
{
  "indicators": {
    "indicator_id": {
      "weight": 25,
      "reason": "Brief explanation for this weight"
    }
  },
  "reasoning": "Overall explanation for the weight distribution"
}

Only return valid JSON, no additional text.
      `;

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 800
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const responseText = result.choices[0]?.message?.content || '{}';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      return {
        success: true,
        suggestions: suggestions
      };
    } catch (error) {
      console.error('AI Suggest Weights Error:', error);
      return {
        success: false,
        error: error.message || 'Chyba při návrhu vah',
        suggestions: {}
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  // Generování komentářů s kontextem (volitelné; stejná sanitizace jako hlavní report)
  const generateComments = useCallback(async (proposals, indicators, weights, context = '') => {
    setIsAnalyzing(true);

    try {
      const proposalsWithScores =
        proposals?.map((p) => ({
          ...p,
          totalScore: p.weightedScore || 0,
          completionRate: p.completionRate || 0,
          filledIndicators: p.filledIndicators || 0,
          totalIndicators: p.totalIndicators || 0
        })) || [];

      const prompt = `
Piš pouze česky. Vycházej výhradně z dostupných dat.
Nevracej HTML ani komentáře o HTML.
Nepoužívej emoji.
Nevytvářej kvalitativní soudy bez explicitních indikátorů.

Povinný formát:
# Shrnutí
# Srovnání návrhů
# Limity dat
# Doporučení

Pravidla:
- pokud jsou skóre shodná, nevol vítěze a napiš: "Na základě aktuálních dat nelze určit jednoznačně lepší návrh."
- pokud chybí data pro oblast, napiš explicitně, že ji nelze spolehlivě vyhodnotit.
- používej pouze metriky z podkladů níže.

KONTEXT: ${context || 'Obecná urbanistická soutěž'}

NÁVRHY:
${proposalsWithScores
  .map(
    (p, index) => `
${index + 1}. ${sanitizeProposalName(p.nazev || p.name)}
- Celkové skóre: ${Number(p.totalScore || 0)} %
- Kompletnost: ${Number(p.completionRate || 0)} %
- Vyplněné indikátory: ${Number(p.filledIndicators || 0)}/${Number(p.totalIndicators || 0)}
- Vstupní data: ${JSON.stringify(p.data || {})}
`
  )
  .join('\n')}

KRITÉRIA A VÁHY:
${indicators?.map((i) => `- ${i.nazev}: váha ${weights?.[i.id] ?? i.vaha ?? 10}, kategorie ${i.kategorie || 'N/A'}, typ ${i.typ || 'N/A'}`).join('\n')}
      `;

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 3000,
        top_p: 0.9,
        frequency_penalty: 0.15
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const consistencyNote = buildScoreConsistencyNote(proposalsWithScores);
      let commentsText = sanitizeAiReportText(result.choices[0]?.message?.content || '');
      if (!commentsText.trim()) {
        commentsText = EMPTY_OUTPUT_MSG;
      } else {
        commentsText = ensureReportSections(commentsText);
        if (consistencyNote && !commentsText.includes(consistencyNote)) {
          commentsText = `${commentsText.trim()}\n\n${consistencyNote}`;
        }
      }

      return {
        success: true,
        comments: commentsText
      };
    } catch (error) {
      console.error('AI Comments Error:', error);
      return {
        success: false,
        error: error.message || 'Chyba při generování komentářů'
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return {
    isAnalyzing,
    lastAnalysis,
    analyzeComparison,
    suggestWeights,
    suggestCategoryWeights,
    generateComments
  };
};

export default useAIAssistant;
