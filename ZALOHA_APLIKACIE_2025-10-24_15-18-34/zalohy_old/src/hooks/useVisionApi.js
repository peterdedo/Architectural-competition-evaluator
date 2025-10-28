import { useState, useCallback } from 'react';

export const useVisionApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzeProject = useCallback(async (project, apiKey, model, criteria) => {
    setIsLoading(true);
    setError(null);

    try {
      const criteriaInstructions = Object.entries(criteria || {})
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
            ...project.pageImages.map(page => ({
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
      const validatedData = {};

      for (const [key, criterion] of Object.entries(criteria || {})) {
        if (parsedData[key]) {
          const value = parsedData[key];
          if (typeof value === 'object' && 'value' in value && 'source' in value) {
            validatedData[key] = {
              value: value.value !== null && value.value !== undefined ? Number(value.value) : null,
              source: String(value.source || 'nenalezeno')
            };
          } else {
            validatedData[key] = { value: null, source: 'neplatný formát odpovědi' };
          }
        } else {
          validatedData[key] = { value: null, source: 'nenalezeno v dokumentu' };
        }
      }

      return validatedData;

    } catch (error) {
      console.error('Vision analysis error:', error);
      setError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    analyzeProject,
    isLoading,
    error
  };
};







