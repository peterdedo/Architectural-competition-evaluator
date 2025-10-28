// Urban Analytics v2.1 - Advanced Weight Settings
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sliders, 
  X, 
  Save, 
  RotateCcw, 
  Info, 
  AlertCircle,
  CheckCircle,
  BarChart3
} from 'lucide-react';
import { 
  getCategoryWeights, 
  setCategoryWeights, 
  getCategorySummary,
  validateScoringConfig,
  getAllIndicators
} from '../utils/indicatorManager.js';
import { kategorie } from '../data/indikatory_zakladni.js';

const StepWeights = ({ isOpen, onClose, onSave, selectedIndicators }) => {
  const [categoryWeights, setCategoryWeightsState] = useState({});
  const [indicatorWeights, setIndicatorWeights] = useState({});
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);

  // Load current weights
  useEffect(() => {
    if (isOpen) {
      const currentCategoryWeights = getCategoryWeights();
      const allIndicators = getAllIndicators();
      const selectedIndicatorsData = allIndicators.filter(ind => selectedIndicators.has(ind.id));
      
      setCategoryWeightsState({ ...currentCategoryWeights });
      
      // Initialize indicator weights
      const weights = {};
      selectedIndicatorsData.forEach(indicator => {
        weights[indicator.id] = indicator.vaha;
      });
      setIndicatorWeights(weights);
      
      setErrors([]);
      setIsValid(true);
    }
  }, [isOpen, selectedIndicators]);

  // Validate weights
  useEffect(() => {
    const allIndicators = getAllIndicators().filter(ind => selectedIndicators.has(ind.id));
    const validation = validateScoringConfig(allIndicators, categoryWeights);
    setIsValid(validation.isValid);
    setErrors(validation.errors);
  }, [categoryWeights, selectedIndicators]);

  const handleCategoryWeightChange = (categoryKey, value) => {
    const newWeights = { ...categoryWeights };
    newWeights[categoryKey] = Math.max(0, Math.min(100, parseInt(value) || 0));
    setCategoryWeightsState(newWeights);
  };

  const handleIndicatorWeightChange = (indicatorId, value) => {
    const newWeights = { ...indicatorWeights };
    newWeights[indicatorId] = Math.max(0, Math.min(100, parseInt(value) || 0));
    setIndicatorWeights(newWeights);
  };

  const normalizeWeights = () => {
    const total = Object.values(categoryWeights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return;

    const normalized = {};
    Object.keys(categoryWeights).forEach(key => {
      normalized[key] = Math.round((categoryWeights[key] / total) * 100);
    });
    setCategoryWeightsState(normalized);
  };

  const resetToDefaults = () => {
    const defaultWeights = {
      "Bilance ploch řešeného území": 40,
      "Bilance HPP dle funkce": 40,
      "Bilance parkovacích ploch": 20
    };
    setCategoryWeightsState(defaultWeights);
  };

  const handleSave = () => {
    if (!isValid) return;

    // Save category weights
    setCategoryWeights(categoryWeights);
    
    // TODO: Save indicator weights to localStorage
    // This would require extending the indicatorManager
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onSave();
      onClose();
    }, 1500);
  };

  const getTotalWeight = () => {
    return Object.values(categoryWeights).reduce((sum, weight) => sum + weight, 0);
  };

  const getWeightColor = (weight) => {
    if (weight === 0) return 'text-slate-400';
    if (weight < 20) return 'text-red-600';
    if (weight < 40) return 'text-orange-600';
    if (weight < 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sliders size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Nastavení vah</h2>
                  <p className="text-white/80 text-sm">Upravte váhy kategorií a indikátorů</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Category Weights */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-800">Váhy kategorií</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={normalizeWeights}
                    className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Normalizovat
                  </button>
                  <button
                    onClick={resetToDefaults}
                    className="px-3 py-1.5 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <RotateCcw size={14} className="inline mr-1" />
                    Výchozí
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {kategorie.map((category) => {
                  const weight = categoryWeights[category.key] || 0;
                  return (
                    <div key={category.key} className="bg-slate-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.ikona}</span>
                          <div>
                            <h4 className="font-semibold text-slate-800">{category.nazev}</h4>
                            <p className="text-sm text-slate-600">{category.popis}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weight}
                            onChange={(e) => handleCategoryWeightChange(category.key, e.target.value)}
                            className={`w-20 px-3 py-1.5 border rounded-lg text-center font-semibold ${getWeightColor(weight)}`}
                          />
                          <span className="text-sm text-slate-500">%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${weight}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Total Weight Display */}
              <div className="bg-slate-100 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800">Celková váha kategorií:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-lg font-bold ${getTotalWeight() === 100 ? 'text-green-600' : 'text-red-600'}`}>
                      {getTotalWeight()}%
                    </span>
                    {getTotalWeight() === 100 ? (
                      <CheckCircle size={20} className="text-green-600" />
                    ) : (
                      <AlertCircle size={20} className="text-red-600" />
                    )}
                  </div>
                </div>
                {getTotalWeight() !== 100 && (
                  <p className="text-sm text-red-600 mt-2">
                    Váhy kategorií musí součet 100%. Aktuálně: {getTotalWeight()}%
                  </p>
                )}
              </div>
            </div>

            {/* Indicator Weights Preview */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Náhled vah indikátorů</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-3">
                  Váhy jednotlivých indikátorů jsou nastaveny v jejich definici. 
                  Zde vidíte přehled vybraných indikátorů a jejich aktuálních vah.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(indicatorWeights).map(([indicatorId, weight]) => {
                    const indicator = getAllIndicators().find(ind => ind.id === indicatorId);
                    if (!indicator) return null;
                    
                    return (
                      <div key={indicatorId} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{indicator.ikona}</span>
                          <span className="text-sm font-medium text-slate-700">{indicator.nazev}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${getWeightColor(weight)}`}>
                            {weight}%
                          </span>
                          <div className="w-16 bg-slate-200 rounded-full h-1.5">
                            <div
                              className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] h-1.5 rounded-full"
                              style={{ width: `${weight}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Errors */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-semibold text-red-800 mb-1">Chyby v konfiguraci:</h4>
                    <ul className="text-sm text-red-700 list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Jak funguje vážené skórování:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Každá kategorie má svou váhu (součet = 100%)</li>
                    <li>Indikátory v rámci kategorie mají své individuální váhy</li>
                    <li>Celkové skóre = Σ(kategorie_skóre × váha_kategorie)</li>
                    <li>Kategorie skóre = Σ(indikátor_skóre × váha_indikátoru)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-200">
            <button
              onClick={onClose}
              className="px-6 py-2 text-slate-700 bg-slate-100 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              Zrušit
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="px-6 py-2 bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              Uložit váhy
            </button>
          </div>

          {/* Success Toast */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 50 }}
                className="fixed bottom-8 right-8 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-50"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Váhy byly úspěšně uloženy!</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StepWeights;
