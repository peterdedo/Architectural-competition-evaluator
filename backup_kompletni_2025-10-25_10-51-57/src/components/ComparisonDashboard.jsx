import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  File, 
  Trophy, 
  Check, 
  X, 
  TrendingUp, 
  Target, 
  Award, 
  Zap,
  Download,
  Settings,
  Eye,
  EyeOff,
  Star,
  Filter,
  SortAsc,
  SortDesc,
  Brain,
  Sparkles,
  Loader2
} from 'lucide-react';
import AdvancedAIAssistant from './AdvancedAIAssistant';
import { indikatory } from '../data/indikatory';
import ResultsSummary from './ResultsSummary';
import RadarChartAdvanced from './RadarChartAdvanced';
import ExpandableRadarChart from './ExpandableRadarChart';
import WeightedHeatmap from './WeightedHeatmap';
import PdfExportPanel from './PdfExportPanel';
import useAIAssistant from '../hooks/useAIAssistant';
import { useWizard } from '../contexts/WizardContext';

const ComparisonDashboard = ({ 
  navrhy, 
  vybraneNavrhy, 
  setVybraneNavrhy, 
  vybraneIndikatory, 
  vahy = {},
  setVahy,
  categoryWeights = {},
  setCategoryWeights,
  aiWeights = null,
  aiCategoryWeights = null,
  onBack 
}) => {
  const [zobrazeni, setZobrazeni] = useState('tabulka');
  const [sortBy, setSortBy] = useState('nazev');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showWeights, setShowWeights] = useState(true);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [filteredIndicators, setFilteredIndicators] = useState(new Set());
  const [showAdvancedAI, setShowAdvancedAI] = useState(false);

  // AI State
  const [aiComment, setAiComment] = useState(null);
  const [showAiComment, setShowAiComment] = useState(false);
  const [showAiWeights, setShowAiWeights] = useState(false);

  // AI Hook
  const apiKey = import.meta.env.VITE_OPENAI_KEY || '';
  const { isAnalyzing, analysisProgress, analyzeComparison, suggestWeights } = useAIAssistant(apiKey);

  // WizardContext hook
  const wizardContext = useWizard();
  const results = wizardContext?.results || [];
  const projects = wizardContext?.projects || [];

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

  // Výpočet váženého skóre pre každý návrh
  const navrhyWithScores = useMemo(() => {
    console.log('🔍 ComparisonDashboard - spracovávam návrhy:', vybraneNavrhyData.map(n => n.nazev));
    console.log('🔍 ComparisonDashboard - indikátory:', vybraneIndikatoryList.map(i => i.nazev));
    console.log('🔍 ComparisonDashboard - váhy:', vahy);
    
    return vybraneNavrhyData.map(navrh => {
      let totalScore = 0;
      let totalWeight = 0;
      let filledIndicators = 0;

      vybraneIndikatoryList.forEach(indikator => {
        const hodnota = navrh.data[indikator.id];
        const actualValue = hodnota && typeof hodnota === 'object' && 'value' in hodnota ? hodnota.value : hodnota;
        
        if (actualValue !== null && actualValue !== undefined) {
          filledIndicators++;
          const weight = vahy[indikator.id] || 10; // Default váha 10
          totalWeight += weight;
          
          // Pokročilá normalizácia hodnoty (0-100)
          let normalizedValue = 0;
          
          if (typeof actualValue === 'number') {
            // Pre hodnoty 0-100 (už normalizované)
            if (actualValue >= 0 && actualValue <= 100) {
              normalizedValue = actualValue;
            } else {
              // Normalizácia podľa rozsahu všetkých hodnôt pre tento indikátor
              const allValues = vybraneNavrhyData
                .map(n => n.data[indikator.id])
                .map(v => v && typeof v === 'object' && 'value' in v ? v.value : v)
                .filter(v => v !== null && v !== undefined && typeof v === 'number');
              
                  if (allValues.length > 0) {
                    const max = Math.max(...allValues);
                    if (max > 0) {
                      normalizedValue = (actualValue / max) * 100;
                    } else {
                      normalizedValue = 0; // Ak je maximum 0
                    }
                  }
            }
          }
          
          totalScore += normalizedValue * (weight / 100);
        }
      });

      const completionRate = vybraneIndikatoryList.length > 0 
        ? (filledIndicators / vybraneIndikatoryList.length) * 100 
        : 0;

      const weightedScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

      console.log(`📊 ${navrh.nazev}: skóre=${Math.round(weightedScore)}%, dokončenosť=${Math.round(completionRate)}%`);

      return {
        ...navrh,
        weightedScore: Math.round(weightedScore),
        completionRate: Math.round(completionRate),
        filledIndicators,
        totalIndicators: vybraneIndikatoryList.length
      };
    }).sort((a, b) => {
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
  }, [vybraneNavrhyData, vybraneIndikatoryList, vahy, sortBy, sortOrder]);

  const handleVybraniNavrhu = (navrhId) => {
    const noveVybrane = new Set(vybraneNavrhy);
    if (noveVybrane.has(navrhId)) {
      noveVybrane.delete(navrhId);
    } else {
      noveVybrane.add(navrhId);
    }
    setVybraneNavrhy(noveVybrane);
  };

  const handleVybratVse = () => {
    setVybraneNavrhy(new Set(zpracovaneNavrhy.map(n => n.id)));
  };

  const handleZrusitVse = () => {
    setVybraneNavrhy(new Set());
  };

  const handleAIReview = async () => {
    if (!apiKey) {
      alert('OpenAI API klíč není nastaven. Nastavte VITE_OPENAI_KEY v .env souboru.');
      return;
    }

    try {
      const analysisData = {
        navrhy: navrhyWithScores,
        indikatory: vybraneIndikatoryList
      };

      const result = await analyzeComparison(analysisData);
      if (result.success) {
        setAiComment(result.analysis);
        setShowAiComment(true);
      } else {
        alert(`Chyba: ${result.error}`);
      }
    } catch (error) {
      console.error('AI Review Error:', error);
      alert('Chyba při generování AI shrnutí');
    }
  };

  const handleAISuggest = async () => {
    if (!apiKey) {
      alert('OpenAI API klíč není nastaven. Nastavte VITE_OPENAI_KEY v .env souboru.');
      return;
    }

    try {
      const criteria = vybraneIndikatoryList.map(ind => ({
        id: ind.id,
        nazev: ind.nazev,
        kategorie: ind.kategorie,
        vaha: vahy[ind.id] || 10
      }));

      const result = await suggestWeights(criteria, 'urbanistická soutěž');
      if (result.success) {
        // AI váhy sa teraz spravujú cez AIWeightManager
        console.log('AI váhy generované:', result.suggestions);
        setShowAiWeights(true);
      } else {
        alert(`Chyba: ${result.error}`);
      }
    } catch (error) {
      console.error('AI Suggest Error:', error);
      alert('Chyba při návrhu vah');
    }
  };

  const formatHodnota = (hodnota, jednotka) => {
    // Ak je hodnota null, undefined alebo prázdna
    if (hodnota === null || hodnota === undefined || hodnota === '') {
      return '—';
    }
    
    // Ak je hodnota objekt, skúsme extrahovať číselnú hodnotu
    if (typeof hodnota === 'object' && hodnota !== null) {
      // Ak má objekt property 'value', použijeme ju
      if ('value' in hodnota && hodnota.value !== null && hodnota.value !== undefined) {
        const numValue = Number(hodnota.value);
        if (Number.isFinite(numValue)) {
          return `${numValue.toLocaleString('cs-CZ')} ${jednotka}`;
        }
      }
      // Ak objekt nemá 'value' property, skúsme nájsť číselnú hodnotu
      const numericValue = Object.values(hodnota).find(v => Number.isFinite(Number(v)));
      if (numericValue !== undefined) {
        return `${Number(numericValue).toLocaleString('cs-CZ')} ${jednotka}`;
      }
      // Ak sa nenašla číselná hodnota, zobrazíme pomlčku
      return '—';
    }
    
    // Ak je hodnota číslo, formátujeme ju
    if (typeof hodnota === 'number' && Number.isFinite(hodnota)) {
      return `${hodnota.toLocaleString('cs-CZ')} ${jednotka}`;
    }
    
    // Ak je hodnota string, skúsme ju konvertovať na číslo
    if (typeof hodnota === 'string') {
      const numValue = Number(hodnota);
      if (Number.isFinite(numValue)) {
        return `${numValue.toLocaleString('cs-CZ')} ${jednotka}`;
      }
    }
    
    // Pre všetky ostatné prípady zobrazíme pomlčku
    return '—';
  };

  const getNejlepsiHodnota = (indikatorId) => {
    const indikator = indikatory.find(i => i.id === indikatorId);
    if (!indikator) return null;

    const hodnoty = vybraneNavrhyData
      .map(navrh => {
        const val = navrh.data[indikatorId];
        return val && typeof val === 'object' && 'value' in val ? val.value : val;
      })
      .filter(v => v !== null && v !== undefined);

    if (hodnoty.length === 0) return null;

    return indikator.lower_better 
      ? Math.min(...hodnoty)
      : Math.max(...hodnoty);
  };

  const isNejlepsiHodnota = (navrh, indikatorId) => {
    const nejlepsiHodnota = getNejlepsiHodnota(indikatorId);
    const navrhHodnota = navrh.data[indikatorId];
    const actualNavrhHodnota = navrhHodnota && typeof navrhHodnota === 'object' && 'value' in navrhHodnota ? navrhHodnota.value : navrhHodnota;
    return nejlepsiHodnota !== null && actualNavrhHodnota === nejlepsiHodnota;
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <Trophy className="w-4 h-4" />;
    if (score >= 60) return <Award className="w-4 h-4" />;
    if (score >= 40) return <Target className="w-4 h-4" />;
    return <X className="w-4 h-4" />;
  };

  if (zpracovaneNavrhy.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-100 to-green-100 rounded-full flex items-center justify-center">
            <BarChart3 size={40} className="text-blue-600" />
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
      {/* Header s akciami */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Porovnání návrhů</h1>
              <p className="text-gray-600 mt-1">
                Moderní analytický dashboard pro {vybraneNavrhyData.length} vybraných návrhů
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <motion.button
                onClick={() => setShowAdvancedAI(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Brain size={18} />
                AI Asistent
              </motion.button>



              <motion.button
                onClick={() => setShowWeights(!showWeights)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  showWeights 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {showWeights ? <Eye size={18} /> : <EyeOff size={18} />}
                {showWeights ? 'Skrýt váhy' : 'Zobrazit váhy'}
              </motion.button>

              <motion.button
                onClick={() => setShowExportPanel(true)}
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
        {/* Výběr návrhů */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Výběr návrhů k porovnání</h2>
            <div className="flex gap-3">
              <motion.button
                onClick={handleVybratVse}
                className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium hover:bg-green-200 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Check size={18} />
                Vybrat vše
              </motion.button>
              <motion.button
                onClick={handleZrusitVse}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium hover:bg-red-200 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X size={18} />
                Zrušit výběr
              </motion.button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {zpracovaneNavrhy.map(navrh => (
              <motion.label
                key={navrh.id}
                className={`
                  relative flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                  ${vybraneNavrhy.has(navrh.id) 
                    ? 'border-blue-500 bg-blue-50 shadow-md' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                  }
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="checkbox"
                  checked={vybraneNavrhy.has(navrh.id)}
                  onChange={() => handleVybraniNavrhu(navrh.id)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 truncate">{navrh.nazev}</div>
                  <div className="text-sm text-gray-500">
                    {Object.keys(navrh.data).length} indikátorů
                  </div>
                </div>
                {vybraneNavrhy.has(navrh.id) && (
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                )}
              </motion.label>
            ))}
          </div>
        </motion.div>


        {/* AI Výstupy */}
        <AnimatePresence>
          {showAiComment && aiComment && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-blue-50 border border-blue-200 rounded-2xl p-6 shadow-sm mb-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <Brain size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-900">🧠 AI Shrnutí porovnání</h3>
                    <p className="text-sm text-blue-700">Automaticky vygenerované hodnocení návrhů</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiComment(false)}
                  className="p-2 text-blue-400 hover:text-blue-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed text-sm">{aiComment}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI váhy sa teraz spravujú cez AIWeightManager */}

        {/* Přepínač zobrazení a řazení */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'tabulka', label: 'Tabulka', icon: BarChart3 },
              { id: 'radar', label: 'Radarový graf', icon: Target },
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'heatmapa', label: 'Heatmapa', icon: Zap }
            ].map(({ id, label, icon: Icon }) => (
              <motion.button
                key={id}
                onClick={() => setZobrazeni(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  zobrazeni === id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon size={18} />
                {label}
              </motion.button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="nazev">Podle názvu</option>
              <option value="score">Podle skóre</option>
              <option value="completion">Podle kompletace</option>
            </select>
            <motion.button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {sortOrder === 'asc' ? <SortAsc size={18} /> : <SortDesc size={18} />}
            </motion.button>
          </div>
        </div>

        {/* Hlavní obsah */}
        <AnimatePresence mode="wait">
          {zobrazeni === 'tabulka' && vybraneNavrhyData.length > 0 && (
            <motion.div
              key="table-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-900 min-w-[300px]">Indikátor</th>
                      <th className="text-center p-4 font-semibold text-gray-900 w-24">Jednotka</th>
                      {showWeights && (
                        <th className="text-center p-4 font-semibold text-gray-900 w-20">Váha</th>
                      )}
                      {navrhyWithScores.map((navrh) => (
                        <th key={navrh.id} className="text-center p-4 font-semibold text-gray-900 min-w-[200px]">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-green-500 rounded-lg flex items-center justify-center">
                                <File size={16} className="text-white" />
                              </div>
                              <span className="font-semibold text-sm truncate max-w-[150px]">{navrh.nazev}</span>
                            </div>
                            <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(navrh.weightedScore)}`}>
                              {getScoreIcon(navrh.weightedScore)}
                              {navrh.weightedScore}%
                            </div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vybraneIndikatoryList.map((indikator) => (
                      <tr key={indikator.id} className="border-t border-gray-200 hover:bg-gray-50 transition-colors">
                        <td className="p-4">
                          <div>
                            <div className="font-medium text-gray-900">{indikator.nazev}</div>
                            <div className="text-sm text-gray-500 mt-1">{indikator.popis}</div>
                          </div>
                        </td>
                        <td className="text-center p-4 text-gray-500">{indikator.jednotka || '—'}</td>
                        {showWeights && (
                          <td className="text-center p-4 text-gray-500">
                            {vahy[indikator.id] ? `${vahy[indikator.id]}%` : '10%'}
                          </td>
                        )}
                        {navrhyWithScores.map((navrh) => {
                          const val = navrh.data[indikator.id];
                          const isBest = isNejlepsiHodnota(navrh, indikator.id);
                          const actualValue = val && typeof val === 'object' && 'value' in val ? val.value : val;
                          
                          return (
                            <td key={navrh.id} className={`text-center p-4 ${isBest ? 'bg-green-50 font-medium' : ''}`}>
                              {actualValue != null && actualValue !== '' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <span className="font-mono text-sm">{formatHodnota(actualValue, indikator.jednotka)}</span>
                                  {isBest && <Trophy size={16} className="text-yellow-500" />}
                                </div>
                              ) : (
                                <span className="text-gray-400 text-sm">N/A</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {zobrazeni === 'radar' && vybraneNavrhyData.length > 0 && (
            <motion.div
              key="radar-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <ExpandableRadarChart 
                data={navrhyWithScores}
                indicators={vybraneIndikatoryList}
                weights={vahy}
              />
            </motion.div>
          )}

          {zobrazeni === 'dashboard' && vybraneNavrhyData.length > 0 && (
            <motion.div
              key="dashboard-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <ResultsSummary 
                vybraneNavrhyData={navrhyWithScores} 
                vybraneIndikatoryList={vybraneIndikatoryList} 
                weights={vahy}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Vážená heatmapa */}
        <AnimatePresence mode="wait">
          {zobrazeni === 'heatmapa' && vybraneNavrhyData.length > 0 && (
            <motion.div
              key="heatmap-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
            >
              <WeightedHeatmap
                vybraneNavrhyData={navrhyWithScores}
                vybraneIndikatoryList={vybraneIndikatoryList}
                vahy={vahy}
                categoryWeights={categoryWeights}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {vybraneNavrhyData.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
              <BarChart3 size={40} className="text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Vyberte návrhy k porovnání</h3>
            <p className="text-gray-500">Označte alespoň jeden návrh pro zobrazení porovnání.</p>
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

      {/* PDF Export Panel */}
      <PdfExportPanel
        isOpen={showExportPanel}
        onClose={() => setShowExportPanel(false)}
        data={{
          navrhy: navrhyWithScores,
          indicators: vybraneIndikatoryList,
          weights: vahy,
          viewType: zobrazeni
        }}
      />


      {/* Advanced AI Assistant */}
      <AnimatePresence>
        {showAdvancedAI && (
          <AdvancedAIAssistant
            indikatory={indikatory}
            vybraneIndikatory={vybraneIndikatory}
            vahy={vahy}
            setVahy={setVahy}
            categoryWeights={categoryWeights}
            setCategoryWeights={setCategoryWeights}
            navrhy={navrhy}
            vybraneNavrhy={vybraneNavrhy}
            onClose={() => setShowAdvancedAI(false)}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default ComparisonDashboard;
