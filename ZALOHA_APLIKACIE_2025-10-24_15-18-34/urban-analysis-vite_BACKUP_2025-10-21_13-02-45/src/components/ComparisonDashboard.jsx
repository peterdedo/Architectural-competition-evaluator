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
  SortDesc
} from 'lucide-react';
import { indikatory } from '../data/indikatory';
import ResultsSummary from './ResultsSummary';
import RadarChartAdvanced from './RadarChartAdvanced';
import PdfExportPanel from './PdfExportPanel';

const ComparisonDashboard = ({ 
  navrhy, 
  vybraneNavrhy, 
  setVybraneNavrhy, 
  vybraneIndikatory, 
  vahy = {},
  onBack 
}) => {
  const [zobrazeni, setZobrazeni] = useState('tabulka');
  const [sortBy, setSortBy] = useState('nazev');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showWeights, setShowWeights] = useState(true);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [filteredIndicators, setFilteredIndicators] = useState(new Set());

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
          
          // Normalizácia hodnoty (0-100)
          const normalizedValue = Math.min(100, Math.max(0, actualValue / 1000 * 100));
          totalScore += normalizedValue * (weight / 100);
        }
      });

      const completionRate = vybraneIndikatoryList.length > 0 
        ? (filledIndicators / vybraneIndikatoryList.length) * 100 
        : 0;

      const weightedScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

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

  const formatHodnota = (hodnota, jednotka) => {
    if (hodnota === null || hodnota === undefined) return '-';
    if (typeof hodnota === 'number') {
      return `${hodnota.toLocaleString('cs-CZ')} ${jednotka}`;
    }
    return `${String(hodnota)} ${jednotka}`;
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

        {/* Přepínač zobrazení a řazení */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'tabulka', label: 'Tabulka', icon: BarChart3 },
              { id: 'radar', label: 'Radarový graf', icon: Target },
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp }
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
              <RadarChartAdvanced 
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
    </div>
  );
};

export default ComparisonDashboard;
