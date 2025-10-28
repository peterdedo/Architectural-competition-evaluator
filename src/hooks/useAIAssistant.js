import { useState, useCallback } from 'react';
import { postOpenAiChatCompletions } from '../utils/openaiProxy';

/** AI volania idú cez backend proxy (/api/openai/chat), nie priamo z klienta. */
const useAIAssistant = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState(null);

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
Jsi profesionální člen mezinárodní poroty architektonických soutěží s 20+ ročnými skúsenosťami. Spojuješ přesnost analytika s citem architekta. Rozumíš urbanismu, architektuře, ekologii, dopravě i ekonomice projektů.

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
${data.indikatory?.map(i => `- ${i.nazev} (${i.description || ''}) - Váha: ${i.vaha || 10}/5, Kategória: ${i.kategorie || 'N/A'}, Typ: ${i.typ || 'N/A'}, Trend: ${i.trend === 'up' ? '📈 vyšší je lepší' : i.trend === 'down' ? '📉 nižší je lepší' : '➡️ neutrální'}, Zdroj: ${i.zdroj || 'N/A'}`).join('\n')}

🎯 ÚKOL - VYTVOR KOMPLEXNÚ ANALÝZU JAKO GLOBÁLNÍ ARCHITEKTONICKÝ HODNOTITEL:

1. **SÚHRN SÚŤAŽE** 📋
   - Celkový prehľad všetkých návrhov s konkrétnymi číslami a poměry
   - Kvalitatívne porovnanie na základe skóre a urbanistických principů
   - Identifikácia hlavných trendov, vzorců a architektonických přístupů

2. **ANALÝZA KAŽDÉHO NÁVRHU** 🔍
   - **Urbanistická kvalita**: měřítko, návaznost, čitelnost, veřejné prostory
   - **Funkční vyváženost**: bydlení vs. komerce, kanceláře, veřejná vybavenost
   - **Udržitelnost**: podíl zeleně, ekologická opatření, hospodaření s vodou
   - **Ekonomická přiměřenost**: efektivita investice, poměr HPP a nákladů
   - **Sociální přínos**: kvalita života, inkluze, aktivace území

3. **POROVNANIE NÁVRHOV** ⚖️
   - Ktorý návrh je najlepší a prečo (s konkrétnymi dôvodmi z urbanistického hlediska)
   - Rozdiely v prístupe, architektonických řešeních a konceptech
   - Inovatívne riešenia a najlepšie praxe z mezinárodní perspektivy

4. **ODPORÚČANIA** 💡
   - Konkrétne návrhy na zlepšenie s architektonickou terminologií
   - Implementačné kroky pro zlepšení urbanistické kvality
   - Budúce smerovanie a rozvojové možnosti s ohledem na udržitelnost

DÔLEŽITÉ POŽIADAVKY:
- Používaj konkrétne čísla, proporce a poměry z analýzy
- Odkazuj sa na konkrétne indikátory a jejich hodnoty
- Poskytuj akčné odporúčania s konkrétnymi krokmi
- Formátuj výstup štruktúrovane s nadpismi a odrážkami
- Používaj architektonickou terminologii vhodnou i pro zadavatele a veřejnost
- Odpovedaj v češtine, profesionálne a konkrétne

Maximálne 2500 slov, štruktúrovane a profesionálne.
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
Jsi profesionální člen mezinárodní poroty architektonických soutěží s 20+ ročnými skúsenosťami. Spojuješ přesnost analytika s citem architekta. Rozumíš urbanismu, architektuře, ekologii, dopravě i ekonomice projektů.

🏗️ KONTEXT SOUTĚŽE: ${context || "Obecná urbanistická soutěž"}

📊 HODNOTENÉ NÁVRHY S DETAILNÝMI VÝSLEDKAMI:
${proposalsWithScores.map((p, index) => {
  const skóre = p.totalScore || p.weightedScore || 0;
  return `
${index + 1}. ${p.nazev || p.name || 'Neznámý návrh'}
   📈 Celkové skóre: ${skóre}% (TOTO POUŽÍVAT V ZÁVERE!!!)
   ✅ Kompletnosť: ${p.completionRate || 0}%
   📊 Vyplnené indikátory: ${p.filledIndicators || 0}/${p.totalIndicators || 0}
   📄 Pôvodné dáta: ${JSON.stringify(p.data || {}).substring(0, 1000)}...
`;
}).join('\n')}

⚖️ HODNOTÍCÍ KRITÉRIA A VÁHY:
${indicators?.map(i => `- ${i.nazev} (${i.description || ''}) - Váha: ${i.vaha || 10}/5, Kategória: ${i.kategorie || 'N/A'}, Typ: ${i.typ || 'N/A'}, Trend: ${i.trend === 'up' ? '📈 vyšší je lepší' : i.trend === 'down' ? '📉 nižší je lepší' : '➡️ neutrální'}, Zdroj: ${i.zdroj || 'N/A'}`).join('\n')}

🎯 ÚKOL - VYTVOR DETAILNÉ HODNOTENIE KAŽDÉHO NÁVRHU JAKO GLOBÁLNÍ ARCHITEKTONICKÝ HODNOTITEL:

Pre každý návrh vytvor:

1. **SILNÉ STRÁNKY** (modré boxy) ✅
   - **Urbanistická kvalita**: měřítko, návaznost, čitelnost, veřejné prostory
   - **Funkční vyváženost**: bydlení vs. komerce, kanceláře, veřejná vybavenost
   - **Udržitelnost**: podíl zeleně, ekologická opatření, hospodaření s vodou
   - **Ekonomická přiměřenost**: efektivita investice, poměr HPP a nákladů
   - **Sociální přínos**: kvalita života, inkluze, aktivace území

2. **NEDOSTATKY** (červené boxy) ⚠️
   - **Urbanistické problémy**: měřítko, návaznost, čitelnost, veřejné prostory
   - **Funkční nevyváženost**: bydlení vs. komerce, kanceláře, veřejná vybavenost
   - **Udržitelnost**: nedostatečný podíl zeleně, chybějící ekologická opatření
   - **Ekonomické problémy**: neefektivita investice, nepoměr HPP a nákladů
   - **Sociální problémy**: kvalita života, inkluze, aktivace území

3. **DOPORUČENIA** (šedé boxy) 💡
   - **Urbanistická zlepšení**: měřítko, návaznost, čitelnost, veřejné prostory
   - **Funkční optimalizace**: bydlení vs. komerce, kanceláře, veřejná vybavenost
   - **Udržitelnost**: zvýšení podílu zeleně, ekologická opatření, hospodaření s vodou
   - **Ekonomická optimalizace**: efektivita investice, poměr HPP a nákladů
   - **Sociální zlepšení**: kvalita života, inkluze, aktivace území

4. **CELKOVÉ HODNOTENIE** (zelený štítek)
   - **POUŽIJ SKÓRE Z HORNEJ ČASTI** (Celkové skóre v % z hodnotenia návrhu)
   - Finálne skóre v % s porovnaním s ostatnými
   - Stručné zhrnutie s kľúčovými bodmi z urbanistického hlediska
   - Pozícia v poradí s dôvodmi z architektonické perspektivy

DÔLEŽITÉ POŽIADAVKY:
- Používaj konkrétne čísla, proporce a poměry z analýzy
- Odkazuj sa na konkrétne indikátory a jejich hodnoty
- Poskytuj akčné odporúčania s konkrétnymi krokmi
- Každý návrh musí mať jedinečné hodnotenie
- Formátuj výstup štruktúrovane s nadpismi a odrážkami
- Používaj architektonickou terminologii vhodnou i pro zadavatele a veřejnost

Odpovedaj v češtine a formátuj výsledok do HTML s nasledujúcou štruktúrou:
- Použij <div> s triedami pre farebné rozlíšenie
- <h3> pre názvy návrhov
- <div class="bg-blue-100 p-3 rounded mb-2"> pre silné stránky
- <div class="bg-red-100 p-3 rounded mb-2"> pre nedostatky  
- <div class="bg-gray-100 p-3 rounded mb-2"> pre doporučenia
- <span class="bg-green-500 text-white px-2 py-1 rounded text-sm"> pre skóre

Maximálne 3000 slov, štruktúrovane a profesionálne. Každý návrh musí mať jedinečné hodnotenie na základe jeho skutočných výsledkov.
      `;

      setAnalysisProgress(30);

      const response = await postOpenAiChatCompletions({
        model: 'gpt-4o-mini', // Vrátené na funkčný model
        messages: [
          { 
            role: "system", 
            content: "Jsi profesionální člen mezinárodní poroty architektonických soutěží s 20+ ročnými skúsenosťami. Spojuješ přesnost analytika s citem architekta. Rozumíš urbanismu, architektuře, ekologii, dopravě i ekonomice projektů. Tvoje hodnocení jsou věcná (využívají čísla, proporce, poměry), odborná (s architektonickou terminologií), srozumitelná (vhodná i pro zadavatele a veřejnost). Odpovídáš v češtině a formátuješ výstup do HTML." 
          },
          { role: 'user', content: prompt }
        ],
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
