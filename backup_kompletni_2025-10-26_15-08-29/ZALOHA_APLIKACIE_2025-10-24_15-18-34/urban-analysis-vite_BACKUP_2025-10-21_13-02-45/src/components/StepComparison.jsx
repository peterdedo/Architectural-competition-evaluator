import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { indikatory } from '../data/indikatory';
import { BarChart3, File, Trophy, Check, X, BarChart2, TrendingUp, Target, Award, Zap } from 'lucide-react';
import ResultsSummary from './ResultsSummary';

const StepComparison = ({ navrhy, vybraneNavrhy, setVybraneNavrhy, vybraneIndikatory, onBack }) => {
  const [zobrazeni, setZobrazeni] = useState('tabulka');
  const [vybraneIndikatoryProGraf, setVybraneIndikatoryProGraf] = useState(new Set());

  const zpracovaneNavrhy = navrhy.filter(navrh => navrh.status === 'zpracován' && navrh.data && Object.keys(navrh.data).length > 0);
  const vybraneIndikatoryList = indikatory.filter(ind => vybraneIndikatory.has(ind.id));

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

  const vybraneNavrhyData = zpracovaneNavrhy.filter(navrh => vybraneNavrhy.has(navrh.id));

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
        // Extrahujeme hodnotu z objektu alebo použijeme priamo číslo
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
    // Extrahujeme hodnotu z objektu alebo použijeme priamo číslo
    const actualNavrhHodnota = navrhHodnota && typeof navrhHodnota === 'object' && 'value' in navrhHodnota ? navrhHodnota.value : navrhHodnota;
    return nejlepsiHodnota !== null && actualNavrhHodnota === nejlepsiHodnota;
  };

  const prepareChartData = () => {
    const indikatoryProGraf = vybraneIndikatoryProGraf.size > 0 
      ? vybraneIndikatoryList.filter(ind => vybraneIndikatoryProGraf.has(ind.id))
      : vybraneIndikatoryList.slice(0, 5); // Prvních 5 indikátorů

    return vybraneNavrhyData.map(navrh => {
      const data = { nazev: navrh.nazev };
      indikatoryProGraf.forEach(indikator => {
        data[indikator.nazev] = navrh.data[indikator.id] || 0;
      });
      return data;
    });
  };

  const prepareRadarData = () => {
    const indikatoryProGraf = vybraneIndikatoryProGraf.size > 0 
      ? vybraneIndikatoryList.filter(ind => vybraneIndikatoryProGraf.has(ind.id))
      : vybraneIndikatoryList.slice(0, 6); // Prvních 6 indikátorů

    return indikatoryProGraf.map(indikator => {
      const data = { indikator: indikator.nazev };
      vybraneNavrhyData.forEach(navrh => {
        data[navrh.nazev] = navrh.data[indikator.id] || 0;
      });
      return data;
    });
  };

  if (zpracovaneNavrhy.length === 0) {
    return (
    <div className="card-active overflow-hidden">
      <div className="bg-primary text-white px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Porovnání návrhů</h2>
              <p className="text-white/80 text-sm">Tabulka a grafy pro porovnání</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <BarChart3 size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nejdříve zpracujte návrhy</h3>
            <p className="text-slate-500 mb-6">Přejděte na krok "Nahrání návrhů" a zpracujte PDF dokumenty.</p>
            <button className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-lg" onClick={onBack}>
              ← Zpět na Výsledky analýzy
            </button>
          </div>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <motion.div
      className="bg-white border border-[#E5E7EB] rounded-xl shadow-sm overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="text-white px-8 py-6" style={{ backgroundImage: 'linear-gradient(90deg, #0066A4 0%, #4BB349 100%)' }}>
        <div className="flex items-center gap-3">
          <motion.div
            className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shadow-sm"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ duration: 0.2 }}
          >
            <BarChart3 size={24} className="text-white" />
          </motion.div>
          <div>
            <h2 className="text-xl font-semibold text-white">Porovnání návrhů</h2>
            <p className="text-white/80 text-sm">
              Moderní analytický dashboard pro {vybraneNavrhyData.length} vybraných návrhů
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        {/* Results Summary */}
        <ResultsSummary 
          vybraneNavrhyData={vybraneNavrhyData} 
          vybraneIndikatoryList={vybraneIndikatoryList} 
        />

        {/* Výběr návrhů */}
        <motion.div
          className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
          variants={itemVariants}
          whileHover={{ scale: 1.02 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#0066A4]">Výběr návrhů k porovnání</h3>
            <div className="flex gap-2">
              <button 
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 border border-[#A6A8AB] text-[#2C2C2C] hover:border-[#0066A4] hover:text-[#0066A4]"
                onClick={handleVybratVse}
              >
                <Check size={16} /> Vybrat vše
              </button>
              <button 
                className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 border border-[#A6A8AB] text-[#2C2C2C] hover:border-[#0066A4] hover:text-[#0066A4]"
                onClick={handleZrusitVse}
              >
                <X size={16} /> Zrušit výběr
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {zpracovaneNavrhy.map(navrh => (
              <label key={navrh.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-[#A6A8AB]/40 hover:border-[#0066A4] cursor-pointer transition-all shadow-sm hover:shadow-md">
                <input
                  type="checkbox"
                  checked={vybraneNavrhy.has(navrh.id)}
                  onChange={() => handleVybraniNavrhu(navrh.id)}
                  className="w-4 h-4 text-[#0066A4] border-[#A6A8AB] rounded focus:ring-[#0066A4]"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#2C2C2C] truncate">{navrh.nazev}</div>
                  <div className="text-xs text-gray-500">
                    {Object.keys(navrh.data).length} indikátorů
                  </div>
                </div>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Přepínač zobrazení */}
        <div className="flex gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              zobrazeni === 'tabulka' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setZobrazeni('tabulka')}
          >
            <BarChart3 size={16} /> Tabulka
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              zobrazeni === 'sloupcovy' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setZobrazeni('sloupcovy')}
          >
            <TrendingUp size={16} /> Sloupcový graf
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              zobrazeni === 'radarovy' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setZobrazeni('radarovy')}
          >
            <Target size={16} /> Radarový graf
          </button>
        </div>

        {/* Horizontálna porovnávacia tabuľka podľa referencie */}
        <AnimatePresence mode="wait">
          {zobrazeni === 'tabulka' && vybraneNavrhyData.length > 0 && (
            <motion.div
              key="table-compare"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm"
            >
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-700">
                    <tr>
                      <th className="text-left p-3 w-80 text-[#0066A4]">Indikátor</th>
                      <th className="text-center p-3 w-28 text-[#0066A4]">Jednotka</th>
                      <th className="text-center p-3 w-28 text-[#0066A4]">Váha</th>
                      {vybraneNavrhyData.map((p) => (
                        <th key={p.id} className="text-center p-3 text-[#0066A4]">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-8 h-8 rounded-md flex items-center justify-center text-white" style={{ backgroundImage: 'linear-gradient(90deg, #0066A4 0%, #4BB349 100%)' }}>
                              <File size={14} />
                            </div>
                            <span className="font-semibold truncate max-w-[12rem] inline-block align-middle">{p.nazev}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {vybraneIndikatoryList.map((metric) => (
                      <tr key={metric.id} className="border-t border-[#E5E7EB] hover:bg-[#F9FAFB] transition">
                        <td className="p-3 text-[#2C2C2C]">
                          <div className="font-medium truncate">{metric.nazev}</div>
                          <div className="text-xs text-gray-500">{metric.popis || ''}</div>
                        </td>
                        <td className="text-center p-3 text-gray-500">{metric.jednotka || '—'}</td>
                        <td className="text-center p-3 text-gray-500">{metric.vaha != null ? `${metric.vaha}%` : '—'}</td>
                        {vybraneNavrhyData.map((p) => {
                          const val = p.data[metric.id];
                          const isBest = isNejlepsiHodnota(p, metric.id);
                          // Extrahujeme hodnotu z objektu alebo použijeme priamo číslo
                          const actualValue = val && typeof val === 'object' && 'value' in val ? val.value : val;
                          return (
                            <td key={p.id} className={`text-center p-3 ${isBest ? 'bg-[#E8F6EB] font-medium text-[#2C2C2C] ring-1 ring-[#4BB349]/30' : ''}`}>
                              {actualValue != null && actualValue !== '' ? (
                                <span className="number-text">{formatHodnota(actualValue, metric.jednotka)}</span>
                              ) : (
                                <span className="text-gray-400">N/A</span>
                              )}
                              {isBest && (
                                <span className="ml-1 align-middle inline-flex">👑</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                  {/* Footer summary cards */}
                  <tfoot>
                    <tr className="border-t border-gray-200">
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      <td className="p-3"></td>
                      {vybraneNavrhyData.map((p) => {
                        const total = vybraneIndikatoryList.length;
                        const filled = vybraneIndikatoryList.reduce((acc, ind) => acc + (p.data[ind.id] != null ? 1 : 0), 0);
                        const pct = total === 0 ? 0 : Math.round((filled / total) * 100);
                        return (
                          <td key={p.id} className="p-3">
                            <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-3 flex items-center justify-between">
                              <span className="text-xs text-gray-500">Kompletace</span>
                              <span className="number-text text-sm font-semibold">{pct}%</span>
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sloupcový graf */}
        <AnimatePresence mode="wait">
          {zobrazeni === 'sloupcovy' && vybraneNavrhyData.length > 0 && (
            <motion.div
              key="bar-chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 size={20} className="text-[#0066A4]" />
                <h3 className="text-lg font-semibold text-[#0066A4]">Sloupcový graf</h3>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={prepareChartData()}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="nazev" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    {vybraneNavrhyData.map((navrh, index) => (
                      <Bar 
                        key={navrh.id} 
                        dataKey={navrh.nazev} 
                        fill={index % 2 === 0 ? '#0066A4' : '#4BB349'}
                        radius={[4, 4, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Radarový graf */}
        <AnimatePresence mode="wait">
          {zobrazeni === 'radarovy' && vybraneNavrhyData.length > 0 && (
            <motion.div
              key="radar-chart"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="gradient-card"
            >
              <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-[#0066A4]" />
                <h3 className="text-lg font-semibold text-[#0066A4]">Radarový graf</h3>
              </div>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={prepareRadarData()}>
                    <PolarGrid stroke="#E2E8F0" />
                    <PolarAngleAxis dataKey="indikator" tick={{ fontSize: 12 }} />
                    <PolarRadiusAxis tick={{ fontSize: 12 }} />
                    {vybraneNavrhyData.map((navrh, index) => (
                      <Radar
                        key={navrh.id}
                        name={navrh.nazev}
                        dataKey={navrh.nazev}
                        stroke={index % 2 === 0 ? '#0066A4' : '#4BB349'}
                        fill={index % 2 === 0 ? '#0066A4' : '#4BB349'}
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    ))}
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #E2E8F0',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {vybraneNavrhyData.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <BarChart3 size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Vyberte návrhy k porovnání</h3>
            <p className="text-slate-500">Označte alespoň jeden návrh pro zobrazení porovnání.</p>
          </div>
        )}

        <motion.div
          className="flex justify-between items-center pt-6 border-t border-[#E5E7EB]"
          variants={itemVariants}
        >
          <motion.button
            className="rounded-lg px-4 py-2.5 text-sm font-semibold border border-[#A6A8AB] text-[#2C2C2C] hover:border-[#0066A4] hover:text-[#0066A4] transition"
            onClick={onBack}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            ← Zpět na Výsledky analýzy
          </motion.button>
          <div className="flex gap-3">
            <motion.button
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-sm"
              style={{ backgroundImage: 'linear-gradient(90deg, #0066A4 0%, #4BB349 100%)' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <BarChart3 size={16} /> Exportovat výsledky
            </motion.button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default StepComparison;
// ✅ JSX fixed