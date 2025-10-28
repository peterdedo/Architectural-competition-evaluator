import { useState, useCallback } from 'react';

const useAIAssistant = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  // Simulácia AI analýzy návrhů
  const analyzeProposals = useCallback(async (navrhy, indicators, weights) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulácia postupného spracovania
      const steps = [
        'Analyzuji návrhy...',
        'Porovnávám indikátory...',
        'Vypočítávám vážené skóre...',
        'Generuji doporučení...',
        'Finalizuji analýzu...'
      ];

      for (let i = 0; i < steps.length; i++) {
        setAnalysisProgress((i + 1) * 20);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Simulované výsledky AI analýzy
      const analysis = {
        timestamp: new Date().toISOString(),
        summary: {
          totalProposals: navrhy.length,
          totalIndicators: indicators.length,
          averageScore: Math.round(navrhy.reduce((acc, navrh) => acc + (navrh.weightedScore || 0), 0) / navrhy.length),
          bestProposal: navrhy.reduce((best, current) => 
            (current.weightedScore || 0) > (best.weightedScore || 0) ? current : best
          ),
          worstProposal: navrhy.reduce((worst, current) => 
            (current.weightedScore || 0) < (worst.weightedScore || 0) ? current : worst
          )
        },
        recommendations: [
          {
            type: 'strength',
            title: 'Nejlepší návrh',
            description: `Návrh "${navrhy.reduce((best, current) => 
              (current.weightedScore || 0) > (best.weightedScore || 0) ? current : best
            ).nazev}" dosáhl nejvyššího skóre díky vynikajícímu poměru kvality a efektivity.`,
            priority: 'high'
          },
          {
            type: 'improvement',
            title: 'Oblast pro zlepšení',
            description: 'Doporučujeme věnovat pozornost indikátorům týkajícím se udržitelnosti a energetické efektivity.',
            priority: 'medium'
          },
          {
            type: 'comparison',
            title: 'Srovnávací analýza',
            description: 'Návrhy vykazují značné rozdíly v oblasti parkování a zelených ploch. Doporučujeme jednotné standardy.',
            priority: 'low'
          }
        ],
        insights: [
          'Všechny návrhy splňují základní požadavky na urbanistické řešení.',
          'Identifikovány jsou významné rozdíly v přístupu k veřejným prostorům.',
          'Doporučujeme další analýzu dopravní obslužnosti.',
          'Finanční náročnost projektů je v přijatelném rozmezí.'
        ],
        riskFactors: [
          {
            factor: 'Nedostatečná parkovací kapacita',
            severity: 'medium',
            affectedProposals: navrhy.filter(navrh => (navrh.data?.C13?.value || 0) < 800).length
          },
          {
            factor: 'Nízký podíl zelených ploch',
            severity: 'high',
            affectedProposals: navrhy.filter(navrh => (navrh.data?.C02?.value || 0) < 10000).length
          }
        ]
      };

      setLastAnalysis(analysis);
      setAnalysisProgress(100);

      return {
        success: true,
        analysis,
        message: 'AI analýza byla úspěšně dokončena'
      };

    } catch (error) {
      console.error('Chyba při AI analýze:', error);
      return {
        success: false,
        error: error.message,
        message: 'Chyba při provádění AI analýzy'
      };
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 3000);
    }
  }, []);

  // Generovanie komentára k návrhu
  const generateComment = useCallback(async (navrh, indicators, weights) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Simulácia generovania komentára
      const steps = ['Analyzuji návrh...', 'Generuji komentář...', 'Finalizuji...'];
      
      for (let i = 0; i < steps.length; i++) {
        setAnalysisProgress((i + 1) * 33);
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      const comment = {
        timestamp: new Date().toISOString(),
        proposal: navrh.nazev,
        score: navrh.weightedScore || 0,
        strengths: [
          'Dobře navržené veřejné prostory',
          'Efektivní využití pozemku',
          'Moderní architektonické řešení'
        ],
        weaknesses: [
          'Nedostatečná parkovací kapacita',
          'Omezené zelené plochy',
          'Vysoké náklady na realizaci'
        ],
        recommendations: [
          'Zvýšit počet parkovacích míst o 20%',
          'Rozšířit zelené plochy na 15% z celkové plochy',
          'Zvážit alternativní materiály pro snížení nákladů'
        ],
        overallAssessment: `Návrh "${navrh.nazev}" dosáhl skóre ${navrh.weightedScore || 0}% a vykazuje ${navrh.weightedScore >= 70 ? 'výborné' : navrh.weightedScore >= 50 ? 'dobré' : 'průměrné'} výsledky v hodnocených kritériích.`,
        priority: navrh.weightedScore >= 80 ? 'high' : navrh.weightedScore >= 60 ? 'medium' : 'low'
      };

      setAnalysisProgress(100);

      return {
        success: true,
        comment,
        message: 'Komentář byl úspěšně vygenerován'
      };

    } catch (error) {
      console.error('Chyba při generování komentáře:', error);
      return {
        success: false,
        error: error.message,
        message: 'Chyba při generování komentáře'
      };
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 2000);
    }
  }, []);

  // Porovnanie dvoch návrhov
  const compareProposals = useCallback(async (navrh1, navrh2, indicators, weights) => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const steps = ['Porovnávám návrhy...', 'Analyzuji rozdíly...', 'Generuji srovnání...'];
      
      for (let i = 0; i < steps.length; i++) {
        setAnalysisProgress((i + 1) * 33);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const comparison = {
        timestamp: new Date().toISOString(),
        proposal1: navrh1.nazev,
        proposal2: navrh2.nazev,
        score1: navrh1.weightedScore || 0,
        score2: navrh2.weightedScore || 0,
        winner: (navrh1.weightedScore || 0) > (navrh2.weightedScore || 0) ? navrh1.nazev : navrh2.nazev,
        scoreDifference: Math.abs((navrh1.weightedScore || 0) - (navrh2.weightedScore || 0)),
        keyDifferences: [
          {
            indicator: 'Celková zastavěná plocha',
            value1: navrh1.data?.C01?.value || 0,
            value2: navrh2.data?.C01?.value || 0,
            better: (navrh1.data?.C01?.value || 0) > (navrh2.data?.C01?.value || 0) ? navrh1.nazev : navrh2.nazev
          },
          {
            indicator: 'Zelené plochy',
            value1: navrh1.data?.C02?.value || 0,
            value2: navrh2.data?.C02?.value || 0,
            better: (navrh1.data?.C02?.value || 0) > (navrh2.data?.C02?.value || 0) ? navrh1.nazev : navrh2.nazev
          }
        ],
        recommendation: `Na základě analýzy doporučujeme návrh "${(navrh1.weightedScore || 0) > (navrh2.weightedScore || 0) ? navrh1.nazev : navrh2.nazev}" jako lepší řešení s ${Math.max(navrh1.weightedScore || 0, navrh2.weightedScore || 0)}% skóre.`
      };

      setAnalysisProgress(100);

      return {
        success: true,
        comparison,
        message: 'Porovnání bylo úspěšně dokončeno'
      };

    } catch (error) {
      console.error('Chyba při porovnávání:', error);
      return {
        success: false,
        error: error.message,
        message: 'Chyba při porovnávání návrhů'
      };
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 2000);
    }
  }, []);

  return {
    analyzeProposals,
    generateComment,
    compareProposals,
    isAnalyzing,
    analysisProgress,
    lastAnalysis
  };
};

export default useAIAssistant;
