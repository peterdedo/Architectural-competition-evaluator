import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Award, 
  Target, 
  TrendingUp, 
  BarChart3, 
  Calculator,
  Star,
  CheckCircle,
  AlertCircle,
  Info,
  Download,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Layers,
  Weight,
  X
} from 'lucide-react';
import { indikatory, kategorie } from '../data/indikatory';
import { calculateProjectScore, evaluateProjects, validateWeights, standardizeWeights } from '../engine/EvaluationEngine';
import { useWizard } from '../contexts/WizardContext';
import { withoutLegacyExcludedById } from '../config/legacyIndicatorFilters';

const WinnerCalculationBreakdown = ({ 
  navrhy, 
  vybraneNavrhy, 
  vybraneIndikatory, 
  vahy = {},
  categoryWeights = {},
  aiWeights = null,
  aiCategoryWeights = null,
  onBack 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [collapsedCategories, setCollapsedCategories] = useState(new Set());
  const [expandedProposals, setExpandedProposals] = useState(new Set());

  // Funkcie pre zbalenie/rozbalenie skupín
  const toggleCategory = (categoryId) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // Funkcie pre rozbalenie/sbalenie návrhů
  const toggleProposal = (proposalId) => {
    setExpandedProposals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(proposalId)) {
        newSet.delete(proposalId);
      } else {
        newSet.add(proposalId);
      }
      return newSet;
    });
  };

  // Napojenie na globálny stav z WizardContext
  const wizardContext = useWizard();
  const globalWeights = wizardContext.weights || vahy || {};
  const globalCategoryWeights = wizardContext.categoryWeights || categoryWeights || {};
  const results = wizardContext.results || [];

  // Parser pre číselné hodnoty - handles all data formats including manually entered values
  const parseNumericValue = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "object" && "value" in val)
      return parseNumericValue(val.value);
    const numericStr = String(val)
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".");
    const parsed = Number(numericStr);
    return isNaN(parsed) ? null : parsed;
  };
  
  // Mapovanie názvov kategórií na ID
  const categoryNameToId = {
    'Využití území': 'vyuziti-uzemi',
    'Intenzita využití': 'intenzita-vyuziti',
    'Funkční rozvržení': 'funkcni-rozvrzeni',
    'Doprava a parkování': 'doprava-parkovani',
    'Hustota osídlení a zaměstnanosti': 'hustota-osidleni',
    'Nákladová efektivita': 'nakladova-efektivita',
    'Kvalita veřejného prostoru a krajiny': 'kvalita-verejneho-prostoru',
    'Urbanistická kvalita': 'urbanisticka-kvalita'
  };

  // Filtrované a spracované návrhy
  const zpracovaneNavrhy = useMemo(() => 
    navrhy.filter(navrh => navrh.status === 'zpracován' && navrh.data && Object.keys(navrh.data).length > 0),
    [navrhy]
  );

  const vybraneIndikatoryList = useMemo(
    () =>
      withoutLegacyExcludedById(
        indikatory.filter((ind) => vybraneIndikatory.has(ind.id))
      ),
    [vybraneIndikatory]
  );

  const vybraneNavrhyData = useMemo(() => 
    zpracovaneNavrhy.filter(navrh => vybraneNavrhy.has(navrh.id)),
    [zpracovaneNavrhy, vybraneNavrhy]
  );

  // Vytvorenie štandardizovanej štruktúry váh pre EvaluationEngine
  const standardizedWeights = useMemo(() => {
    const weights = {};
    
    // Skupina indikátorů podle kategorií
    const indicatorsByCategory = {};
    vybraneIndikatoryList.forEach(indikator => {
      if (!indicatorsByCategory[indikator.kategorie]) {
        indicatorsByCategory[indikator.kategorie] = [];
      }
      indicatorsByCategory[indikator.kategorie].push(indikator);
    });

    // Vytvor štruktúru váh pre EvaluationEngine
    Object.entries(indicatorsByCategory).forEach(([categoryId, categoryIndicators]) => {
      const categoryWeight = globalCategoryWeights[categoryId] || (100 / Object.keys(indicatorsByCategory).length);
      
      weights[categoryId] = {
        weight: categoryWeight,
        indicators: {}
      };
      
      categoryIndicators.forEach(indikator => {
        const indicatorWeight = globalWeights[indikator.id] || 10;
        weights[categoryId].indicators[indikator.id] = {
          weight: indicatorWeight
        };
      });
    });

    return standardizeWeights(weights);
  }, [globalWeights, globalCategoryWeights, vybraneIndikatoryList]);

  // Použitie results z WizardContext s fallback výpočtom
  const navrhyWithScores = useMemo(() => {
    console.log('[WinnerCalculationBreakdown] Debug - results:', results);
    console.log('[WinnerCalculationBreakdown] Debug - vybraneNavrhyData:', vybraneNavrhyData);
    console.log('[WinnerCalculationBreakdown] Debug - standardizedWeights:', standardizedWeights);
    
    let projectsToProcess = [];
    
    if (results.length > 0) {
      // Použi results z WizardContext
      projectsToProcess = results.filter(project => vybraneNavrhy.has(project.id));
      console.log('[WinnerCalculationBreakdown] Používam results z kontextu:', projectsToProcess.length);
    } else {
      // Fallback - vypočítaj skóre lokálne
      console.log('[WinnerCalculationBreakdown] Fallback - vypočítavam skóre lokálne');
      try {
        projectsToProcess = evaluateProjects(vybraneNavrhyData, standardizedWeights);
        console.log('[WinnerCalculationBreakdown] Lokálne vypočítané skóre:', projectsToProcess);
      } catch (error) {
        console.error('[WinnerCalculationBreakdown] Chyba pri lokálnom výpočte:', error);
        return [];
      }
    }
    
    if (projectsToProcess.length === 0) {
      console.warn('[WinnerCalculationBreakdown] Žiadne projekty na spracovanie');
      return [];
    }
    
    try {
      // Filtruj len vybrané návrhy
      const filteredResults = projectsToProcess;
      
      // Lokálny výpočet skóre - podobne ako v StepResults a StepComparison
      const navrhyWithDetails = filteredResults.map(project => {
        let totalScore = 0;
        let totalWeight = 0;
        let filledIndicators = 0;
        const detailedScores = [];

        vybraneIndikatoryList.forEach((indikator) => {
          const hodnota = project.data[indikator.id];
          const actualValue = parseNumericValue(hodnota);
          
          if (actualValue !== null && actualValue !== undefined) {
            // Kontrola source - zahrneme ručně doplněné hodnoty
            const source = hodnota && typeof hodnota === 'object' && 'source' in hodnota ? hodnota.source : 'unknown';
            // Vynecháme len hodnoty bez hodnoty (nenalezeno v dokumentu bez ručného doplnenia)
            if (source === "nenalezeno v dokumentu" && (actualValue === null || actualValue === undefined)) {
              return; // Přeskočit indikátory bez hodnoty
            }
            filledIndicators++;
            const weight = globalWeights[indikator.id] || 10; // Default váha 10
            totalWeight += weight;
            
            // Normalizácia hodnoty (0-100)
            let normalizedValue = 0;
            
            // Získaj všetky hodnoty pre tento indikátor
            const allValues = filteredResults
              .map(p => parseNumericValue(p.data[indikator.id]))
              .filter(v => v !== null && !isNaN(v));
            
            if (allValues.length > 0) {
              const max = Math.max(...allValues);
              if (max > 0) {
                normalizedValue = (actualValue / max) * 100;
              } else {
                // Fallback: ak je hodnota platná ale max je 0, nastav na 100%
                normalizedValue = actualValue ? 100 : 0;
              }
            }
            
            // Správny výpočet: Normalizované skóre × Váha indikátoru × Váha kategórie
            const categoryWeight = globalCategoryWeights[categoryNameToId[indikator.kategorie]] || (100 / Object.keys(globalCategoryWeights).length);
            const weightedValue = (normalizedValue / 100) * (weight / 100) * (categoryWeight / 100) * 100;
            totalScore += weightedValue;
            
            // Pridaj do detailných skóre
            detailedScores.push({
              id: indikator.id,
              nazev: indikator.nazev,
              jednotka: indikator.jednotka,
              hodnota: actualValue,
              source: hodnota && typeof hodnota === 'object' && 'source' in hodnota ? hodnota.source : 'unknown',
              weight: weight,
              categoryWeight: categoryWeight,
              finalWeight: weight, // Zobrazujeme základnú váhu indikátoru
              normalizedValue: normalizedValue,
              weightedValue: weightedValue,
              category: indikator.kategorie
            });
          }
        });

        const completionRate = vybraneIndikatoryList.length > 0 
          ? (filledIndicators / vybraneIndikatoryList.length) * 100 
          : 0;

        // Celkové skóre je súčet všetkých vážených hodnôt
        const weightedScore = totalScore;
        
        return {
          ...project,
          indicatorScores: detailedScores,
          totalIndicators: vybraneIndikatoryList.length,
          totalWeight: totalWeight,
          weightedScore: Math.round(weightedScore * 10) / 10, // Zaokrúhli na 1 desatinné miesto
          originalScore: weightedScore,
          completionRate: Math.round(completionRate),
          filledIndicators: filledIndicators
        };
      });

      // Zoradenie podľa zvoleného kritéria
      return navrhyWithDetails.sort((a, b) => {
        if (sortBy === 'score') {
          return sortOrder === 'asc' ? a.weightedScore - b.weightedScore : b.weightedScore - a.weightedScore;
        } else if (sortBy === 'completion') {
          return sortOrder === 'asc' ? a.completionRate - b.completionRate : b.completionRate - a.completionRate;
        } else {
          return sortOrder === 'asc' 
            ? a.nazev.localeCompare(b.nazev) 
            : b.nazev.localeCompare(a.nazev);
        }
      });
      
    } catch (error) {
      console.error('[WinnerCalculationBreakdown] Chyba pri výpočte skóre:', error);
      return [];
    }
  }, [results, vybraneNavrhy, vybraneNavrhyData, sortBy, sortOrder, vybraneIndikatoryList, globalWeights, globalCategoryWeights, standardizedWeights]);

  // Nájdenie víťaza
  const winner = navrhyWithScores.length > 0 ? navrhyWithScores[0] : null;
  
  // Funkcia pre generovanie Executive Summary
  const generateExecutiveSummary = useMemo(() => {
    if (!winner || !winner.indicatorScores) return null;
    
    // Skupinovať indikátory podľa kategórií
    const categories = {};
    winner.indicatorScores.forEach(score => {
      if (!categories[score.category]) {
        categories[score.category] = { scores: [], totalScore: 0 };
      }
      categories[score.category].scores.push(score);
      categories[score.category].totalScore += score.weightedValue || 0;
    });
    
    // Zoradiť kategórie podľa skóre
    const sortedCategories = Object.entries(categories)
      .sort((a, b) => b[1].totalScore - a[1].totalScore)
      .slice(0, 2);
    
    if (sortedCategories.length === 0) return null;
    
    const topCategoryNames = sortedCategories.map(([catName]) => catName).join(" a ");
    const winnerScore = winner.weightedScore.toFixed(1);
    const gapToSecond = navrhyWithScores.length > 1 
      ? (winner.weightedScore - navrhyWithScores[1].weightedScore).toFixed(1)
      : null;
    
    let summary = `🏆 Návrh **${winner.nazev}** dosáhl najvyššie skóre **${winnerScore}%** vďaka vynikajúcim výsledkom v kategóriách **${topCategoryNames}**.`;
    
    if (gapToSecond && parseFloat(gapToSecond) > 0) {
      summary += ` Vedie o **${gapToSecond}%** pred druhým návrhom.`;
    }
    
    return summary;
  }, [winner, navrhyWithScores]);
  
  // Skupinovanie indikátorov podľa kategórií pre víťaza
  const winnerWithCategories = useMemo(() => {
    if (!winner || !winner.indicatorScores) return null;
    
    const indicatorScoresByCategory = {};
    winner.indicatorScores.forEach(score => {
      const categoryId = score.category;
      if (!indicatorScoresByCategory[categoryId]) {
        indicatorScoresByCategory[categoryId] = [];
      }
      indicatorScoresByCategory[categoryId].push(score);
    });
    
    return {
      ...winner,
      indicatorScoresByCategory
    };
  }, [winner]);

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'bg-gradient-to-br from-green-50 to-green-100 border-green-300';
    if (score >= 60) return 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-300';
    if (score >= 40) return 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-300';
    return 'bg-gradient-to-br from-red-50 to-red-100 border-red-300';
  };

  const getScoreBarColor = (score) => {
    if (score >= 80) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (score >= 40) return 'bg-gradient-to-r from-orange-400 to-orange-600';
    return 'bg-gradient-to-r from-red-400 to-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <Trophy className="w-5 h-5" />;
    if (score >= 60) return <Award className="w-5 h-5" />;
    if (score >= 40) return <Target className="w-5 h-5" />;
    return <AlertCircle className="w-5 h-5" />;
  };

  const formatHodnota = (hodnota, jednotka) => {
    if (hodnota === null || hodnota === undefined) return '-';
    if (typeof hodnota === 'number') {
      return `${hodnota.toLocaleString('cs-CZ')} ${jednotka}`;
    }
    return `${String(hodnota)} ${jednotka}`;
  };

  // Validácia dát
  if (!results || results.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
            <Trophy size={40} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Data nejsou k dispozici</h3>
          <p className="text-gray-600 mb-8">
            Nejdříve zpracujte návrhy a nastavte váhy pro výpočet skóre.
          </p>
          <motion.button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Zpět na Výsledky analýzy
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (zpracovaneNavrhy.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
            <Trophy size={40} className="text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">Nejdříve zpracujte návrhy</h3>
          <p className="text-gray-600 mb-8">
            Přejděte na krok "Nahrání návrhů" a zpracujte PDF dokumenty pro analýzu.
          </p>
          <motion.button
            onClick={onBack}
            className="w-full bg-gradient-to-r from-blue-600 to-green-500 text-white px-6 py-4 rounded-xl font-semibold text-lg hover:shadow-lg transition-all duration-200"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ← Zpět na Výsledky analýzy
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Trophy size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Hodnocení vítězných návrhů</h2>
              <p className="text-blue-100">Detailný výpočet skóre a porovnanie návrhov</p>
            </div>
          </div>
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>
      
      <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Detailní analýza</h1>
              <p className="text-gray-600 mt-1">
                Porovnání {vybraneNavrhyData.length} vybraných návrhů
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  showDetails 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showDetails ? <Eye size={18} /> : <EyeOff size={18} />}
                {showDetails ? 'Skrýt detaily' : 'Zobrazit detaily'}
              </motion.button>

              <motion.button
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Download size={18} />
                Export do PDF
              </motion.button>
            </div>
          </div>

        {/* Executive Summary */}
        {generateExecutiveSummary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Info className="text-white" size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Executive Summary</h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {generateExecutiveSummary}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Víťaz */}
        {winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-6 mb-8"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                <Trophy size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  🏆 Víťazný návrh: {winner.nazev}
                </h2>
                <p className="text-gray-600">
                  Celkové skóre: {Number.isFinite(winner.weightedScore) ? `${winner.weightedScore.toFixed(1)}%` : "0%"} | Kompletnosť: {Number.isFinite(winner.completionRate) ? `${winner.completionRate}%` : "0%"}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-xl p-4 border-2 ${getScoreGradient(winner.weightedScore)}`}>
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={20} className="text-yellow-600" />
                  <span className="font-semibold text-gray-900">Celkové skóre</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(winner.weightedScore).split(' ')[0]}`}>
                  {Number.isFinite(winner.weightedScore) ? `${winner.weightedScore.toFixed(1)}%` : "0%"}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(winner.weightedScore)}`}
                    style={{width: `${Math.min((winner.weightedScore || 0) * 10, 100)}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="font-semibold text-gray-900">Kompletnosť</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {Number.isFinite(winner.completionRate) ? `${winner.completionRate.toFixed(1)}%` : "0%"}
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{width: `${Math.min(winner.completionRate || 0, 100)}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 size={20} className="text-blue-600" />
                  <span className="font-semibold text-gray-900">Indikátory</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {winner.filledIndicators}/{winner.totalIndicators}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Poradie všetkých návrhov */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Poradie všech návrhů</h3>
              <p className="text-sm text-gray-600 mt-1">
                Kompletní přehled všech {navrhyWithScores.length} návrhů s jejich hodnocením
              </p>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="score">Podle skóre</option>
                <option value="completion">Podle kompletace</option>
                <option value="nazev">Podle názvu</option>
              </select>
              <motion.button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </motion.button>
              <motion.button
                onClick={() => {
                  if (expandedProposals.size === navrhyWithScores.length) {
                    setExpandedProposals(new Set());
                  } else {
                    setExpandedProposals(new Set(navrhyWithScores.map(n => n.id)));
                  }
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Layers size={16} />
                {expandedProposals.size === navrhyWithScores.length ? 'Skrýt vše' : 'Rozbalit vše'}
              </motion.button>
            </div>
          </div>

          <div className="space-y-4">
            {navrhyWithScores.map((navrh, index) => (
              <motion.div
                key={navrh.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  index === 0 
                    ? 'border-yellow-300 bg-gradient-to-r from-yellow-50 to-orange-50' 
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                        : index === 1 
                        ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index === 0 ? <Trophy size={20} /> : index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{navrh.nazev}</h4>
                      <p className="text-sm text-gray-500">
                        {navrh.filledIndicators}/{navrh.totalIndicators} indikátorů
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Celkové skóre */}
                    <div className="text-center">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(navrh.weightedScore)}`}>
                        {getScoreIcon(navrh.weightedScore)}
                        {Number.isFinite(navrh.weightedScore) ? `${navrh.weightedScore.toFixed(1)}%` : "0%"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Celkové skóre</div>
                    </div>
                    
                    {/* Kompletnost */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-700">
                        <CheckCircle size={14} />
                        {Number.isFinite(navrh.completionRate) ? `${navrh.completionRate}%` : "0%"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Kompletnost</div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-24">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-500 ${getScoreBarColor(navrh.weightedScore)}`}
                          style={{width: `${Math.min((navrh.weightedScore || 0) * 10, 100)}%`}}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Tlačítko pro rozbalení detailů */}
                    <motion.button
                      onClick={() => toggleProposal(navrh.id)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {expandedProposals.has(navrh.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      {expandedProposals.has(navrh.id) ? 'Skrýt detaily' : 'Zobrazit detaily'}
                    </motion.button>
                  </div>
                </div>
                
                {/* Rozbalovací sekce s detailními skóre */}
                <AnimatePresence>
                  {expandedProposals.has(navrh.id) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-4 pt-4 border-t border-gray-200"
                    >
                      <h5 className="text-sm font-semibold text-gray-700 mb-3">Detailní skóre podle kategorií</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {navrh.indicatorScores && Object.entries(
                          navrh.indicatorScores.reduce((acc, score) => {
                            if (!acc[score.category]) acc[score.category] = [];
                            acc[score.category].push(score);
                            return acc;
                          }, {})
                        ).map(([category, scores]) => (
                          <div key={category} className="bg-gray-50 rounded-lg p-3">
                            <h6 className="text-xs font-semibold text-gray-600 mb-2">{category}</h6>
                            <div className="space-y-2">
                              {scores.map(score => (
                                <div key={score.id} className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600 truncate">{score.nazev}</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium text-blue-600">{score.normalizedValue.toFixed(1)}%</span>
                                    <span className="text-gray-400">×</span>
                                    <span className="font-medium text-purple-600">{score.weight}%</span>
                                    <span className="text-gray-400">×</span>
                                    <span className="font-medium text-orange-600">{score.categoryWeight.toFixed(1)}%</span>
                                    <span className="text-gray-400">=</span>
                                    <span className="font-bold text-green-600">{score.weightedValue.toFixed(1)}%</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detailné skóre pro všechny návrhy */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Detailné skóre všech návrhů
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setCollapsedCategories(new Set(navrhyWithScores.map(n => `proposal-${n.id}`)))}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Zbaliť všetko
                </button>
                <button
                  onClick={() => setCollapsedCategories(new Set())}
                  className="px-3 py-1.5 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  Rozbaliť všetko
                </button>
              </div>
            </div>
            
            {/* Detailní rozbor pro každý návrh */}
            <div className="space-y-8">
              {navrhyWithScores.map((navrh) => {
                // Group indicators by category for this proposal
                const indicatorsByCategory = {};
                navrh.indicatorScores?.forEach(score => {
                  if (!indicatorsByCategory[score.category]) {
                    indicatorsByCategory[score.category] = [];
                  }
                  indicatorsByCategory[score.category].push(score);
                });
                
                const isProposalCollapsed = collapsedCategories.has(`proposal-${navrh.id}`);
                
                return (
                  <div key={navrh.id} className="border-2 border-purple-200 rounded-xl overflow-hidden">
                    {/* Header návrhu */}
                    <div 
                      className="bg-purple-50 p-4 cursor-pointer hover:bg-purple-100 transition-all"
                      onClick={() => {
                        const key = `proposal-${navrh.id}`;
                        setCollapsedCategories(prev => {
                          const newSet = new Set(prev);
                          if (newSet.has(key)) {
                            newSet.delete(key);
                          } else {
                            newSet.add(key);
                          }
                          return newSet;
                        });
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-lg font-bold text-purple-900">
                          📊 {navrh.nazev} - Detailné skóre
                        </h4>
                        <motion.div
                          animate={{ rotate: isProposalCollapsed ? 0 : 180 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronRight className="w-6 h-6 text-purple-600" />
                        </motion.div>
                      </div>
                    </div>
                    
                    {/* Obsah návrhu */}
                    <AnimatePresence>
                      {!isProposalCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 space-y-6 bg-white">
                            {Object.entries(indicatorsByCategory).map(([categoryId, indicators]) => {
                              const category = kategorie.find(cat => cat.nazev === categoryId);
                              const isCollapsed = collapsedCategories.has(categoryId);
                              const categoryTotal = indicators.reduce((sum, score) => sum + (score.weightedValue || 0), 0);
                              
                              return (
                                <div key={`${categoryId}-${navrh.id}`} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                                  {/* Header kategórie */}
                                  <div 
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4"
                                  >
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{category?.ikona || '📊'}</span>
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-lg">{category?.nazev || categoryId}</h4>
                            <p className="text-sm text-gray-600">
                              {indicators.length} indikátorů • Celkové skóre: {categoryTotal.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="text-lg font-bold text-blue-600">
                              {categoryTotal.toFixed(1)}%
                            </div>
                            <div className="text-xs text-gray-500">
                              {globalCategoryWeights[categoryId]?.toFixed(1) || 0}% váha kategórie
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                                  {/* Obsah kategórie */}
                                  <div className="p-4">
                                    <div className="overflow-x-auto">
                              <table className="w-full min-w-[800px]">
                                <thead className="bg-white">
                                  <tr>
                                    <th className="text-left p-3 font-semibold text-gray-900">Indikátor</th>
                                    <th className="text-center p-3 font-semibold text-gray-900">Hodnota</th>
                                    <th className="text-center p-3 font-semibold text-gray-900 bg-blue-50 text-blue-800">
                                      <div className="flex items-center justify-center gap-1">
                                        <Weight className="w-4 h-4" />
                                        Váha
                                      </div>
                                    </th>
                                    <th className="text-center p-3 font-semibold text-gray-900 bg-green-50 text-green-800">
                                      Normalizovaná
                                    </th>
                                    <th className="text-center p-3 font-semibold text-gray-900 bg-purple-50 text-purple-800">
                                      Vážené skóre
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {indicators.map((score, index) => (
                                    <tr key={score.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                                      <td className="p-3">
                                        <div className="font-medium text-gray-900">{score.nazev}</div>
                                        <div className="text-sm text-gray-500">{score.jednotka}</div>
                                      </td>
                                      <td className="text-center p-3 font-mono text-sm text-gray-700">
                                        <div className="flex items-center justify-center gap-1">
                                          {formatHodnota(score.hodnota, score.jednotka)}
                                          {score.source === "uživatelský vstup" && (
                                            <span title="Ručně zadáno" className="text-blue-500 ml-1">✏️</span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="text-center p-3 bg-blue-50">
                                        <div className="flex flex-col items-center gap-1">
                                          <div className="flex items-center gap-1">
                                            <span className="font-bold text-lg text-blue-800">
                                              {score.weight}%
                                            </span>
                                            {aiWeights?.indicators?.[score.id] && (
                                              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                                <Star className="w-3 h-3" />
                                                AI
                                              </div>
                                            )}
                                          </div>
                                          <div className="text-xs text-blue-600">
                                            {score.categoryWeight && `Kategória: ${score.categoryWeight.toFixed(1)}%`}
                                          </div>
                                        </div>
                                      </td>
                                      <td className="text-center p-3 bg-green-50">
                                        <div className="flex flex-col items-center gap-1">
                                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                                            {Number.isFinite(score.normalizedValue) ? `${Math.round(score.normalizedValue)}%` : "0%"}
                                          </div>
                                          <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                              style={{width: `${Math.min(score.normalizedValue || 0, 100)}%`}}
                                            ></div>
                                          </div>
                                        </div>
                                      </td>
                                      <td className="text-center p-3 bg-purple-50">
                                        <div className="flex flex-col items-center gap-1">
                                          <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-bold">
                                            {Number.isFinite(score.weightedValue) ? `${score.weightedValue.toFixed(1)}%` : "0%"}
                                          </div>
                                          <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                              style={{width: `${Math.min((score.weightedValue || 0) * 10, 100)}%`}}
                                            ></div>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Kategorie vah */}
        {Object.keys(categoryWeights).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Váhy kategorií
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(categoryWeights).map(([categoryId, weight]) => {
                const category = kategorie.find(cat => cat.nazev === categoryId);
                return (
                  <div key={categoryId} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-gray-900">{category?.nazev || categoryId}</h4>
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold text-blue-600">{weight}%</div>
                        {aiCategoryWeights?.categoryWeights?.[categoryId] && (
                          <div className="flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs">
                            <Star className="w-3 h-3" />
                            AI
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${weight}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

          {/* Navigačné tlačidlá */}
          <motion.div
            className="flex justify-between items-center pt-8 border-t border-gray-200 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <motion.button
              onClick={onBack}
              className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Zpět na Výsledky analýzy
            </motion.button>
          </motion.div>
        </div>
      </div>
      </motion.div>
    </motion.div>
  );
};

export default WinnerCalculationBreakdown;
