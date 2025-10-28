import { useState, useCallback } from 'react';

export const useVisionAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);

  const analyzeDocumentWithVision = async (pdfFile, apiKey) => {
    try {
      console.log('Začínám analýzu PDF:', pdfFile.name);
      setIsAnalyzing(true);
      setProgress(0);

      // Konvertujeme PDF na obrázky pomocí PDF.js
      console.log('Konvertuji PDF na obrázky...');
      const images = await convertPdfToImages(pdfFile);
      console.log('PDF převedeno na', images.length, 'obrázků');
      setProgress(30);

      // Voláme OpenAI Vision API
      console.log('Volám OpenAI Vision API...');
      const analysisResult = await callOpenAIVisionAPI(images, apiKey);
      console.log('Vision API odpověď:', analysisResult);
      setProgress(80);

      // Parsujeme výsledek
      console.log('Parsuji výsledek...');
      const extractedData = parseVisionResponse(analysisResult);
      console.log('Extrahovaná data:', extractedData);
      setProgress(100);

      const indicatorCount = Object.keys(extractedData).length;
      console.log('Počet nalezených indikátorů:', indicatorCount);

      return {
        success: true,
        data: extractedData,
        message: `Úspěšně analyzováno ${indicatorCount} indikátorů`
      };
    } catch (error) {
      console.error('Chyba při analýze dokumentu:', error);
      return {
        success: false,
        data: {},
        message: 'Chyba při analýze: ' + error.message
      };
    } finally {
      setIsAnalyzing(false);
    }
  };

  const convertPdfToImages = async (pdfFile) => {
    const pdfjsLib = await import('pdfjs-dist');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const arrayBuffer = await pdfFile.arrayBuffer();
    const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
    
    const images = [];
    const maxPages = Math.min(pdf.numPages, 3); // První 3 stránky

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;

      images.push(canvas.toDataURL('image/jpeg', 0.8));
    }

    return images;
  };

  const callTextAPI = async (images, apiKey) => {
    // Fallback pro textový model - použijeme pouze textový popis
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: `Analyzuj urbanistický dokument a extrahuj všechny numerické hodnoty s jednotkami. 
            Hledej zejména:
            - Plochy v m² (celková plocha, zastavěná plocha, GFA, zelené plochy, atd.)
            - Procenta (%)
            - Počty (obyvatelé, parkovací místa, podlaží)
            - Náklady v Kč
            - Koeficienty a poměry
            
            Vrať výsledek jako JSON objekt s klíči podle typu indikátoru:
            {
              "area_total": číslo, // Plocha řešeného území, celková plocha, area of interests
              "built_up_area": číslo, // Zastavěná plocha objekty, zastavené plochy, budovy
              "gfa_total": číslo, // Celková plocha nadzemních podlaží, GFA, HPP
              "green_areas": číslo, // Zelené plochy, trávníky, parky, vegetace
              "blue_areas": číslo, // Zpevněné plochy, komunikace, chodníky, náměstí
              "underground_area": číslo, // Celková plocha podzemních podlaží, suterén
              "gfa_living": číslo, // HPP bydlení, obytné plochy, bydlení
              "gfa_commerce": číslo, // HPP komerce, obchodní plochy, komerce
              "gfa_offices": číslo, // HPP kanceláře, administrativní plochy, služby
              "gfa_public": číslo, // HPP veřejná vybavenost, veřejné služby
              "gfa_technology": číslo, // HPP technologie, technické prostory, zázemí
              "gfa_parking": číslo, // HPP parkování, parkovací plochy, garáže
              "parking_places_covered": číslo, // Parkovací stání krytá, kryté parkování
              "parking_places_public": číslo, // Parkovací stání venkovní, venkovní parkování
              "underground_parking": číslo, // Parkovací stání podzemní, podzemní parkování
              "parking_places_total": číslo // Parkovací stání celkem, celkové parkování
            }
            
            Pokud hodnotu nenajdeš, nastav ji na null. Vrať pouze validní JSON bez dalšího textu.
            
            POZNÁMKA: Používám textový model místo Vision API, takže analyzuj obecné urbanistické hodnoty.`
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Text API chyba: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  const callOpenAIVisionAPI = async (images, apiKey) => {
    // Zkusíme najít dostupný Vision model
    const modelsResponse = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const modelsData = await modelsResponse.json();
    console.log('🔍 Dostupné modely:', modelsData.data.map(m => m.id));
    
    const visionModel = modelsData.data.find(model => 
      model.id.includes('gpt-4') && 
      (model.id.includes('vision') || model.id.includes('gpt-4o'))
    );

    console.log('🎯 Vybraný Vision model:', visionModel?.id);

    if (!visionModel) {
      console.log('⚠️ Vision model nenalezen, používám textový fallback');
      return await callTextAPI(images, apiKey);
    }

    const messages = images.map(image => ({
      type: "image_url",
      image_url: {
        url: image
      }
    }));

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: visionModel.id,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyzuj tento český urbanistický dokument a extrahuj všechny numerické hodnoty.

DOKUMENT OBSAHUJE:
- Bilance ploch řešeného území (m²)
- Bilance HPP dle funkce (m²) 
- Bilance parkovacích ploch (ks)

HLEDEJ TYTO KONKRÉTNÍ HODNOTY:
1. "Plocha řešeného území" → area_total
2. "z toho zastavěná plocha objekty" → built_up_area  
3. "z toho plochy zelené" → green_areas
4. "z toho plochy zpevněné" → blue_areas
5. "z toho plochy ostatní" → other_areas
   (hľadaj aj: "ostatní", "vodní", "ostatní plochy", "vodní plochy")
6. "Celková plocha nadzemních podlaží" → gfa_total
7. "Celková plocha podzemních podlaží" → basement_area
8. "HPP bydlení" → residential_gfa
9. "HPP komerce / obchod" → commercial_gfa
10. "HPP kanceláře / služby" → office_gfa
11. "HPP veřejná vybavenost" → public_gfa
12. "HPP technologie" → technical_gfa
13. "HPP parkování" → parking_gfa
14. "parkovací stání krytá" → covered_parking
15. "parkovací stání venkovní" → outdoor_parking
16. "parkovací stání podzemní" → underground_parking
17. "parkovací stání celkem" → total_parking

VRAŤ POUZE JSON:
{
  "area_total": číslo,
  "built_up_area": číslo,
  "green_areas": číslo,
  "blue_areas": číslo,
  "other_areas": číslo,
  "gfa_total": číslo,
  "basement_area": číslo,
  "residential_gfa": číslo,
  "commercial_gfa": číslo,
  "office_gfa": číslo,
  "public_gfa": číslo,
  "technical_gfa": číslo,
  "parking_gfa": číslo,
  "covered_parking": číslo,
  "outdoor_parking": číslo,
  "underground_parking": číslo,
  "total_parking": číslo
}

DÔLEŽITÉ:
- "z toho plochy ostatní (vodní, ...)" = other_areas
- Ak nenájdeš "ostatní plochy", vypočítaj ich: area_total - built_up_area - green_areas - blue_areas
- Ak hodnotu nenájdeš, nastav na null. Vrať POUZE JSON bez textu.`
              },
              ...messages
            ]
          }
        ],
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Vision API chyba:', errorData);
      throw new Error(`Vision API chyba: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Vision API úspěšná odpověď:', data.choices[0].message.content);
    return data.choices[0].message.content;
  };

  const parseVisionResponse = (response) => {
    console.log('Vision API odpověď:', response);
    
    try {
      // Pokusíme se najít JSON v odpovědi
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        console.log('Nalezený JSON:', jsonStr);
        const parsed = JSON.parse(jsonStr);
        console.log('Parsovaný JSON:', parsed);
        
        // Filtrujeme pouze číselné hodnoty
        const filtered = {};
        Object.entries(parsed).forEach(([key, value]) => {
          if (value !== null && value !== undefined && !isNaN(value) && value > 0) {
            filtered[key] = parseFloat(value);
          }
        });
        
        // Ak Vision API nerozoznalo "ostatní plochy", vypočítame ich ako rozdiel
        if (!filtered.other_areas && filtered.area_total && filtered.built_up_area && filtered.green_areas && filtered.blue_areas) {
          const ostatni = filtered.area_total - filtered.built_up_area - filtered.green_areas - filtered.blue_areas;
          if (ostatni > 0) {
            filtered.other_areas = ostatni;
            console.log(`✅ Vypočítané ostatní plochy (fallback): ${ostatni} m²`);
          } else {
            console.log(`⚠️ Ostatní plochy by boli záporné: ${ostatni} m²`);
          }
        } else if (filtered.other_areas) {
          console.log(`✅ Vision API rozoznalo ostatní plochy: ${filtered.other_areas} m²`);
        }
        
        console.log('Filtrované hodnoty:', filtered);
        return filtered;
      } else {
        console.log('Žádný JSON nebyl nalezen v odpovědi');
      }
    } catch (error) {
      console.error('Chyba při parsování Vision API odpovědi:', error);
      console.error('Odpověď:', response);
    }
    
    return {};
  };

  const searchIndicatorsInDocument = async (documentData, selectedIndicators) => {
    // Tato funkce bude volána později pro dynamické vyhledávání
    // Zatím vrátíme pouze vybrané indikátory z dokumentu
    const result = {};
    selectedIndicators.forEach(indicatorId => {
      if (documentData[indicatorId] !== undefined) {
        result[indicatorId] = documentData[indicatorId];
      }
    });
    return result;
  };

  return {
    analyzeDocumentWithVision,
    searchIndicatorsInDocument,
    isAnalyzing,
    progress
  };
};