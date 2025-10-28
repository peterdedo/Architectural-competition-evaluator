import { useState, useCallback } from 'react';

const useAIAssistant = (apiKey) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  // Analýza porovnání návrhů
  const analyzeComparison = useCallback(async (data, context = '') => {
    if (!apiKey) {
      throw new Error('OpenAI API klíč není nastaven');
    }

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
Jsi expertný porotce urbanistických soutěží s 20+ ročnými skúsenosťami v hodnotení architektonických a urbanistických návrhov.

🏗️ KONTEXT SOUTĚŽE: ${context || "Obecná urbanistická soutěž"}

📊 HODNOTENÉ NÁVRHY S VÝSLEDKAMI:
${proposalsWithScores.map((navrh, index) => `
${index + 1}. ${navrh.nazev || navrh.name || 'Neznámý návrh'}
   📈 Celkové skóre: ${navrh.totalScore}%
   📊 Kategórie: ${JSON.stringify(navrh.categoryScores)}
   📋 Indikátory: ${JSON.stringify(navrh.indicatorScores)}
   📄 Pôvodné dáta: ${JSON.stringify(navrh.data || {})}
`).join('\n')}

⚖️ HODNOTÍCÍ KRITÉRIA A VÁHY:
${data.indikatory?.map(i => `- ${i.nazev} (Váha: ${i.vaha || 10}%, Kategória: ${i.kategorie || 'N/A'})`).join('\n')}

🎯 ÚKOL - VYTVOR KOMPLEXNÚ ANALÝZU:

1. **SÚHRN SÚŤAŽE** 📋
   - Celkový prehľad všetkých návrhov
   - Kvalitatívne porovnanie
   - Identifikácia hlavných trendov

2. **ANALÝZA KAŽDÉHO NÁVRHU** 🔍
   - Silné stránky na základe skóre
   - Slabé stránky a problémy
   - Konkrétne pozoruhodnosti

3. **POROVNANIE NÁVRHOV** ⚖️
   - Ktorý návrh je najlepší a prečo
   - Rozdiely v prístupe
   - Inovatívne riešenia

4. **ODPORÚČANIA** 💡
   - Konkrétne návrhy na zlepšenie
   - Najlepšie praxe z analýzy
   - Budúce smerovanie

Odpovedaj v češtine, štruktúrovane a profesionálne. Maximálne 1500 slov.
      `;

      setAnalysisProgress(30);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.6,
          max_tokens: 1000
        })
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const analysisText = result.choices[0]?.message?.content || '';

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
  }, [apiKey]);

  // Návrh vah pro kategorie
  const suggestCategoryWeights = useCallback(async (categories, context) => {
    if (!apiKey) {
      throw new Error('OpenAI API klíč není nastaven');
    }

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 600
        })
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
  }, [apiKey]);

  // Návrh vah pro indikátory
  const suggestWeights = useCallback(async (criteria, context) => {
    if (!apiKey) {
      throw new Error('OpenAI API klíč není nastaven');
    }

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

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.5,
          max_tokens: 800
        })
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
  }, [apiKey]);

  // Generování komentářů s kontextem
  const generateComments = useCallback(async (proposals, indicators, weights, context = "") => {
    if (!apiKey) {
      throw new Error('OpenAI API klíč není nastaven');
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Získanie výsledkov z WizardContext
      const proposalsWithScores = proposals?.map(p => ({
        ...p,
        scores: p.scores || { total: 0, categories: {}, indicators: {} }
      })) || [];

      const prompt = `
Jsi expertný porotce urbanistických soutěží s 20+ ročnými skúsenosťami v hodnotení architektonických a urbanistických návrhov.

🏗️ KONTEXT SOUTĚŽE: ${context || "Obecná urbanistická soutěž"}

📊 HODNOTENÉ NÁVRHY S DETAILNÝMI VÝSLEDKAMI:
${proposalsWithScores.map((p, index) => {
  const scores = p.scores || {};
  return `
${index + 1}. ${p.nazev || p.name || 'Neznámý návrh'}
   📈 Celkové skóre: ${scores.total || 0}%
   📊 Kategórie: ${JSON.stringify(scores.categories || {})}
   📋 Indikátory: ${JSON.stringify(scores.indicators || {})}
   📄 Pôvodné dáta: ${JSON.stringify(p.data || {})}
`;
}).join('\n')}

⚖️ HODNOTÍCÍ KRITÉRIA A VÁHY:
${indicators?.map(i => `- ${i.nazev} (Váha: ${i.vaha || 10}%, Kategória: ${i.kategorie || 'N/A'})`).join('\n')}

🎯 ÚKOL - VYTVOR DETAILNÉ HODNOTENIE KAŽDÉHO NÁVRHU:

Pre každý návrh vytvor:

1. **SILNÉ STRÁNKY** (modré boxy) ✅
   - Konkrétne prednosti na základe skóre
   - Inovatívne riešenia
   - Kvalitné urbanistické prístupy
   - Najlepšie aspekty podľa indikátorov

2. **NEDOSTATKY** (červené boxy) ⚠️
   - Konkrétne slabiny na základe skóre
   - Chýbajúce aspekty
   - Rizikové faktory
   - Problémy identifikované analýzou

3. **DOPORUČENIA** (šedé boxy) 💡
   - Konkrétne návrhy na zlepšenie
   - Alternatívne riešenia
   - Ďalšie kroky pre rozvoj
   - Optimalizácie na základe skóre

4. **CELKOVÉ HODNOTENIE** (zelený štítek)
   - Finálne skóre v %
   - Stručné zhrnutie
   - Pozícia v poradí

Odpovedaj v češtine a formátuj výsledok do HTML s nasledujúcou štruktúrou:
- Použij <div> s triedami pre farebné rozlíšenie
- <h3> pre názvy návrhov
- <div class="bg-blue-100 p-3 rounded mb-2"> pre silné stránky
- <div class="bg-red-100 p-3 rounded mb-2"> pre nedostatky  
- <div class="bg-gray-100 p-3 rounded mb-2"> pre doporučenia
- <span class="bg-green-500 text-white px-2 py-1 rounded text-sm"> pre skóre

Maximálne 2000 slov, štruktúrovane a profesionálne. Každý návrh musí mať jedinečné hodnotenie na základe jeho skutočných výsledkov.
      `;

      setAnalysisProgress(30);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: "system", 
              content: "Jsi AI expert na urbanistické soutěže s dlouholetými zkušenostmi. Odpovídáš v češtině a formátuješ výstup do HTML." 
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      setAnalysisProgress(70);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API Error');
      }

      const result = await response.json();
      const commentsText = result.choices[0]?.message?.content || '';

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
  }, [apiKey]);

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
