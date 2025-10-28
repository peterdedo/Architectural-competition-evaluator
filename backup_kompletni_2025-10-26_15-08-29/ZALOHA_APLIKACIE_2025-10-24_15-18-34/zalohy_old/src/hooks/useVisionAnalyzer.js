import { useState, useCallback } from 'react';
import { CRITERIA } from '../models/CriteriaModel';

export const useVisionAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState(null);

  // Validácia JSON odpovede od OpenAI
  const validateApiResponse = (response, criteria) => {
    try {
      if (typeof response === 'string') {
        response = JSON.parse(response);
      }

      const validatedData = {};
      
      for (const [key, criterion] of Object.entries(criteria)) {
        if (response[key]) {
          const value = response[key];
          if (typeof value === 'object' && 'value' in value && 'source' in value) {
            validatedData[key] = {
              value: value.value !== null && value.value !== undefined ? Number(value.value) : null,
              source: String(value.source || 'nenalezeno'),
              unit: criterion.unit
            };
          } else {
            validatedData[key] = { 
              value: null, 
              source: 'neplatný formát odpovědi',
              unit: criterion.unit
            };
          }
        } else {
          validatedData[key] = { 
            value: null, 
            source: 'nenalezeno v dokumentu',
            unit: criterion.unit
          };
        }
      }

      return validatedData;
    } catch (error) {
      console.error('JSON validation error:', error);
      throw new Error('Neplatná JSON odpověď od API');
    }
  };

  // Mock analýza pre testovanie
  const mockAnalyze = useCallback(async (project, criteria) => {
    // Simulácia času spracovania
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    const mockData = {};
    Object.keys(criteria).forEach(key => {
      const criterion = criteria[key];
      const hasValue = Math.random() > 0.3; // 70% šanca na hodnotu
      
      if (hasValue) {
        let value;
        if (criterion.unit === '%') {
          value = Math.round(Math.random() * 100);
        } else if (criterion.unit === 'EUR' || criterion.unit === 'EUR/m²') {
          value = Math.round(Math.random() * 1000000 + 10000);
        } else if (criterion.unit === 'm²') {
          value = Math.round(Math.random() * 50000 + 1000);
        } else if (criterion.unit === 'roky') {
          value = Math.round(Math.random() * 20 + 1);
        } else if (criterion.unit === 'index') {
          value = Math.round(Math.random() * 10 + 1);
        } else {
          value = Math.round(Math.random() * 1000 + 1);
        }
        
        mockData[key] = {
          value,
          source: `Simulovaný zdroj pre ${project.name} - strana ${Math.floor(Math.random() * 5) + 1}`,
          unit: criterion.unit
        };
      } else {
        mockData[key] = {
          value: null,
          source: 'nenalezeno v dokumente',
          unit: criterion.unit
        };
      }
    });
    
    return mockData;
  }, []);

  // Skutočné volanie OpenAI Vision API
  const realAnalyze = useCallback(async (project, criteria, apiKey, model = 'gpt-4o') => {
    const criteriaInstructions = Object.entries(criteria)
      .map(([key, criterion]) =>
        `  "${key}": {
    "name": "${criterion.name}",
    "unit": "${criterion.unit}",
    "description": "Hledej přesně tuto hodnotu v dokumentu"
  }`
      )
      .join(',\n');

    const systemPrompt = `Jsi expert na analýzu urbanistických dokumentů. Tvůj úkol je extrahovat POUZE skutečná číselná data z poskytnutých obrázků PDF dokumentů.

DOSTUPNÁ KRITÉRIA:
{
${criteriaInstructions}
}

NÁVOD PRO EXTRAKCI:
1. Pro každý klíč hledej POUZE skutečná čísla z dokumentu
2. Pokud není hodnota v dokumentu explicitně uvedena, použij null
3. Nikdy nevymýšlej, neodhaduj ani neměň čísla
4. Zdroj musí být přesný (např. "strana 5, tabulka 2" nebo "kapitola 3.1")
5. Vrať POUZE JSON objekt bez dalšího textu

PŘÍKLAD SPRÁVNÉ ODPOVĚDI:
{
  "celkova_plocha": {"value": 15000, "source": "strana 3, celková plocha pozemku"},
  "zastavena_plocha": {"value": 4500, "source": "strana 4, tabulka zastavěnosti"},
  "zelena_plocha": {"value": null, "source": "nenalezeno v dokumentu"},
  "naklady": {"value": 25000000, "source": "strana 12, rozpočet projektu"}
}`;

    const userPrompt = `Analyzuj tyto obrázky PDF dokumentu "${project.name}" a extrahuj PŘESNÉ hodnoty pro všechna kritéria.

Pro každé kritérium:
- Najdi přesnou číselnou hodnotu v dokumentu
- Pokud není hodnota uvedena, použij null
- Zdroj musí být konkrétní (strana, tabulka, kapitola)

Vrať POUZE JSON objekt ve formátu:
{
  "název_kritéria": {
    "value": číslo_nebo_null,
    "source": "přesný_zdroj_v_dokumentu"
  }
}`;

    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: userPrompt
          },
          ...project.images.map(page => ({
            type: 'image_url',
            image_url: {
              url: `data:image/png;base64,${page.imageData}`,
              detail: 'high'
            }
          }))
        ]
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens: 4000,
        temperature: 0.1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;

    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/```\s*/, '').replace(/\s*```$/, '');
    }

    const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('OpenAI nevrátila platný JSON objekt');
    }

    const parsedData = JSON.parse(jsonMatch[0]);
    return validateApiResponse(parsedData, criteria);
  }, []);

  // Hlavná analýza funkcia
  const analyze = useCallback(async (project, criteria, apiKey = null, model = 'gpt-4o', useMock = false) => {
    setIsAnalyzing(true);
    setError(null);

    try {
      let result;
      
      if (useMock || !apiKey) {
        result = await mockAnalyze(project, criteria);
      } else {
        result = await realAnalyze(project, criteria, apiKey, model);
      }

      return {
        success: true,
        data: result,
        projectName: project.name
      };

    } catch (error) {
      console.error('Vision analysis error:', error);
      setError(error.message);
      return {
        success: false,
        error: error.message,
        projectName: project.name
      };
    } finally {
      setIsAnalyzing(false);
    }
  }, [mockAnalyze, realAnalyze]);

  return {
    analyze,
    isAnalyzing,
    error
  };
};
