import { useState, useCallback } from 'react';

const useAIAssistant = (apiKey) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  // Analýza porovnání návrhů
  const analyzeComparison = useCallback(async (data) => {
    if (!apiKey) {
      throw new Error('OpenAI API klíč není nastaven');
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const prompt = `
You are an expert urban planner evaluating design competition entries. Based on the following indicators and proposals, provide a comprehensive summary with key insights and recommendations.

Proposals:
${data.navrhy?.map(n => `- ${n.nazev}: ${JSON.stringify(n.data)}`).join('\n')}

Indicators:
${data.indikatory?.map(i => `- ${i.nazev} (Weight: ${i.vaha || 10})`).join('\n')}

Please provide:
1. Summary of each proposal's strengths and weaknesses
2. Overall competition insights
3. Key recommendations for improvement

Keep response concise but informative (max 500 words).
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
      let results = [];
      try {
        const wizardContext = require('../contexts/WizardContext');
        // Toto je workaround - v skutočnosti by sme mali použiť useContext
        results = proposals.map(p => ({
          ...p,
          scores: p.scores || { total: 0, categories: {}, indicators: {} }
        }));
      } catch (error) {
        console.warn('Nepodarilo sa načítať výsledky z kontextu');
      }

      const prompt = `
Jsi odborný porotce urbanistické soutěže s dlouholetými zkušenostmi v hodnocení architektonických a urbanistických návrhů.

🧱 KONTEXT SOUTĚŽE: ${context || "Obecná urbanistická soutěž"}

📊 HODNOTENÉ NÁVRHY A VÝSLEDKY:
${proposals?.map((p, index) => {
  const scores = p.scores || {};
  return `
${index + 1}. ${p.nazev || p.name || 'Neznámý návrh'}
   - Celkové skóre: ${scores.total || 0}%
   - Kategorie: ${JSON.stringify(scores.categories || {})}
   - Indikátory: ${JSON.stringify(scores.indicators || {})}
   - Data: ${JSON.stringify(p.data || {})}
`;
}).join('\n')}

⚖️ HODNOTÍCÍ KRITÉRIA A VÁHY:
${indicators?.map(i => `- ${i.nazev} (Váha: ${i.vaha || 10}%, Kategorie: ${i.kategorie || 'N/A'})`).join('\n')}

🎯 ÚKOL:
Vyhodnoť každý návrh komplexně a uveď:

1. **SILNÉ STRÁNKY** (modré boxy) ✅
   - Hlavní přednosti návrhu
   - Inovativní řešení
   - Kvalitní urbanistické přístupy

2. **NEDOSTATKY** (červené boxy) ⚠️
   - Hlavní slabiny a problémy
   - Chybějící aspekty
   - Rizikové faktory

3. **DOPORUČENÍ** (šedé boxy) 💡
   - Konkrétní návrhy na zlepšení
   - Alternativní řešení
   - Další kroky pro rozvoj

4. **CELKOVÉ HODNOCENÍ** (zelený štítek)
   - Finální skóre v %
   - Stručné shrnutí

Odpověz v češtině a formátuj výsledek do HTML s následující strukturou:
- Použij <div> s třídami pro barevné rozlišení
- <h3> pro názvy návrhů
- <div class="bg-blue-100 p-3 rounded mb-2"> pro silné stránky
- <div class="bg-red-100 p-3 rounded mb-2"> pro nedostatky  
- <div class="bg-gray-100 p-3 rounded mb-2"> pro doporučení
- <span class="bg-green-500 text-white px-2 py-1 rounded text-sm"> pro skóre

Maximálně 1000 slov, strukturovaně a profesionálně.
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
