import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Nastavení PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

export const usePdfProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const extractDataFromPdf = async (pdfFile) => {
    try {
      setIsProcessing(true);
      setProgress(0);

      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      // Zpracujeme pouze první 3 stránky pro rychlost
      const maxPages = Math.min(pdf.numPages, 3);
      let extractedText = '';

      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        extractedText += pageText + '\n';
        
        setProgress((pageNum / maxPages) * 100);
      }

      // Debug: zobrazíme extrahovaný text
      console.log('Extrahovaný text z PDF:', extractedText.substring(0, 1000) + '...');
      
      // Extrakce indikátorů z textu
      const indicators = extractIndicatorsFromText(extractedText);
      
      console.log('Nalezené indikátory:', indicators);
      
      setProgress(100);
      return indicators;
    } catch (error) {
      console.error('Chyba při zpracování PDF:', error);
      return {};
    } finally {
      setIsProcessing(false);
    }
  };

  const extractIndicatorsFromText = (text) => {
    const indicators = {};
    
    // Normalizace textu pro lepší vyhledávání
    const normalizedText = text.toLowerCase()
      .replace(/[^\w\s\d.,-]/g, ' ')
      .replace(/\s+/g, ' ');

    // Vzory pro vyhledávání indikátorů - více flexibilní
    const patterns = {
      // Územní indikátory
      'area_total': [
        /celková\s+plocha\s+území[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /total\s+area[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /plocha\s+území[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /celková\s+plocha[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /plocha[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /area[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /(\d+(?:[.,]\d+)?)\s*m².*?plocha/i
      ],
      'built_up_area': [
        /zastavěná\s+plocha[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /built\s+up\s+area[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /zastavěná[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /zastavěná[^\d]*?(\d+(?:[.,]\d+)?)\s*m2/i,
        /(\d+(?:[.,]\d+)?)\s*m².*?zastavěná/i,
        /(\d+(?:[.,]\d+)?)\s*m2.*?zastavěná/i
      ],
      'gfa_total': [
        /celková\s+hrubá\s+podlažní\s+plocha[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /gfa\s+total[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /hrubá\s+podlažní\s+plocha[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /gfa[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /gfa[^\d]*?(\d+(?:[.,]\d+)?)\s*m2/i,
        /(\d+(?:[.,]\d+)?)\s*m².*?gfa/i,
        /(\d+(?:[.,]\d+)?)\s*m2.*?gfa/i
      ],
      'coefficient_land_use': [
        /koeficient\s+využití\s+území[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /intenzita\s+zástavby[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /koeficient[^\d]*?(\d+(?:[.,]\d+)?)/i
      ],
      'mix_used_areas': [
        /podíl\s+smíšeného\s+využití[^\d]*?(\d+(?:[.,]\d+)?)\s*%/i,
        /smíšené\s+využití[^\d]*?(\d+(?:[.,]\d+)?)\s*%/i,
        /mix\s+used[^\d]*?(\d+(?:[.,]\d+)?)\s*%/i
      ],
      'number_of_storeys': [
        /počet\s+nadzemních\s+podlaží[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /podlaží[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /storeys[^\d]*?(\d+(?:[.,]\d+)?)/i
      ],
      
      // Environmentální indikátory
      'green_areas': [
        /zelené\s+plochy[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /green\s+areas[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /zeleň[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      'blue_areas': [
        /modré\s+plochy[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /vodní\s+plochy[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /blue\s+areas[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      'green_roofs': [
        /zelené\s+střechy[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /green\s+roofs[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /střechy[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      
      // Dopravní indikátory
      'parking_places_total': [
        /celkový\s+počet\s+parkovacích\s+míst[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /parkovací\s+místa[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /parking[^\d]*?(\d+(?:[.,]\d+)?)/i
      ],
      'parking_places_public': [
        /veřejná\s+parkovací\s+místa[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /public\s+parking[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /veřejná[^\d]*?(\d+(?:[.,]\d+)?)/i
      ],
      'parking_places_private': [
        /soukromá\s+parkovací\s+místa[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /private\s+parking[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /soukromá[^\d]*?(\d+(?:[.,]\d+)?)/i
      ],
      
      // Funkční struktura
      'gfa_living': [
        /gfa\s+bydlení[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /bydlení[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /living[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      'gfa_commerce': [
        /gfa\s+obchod[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /obchod\s+a\s+služby[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /commerce[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      'gfa_offices': [
        /gfa\s+kanceláře[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /kanceláře[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /offices[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      'gfa_public': [
        /gfa\s+veřejná\s+vybavenost[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /veřejná\s+vybavenost[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /public[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      'gfa_sport': [
        /gfa\s+sport[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /sport\s+a\s+rekreace[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /sport[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      'gfa_technology': [
        /gfa\s+technické[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /technické\s+a\s+výrobní[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i,
        /technology[^\d]*?(\d+(?:[.,]\d+)?)\s*m²/i
      ],
      
      // Sociální a ekonomické indikátory
      'population_total': [
        /počet\s+obyvatel[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /population[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /obyvatel[^\d]*?(\d+(?:[.,]\d+)?)/i
      ],
      'employees_total': [
        /počet\s+pracovních\s+míst[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /pracovní\s+místa[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /employees[^\d]*?(\d+(?:[.,]\d+)?)/i
      ],
      'investment_cost_total': [
        /investiční\s+náklady\s+celkem[^\d]*?(\d+(?:[.,]\d+)?)\s*kč/i,
        /investment\s+cost[^\d]*?(\d+(?:[.,]\d+)?)\s*kč/i,
        /náklady[^\d]*?(\d+(?:[.,]\d+)?)\s*kč/i
      ],
      'investment_cost_per_gfa': [
        /investiční\s+náklady\s+na\s+m²\s+gfa[^\d]*?(\d+(?:[.,]\d+)?)\s*kč/i,
        /cost\s+per\s+gfa[^\d]*?(\d+(?:[.,]\d+)?)\s*kč/i,
        /náklady\s+na\s+m²[^\d]*?(\d+(?:[.,]\d+)?)\s*kč/i
      ],
      'efficiency_land_use': [
        /efektivita\s+využití\s+území[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /efficiency[^\d]*?(\d+(?:[.,]\d+)?)/i,
        /efektivita[^\d]*?(\d+(?:[.,]\d+)?)/i
      ]
    };

    // Vyhledávání hodnot pro každý indikátor
    Object.entries(patterns).forEach(([key, patternList]) => {
      for (const pattern of patternList) {
        const match = normalizedText.match(pattern);
        if (match && match[1]) {
          const value = parseFloat(match[1].replace(',', '.'));
          if (!isNaN(value) && value > 0) {
            indicators[key] = value;
            console.log(`Nalezen indikátor ${key}: ${value}`);
            break; // Použijeme první nalezenou hodnotu
          }
        }
      }
    });

    // Pokud nenajdeme žádné indikátory, zkusíme obecnější vyhledávání
    if (Object.keys(indicators).length === 0) {
      console.log('Žádné indikátory nenalezeny, zkouším obecnější vyhledávání...');
      
      // Hledáme čísla s jednotkami m²
      const m2Matches = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*m[²2]/g);
      if (m2Matches && m2Matches.length > 0) {
        console.log('Nalezena čísla s m²:', m2Matches);
        // Přiřadíme první hodnotu jako area_total
        const firstValue = parseFloat(m2Matches[0].replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(firstValue) && firstValue > 0) {
          indicators['area_total'] = firstValue;
          console.log(`Přiřazeno jako area_total: ${firstValue}`);
        }
      }
      
      // Hledáme čísla s jednotkami %
      const percentMatches = normalizedText.match(/(\d+(?:[.,]\d+)?)\s*%/g);
      if (percentMatches && percentMatches.length > 0) {
        console.log('Nalezena čísla s %:', percentMatches);
        // Přiřadíme první hodnotu jako mix_used_areas
        const firstValue = parseFloat(percentMatches[0].replace(/[^\d.,]/g, '').replace(',', '.'));
        if (!isNaN(firstValue) && firstValue > 0) {
          indicators['mix_used_areas'] = firstValue;
          console.log(`Přiřazeno jako mix_used_areas: ${firstValue}`);
        }
      }
      
      // Hledáme obecná čísla
      const numberMatches = normalizedText.match(/\b(\d+(?:[.,]\d+)?)\b/g);
      if (numberMatches && numberMatches.length > 0) {
        console.log('Nalezena obecná čísla:', numberMatches.slice(0, 10)); // Prvních 10
        // Přiřadíme první hodnotu jako population_total
        const firstValue = parseFloat(numberMatches[0].replace(',', '.'));
        if (!isNaN(firstValue) && firstValue > 0) {
          indicators['population_total'] = firstValue;
          console.log(`Přiřazeno jako population_total: ${firstValue}`);
        }
      }
    }

    return indicators;
  };

  const processPdf = useCallback(async (pdfFile) => {
    try {
      const indicators = await extractDataFromPdf(pdfFile);
      return {
        success: true,
        indicators,
        message: `Úspěšně zpracováno ${Object.keys(indicators).length} indikátorů`
      };
    } catch (error) {
      console.error('Chyba při zpracování PDF:', error);
      return {
        success: false,
        indicators: {},
        message: 'Chyba při zpracování PDF: ' + error.message
      };
    }
  }, []);

  return {
    processPdf,
    isProcessing,
    progress
  };
};