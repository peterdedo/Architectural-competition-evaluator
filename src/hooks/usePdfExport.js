import { useState, useCallback } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const usePdfExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  const formatHodnota = (hodnota, jednotka) => {
    if (hodnota === null || hodnota === undefined) return '-';
    if (typeof hodnota === 'number') {
      return `${hodnota.toLocaleString('cs-CZ')} ${jednotka}`;
    }
    return `${String(hodnota)} ${jednotka}`;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#10B981'; // green-500
    if (score >= 60) return '#F59E0B'; // yellow-500
    if (score >= 40) return '#F97316'; // orange-500
    return '#EF4444'; // red-500
  };

  // AI-asistovaný layout generátor
  const generateAILayout = async (navrhy, indicators, weights) => {
    try {
      const apiKey = localStorage.getItem('apiKey') || localStorage.getItem('openai_api_key');
      if (!apiKey) {
        return {
          title: 'Archi Evaluator - Porovnání návrhů',
          footer: 'Generováno pomocí AI Asistenta',
          sections: ['Shrnutí analýzy', 'Porovnání návrhů', 'Detailní porovnání indikátorů']
        };
      }

      const prompt = `
        Navrhni vizuálne prívetivý layout pre PDF export urbanistickej analýzy.
        
        Kontext:
        - Počet návrhů: ${navrhy.length}
        - Počet indikátorů: ${indicators.length}
        - Typ analýzy: Porovnání urbanistických návrhů
        
        Vráť JSON s týmito sekciami:
        {
          "title": "Návrh názvu dokumentu",
          "footer": "Návrh footer textu",
          "sections": ["Sekcia 1", "Sekcia 2", "Sekcia 3"],
          "layout": "Návrh layoutu (napr. 'Moderný s gradientmi')",
          "colors": ["#0066A4", "#4BB349", "#F59E0B"]
        }
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parsovanie AI odpovede
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return {
        title: 'Archi Evaluator - Porovnání návrhů',
        footer: 'Generováno pomocí AI Asistenta',
        sections: ['Shrnutí analýzy', 'Porovnání návrhů', 'Detailní porovnání indikátorů']
      };
    } catch (error) {
      console.error('AI Layout generation error:', error);
      return {
        title: 'Archi Evaluator - Porovnání návrhů',
        footer: 'Generováno pomocí AI Asistenta',
        sections: ['Shrnutí analýzy', 'Porovnání návrhů', 'Detailní porovnání indikátorů']
      };
    }
  };

  const generatePdfReport = useCallback(async (data) => {
    setIsExporting(true);
    setExportProgress(0);

    try {
      const { navrhy, indicators, weights, viewType } = data;
      
      // AI-asistovaný layout
      const aiLayout = await generateAILayout(navrhy, indicators, weights);
      
      // Vytvoríme nový PDF dokument
      const doc = new jsPDF('p', 'mm', 'a4');
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const contentWidth = pageWidth - (margin * 2);

      // Nastavenie fontov
      doc.setFont('helvetica');

      // AI-asistovaný header s gradient pozadím
      setExportProgress(10);
      doc.setDrawColor(200);
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(15, 30, 180, 240, 3, 3, "F");
      
      // Hlavný nadpis s AI návrhom
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(aiLayout.title || 'Archi Evaluator - Porovnání návrhů', margin, 20);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generováno: ${new Date().toLocaleDateString('cs-CZ')}`, margin, 28);
      doc.text(aiLayout.footer || 'Generováno pomocí AI Asistenta', margin, 280);

      // Reset farby
      doc.setTextColor(0, 0, 0);
      let currentY = 40;

      // Shrnutí
      setExportProgress(20);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('Shrnutí analýzy', margin, currentY);
      currentY += 10;

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(`Počet návrhů: ${navrhy.length}`, margin, currentY);
      currentY += 6;
      doc.text(`Počet indikátorů: ${indicators.length}`, margin, currentY);
      currentY += 6;
      doc.text(`Typ zobrazení: ${viewType}`, margin, currentY);
      currentY += 15;

      // Najlepšie skóre
      const bestScore = Math.max(...navrhy.map(navrh => navrh.weightedScore || 0));
      const bestNavrh = navrhy.find(navrh => navrh.weightedScore === bestScore);
      
      if (bestNavrh) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Nejlepší návrh:', margin, currentY);
        currentY += 8;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.text(`${bestNavrh.nazev} - ${bestScore}%`, margin, currentY);
        currentY += 15;
      }

      // Tabuľka porovnania
      setExportProgress(40);
      if (navrhy.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Porovnání návrhů', margin, currentY);
        currentY += 10;

        // Header tabuľky
        const colWidths = [60, 30, 30, 30]; // Názov, Skóre, Kompletace, Indikátory
        const tableStartY = currentY;
        
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, currentY - 5, contentWidth, 10, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('Návrh', margin + 2, currentY);
        doc.text('Skóre', margin + colWidths[0] + 2, currentY);
        doc.text('Kompletace', margin + colWidths[0] + colWidths[1] + 2, currentY);
        doc.text('Indikátory', margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, currentY);
        
        currentY += 8;

        // Riadky tabuľky
        navrhy.forEach((navrh, index) => {
          if (currentY > pageHeight - 30) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          
          // Názov návrhu
          const nazev = navrh.nazev.length > 25 ? navrh.nazev.substring(0, 25) + '...' : navrh.nazev;
          doc.text(nazev, margin + 2, currentY);
          
          // Skóre s farbou
          const scoreColor = getScoreColor(navrh.weightedScore || 0);
          const rgb = hexToRgb(scoreColor);
          doc.setTextColor(rgb.r, rgb.g, rgb.b);
          doc.text(`${navrh.weightedScore || 0}%`, margin + colWidths[0] + 2, currentY);
          
          // Reset farby
          doc.setTextColor(0, 0, 0);
          doc.text(`${navrh.completionRate || 0}%`, margin + colWidths[0] + colWidths[1] + 2, currentY);
          doc.text(`${navrh.filledIndicators || 0}/${navrh.totalIndicators || 0}`, margin + colWidths[0] + colWidths[1] + colWidths[2] + 2, currentY);
          
          currentY += 6;
        });

        currentY += 10;
      }

      // Detailné porovnanie indikátorů
      setExportProgress(60);
      if (indicators.length > 0 && navrhy.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('Detailní porovnání indikátorů', margin, currentY);
        currentY += 10;

        // Zmenšíme font pre tabuľku
        doc.setFontSize(8);
        
        // Header
        const indicatorColWidth = 40;
        const navrhColWidth = 25;
        const totalWidth = indicatorColWidth + (navrhColWidth * Math.min(navrhy.length, 6)); // Max 6 návrhů
        
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, currentY - 3, totalWidth, 8, 'F');
        
        doc.setFont('helvetica', 'bold');
        doc.text('Indikátor', margin + 2, currentY);
        
        navrhy.slice(0, 6).forEach((navrh, index) => {
          const x = margin + indicatorColWidth + (navrhColWidth * index);
          const nazev = navrh.nazev.length > 8 ? navrh.nazev.substring(0, 8) + '...' : navrh.nazev;
          doc.text(nazev, x + 2, currentY);
        });
        
        currentY += 6;

        // Riadky indikátorů
        indicators.slice(0, 20).forEach((indicator, indIndex) => { // Max 20 indikátorů
          if (currentY > pageHeight - 20) {
            doc.addPage();
            currentY = 20;
          }

          doc.setFont('helvetica', 'normal');
          const nazev = indicator.nazev.length > 15 ? indicator.nazev.substring(0, 15) + '...' : indicator.nazev;
          doc.text(nazev, margin + 2, currentY);
          
          navrhy.slice(0, 6).forEach((navrh, navIndex) => {
            const x = margin + indicatorColWidth + (navrhColWidth * navIndex);
            const val = navrh.data[indicator.id];
            const actualValue = val && typeof val === 'object' && 'value' in val ? val.value : val;
            
            if (actualValue !== null && actualValue !== undefined) {
              doc.text(formatHodnota(actualValue, indicator.jednotka), x + 2, currentY);
            } else {
              doc.text('N/A', x + 2, currentY);
            }
          });
          
          currentY += 5;
        });

        currentY += 10;
      }

      // Footer
      setExportProgress(80);
      const footerY = pageHeight - 15;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(128, 128, 128);
      doc.text('Archi Evaluator - Proposal Analysis', margin, footerY);
      doc.text(`Stránka ${doc.internal.getNumberOfPages()}`, pageWidth - margin - 20, footerY);

      setExportProgress(90);

      // Uloženie PDF
      const fileName = `urban-analysis-porovnani-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      setExportProgress(100);
      
      return {
        success: true,
        fileName,
        message: 'PDF byl úspěšně vygenerován a stažen'
      };

    } catch (error) {
      console.error('Chyba při generování PDF:', error);
      return {
        success: false,
        error: error.message,
        message: 'Chyba při generování PDF'
      };
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportProgress(0), 2000);
    }
  }, []);

  // Pomocná funkcia pre konverziu hex farby na RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  };

  return {
    generatePdfReport,
    isExporting,
    exportProgress
  };
};

export default usePdfExport;
