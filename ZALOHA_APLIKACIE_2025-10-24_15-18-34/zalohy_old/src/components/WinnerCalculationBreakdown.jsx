import React, { useState, useMemo } from 'react';
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
  EyeOff
} from 'lucide-react';

const WinnerCalculationBreakdown = ({ 
  navrhy, 
  vybraneNavrhy, 
  vybraneIndikatory, 
  vahy = {},
  onBack 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');

  // Filtrované a spracované návrhy
  const zpracovaneNavrhy = useMemo(() => 
    navrhy.filter(navrh => navrh.status === 'zpracován' && navrh.data && Object.keys(navrh.data).length > 0),
    [navrhy]
  );

  const vybraneIndikatoryList = useMemo(() => 
    Array.from(vybraneIndikatory).map(id => ({ id, nazev: `Indikátor ${id}`, jednotka: 'ks' })),
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
      const indicatorScores = [];

      vybraneIndikatoryList.forEach(indikator => {
        const hodnota = navrh.data[indikator.id];
        const actualValue = hodnota && typeof hodnota === 'object' && 'value' in hodnota ? hodnota.value : hodnota;
        
        if (actualValue !== null && actualValue !== undefined) {
          filledIndicators++;
          const weight = vahy[indikator.id] || 10; // Default váha 10
          totalWeight += weight;
          
          // Normalizácia hodnoty (0-100)
          const normalizedValue = Math.min(100, Math.max(0, actualValue / 1000 * 100));
          const weightedValue = normalizedValue * (weight / 100);
          totalScore += weightedValue;
          
          indicatorScores.push({
            id: indikator.id,
            nazev: indikator.nazev,
            hodnota: actualValue,
            normalizedValue,
            weight,
            weightedValue,
            jednotka: indikator.jednotka
          });
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
        totalIndicators: vybraneIndikatoryList.length,
        totalWeight,
        indicatorScores
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

  // Nájdenie víťaza
  const winner = navrhyWithScores.length > 0 ? navrhyWithScores[0] : null;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
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
                  Celkové skóre: {winner.weightedScore}% | Kompletnosť: {winner.completionRate}%
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy size={20} className="text-yellow-600" />
                  <span className="font-semibold text-gray-900">Celkové skóre</span>
                </div>
                <div className={`text-2xl font-bold ${getScoreColor(winner.weightedScore).split(' ')[0]}`}>
                  {winner.weightedScore}%
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 border border-yellow-200">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={20} className="text-green-600" />
                  <span className="font-semibold text-gray-900">Kompletnosť</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {winner.completionRate}%
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
                        {navrh.weightedScore}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Kompletnosť: {navrh.completionRate}%
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Detailné skóre */}
        {showDetails && winner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Detailné skóre víťazného návrhu: {winner.nazev}
            </h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-900">Indikátor</th>
                    <th className="text-center p-3 font-semibold text-gray-900">Hodnota</th>
                    <th className="text-center p-3 font-semibold text-gray-900">Váha</th>
                    <th className="text-center p-3 font-semibold text-gray-900">Normalizovaná hodnota</th>
                    <th className="text-center p-3 font-semibold text-gray-900">Vážené skóre</th>
                  </tr>
                </thead>
                <tbody>
                  {winner.indicatorScores.map((score, index) => (
                    <tr key={score.id} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium text-gray-900">{score.nazev}</div>
                        <div className="text-sm text-gray-500">{score.jednotka}</div>
                      </td>
                      <td className="text-center p-3 font-mono text-sm">
                        {formatHodnota(score.hodnota, score.jednotka)}
                      </td>
                      <td className="text-center p-3 text-gray-600">
                        {score.weight}%
                      </td>
                      <td className="text-center p-3">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                          {Math.round(score.normalizedValue)}%
                        </div>
                      </td>
                      <td className="text-center p-3">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          {Math.round(score.weightedValue)}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100">
                  <tr>
                    <td className="p-3 font-semibold text-gray-900">Celkové skóre</td>
                    <td className="text-center p-3">—</td>
                    <td className="text-center p-3 font-semibold text-gray-900">
                      {Math.round(winner.totalWeight)}%
                    </td>
                    <td className="text-center p-3">—</td>
                    <td className="text-center p-3">
                      <div className="inline-flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-100 to-blue-100 text-green-700 rounded-full text-sm font-bold">
                        <Trophy size={16} />
                        {winner.weightedScore}%
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.div>
        )}

        {/* Porovnanie tabuľka */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Porovnání všech návrhů</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-900">Návrh</th>
                    {vybraneIndikatoryList.map(indikator => (
                      <th key={indikator.id} className="text-center p-3 font-semibold text-gray-900 min-w-[120px]">
                        {indikator.nazev}
                      </th>
                    ))}
                    <th className="text-center p-3 font-semibold text-gray-900">Celkové skóre</th>
                  </tr>
                </thead>
                <tbody>
                  {navrhyWithScores.map((navrh, index) => (
                    <tr key={navrh.id} className={`border-t border-gray-200 hover:bg-gray-50 ${
                      index === 0 ? 'bg-yellow-50' : ''
                    }`}>
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
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
                            <div className="font-medium text-gray-900">{navrh.nazev}</div>
                            <div className="text-sm text-gray-500">
                              {navrh.completionRate}% kompletní
                            </div>
                          </div>
                        </div>
                      </td>
                      {vybraneIndikatoryList.map(indikator => {
                        const val = navrh.data[indikator.id];
                        const actualValue = val && typeof val === 'object' && 'value' in val ? val.value : val;
                        
                        return (
                          <td key={indikator.id} className="text-center p-3">
                            {actualValue != null && actualValue !== '' ? (
                              <div className="font-mono text-sm">
                                {formatHodnota(actualValue, indikator.jednotka)}
                              </div>
                            ) : (
                              <span className="text-gray-400 text-sm">N/A</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center p-3">
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(navrh.weightedScore)}`}>
                          {getScoreIcon(navrh.weightedScore)}
                          {navrh.weightedScore}%
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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



