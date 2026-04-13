import { useState, useCallback } from 'react';
import { postOpenAiChatCompletions } from '../utils/openaiProxy';

/** AI volania idú cez backend proxy (/api/openai/chat), nie priamo z klienta. */
const useAIAssistant = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  const sanitizeProposalName = (name) =>
    String(name || 'Neznámý návrh')
      .replace(/[^\p{L}\p{N}\s._\-()/]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();

  const sanitizeAiReportText = (input) => {
    if (!input) return '';

    let text = String(input);

    // Odstráni HTML a meta komentáre o HTML výstupe
    text = text
      .replace(/<!doctype[\s\S]*?>/gi, '')
      .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/Tento HTML kód[^\n]*/gi, '')
      .replace(/formátuj[^\n]*HTML[^\n]*/gi, '');

    // Základná normalizácia medzier a riadkov
    text = text
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    return text;
  };

  const ensureReportSections = (text) => {
    const required = [
      '# Shrnutí soutěže',
      '# Přehled návrhů',
      '# Srovnání návrhů',
      '# Limity hodnocení',
      '# Doporučení'
    ];

    const missing = required.filter((section) => !text.includes(section));
    if (missing.length === 0) return text;

    return `${required.join('\n\n')}\n\n${text}`.trim();
  };

  const buildScoreConsistencyNote = (proposals) => {
    if (!proposals || proposals.length === 0) return '';
    const scores = proposals.map((p) => Number(p.totalScore || 0));
    const allEqual = scores.every((score) => score === scores[0]);
    if (!allEqual) return '';

    if (scores[0] === 0) {
      return proposals.length === 2
        ? 'Oba návrhy dosáhly stejného výsledku podle aktuálního bodového hodnocení.'
        : 'Všechny návrhy dosáhly stejného výsledku podle aktuálního bodového hodnocení.';
    }
    return 'Na základě aktuálních dat nelze určit jednoznačně lepší návrh.';
  };

  // Analýza porovnání návrhů
  const analyzeComparison = useCallback(async (data, context = '') => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Získanie výsledkov skóre z WizardContext
      const proposalsWithScores = data.navrhy?.map(navrh => {
        const scores = navrh.scores || {};
        return {
          ...navrh,
          totalScore: scores.total || 0,
          categoryScores: scores.categories || {},
          indicatorScores: scores.indicators || {}
        };
      }) || [];

      const prompt = `
Piš pouze česky. Vycházej výhradně z dat uvedených níže.
Nevymýšlej kvalitativní závěry bez datové opory.
Nevracej HTML, XML ani komentáře o formátu.
Nepoužívej emoji.

Povolené typy tvrzení:
- porovnání číselných metrik,
- vyšší/nižší hodnoty,
- rozdíly v podílech funkcí,
- explicitní přiznání chybějících dat.

Zakázané typy tvrzení bez explicitních indikátorů:
- urbanistická kvalita, návaznost, čitelnost, sociální přínos, inovativnost, ekonomická přiměřenost.

Pravidla pořadí:
- Pokud mají návrhy stejné skóre, nevybírej vítěze a napiš: "Na základě aktuálních dat nelze určit jednoznačně lepší návrh."
- Pokud mají všechny návrhy 0 %, napiš: "Oba návrhy dosáhly stejného výsledku podle aktuálního bodového hodnocení." (případně analogicky pro více návrhů).

Povinné fallback formulace při chybějících datech:
- "Na základě dostupných dat nelze vyhodnotit urbanistickou návaznost návrhu."
- "Data neobsahují dostatek kvalitativních indikátorů pro posouzení čitelnosti veřejného prostoru."
- "Ekonomickou přiměřenost nelze posoudit, protože chybí údaje o nákladech."

Použij přesně tuto strukturu:
# Shrnutí soutěže
# Přehled návrhů
# Srovnání návrhů
# Limity hodnocení
# Doporučení

KONTEXT: ${context || 'Obecná urbanistická soutěž'}

NÁVRHY A DATA:
${proposalsWithScores.map((navrh, index) => `
${index + 1}. ${sanitizeProposalName(navrh.nazev || navrh.name)}
- Celkové skóre: ${Number(navrh.totalScore || 0)} %
- Kategorie skóre: ${JSON.stringify(navrh.categoryScores)}
- Indikátorové skóre: ${JSON.stringify(navrh.indicatorScores)}
- Vstupní data: ${JSON.stringify(navrh.data || {})}
`).join('\n')}

KRITÉRIA:
${data.indikatory?.map((i) => `- ${i.nazev}: váha ${i.vaha || 10}, kategorie ${i.kategorie || 'N/A'}, typ ${i.typ || 'N/A'}`).join('\n')}
      `;

      setAnalysisProgress(30);

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini', // Vrátené na funkčný model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6, // Zachovaná pôvodná hodnota pre kvalitu
        max_tokens: 2000, // Zachovaný pôvodný limit
        top_p: 0.9, // Pre rýchlejšie generovanie
        frequency_penalty: 0.1 // Znižuje opakovanie
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const consistencyNote = buildScoreConsistencyNote(proposalsWithScores);
      let analysisText = sanitizeAiReportText(result.choices[0]?.message?.content || '');
      analysisText = ensureReportSections(analysisText);
      if (consistencyNote && !analysisText.includes(consistencyNote)) {
        analysisText = `${analysisText}\n\n# Limity hodnocení\n${consistencyNote}`;
      }

      setAnalysisProgress(100);
      setLastAnalysis(analysisText);

      return {
        success: true,
        analysis: analysisText
      };
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return {
        success: false,
        error: error.message || 'Chyba při AI analýze'
      };
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, []);

  // Návrh vah pro kategorie
  const suggestCategoryWeights = useCallback(async (categories, context) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

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

      setAnalysisProgress(30);

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini', // Vrátené na funkčný model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 600
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const responseText = result.choices[0]?.message?.content || '{}';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      setAnalysisProgress(100);

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
      setAnalysisProgress(0);
    }
  }, []);

  // Návrh vah pro indikátory
  const suggestWeights = useCallback(async (criteria, context) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

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

      setAnalysisProgress(30);

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini', // Vrátené na funkčný model
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
        max_tokens: 800
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const responseText = result.choices[0]?.message?.content || '{}';
      
      // Extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      const suggestions = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

      setAnalysisProgress(100);

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
      setAnalysisProgress(0);
    }
  }, []);

  // Generování komentářů s kontextem
  const generateComments = useCallback(async (proposals, indicators, weights, context = "") => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Získanie výsledkov - musia byť prechádzané ako parameter
      const proposalsWithScores = proposals?.map(p => ({
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
# Shrnutí soutěže
# Přehled návrhů
# Srovnání návrhů
# Limity hodnocení
# Doporučení

Pravidla:
- pokud jsou skóre shodná, nevol vítěze a napiš: "Na základě aktuálních dat nelze určit jednoznačně lepší návrh."
- pokud chybí data pro oblast, napiš explicitně, že ji nelze spolehlivě vyhodnotit.
- používej pouze metriky z podkladů níže.

KONTEXT: ${context || 'Obecná urbanistická soutěž'}

NÁVRHY:
${proposalsWithScores.map((p, index) => `
${index + 1}. ${sanitizeProposalName(p.nazev || p.name)}
- Celkové skóre: ${Number(p.totalScore || 0)} %
- Kompletnost: ${Number(p.completionRate || 0)} %
- Vyplněné indikátory: ${Number(p.filledIndicators || 0)}/${Number(p.totalIndicators || 0)}
- Vstupní data: ${JSON.stringify(p.data || {})}
`).join('\n')}

KRITÉRIA A VÁHY:
${indicators?.map(i => `- ${i.nazev}: váha ${i.vaha || 10}, kategorie ${i.kategorie || 'N/A'}, typ ${i.typ || 'N/A'}`).join('\n')}
      `;

      setAnalysisProgress(30);

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7, // Zachovaná pôvodná hodnota pre kvalitu
        max_tokens: 3000, // Zachovaný pôvodný limit
        top_p: 0.9,
        frequency_penalty: 0.15 // Redukuje opakovanie
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const consistencyNote = buildScoreConsistencyNote(proposalsWithScores);
      let commentsText = sanitizeAiReportText(result.choices[0]?.message?.content || '');
      commentsText = ensureReportSections(commentsText);
      if (consistencyNote && !commentsText.includes(consistencyNote)) {
        commentsText = `${commentsText}\n\n# Limity hodnocení\n${consistencyNote}`;
      }

      setAnalysisProgress(100);

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
      setAnalysisProgress(0);
    }
  }, []);

  return {
    isAnalyzing,
    analysisProgress,
    lastAnalysis,
    analyzeComparison,
    suggestWeights,
    suggestCategoryWeights,
    generateComments
  };
};

export default useAIAssistant;
