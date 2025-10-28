import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { getAllIndicators, getCategoryWeights, getCategorySummary, deleteIndicator } from '../utils/indicatorManager.js';
import { kategorie } from '../data/indikatory.js';
import { 
  Settings, 
  Lightbulb, 
  Check, 
  X, 
  Sliders, 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Info,
  Target,
  BarChart3,
  Filter,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import StepWeights from './StepWeights';
import AddIndicatorModal from './AddIndicatorModal';
import EditIndicatorModal from './EditIndicatorModal';
import AIWeightManager from './AIWeightManager';
import { useWizard } from '../contexts/WizardContext';

const StepCriteria = ({ vybraneIndikatory, setVybraneIndikatory, onNext, onBack, vahy, setVahy, categoryWeights, setCategoryWeights }) => {
  // Použitie WizardContext pre synchronizáciu váh
  const wizardContext = useWizard();
  
  // Používaj globálne váhy kategórií z WizardContext
  const globalCategoryWeights = wizardContext?.categoryWeights || categoryWeights || {};
  
  const [expandedCategories, setExpandedCategories] = useState(new Set());
  const [query, setQuery] = useState('');
  const [typFiltra, setTypFiltra] = useState('all');
  const [showWeightSettings, setShowWeightSettings] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [indicators, setIndicators] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [showAIWeightManager, setShowAIWeightManager] = useState(false);
  const [contextText, setContextText] = useState('');

  // Synchronizácia s globálnym stavom váh
  useEffect(() => {
    if (!wizardContext) return;
    
    const globalWeights = wizardContext.weights || {};
    const globalCategoryWeights = wizardContext.categoryWeights || {};
    
    // Aktualizuj lokálne váhy ak sa zmenili globálne
    if (Object.keys(globalWeights).length > 0 && JSON.stringify(globalWeights) !== JSON.stringify(vahy)) {
      console.log("🔄 Synchronizuji váhy indikátorů z globálního stavu...", globalWeights);
      setVahy(globalWeights);
    }
    if (Object.keys(globalCategoryWeights).length > 0 && JSON.stringify(globalCategoryWeights) !== JSON.stringify(globalCategoryWeights)) {
      console.log("🔄 Synchronizuji váhy kategorií z globálního stavu...", globalCategoryWeights);
      setCategoryWeights(globalCategoryWeights);
    }
  }, [wizardContext, vahy, globalCategoryWeights, setVahy, setCategoryWeights]);

  // Refresh váh z kontextu
  const refreshWeightsFromContext = useCallback(() => {
    if (!wizardContext) return;
    
    const globalWeights = wizardContext.weights || {};
    const globalCategoryWeights = wizardContext.categoryWeights || {};
    
    if (Object.keys(globalWeights).length > 0) {
      setVahy(globalWeights);
      console.log("✅ Váhy indikátorů aktualizovány z kontextu", globalWeights);
    }
    if (Object.keys(globalCategoryWeights).length > 0) {
      setCategoryWeights(globalCategoryWeights);
      console.log("✅ Váhy kategorií aktualizovány z kontextu", globalCategoryWeights);
    }
  }, [wizardContext, setVahy, setCategoryWeights]);

  // Automatická synchronizácia pri zmene globálnych váh
  useEffect(() => {
    refreshWeightsFromContext();
  }, [refreshWeightsFromContext]);

  // Aktualizácia globálneho stavu pri zmene lokálnych váh
  const handleWeightChange = useCallback((indicatorId, newWeight) => {
    const updatedWeights = { ...vahy, [indicatorId]: newWeight };
    setVahy(updatedWeights);
    
    // Aktualizuj globálny stav
    try {
      if (wizardContext && wizardContext.updateWeights) {
        wizardContext.updateWeights(updatedWeights, globalCategoryWeights);
      }
    } catch (error) {
      console.warn('WizardContext nie je dostupný pre aktualizáciu váh');
    }
  }, [vahy, globalCategoryWeights]);

  // Aktualizácia globálneho stavu pri zmene váh kategórií
  const handleCategoryWeightChange = useCallback((categoryId, newWeight) => {
    const updatedCategoryWeights = { ...globalCategoryWeights, [categoryId]: newWeight };
    setCategoryWeights(updatedCategoryWeights);
    
    // Aktualizuj globálny stav
    try {
      if (wizardContext && wizardContext.updateWeights) {
        wizardContext.updateWeights(vahy, updatedCategoryWeights);
      }
    } catch (error) {
      console.warn('WizardContext nie je dostupný pre aktualizáciu váh kategórií');
    }
  }, [vahy, globalCategoryWeights]);

  // Load indicators on component mount
  useEffect(() => {
    const loadIndicators = async () => {
      try {
        const allIndicators = getAllIndicators().filter(ind => ind.id !== 'custom_1761333530207');
        setIndicators(allIndicators);
        
        const summary = getCategorySummary();
        setCategorySummary(summary);
      } catch (error) {
        console.error('Error loading indicators:', error);
      }
    };
    
    loadIndicators();
  }, []);

  // Staré useEffect hooky boli nahradené novými s wizardContext

  // Accordion functions
  const toggleCategory = (categoryKey) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryKey)) {
      newExpanded.delete(categoryKey);
    } else {
      newExpanded.add(categoryKey);
    }
    setExpandedCategories(newExpanded);
  };

  // Selection functions
  const handleVybratVse = () => {
    setVybraneIndikatory(new Set(indicators.map(i => i.id)));
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleZrusitVse = () => {
    setVybraneIndikatory(new Set());
  };

  const handleVybratVseVKategorii = (kategorieId) => {
    const kategorieIndikatory = indicators
      .filter(indicator => indicator.kategorie === kategorieId)
      .map(indicator => indicator.id);

    const vseVybrano = kategorieIndikatory.every(id => vybraneIndikatory.has(id));

    if (vseVybrano) {
      const noveVybrane = new Set(vybraneIndikatory);
      kategorieIndikatory.forEach(id => noveVybrane.delete(id));
      setVybraneIndikatory(noveVybrane);
    } else {
      const noveVybrane = new Set(vybraneIndikatory);
      kategorieIndikatory.forEach(id => noveVybrane.add(id));
      setVybraneIndikatory(noveVybrane);
    }
  };

  const handleIndikatorToggle = (indikatorId) => {
    const noveVybrane = new Set(vybraneIndikatory);
    if (noveVybrane.has(indikatorId)) {
      noveVybrane.delete(indikatorId);
    } else {
      noveVybrane.add(indikatorId);
    }
    setVybraneIndikatory(noveVybrane);
  };


  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'a') {
          e.preventDefault();
          handleVybratVse();
        } else if (e.key === 'd') {
          e.preventDefault();
          handleZrusitVse();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Helper functions
  const getPocetVybranychVKategorii = (kategorieId) => {
    const kategorieIndikatory = indicators
      .filter(indicator => indicator.kategorie === kategorieId)
      .map(indicator => indicator.id);
    return kategorieIndikatory.filter(id => vybraneIndikatory.has(id)).length;
  };

  const handleAddIndicator = (newIndicator) => {
    // Refresh indicators list
    const allIndicators = getAllIndicators().filter(ind => ind.id !== 'custom_1761333530207');
    const summary = getCategorySummary();
    setIndicators(allIndicators);
    setCategorySummary(summary);
    
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleDeleteIndicator = (indicatorId) => {
    if (window.confirm('Opravdu chcete smazat tento indikátor? Tato akce je nevratná.')) {
      try {
        deleteIndicator(indicatorId);
        
        // Remove from selected indicators if selected
        const newSelected = new Set(vybraneIndikatory);
        newSelected.delete(indicatorId);
        setVybraneIndikatory(newSelected);
        
        // Refresh indicators list
        const allIndicators = getAllIndicators().filter(ind => ind.id !== 'custom_1761333530207');
        const summary = getCategorySummary();
        setIndicators(allIndicators);
        setCategorySummary(summary);
        
        // Show success toast
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
      } catch (error) {
        console.error('Error deleting indicator:', error);
        alert('Chyba při mazání indikátoru: ' + error.message);
      }
    }
  };

  const handleEditIndicator = (indicator) => {
    setEditingIndicator(indicator);
    setShowEditModal(true);
  };

  const handleEditSave = (updatedIndicator) => {
    // Refresh indicators list
    const allIndicators = getAllIndicators().filter(ind => ind.id !== 'custom_1761333530207');
    const summary = getCategorySummary();
    setIndicators(allIndicators);
    setCategorySummary(summary);
    
    // Show success toast
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const filteredIndicators = useMemo(() => {
    const q = query.trim().toLowerCase();
    return indicators.filter(ind => {
      if (typFiltra !== 'all' && ind.comparison_method !== typFiltra) return false;
      if (!q) return true;
      return (
        ind.nazev.toLowerCase().includes(q) ||
        (ind.popis || '').toLowerCase().includes(q) ||
        (ind.jednotka || '').toLowerCase().includes(q)
      );
    });
  }, [indicators, typFiltra, query]);

  const getBarvaKategorie = (barva) => {
    const barvy = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      pink: 'bg-pink-50 border-pink-200 text-pink-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800'
    };
    return barvy[barva] || 'bg-slate-50 border-slate-200 text-slate-800';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white px-8 py-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
            <Settings size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Výběr kritérií</h1>
            <p className="text-white/90 text-sm">Vyberte indikátory pro porovnání návrhů</p>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto px-8 py-8">
        {/* Quick Actions & Search */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
            <button 
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0066A4] text-white rounded-lg font-semibold hover:bg-[#005a8f] transition-all shadow-sm hover:shadow-md"
              onClick={handleVybratVse}
            >
                  <Check size={16} />
                  Vybrat vše
            </button>
            <button 
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 transition-all shadow-sm hover:shadow-md"
              onClick={handleZrusitVse}
            >
                  <X size={16} />
                  Zrušit vše
                </button>
                <button 
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#4BB349] text-white rounded-lg font-semibold hover:bg-[#3fa03a] transition-all shadow-sm hover:shadow-md"
                  onClick={() => {
                    // Vybrat podľa relevance - vyberie najdôležitejšie indikátory
                    const relevantIndicators = indicators
                      .filter(ind => ind.vaha >= 8)
                      .map(ind => ind.id);
                    setVybraneIndikatory(new Set(relevantIndicators));
                  }}
                >
                  <Target size={16} />
                  Podle relevance
                </button>
                <button 
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#FFA84C] to-[#FF8C42] text-white rounded-lg font-semibold hover:shadow-lg transition-all shadow-sm hover:shadow-md"
                  onClick={() => setShowAddModal(true)}
                >
                  <Plus size={16} />
                  Přidat indikátor
            </button>
          </div>

              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
                    className="pl-10 pr-4 py-2.5 w-64 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent"
                    placeholder="Hledat indikátory..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
                </div>
            <select
                  className="px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent"
              value={typFiltra}
              onChange={(e) => setTypFiltra(e.target.value)}
            >
              <option value="all">Všechny typy</option>
              <option value="numeric">Numerické</option>
              <option value="categorical">Kategorické</option>
              <option value="qualitative">Kvalitativní</option>
            </select>
          </div>
        </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
                    <span className="text-sm font-semibold text-slate-700">
                      Vybráno: {vybraneIndikatory.size} z {indicators.length} indikátorů
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Accordion Categories */}
        <div className="space-y-4">
          {kategorie.map((kategorie) => {
            const kategorieIndikatory = filteredIndicators.filter(indicator => 
              indicator.kategorie === kategorie.id
            );
            
            if (kategorieIndikatory.length === 0) return null;
            
            const isExpanded = expandedCategories.has(kategorie.id);
            const vybranoVKategorii = getPocetVybranychVKategorii(kategorie.id);
            const vseVybrano = vybranoVKategorii === kategorieIndikatory.length;
            const categorySummaryData = categorySummary.find(cat => cat.key === kategorie.id);
            
            return (
              <motion.div
                key={kategorie.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden"
                initial={false}
                animate={{ height: 'auto' }}
              >
                {/* Category Header */}
                <button
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                  onClick={() => toggleCategory(kategorie.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                      <span className="text-xl">{kategorie.ikona}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-slate-800">{kategorie.nazev}</h3>
                      <p className="text-sm text-slate-600">
                        {vybranoVKategorii} z {kategorieIndikatory.length} indikátorů vybráno
                        {categorySummaryData && (
                          <span className="ml-2 text-xs bg-slate-100 px-2 py-1 rounded">
                            Váha kategorie: {categorySummaryData.categoryWeight}%
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                  <button
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleVybratVseVKategorii(kategorie.id);
                      }}
                      style={{
                        backgroundColor: vseVybrano ? '#ef4444' : '#0066A4',
                        color: 'white'
                      }}
                    >
                      {vseVybrano ? 'Zrušit vše' : 'Vybrat vše'}
                    </button>
                    {isExpanded ? <ChevronDown size={20} className="text-slate-400" /> : <ChevronRight size={20} className="text-slate-400" />}
                  </div>
                  </button>

                {/* Category Content */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="border-t border-slate-200"
                    >
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {kategorieIndikatory.map((indikator) => {
                            const isSelected = vybraneIndikatory.has(indikator.id);
                            const isCustom = indikator.type === 'custom';
                            return (
                              <motion.div
                                key={indikator.id}
                                className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:shadow-md ${
                                  isSelected 
                                    ? 'border-[#0066A4] bg-blue-50 shadow-sm' 
                                    : 'border-slate-200 bg-white hover:border-slate-300'
                                } ${isCustom ? 'ring-2 ring-orange-200' : ''}`}
                                onClick={() => handleIndikatorToggle(indikator.id)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                {/* Selection Indicator */}
                                <div className="absolute top-3 right-3">
                                  {isSelected ? (
                                    <div className="w-6 h-6 bg-[#0066A4] rounded-full flex items-center justify-center">
                                      <Check size={14} className="text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 border-2 border-slate-300 rounded-full" />
                                  )}
                </div>

                                {/* Custom Indicator Badge */}
                                {isCustom && (
                                  <div className="absolute top-3 left-3">
                                    <div className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded-full font-semibold">
                                      Vlastní
                                    </div>
                                  </div>
                                )}

                                {/* Card Content */}
                                <div className="pr-8">
                                  <div className="flex items-start gap-3 mb-3">
                                    <span className="text-2xl">{indikator.ikona}</span>
                      <div className="flex-1 min-w-0">
                                      <h4 className="font-semibold text-slate-800 text-sm leading-tight">
                          {indikator.nazev}
                                      </h4>
                                    </div>
                        </div>

                                  <div className="space-y-2">
                                    {/* Description tooltip */}
                                    {indikator.description && (
                                      <p className="text-xs text-slate-600 mb-2" title={indikator.description}>
                                        {indikator.description}
                                      </p>
                                    )}
                                    
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-xs font-semibold text-[#0066A4] bg-blue-100 px-2 py-1 rounded">
                                        {indikator.jednotka}
                                      </span>
                                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
                                        {indikator.typ || 'N/A'}
                                      </span>
                                      <span className={`text-xs px-2 py-1 rounded ${
                                        indikator.trend === 'up' ? 'text-green-600 bg-green-100' :
                                        indikator.trend === 'down' ? 'text-red-600 bg-red-100' :
                                        'text-gray-600 bg-gray-100'
                                      }`}>
                                        {indikator.trend === 'up' ? '📈 vyšší lepší' :
                                         indikator.trend === 'down' ? '📉 nižší lepší' :
                                         '➡️ neutrální'}
                                      </span>
                                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                                        Váha: {indikator.vaha || 1}/5
                                      </span>
                          </div>
                                    
                                    <div className="text-xs text-slate-600 leading-relaxed">
                            {indikator.popis}
                          </div>

                          {indikator.lower_better && (
                                      <div className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                        <Check size={12} />
                                        Nižší hodnota je lepší
                                      </div>
                                    )}

                                    {/* Tooltip for more info */}
                                    <div className="flex items-center gap-1 text-xs text-slate-400">
                                      <Info size={12} />
                                      <span>Klikněte pro výběr</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Custom Indicator Actions */}
                                {isCustom && (
                                  <div className="absolute bottom-3 right-3 flex gap-1">
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditIndicator(indikator);
                                      }}
                                      className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
                                      title="Upravit indikátor"
                                    >
                                      <Edit3 size={12} />
                                    </button>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteIndicator(indikator.id);
                                      }}
                                      className="w-6 h-6 bg-red-100 text-red-600 rounded-full flex items-center justify-center hover:bg-red-200 transition-colors"
                                      title="Smazat indikátor"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                            </div>
                          )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom Summary Bar */}
        <div className="sticky bottom-0 mt-8 bg-white border-t border-slate-200 shadow-lg rounded-t-xl">
          <div className="px-8 py-6">
            <div className="flex items-center justify-between">
              <button 
                className="inline-flex items-center gap-2 px-6 py-3 text-slate-700 bg-slate-100 rounded-lg font-semibold hover:bg-slate-200 transition-all"
                onClick={onBack}
              >
            ← Zpět na Nahrání návrhů
          </button>
          
              <div className="flex items-center gap-4">
            {vybraneIndikatory.size > 0 && (
              <button
                onClick={() => setShowWeightSettings(true)}
                    className="inline-flex items-center gap-2 px-6 py-3 text-[#0066A4] bg-blue-50 border-2 border-[#0066A4] rounded-lg font-semibold hover:bg-blue-100 transition-all"
              >
                <Sliders size={18} />
                Nastavit váhy ({vybraneIndikatory.size})
              </button>
            )}
            
            <button
                  className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={onNext}
              disabled={vybraneIndikatory.size === 0}
            >
                  <BarChart3 size={18} />
                  Pokračovat na výsledky analýzy
              <span className="text-lg">→</span>
            </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-8 right-8 bg-[#4BB349] text-white px-6 py-4 rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center gap-3">
              <Check size={20} />
              <span className="font-semibold">Indikátor byl úspěšně smazán!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Indicator Modal */}
      <AddIndicatorModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSave={handleAddIndicator}
      />

      {/* Edit Indicator Modal */}
      <EditIndicatorModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingIndicator(null);
        }}
        onSave={handleEditSave}
        indicator={editingIndicator}
      />

      {/* Weight Settings Modal */}
      <StepWeights 
        isOpen={showWeightSettings}
        onClose={() => setShowWeightSettings(false)}
        onSave={() => setShowWeightSettings(false)}
        selectedIndicators={vybraneIndikatory}
        vahy={vahy}
        setVahy={setVahy}
        categoryWeights={globalCategoryWeights}
        setCategoryWeights={setCategoryWeights}
        wizardWeights={wizardContext?.weights}
        wizardCategoryWeights={wizardContext?.categoryWeights}
      />
      {/* Debug logy */}
      {console.log('🔍 StepCriteria - wizardContext?.weights:', wizardContext?.weights)}
      {console.log('🔍 StepCriteria - wizardContext?.categoryWeights:', wizardContext?.categoryWeights)}

      {/* AI Weight Manager Modal */}
      <AnimatePresence>
        {showAIWeightManager && (
          <AIWeightManager
            indikatory={indicators}
            vybraneIndikatory={vybraneIndikatory}
            vahy={vahy}
            setVahy={setVahy}
            categoryWeights={globalCategoryWeights}
            setCategoryWeights={setCategoryWeights}
            onClose={() => setShowAIWeightManager(false)}
            onOpenWeights={() => setShowWeightSettings(true)}
            contextText={contextText}
            setContextText={setContextText}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepCriteria;