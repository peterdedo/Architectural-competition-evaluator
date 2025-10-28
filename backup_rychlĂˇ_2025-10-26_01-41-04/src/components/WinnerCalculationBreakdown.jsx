import React, { useState, useMemo, useEffect, useContext } from 'react';
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
  Weight
} from 'lucide-react';
import { indikatory, kategorie } from '../data/indikatory';
import { calculateProjectScore, evaluateProjects, validateWeights, standardizeWeights } from '../engine/EvaluationEngine';
import { useWizard } from '../contexts/WizardContext';

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

  // Napojenie na globálny stav z WizardContext
  const wizardContext = useWizard();
  const globalWeights = wizardContext.weights || vahy || {};
  const globalCategoryWeights = wizardContext.categoryWeights || categoryWeights || {};
  const results = wizardContext.results || [];
  
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

  const vybraneIndikatoryList = useMemo(() => 
    indikatory.filter(ind => vybraneIndikatory.has(ind.id)),
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

        vybraneIndikatoryList.forEach(indikator => {
          const hodnota = project.data[indikator.id];
          const actualValue = hodnota && typeof hodnota === 'object' && 'value' in hodnota ? hodnota.value : hodnota;
          
          if (actualValue !== null && actualValue !== undefined) {
            // Kontrola source - zahrneme ručně doplněné hodnoty
            const source = hodnota && typeof hodnota === 'object' && 'source' in hodnota ? hodnota.source : 'unknown';
            if (source === "nenalezeno v dokumentu" && source !== "uživatelský vstup") {
              return; // Přeskočit indikátory bez hodnoty (kromě ručně doplněných)
            }
            filledIndicators++;
            const weight = globalWeights[indikator.id] || 10; // Default váha 10
            totalWeight += weight;
            
            // Pokročilá normalizácia hodnoty (0-100)
            let normalizedValue = 0;
            
            if (typeof actualValue === 'number') {
              // Pre hodnoty 0-100 (už normalizované)
              if (actualValue >= 0 && actualValue <= 100) {
                normalizedValue = actualValue;
              } else {
                // Normalizácia podľa rozsahu všetkých hodnôt pre tento indikátor
                const allValues = filteredResults
                  .map(p => p.data[indikator.id])
                  .map(v => v && typeof v === 'object' && 'value' in v ? v.value : v)
                  .filter(v => v !== null && v !== undefined && typeof v === 'number');
                
                if (allValues.length > 0) {
                  const max = Math.max(...allValues);
                  if (max > 0) {
                    normalizedValue = (actualValue / max) * 100;
                  } else {
                    normalizedValue = 0;
                  }
                }
              }
            }
            
            const weightedValue = normalizedValue * (weight / 100);
            totalScore += weightedValue;
            
            // Pridaj do detailných skóre
            detailedScores.push({
              id: indikator.id,
              nazev: indikator.nazev,
              jednotka: indikator.jednotka,
              hodnota: actualValue,
              source: hodnota && typeof hodnota === 'object' && 'source' in hodnota ? hodnota.source : 'unknown',
              weight: weight,
              categoryWeight: globalCategoryWeights[categoryNameToId[indikator.kategorie]] || (100 / Object.keys(globalCategoryWeights).length),
              finalWeight: (weight * (globalCategoryWeights[categoryNameToId[indikator.kategorie]] || (100 / Object.keys(globalCategoryWeights).length))) / 100,
              normalizedValue: normalizedValue,
              weightedValue: weightedValue,
              category: indikator.kategorie
            });
          }
        });

        const completionRate = vybraneIndikatoryList.length > 0 
          ? (filledIndicators / vybraneIndikatoryList.length) * 100 
          : 0;

        const weightedScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;
        
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Hodnocení vítězných návrhů</h1>
              <p className="text-gray-600 mt-1">
                Detailní analýza a porovnání {vybraneNavrhyData.length} vybraných návrhů
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
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 lg:p-6">
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
                    style={{width: `${Math.min(winner.weightedScore || 0, 100)}%`}}
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
            <h3 className="text-xl font-semibold text-gray-900">Poradie návrhů</h3>
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
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${
                      index === 0 
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' 
                        : index === 1 
                        ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-white'
                        : index === 2
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{navrh.nazev}</h4>
                      <p className="text-sm text-gray-500">
                        {navrh.filledIndicators}/{navrh.totalIndicators} indikátorů
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getScoreColor(navrh.weightedScore)}`}>
                        {getScoreIcon(navrh.weightedScore)}
                        {Number.isFinite(navrh.weightedScore) ? `${navrh.weightedScore.toFixed(1)}%` : "0%"}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Kompletnosť: {Number.isFinite(navrh.completionRate) ? `${navrh.completionRate}%` : "0%"}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detailné skóre */}
        {showDetails && winnerWithCategories && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Detailné skóre víťazného návrhu: {winnerWithCategories.nazev}
              </h3>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const allCategories = Object.keys(winnerWithCategories.indicatorScoresByCategory);
                    setCollapsedCategories(new Set(allCategories));
                  }}
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
            
            {/* Skupinovaná tabuľka podľa kategórií */}
            <div className="space-y-6">
              {Object.entries(winnerWithCategories.indicatorScoresByCategory).map(([categoryId, indicators]) => {
                const category = kategorie.find(cat => cat.nazev === categoryId);
                const isCollapsed = collapsedCategories.has(categoryId);
                const categoryTotal = indicators.reduce((sum, score) => sum + (score.weightedValue || 0), 0);
                
                return (
                  <div key={categoryId} className="bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    {/* Header kategórie */}
                    <div 
                      className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4 cursor-pointer hover:from-blue-100 hover:to-indigo-100 transition-all"
                      onClick={() => toggleCategory(categoryId)}
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
                          <motion.div
                            animate={{ rotate: isCollapsed ? 0 : 90 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronRight className="w-5 h-5 text-gray-500" />
                          </motion.div>
                        </div>
                      </div>
                    </div>

                    {/* Obsah kategórie */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
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
                                              {score.finalWeight?.toFixed(1) || score.weight}%
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
                                            {Number.isFinite(score.weightedValue) ? `${Math.round(score.weightedValue)}%` : "0%"}
                                          </div>
                                          <div className="w-20 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                              style={{width: `${Math.min(score.weightedValue || 0, 100)}%`}}
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
  );
};

export default WinnerCalculationBreakdown;
