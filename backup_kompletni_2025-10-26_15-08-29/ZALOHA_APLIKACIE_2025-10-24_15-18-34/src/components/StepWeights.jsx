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
  BarChart3,
  Brain,
  Settings
} from 'lucide-react';
import { useWizard } from '../contexts/WizardContext';
import { useToast } from '../hooks/useToast';
import { 
  getCategoryWeights, 
  setCategoryWeights, 
  getCategorySummary,
  validateScoringConfig,
  getAllIndicators
} from '../utils/indicatorManager.js';
import { kategorie } from '../data/indikatory.js';

const StepWeights = ({ isOpen, onClose, onSave, selectedIndicators, vahy, setVahy, categoryWeights: globalCategoryWeights, setCategoryWeights: setGlobalCategoryWeights }) => {
  const [categoryWeights, setCategoryWeightsLocal] = useState({});
  const [indicatorWeights, setIndicatorWeights] = useState({});
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAIWeightManager, setShowAIWeightManager] = useState(false);
  const [contextText, setContextText] = useState('');
  
  // AI Weight Manager states
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAIResponse] = useState(null);
  const [error, setError] = useState(null);
  
  // Wizard context
  const { updateWeights, weights: wizardWeights, categoryWeights: wizardCategoryWeights } = useWizard();
  const { showToast } = useToast();
  
  // AI Weight Manager funkce
  const handleGetAIDoporučení = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiKey = localStorage.getItem('apiKey') || localStorage.getItem('openai_api_key');
      if (!apiKey) {
        throw new Error('OpenAI API kľúč nie je nastavený');
      }

      const allIndicators = getAllIndicators();
      const selectedIndicatorsData = allIndicators.filter(ind => selectedIndicators.has(ind.id));

      const prompt = `
      Na základě tohoto kontextu soutěže:
      "${contextText || "obecná urbanistická soutěž"}"

      Navrhni optimální rozložení vah mezi kategoriemi a indikátory
      pro vyhodnocení projektových návrhů.

      Dostupné kategorie:
      ${kategorie.map(cat => `- ${cat.nazev} (${cat.id})`).join('\n')}

      Dostupné indikátory:
      ${selectedIndicatorsData.map(ind => `- ${ind.nazev} (${ind.id}) - ${ind.jednotka} - kategorie: ${ind.kategorie}`).join('\n')}

      Vrať výsledek jako čistý JSON bez komentářů:
      {
        "kategorie": { "Bilance ploch řešeného území": 40, "Bilance HPP dle funkce": 40, "Bilance parkovacích ploch": 20 },
        "indikatory": { "Plocha řešeného území": 10, "Zastavěná plocha objektů": 10, "Plochy zelené": 10, "Plochy zpevněné": 10 }
      }

      DŮLEŽITÉ: Navrhni váhy pro VŠECHNY vybrané indikátory, ne jen pro několik příkladů!
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('AI nevrátil žádnou odpověď');
      }

      // Bezpečné parsovanie JSON
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        // Fallback - pokus o opravu JSON
        const corrected = content
          .replace(/,\s*}/g, "}")  // Odstránenie trailing comma
          .replace(/,\s*]/g, "]")  // Odstránenie trailing comma v array
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Pridanie úvodzoviek k kľúčom
          .replace(/:\s*([^",{\[\s][^,}\]\s]*)/g, ': "$1"');  // Pridanie úvodzoviek k hodnotám
        
        parsed = JSON.parse(corrected);
      }

      if (!parsed.kategorie || !parsed.indikatory) {
        throw new Error('AI nevrátil správný formát dat');
      }

      setAIResponse(parsed);
      console.log('🔍 StepWeights - odosielam váhy do updateWeights:', parsed);
      
      // Aplikuj AI doporučení s automatickým přepočítáním výsledků
      updateWeights(parsed.indikatory, parsed.kategorie);
      
      // Aktualizuj lokální stavy
      setCategoryWeightsLocal(parsed.kategorie);
      setIndicatorWeights(parsed.indikatory);
      
      showToast("AI doporučení bylo úspěšně aplikováno a výsledky přepočítány!", 'success');
    } catch (err) {
      console.error("AI Error:", err);
      setError(err.message);
      showToast(`Nepodařilo se získat AI doporučení: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load current weights from props or localStorage
  useEffect(() => {
    if (isOpen) {
      const allIndicators = getAllIndicators();
      const selectedIndicatorsData = allIndicators.filter(ind => selectedIndicators.has(ind.id));
      
      // Use global category weights from props, fallback to localStorage
      const currentWeights = globalCategoryWeights || getCategoryWeights();
      setCategoryWeightsLocal({ ...currentWeights });
      
      // Initialize indicator weights from props or defaults
      const weights = {};
      selectedIndicatorsData.forEach(indicator => {
        weights[indicator.id] = vahy[indicator.id] || indicator.vaha || 10;
      });
      setIndicatorWeights(weights);
      
      setErrors([]);
      setIsValid(true);
    }
  }, [isOpen, selectedIndicators, vahy, globalCategoryWeights]);

  // Automatická aktualizácia pri zmene globálnych váh (AI Weight Manager)
  useEffect(() => {
    if (wizardCategoryWeights && Object.keys(wizardCategoryWeights).length > 0) {
      console.log('✅ Automatická aktualizácia váh kategórií z AI Weight Manager');
      setCategoryWeightsLocal({ ...wizardCategoryWeights });
    }
  }, [wizardCategoryWeights]);

  // Automatická aktualizácia váh indikátorů z AI Weight Manager
  useEffect(() => {
    if (vahy && Object.keys(vahy).length > 0) {
      console.log('✅ StepWeights - automatická aktualizácia váh indikátorů z AI Weight Manager');
      console.log('🔍 StepWeights - vahy prop:', vahy);
      console.log('🔍 StepWeights - selectedIndicators:', selectedIndicators);
      
      const allIndicators = getAllIndicators();
      const selectedIndicatorsData = allIndicators.filter(ind => selectedIndicators.has(ind.id));
      
      const weights = {};
      selectedIndicatorsData.forEach(indicator => {
        weights[indicator.id] = vahy[indicator.id] || indicator.vaha || 10;
      });
      
      console.log('🔍 StepWeights - nastavujem indicatorWeights:', weights);
      setIndicatorWeights(weights);
    }
  }, [vahy, selectedIndicators]);

  // Aktualizace váh indikátorů z WizardContext (AI Weight Manager)
  useEffect(() => {
    if (wizardWeights && Object.keys(wizardWeights).length > 0) {
      console.log('🔄 StepWeights - aktualizuji váhy indikátorů z WizardContext:', wizardWeights);
      
      const allIndicators = getAllIndicators();
      const selectedIndicatorsData = allIndicators.filter(ind => selectedIndicators.has(ind.id));
      
      const weights = {};
      selectedIndicatorsData.forEach(indicator => {
        weights[indicator.id] = wizardWeights[indicator.id] || indicator.vaha || 10;
      });
      
      console.log('🔍 StepWeights - nastavujem indicatorWeights z WizardContext:', weights);
      setIndicatorWeights(weights);
    }
  }, [wizardWeights, selectedIndicators]);

  // Real-time validation and updates
  useEffect(() => {
    if (isOpen) {
      validateWeights();
    }
  }, [categoryWeights, indicatorWeights, isOpen]);

  // Real-time validation function
  const validateWeights = () => {
    const newErrors = [];
    
    // Validate category weights sum to 100
    const categorySum = Object.values(categoryWeights).reduce((sum, weight) => sum + (weight || 0), 0);
    if (Math.abs(categorySum - 100) > 0.1) {
      newErrors.push(`Súčet váh kategórií musí byť 100% (aktuálne: ${categorySum.toFixed(1)}%)`);
    }
    
    // Validate indicator weights are positive
    Object.entries(indicatorWeights).forEach(([id, weight]) => {
      if (weight < 0) {
        newErrors.push(`Váha indikátora ${id} nemôže byť negatívna`);
      }
    });
    
    setErrors(newErrors);
    setIsValid(newErrors.length === 0);
  };

  // Validate weights
  useEffect(() => {
    const allIndicators = getAllIndicators().filter(ind => selectedIndicators.has(ind.id));
    const validation = validateScoringConfig(allIndicators, categoryWeights);
    setIsValid(validation.isValid);
    setErrors(validation.errors);
  }, [categoryWeights, selectedIndicators]);

  const handleCategoryWeightChange = (categoryId, value) => {
    const newWeights = { ...categoryWeights };
    newWeights[categoryId] = Math.max(0, Math.min(100, parseInt(value) || 0));
    setCategoryWeightsLocal(newWeights);
    
    // Automaticky aktualizuj váhy v WizardContext
    updateWeights(wizardWeights || indicatorWeights, newWeights);
  };

  const handleIndicatorWeightChange = (indicatorId, value) => {
    const newWeights = { ...indicatorWeights };
    newWeights[indicatorId] = Math.max(0, Math.min(100, parseInt(value) || 0));
    setIndicatorWeights(newWeights);
    
    // Automaticky aktualizuj váhy v WizardContext
    updateWeights(newWeights, wizardCategoryWeights || categoryWeights);
  };

  const normalizeWeights = () => {
    const total = Object.values(categoryWeights).reduce((sum, weight) => sum + weight, 0);
    if (total === 0) return;

    const normalized = {};
    Object.keys(categoryWeights).forEach(key => {
      normalized[key] = Math.round((categoryWeights[key] / total) * 100);
    });
    setCategoryWeightsLocal(normalized);
  };

  const resetToDefaults = () => {
    const defaultWeights = {
      "Bilance ploch řešeného území": 40,
      "Bilance HPP dle funkce": 40,
      "Bilance parkovacích ploch": 20
    };
    setCategoryWeightsLocal(defaultWeights);
  };

  const handleSave = () => {
    if (!isValid) return;

    // Save category weights to global state AND localStorage
    if (setGlobalCategoryWeights) {
      setGlobalCategoryWeights(categoryWeights);
    }
    setCategoryWeights(categoryWeights); // Also save to localStorage
    
    // Save indicator weights to parent component
    if (setVahy) {
      setVahy(prev => ({ ...prev, ...indicatorWeights }));
    }
    
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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAIWeightManager(true)}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Brain size={16} />
                  AI Weight Manager
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Kontext soutěže */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-blue-800 mb-2">
                Kontext soutěže / projektu
              </label>
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Např. Urbanistická soutěž zaměřená na udržitelný rozvoj městského centra, rezidenční čtvrť s důrazem na zelené plochy, kampus univerzity s moderními technologiemi..."
                className="w-full border border-blue-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                rows={3}
              />
              <p className="text-xs text-blue-600 mt-2">
                💡 Kontext pomáhá AI lépe pochopit charakter soutěže a navrhnout relevantní váhy
              </p>
            </div>

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
                  const weight = categoryWeights[category.id] || 0;
                  return (
                    <div key={category.id} className="bg-slate-50 rounded-lg p-4">
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
                            onChange={(e) => handleCategoryWeightChange(category.id, e.target.value)}
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

            {/* Indicator Weights */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800">Váhy indikátorů</h3>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-sm text-slate-600 mb-3">
                  Upravte váhy jednotlivých indikátorů. Váha určuje důležitost indikátoru v rámci jeho kategorie.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(indicatorWeights).map(([indicatorId, weight]) => {
                    const indicator = getAllIndicators().find(ind => ind.id === indicatorId);
                    if (!indicator) return null;
                    
                    return (
                      <div key={indicatorId} className="flex items-center justify-between bg-white rounded-lg p-3 border">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg">{indicator.ikona}</span>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-slate-700 block truncate">
                              {indicator.nazev}
                            </span>
                            <span className="text-xs text-slate-500">{indicator.jednotka}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={weight}
                            onChange={(e) => handleIndicatorWeightChange(indicatorId, e.target.value)}
                            className={`w-16 px-2 py-1 border rounded text-center text-sm font-semibold ${getWeightColor(weight)}`}
                          />
                          <span className="text-xs text-slate-500">%</span>
                          <div className="w-12 bg-slate-200 rounded-full h-1.5">
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

          {/* AI Weight Manager zabudovaný */}
          {showAIWeightManager && (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain size={16} className="text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">AI Weight Manager</h3>
                  <p className="text-sm text-gray-600">Context-aware generování váh pomocí AI</p>
                </div>
              </div>
              
              {/* Kontext soutěže */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Kontext soutěže / projektu
                </label>
                <textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Např. Urbanistická soutěž zaměřená na udržitelný rozvoj městského centra, rezidenční čtvrť s důrazem na zelené plochy, kampus univerzity s moderními technologiemi..."
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-2">
                  💡 Kontext pomáhá AI lépe pochopit charakter soutěže a navrhnout relevantní váhy
                </p>
              </div>
              
              {/* Tlačidlá */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGetAIDoporučení}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Generuji...
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      Získat AI doporučení
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowAIWeightManager(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Zavřít
                </button>
              </div>
              
              {/* AI Response */}
              {aiResponse && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle size={16} className="text-green-600" />
                    <span className="text-sm font-medium text-green-800">AI doporučení bylo úspěšně aplikováno!</span>
                  </div>
                  <div className="text-xs text-green-700">
                    Použitý model: GPT-4o-mini (context-aware)
                  </div>
                </div>
              )}
              
              {/* Error */}
              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="text-red-600" />
                    <span className="text-sm font-medium text-red-800">Chyba: {error}</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StepWeights;
