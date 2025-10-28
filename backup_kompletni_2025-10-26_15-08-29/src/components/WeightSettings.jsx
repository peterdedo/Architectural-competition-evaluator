import React, { useState } from 'react';
import { Sliders, RotateCcw, Info, TrendingUp, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WeightSettings = ({ indikatory, vybraneIndikatory, vahy, setVahy, onClose }) => {
  const [showInfo, setShowInfo] = useState(false);
  const [upraveneVahy, setUpraveneVahy] = useState(vahy || {});

  // Filtrujeme pouze vybrané indikátory
  const vybraneIndikatoryList = indikatory.filter(ind => vybraneIndikatory.has(ind.id));

  // Výchozí váha pro každý indikátor
  const getVaha = (indikatorId) => {
    return upraveneVahy[indikatorId] ?? indikatory.find(i => i.id === indikatorId)?.vaha ?? 10;
  };

  // Změna váhy pro indikátor
  const handleVahaChange = (indikatorId, novaVaha) => {
    setUpraveneVahy(prev => ({
      ...prev,
      [indikatorId]: parseInt(novaVaha)
    }));
  };

  // Reset na výchozí hodnoty
  const handleReset = () => {
    const defaultVahy = {};
    vybraneIndikatoryList.forEach(ind => {
      defaultVahy[ind.id] = ind.vaha;
    });
    setUpraveneVahy(defaultVahy);
  };

  // Uložení vah
  const handleUlozit = () => {
    setVahy(upraveneVahy);
    onClose();
  };

  // Výpočet celkové váhy
  const celkovaVaha = vybraneIndikatoryList.reduce((sum, ind) => sum + getVaha(ind.id), 0);

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-green-500 text-white px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Sliders size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Nastavení vah</h2>
                <p className="text-white/80 text-sm">Určete důležitost jednotlivých indikátorů</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Info banner */}
        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-blue-50 border-b border-blue-200 px-8 py-4 overflow-hidden"
            >
              <div className="flex gap-3">
                <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Jak fungují váhy?</p>
                  <ul className="space-y-1 text-blue-800">
                    <li>• Vyšší váha = větší důležitost indikátoru při hodnocení</li>
                    <li>• Váha 0 = indikátor se nebere v úvahu</li>
                    <li>• Váha 20 = dvojnásobná důležitost oproti základní (10)</li>
                    <li>• Celková váha je suma všech vah vybraných indikátorů</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Controls */}
        <div className="px-8 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Info size={16} />
            {showInfo ? 'Skrýt nápovědu' : 'Zobrazit nápovědu'}
          </button>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp size={16} className="text-slate-500" />
              <span className="text-slate-600">Celková váha:</span>
              <span className="font-bold text-slate-900">{celkovaVaha}</span>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all text-sm font-medium"
            >
              <RotateCcw size={16} />
              Reset
            </button>
          </div>
        </div>

        {/* Weight sliders */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 280px)' }}>
          <div className="px-8 py-6 space-y-4">
            {vybraneIndikatoryList.map((indikator, index) => {
              const vaha = getVaha(indikator.id);
              const procentoVahy = celkovaVaha > 0 ? Math.round((vaha / celkovaVaha) * 100) : 0;
              
              return (
                <motion.div
                  key={indikator.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="text-2xl flex-shrink-0">{indikator.ikona}</div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900 text-sm">
                            {indikator.nazev}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {indikator.popis}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">
                            {procentoVahy}% celku
                          </span>
                          <div className="w-16 text-center">
                            <input
                              type="number"
                              min="0"
                              max="50"
                              value={vaha}
                              onChange={(e) => handleVahaChange(indikator.id, e.target.value)}
                              className="w-full px-2 py-1 text-center font-bold text-lg border-2 border-slate-200 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                      
                      {/* Slider */}
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={vaha}
                          onChange={(e) => handleVahaChange(indikator.id, e.target.value)}
                          className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider-thumb"
                          style={{
                            background: `linear-gradient(to right, #0066A4 0%, #4BB349 ${(vaha / 50) * 100}%, #E2E8F0 ${(vaha / 50) * 100}%, #E2E8F0 100%)`
                          }}
                        />
                        <div className="flex gap-1 text-xs text-slate-400">
                          <span>0</span>
                          <span>·</span>
                          <span>25</span>
                          <span>·</span>
                          <span>50</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <p className="text-sm text-slate-600">
            <span className="font-semibold">{vybraneIndikatoryList.length}</span> indikátorů vybraných
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 hover:border-slate-400 transition-all font-medium"
            >
              Zrušit
            </button>
            <button
              onClick={handleUlozit}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-blue-600 to-green-500 text-white rounded-lg hover:from-blue-700 hover:to-green-600 transition-all font-medium shadow-md hover:shadow-lg"
            >
              <Check size={18} />
              Uložit váhy
            </button>
          </div>
        </div>
      </motion.div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0066A4, #4BB349);
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .slider-thumb::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #0066A4, #4BB349);
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          transition: all 0.2s;
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
      `}</style>
    </motion.div>
  );
};

export default WeightSettings;




