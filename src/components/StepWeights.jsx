// Urban Analytics v2.1 - Advanced Weight Settings
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
} from 'lucide-react';
import { useWizard } from '../contexts/WizardContext';
import { useToast } from '../hooks/useToast';
import AIWeightManager from './AIWeightManager';
import {
  getCategoryWeights,
  setCategoryWeights as persistCategoryWeights,
  getAllIndicators,
} from '../utils/indicatorManager.js';
import { kategorie } from '../data/indikatory.js';
import { validateWeightModalState, parseWeightInput } from '../utils/weightValidation.js';

const StepWeights = ({
  isOpen,
  onClose,
  onSave,
  selectedIndicators,
  vahy,
  setVahy,
  categoryWeights: globalCategoryWeights,
  setCategoryWeights: setGlobalCategoryWeights,
}) => {
  const [categoryWeights, setCategoryWeightsLocal] = useState({});
  const [indicatorWeights, setIndicatorWeights] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [showAIWeightManager, setShowAIWeightManager] = useState(false);
  const [contextText, setContextText] = useState('');
  const [aiSuccessBanner, setAiSuccessBanner] = useState('');

  const { updateWeights, weights: wizardWeights, categoryWeights: wizardCategoryWeights } = useWizard();
  const { showToast } = useToast();

  const panelRef = useRef(null);
  const openSnapshotRef = useRef(null);
  const lastFocusedRef = useRef(null);

  const allIndicatorsList = useMemo(() => getAllIndicators(), [isOpen]);

  const validation = useMemo(
    () =>
      validateWeightModalState({
        kategorieDef: kategorie,
        categoryWeights,
        indicatorWeights,
        selectedIndicatorIds: selectedIndicators,
        allIndicators: allIndicatorsList,
      }),
    [categoryWeights, indicatorWeights, selectedIndicators, allIndicatorsList]
  );

  useEffect(() => {
    if (!isOpen) return;
    const selectedData = allIndicatorsList.filter((ind) => selectedIndicators.has(ind.id));
    const currentWeights = globalCategoryWeights || getCategoryWeights();
    const cat = { ...currentWeights };
    const weights = {};
    selectedData.forEach((indicator) => {
      weights[indicator.id] = vahy[indicator.id] ?? indicator.vaha ?? 10;
    });
    setCategoryWeightsLocal(cat);
    setIndicatorWeights(weights);
    setShowAIWeightManager(false);
    setAiSuccessBanner('');
    openSnapshotRef.current = JSON.stringify({ cat, ind: weights });
  }, [isOpen, selectedIndicators, vahy, globalCategoryWeights, allIndicatorsList]);

  useEffect(() => {
    if (wizardCategoryWeights && Object.keys(wizardCategoryWeights).length > 0 && isOpen) {
      setCategoryWeightsLocal({ ...wizardCategoryWeights });
    }
  }, [wizardCategoryWeights, isOpen]);

  useEffect(() => {
    if (
      !wizardWeights ||
      Object.keys(wizardWeights).length === 0 ||
      !isOpen ||
      !showAIWeightManager
    ) {
      return;
    }
    const selectedData = allIndicatorsList.filter((ind) => selectedIndicators.has(ind.id));
    const weights = {};
    selectedData.forEach((indicator) => {
      weights[indicator.id] = wizardWeights[indicator.id] ?? indicator.vaha ?? 10;
    });
    setIndicatorWeights(weights);
    setAiSuccessBanner('Váhy z AI byly načteny do náhledu — stiskněte „Uložit váhy“, aby se použily v průvodci.');
  }, [wizardWeights, selectedIndicators, isOpen, allIndicatorsList, showAIWeightManager]);

  const isDirty = useCallback(() => {
    const now = JSON.stringify({ cat: categoryWeights, ind: indicatorWeights });
    return openSnapshotRef.current !== now;
  }, [categoryWeights, indicatorWeights]);

  const requestClose = useCallback(() => {
    if (isDirty()) {
      if (!window.confirm('Zahodit neuložené změny vah?')) return;
    }
    onClose();
  }, [isDirty, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    lastFocusedRef.current = document.activeElement;
    const t = window.setTimeout(() => {
      panelRef.current?.querySelector('[data-modal-initial-focus="true"]')?.focus();
    }, 100);

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        requestClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      const list = Array.from(focusables).filter((el) => !el.hasAttribute('disabled'));
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(t);
      document.removeEventListener('keydown', onKeyDown);
      lastFocusedRef.current?.focus?.();
    };
  }, [isOpen, requestClose]);

  const handleCategoryWeightChange = useCallback((categoryId, value) => {
    const parsed = parseWeightInput(value);
    if (parsed === null) {
      setCategoryWeightsLocal((prev) => ({ ...prev, [categoryId]: 0 }));
      return;
    }
    if (Number.isNaN(parsed)) return;
    setCategoryWeightsLocal((prev) => ({ ...prev, [categoryId]: parsed }));
  }, []);

  const handleIndicatorWeightChange = useCallback((indicatorId, value) => {
    const parsed = parseWeightInput(value);
    if (parsed === null) {
      setIndicatorWeights((prev) => ({ ...prev, [indicatorId]: 0 }));
      return;
    }
    if (Number.isNaN(parsed)) return;
    setIndicatorWeights((prev) => ({ ...prev, [indicatorId]: parsed }));
  }, []);

  const normalizeWeights = () => {
    const total = Object.values(categoryWeights).reduce((sum, weight) => sum + (Number(weight) || 0), 0);
    if (total === 0) return;
    const normalized = {};
    Object.keys(categoryWeights).forEach((key) => {
      normalized[key] = Math.round(((Number(categoryWeights[key]) || 0) / total) * 100);
    });
    setCategoryWeightsLocal(normalized);
  };

  const resetToDefaults = () => {
    if (!window.confirm('Obnovit výchozí váhy kategorií? (indikátory zůstanou podle aktuálního výběru)')) return;
    const defaultWeights = {
      'vyuziti-uzemi': 15,
      'intenzita-vyuziti': 12,
      'funkcni-rozvrzeni': 18,
      'doprava-parkovani': 10,
      'hustota-osidleni': 8,
      'nakladova-efektivita': 12,
      'kvalita-verejneho-prostoru': 15,
      'urbanisticka-kvalita': 20,
    };
    setCategoryWeightsLocal(defaultWeights);
  };

  const scrollToField = (fieldKey) => {
    if (!fieldKey) return;
    if (fieldKey.startsWith('cat-ind:')) {
      const catId = fieldKey.slice('cat-ind:'.length);
      const first = allIndicatorsList.find(
        (i) => selectedIndicators.has(i.id) && i.kategorie === catId
      );
      if (first) {
        document
          .querySelector(`[data-weight-field="ind:${first.id}"]`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    const el =
      fieldKey === 'summary-categories'
        ? document.querySelector('[data-weight-field="summary-categories"]')
        : document.querySelector(`[data-weight-field="${fieldKey}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSave = () => {
    const v = validateWeightModalState({
      kategorieDef: kategorie,
      categoryWeights,
      indicatorWeights,
      selectedIndicatorIds: selectedIndicators,
      allIndicators: allIndicatorsList,
    });
    if (!v.ok) {
      scrollToField(v.firstScrollId);
      showToast('Opravte chyby ve váhách — nápověda je níže.', 'error', 6000);
      return;
    }

    persistCategoryWeights(categoryWeights);
    if (setGlobalCategoryWeights) setGlobalCategoryWeights(categoryWeights);
    if (setVahy) setVahy((prev) => ({ ...prev, ...indicatorWeights }));
    updateWeights(indicatorWeights, categoryWeights);

    openSnapshotRef.current = JSON.stringify({ cat: categoryWeights, ind: indicatorWeights });
    setShowSuccess(true);
    showToast('Váhy byly uloženy a výsledky přepočítány.', 'success', 4000);
    window.setTimeout(() => {
      setShowSuccess(false);
      onSave();
      onClose();
    }, 900);
  };

  const openAiSection = () => {
    setShowAIWeightManager(true);
    window.requestAnimationFrame(() => {
      document.querySelector('[data-weight-field="ai-panel"]')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  const getTotalWeight = () =>
    kategorie.reduce((s, cat) => s + (Number(categoryWeights[cat.id]) || 0), 0);

  const getWeightColor = (weight) => {
    const w = Number(weight) || 0;
    if (w === 0) return 'text-slate-400';
    if (w < 20) return 'text-red-600';
    if (w < 40) return 'text-orange-600';
    if (w < 60) return 'text-yellow-600';
    return 'text-green-600';
  };

  const fieldClass = (key, base) => {
    const has = validation.fieldErrors[key];
    return `${base} ${has ? 'border-red-500 ring-1 ring-red-400' : 'border-slate-200'}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        role="presentation"
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={(e) => {
          if (e.target === e.currentTarget) requestClose();
        }}
      >
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="stepweights-title"
          className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
          initial={{ y: -24, opacity: 0, scale: 0.98 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -24, opacity: 0, scale: 0.98 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white p-6 rounded-t-xl shrink-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Sliders size={20} />
                </div>
                <div>
                  <h2 id="stepweights-title" className="text-xl font-bold">
                    Nastavení vah
                  </h2>
                  <p className="text-white/80 text-sm">Upravte váhy kategorií a indikátorů</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  data-modal-initial-focus="true"
                  onClick={openAiSection}
                  className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#0066A4]"
                >
                  <Brain size={16} aria-hidden />
                  Správce váh AI
                </button>
                <button
                  type="button"
                  onClick={requestClose}
                  className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  aria-label="Zavřít dialog vah"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-y-auto flex-1 p-6 space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label htmlFor="stepweights-context" className="block text-sm font-medium text-blue-900 mb-2">
                Kontext soutěže / projektu
              </label>
              <textarea
                id="stepweights-context"
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Např. urbanistická soutěž na centrum města…"
                className="w-full border border-blue-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                rows={3}
              />
              <p className="text-xs text-blue-800 mt-2">
                Kontext pomáhá AI navrhnout rozumné váhy pro váš typ zadání.
              </p>
            </div>

            {aiSuccessBanner && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm rounded-lg p-3">
                {aiSuccessBanner}
              </div>
            )}

            {showAIWeightManager && (
              <div
                data-weight-field="ai-panel"
                className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Brain size={16} className="text-blue-600" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Návrhy vah pomocí AI</h3>
                    <p className="text-sm text-slate-600">Vygenerujte návrh a potvrďte ho úložením v tomto okně.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAIWeightManager(false)}
                    className="ml-auto w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-200 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    aria-label="Skrýt sekci AI"
                  >
                    <X size={16} className="text-slate-600" />
                  </button>
                </div>
                <AIWeightManager
                  contextText={contextText}
                  setContextText={setContextText}
                  indikatory={allIndicatorsList}
                  vybraneIndikatory={selectedIndicators}
                  kategorie={kategorie}
                />
              </div>
            )}

            <div className="space-y-4">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h3 className="text-lg font-semibold text-slate-900">Váhy kategorií</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={normalizeWeights}
                    className="px-3 py-1.5 text-sm bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                  >
                    Normalizovat
                  </button>
                  <button
                    type="button"
                    onClick={resetToDefaults}
                    className="px-3 py-1.5 text-sm bg-slate-100 text-slate-800 rounded-lg hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 inline-flex items-center gap-1"
                  >
                    <RotateCcw size={14} aria-hidden />
                    Výchozí
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {kategorie.map((category) => {
                  const weight = Number(categoryWeights[category.id]) || 0;
                  const fe = validation.fieldErrors[`cat-${category.id}`];
                  return (
                    <div
                      key={category.id}
                      data-weight-field={`cat:${category.id}`}
                      className={`rounded-lg p-4 ${fe ? 'bg-red-50 border border-red-200' : 'bg-slate-50'}`}
                    >
                      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl" aria-hidden>
                            {category.ikona}
                          </span>
                          <div>
                            <h4 className="font-semibold text-slate-900">{category.nazev}</h4>
                            <p className="text-sm text-slate-600">{category.popis}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="sr-only" htmlFor={`cw-${category.id}`}>
                            Váha kategorie {category.nazev} v procentech
                          </label>
                          <input
                            id={`cw-${category.id}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={100}
                            step={1}
                            value={weight}
                            onChange={(e) => handleCategoryWeightChange(category.id, e.target.value)}
                            className={fieldClass(
                              `cat-${category.id}`,
                              `w-20 px-3 py-1.5 border rounded-lg text-center font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066A4] ${getWeightColor(weight)}`
                            )}
                          />
                          <span className="text-sm text-slate-600">%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, weight)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                data-weight-field="summary-categories"
                className="bg-slate-100 rounded-lg p-4 border border-slate-200"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-900">Celková váha kategorií</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-lg font-bold ${getTotalWeight() === 100 ? 'text-green-700' : 'text-red-700'}`}
                    >
                      {getTotalWeight()}%
                    </span>
                    {getTotalWeight() === 100 ? (
                      <CheckCircle size={20} className="text-green-600" aria-hidden />
                    ) : (
                      <AlertCircle size={20} className="text-red-600" aria-hidden />
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4" data-weight-field="indicators-section">
              <h3 className="text-lg font-semibold text-slate-900">Váhy indikátorů (v rámci kategorie součet 100 %)</h3>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <p className="text-sm text-slate-700 mb-3">
                  Každá kategorie se svými vybranými indikátory musí mít součet vah 100 %.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(indicatorWeights).map(([indicatorId, weight]) => {
                    const indicator = allIndicatorsList.find((ind) => ind.id === indicatorId);
                    if (!indicator) return null;
                    const fe = validation.fieldErrors[`ind-${indicatorId}`];
                    return (
                      <div
                        key={indicatorId}
                        data-weight-field={`ind:${indicatorId}`}
                        className={`flex items-center justify-between rounded-lg p-3 border gap-2 ${
                          fe ? 'bg-red-50 border-red-300' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg" aria-hidden>
                            {indicator.ikona}
                          </span>
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-medium text-slate-800 block truncate">{indicator.nazev}</span>
                            <span className="text-xs text-slate-600">{indicator.jednotka}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <label className="sr-only" htmlFor={`iw-${indicatorId}`}>
                            Váha indikátoru {indicator.nazev}
                          </label>
                          <input
                            id={`iw-${indicatorId}`}
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={100}
                            step={1}
                            value={weight}
                            onChange={(e) => handleIndicatorWeightChange(indicatorId, e.target.value)}
                            className={fieldClass(
                              `ind-${indicatorId}`,
                              `w-16 px-2 py-1 border rounded text-center text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066A4] ${getWeightColor(weight)}`
                            )}
                          />
                          <span className="text-xs text-slate-600">%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {!validation.ok && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle size={16} className="text-red-700 mt-0.5 shrink-0" aria-hidden />
                  <div>
                    <h4 className="text-sm font-semibold text-red-900 mb-1">Nelze uložit — zkontrolujte:</h4>
                    <ul className="text-sm text-red-800 list-disc list-inside space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-700 mt-0.5 shrink-0" aria-hidden />
                <div className="text-sm text-blue-900">
                  <p className="font-semibold mb-1">Jak funguje vážené skórování</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Součet vah kategorií musí být 100 %.</li>
                    <li>V každé kategorii se součet vah vybraných indikátorů musí rovnat 100 %.</li>
                    <li>Změny se do průvodce zapíší až po stisku „Uložit váhy“.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 p-6 pt-4 border-t border-slate-200 shrink-0 bg-white">
            <button
              type="button"
              onClick={requestClose}
              className="px-6 py-2 text-slate-800 bg-slate-100 rounded-lg font-semibold hover:bg-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              Zrušit
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!validation.ok}
              className="px-6 py-2 bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#0066A4]"
            >
              <Save size={16} aria-hidden />
              Uložit váhy
            </button>
          </div>

          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                className="absolute bottom-6 right-6 bg-green-600 text-white px-5 py-3 rounded-lg shadow-lg z-10 flex items-center gap-2"
                role="status"
              >
                <CheckCircle size={20} aria-hidden />
                <span className="font-semibold">Váhy uloženy</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default StepWeights;
