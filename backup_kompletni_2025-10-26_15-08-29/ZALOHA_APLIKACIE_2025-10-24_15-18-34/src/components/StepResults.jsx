import React, { useState, useMemo } from 'react';
import { getAllIndicators, getCategoryWeights } from '../utils/indicatorManager.js';
import { calculateProjectScore, evaluateProjects } from '../engine/EvaluationEngine.js';
import { BarChart3, File, Trophy, ArrowRight, Edit3, Save, Info, TrendingUp, Calculator, X, Award, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kategorie } from '../data/indikatory.js';
import EditIndicatorModal from './EditIndicatorModal';
import { useWizard } from '../contexts/WizardContext';

const StepResults = ({ navrhy, vybraneIndikatory, onNext, onBack, setNavrhy, vahy = {}, categoryWeights, aiWeights = null, aiCategoryWeights = null }) => {
  
  // Použití WizardContext pro centralizované výsledky
  const wizardContext = useWizard();
  const results = wizardContext.results || [];
  
  // State pro editování
  const [editModal, setEditModal] = useState({
    isOpen: false,
    indicator: null,
    proposal: null,
    currentValue: null
  });

  // State pro zobrazení detailního výpočtu
  const [showCalculationModal, setShowCalculationModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  
  // State pro zobrazení Winner Calculation Breakdown
  const [showWinnerBreakdown, setShowWinnerBreakdown] = useState(false);

  // Get all indicators and calculate scores
  const indicators = useMemo(() => {
    return getAllIndicators().filter(ind => vybraneIndikatory.has(ind.id));
  }, [vybraneIndikatory]);

  // Použití results z WizardContext místo vlastního výpočtu
  const scoredProposals = useMemo(() => {
    if (results.length === 0) {
      console.warn('[StepResults] Žádné výsledky z kontextu');
      return [];
    }
    
    // Filtruj pouze návrhy, které jsou v navrhy
    const filteredResults = results.filter(project => 
      navrhy.some(navrh => navrh.id === project.id)
    );
    
    return filteredResults.map(project => ({
      ...project,
      // Použij normalizované skóre pokud existuje, jinak weightedScore
      displayScore: project.normalizedScore || project.weightedScore || 0,
      originalScore: project.weightedScore || 0,
      weightedScore: project.normalizedScore || project.weightedScore || 0
    }));
  }, [results, navrhy]);
  
  // ✅ VALIDACE: Kontrola, zda jsou vybrány indikátory
  if (!vybraneIndikatory || vybraneIndikatory.size === 0) {
    return (
      <div className="card-urban overflow-hidden">
        <div className="bg-warning text-white px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="heading-1">Žádné indikátory nevybrány</h2>
              <p className="text-white/80 text-sm">Vyberte indikátory v předchozím kroku</p>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="text-center py-12">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-xl font-semibold text-slate-700 mb-2">
              Nejprve vyberte indikátory
            </h3>
            <p className="text-slate-600 mb-6">
              Přejděte na krok "Výběr kritérií" a vyberte indikátory, které chcete analyzovat.
            </p>
            <button 
              onClick={onBack}
              className="btn-primary"
            >
              Zpět na výběr kritérií
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Use scored proposals from evaluation engine
  const vybraneIndikatoryList = indicators;

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
    const indikator = indicators.find(i => i.id === indikatorId);
    if (!indikator) return null;

    const hodnoty = scoredProposals
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

  // Funkcie pre editovanie
  const openEditModal = (indicator, proposal) => {
    const currentValue = proposal.data[indicator.id];
    const actualValue = currentValue && typeof currentValue === 'object' && 'value' in currentValue 
      ? currentValue.value 
      : currentValue;
    
    setEditModal({
      isOpen: true,
      indicator,
      proposal,
      currentValue: actualValue
    });
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      indicator: null,
      proposal: null,
      currentValue: null
    });
  };

  const saveEditedValue = (indicatorId, newValue) => {
    if (!editModal.proposal) return;
    
    const updatedNavrhy = navrhy.map(navrh => {
      if (navrh.id === editModal.proposal.id) {
        return {
          ...navrh,
          data: {
            ...navrh.data,
            [indicatorId]: {
              value: newValue,
              source: 'Manuálně upraveno'
            }
          }
        };
      }
      return navrh;
    });
    
    setNavrhy(updatedNavrhy);
    closeEditModal();
  };

  if (scoredProposals.length === 0) {
    return (
      <div className="card-urban overflow-hidden">
        <div className="bg-primary text-white px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="heading-1">Výsledky analýzy</h2>
              <p className="text-white/80 text-sm">Přehled hodnot indikátorů</p>
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
            <button className="btn-secondary" onClick={onBack}>
              ← Zpět na Nahrání návrhů
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card-active overflow-hidden animate-fade-in">
      {/* Sticky header s primárnym CTA */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md z-30 border-b border-gray-200">
        <div className="bg-primary text-white px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <BarChart3 size={20} className="text-white" />
              </div>
              <div>
                <h2 className="heading-1 text-white">Výsledky analýzy</h2>
                <p className="text-white/80 text-sm">
                  Přehled {scoredProposals.length} zpracovaných návrhů podle {vybraneIndikatoryList.length} vybraných indikátorů
                </p>
              </div>
            </div>
            
            {/* Primárne CTA tlačidlo - responzívne */}
            <div className="flex justify-center lg:justify-end">
              <button 
                className="text-white px-6 py-3 rounded-2xl text-base font-bold shadow-xl hover:shadow-2xl hover:scale-110 hover:brightness-120 transition-all duration-300 flex items-center gap-3 border-2 border-orange-300 hover:border-orange-400
                         sm:px-8 sm:py-4 sm:text-lg"
                style={{ background: 'linear-gradient(135deg, #F7931E 0%, #FF6B35 100%)' }}
                onClick={() => setShowWinnerBreakdown(true)}
              >
                <Trophy size={16} className="sm:w-[18px] sm:h-[18px]" /> 
                <span className="hidden sm:inline">Hodnocení vítězných návrhů</span>
                <span className="sm:hidden">Hodnocení</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        {/* Přehled návrhů - kompaktní layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {scoredProposals.map(navrh => {
            const pocetIndikatoru = Object.keys(navrh.data).length;
            const kompletnost = navrh.completionRate || Math.round((pocetIndikatoru / vybraneIndikatoryList.length) * 100);
            const weightedScore = Math.round(navrh.weightedScore || 0);
            
            return (
              <div key={navrh.id} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <File size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900 truncate" title={navrh.nazev}>
                      {navrh.nazev}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                        {weightedScore}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">Kompletnost</span>
                    <span className="text-sm font-semibold text-gray-900">{kompletnost}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        kompletnost >= 80 ? 'bg-green-500' :
                        kompletnost >= 60 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${kompletnost}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {pocetIndikatoru}/{vybraneIndikatoryList.length} indikátorů
                  </div>
                  
                </div>
              </div>
            );
          })}
        </div>

        {/* Sticky toolbar nad tabuľkou */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-200 py-3 px-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-lg font-semibold text-gray-900">Detailní výsledky</h3>
              <div className="text-sm text-gray-600">
                {vybraneIndikatoryList.length} indikátorů
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCalculationModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <Calculator size={14} />
                Zobrazit transparentný výpočet
              </button>
            </div>
          </div>
        </div>

        {/* Tabulka výsledků */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-surface rounded-b-xl overflow-hidden shadow-card">
            <thead>
              <tr>
                <th className="table-header px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border w-64">Návrh</th>
                {vybraneIndikatoryList.map(indikator => (
                  <th key={indikator.id} className="table-header px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border text-center min-w-32">
                    <div className="space-y-1">
                      <div className="font-semibold text-xs flex items-center gap-1 justify-center">
                        {indikator.nazev}
                      </div>
                      <div className="text-xs text-text-light">{indikator.jednotka}</div>
                      {indikator.lower_better && (
                        <div className="text-xs text-emerald-600">↓ lepší</div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {scoredProposals.map(navrh => (
                <tr key={navrh.id} className="table-row">
                  <td className="px-4 py-3 text-sm text-text-dark border-b border-border font-semibold">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                        <File size={16} className="text-slate-600" />
                      </div>
                      <div>
                        <div className="font-semibold">{navrh.nazev}</div>
                        <div className="text-xs text-text-light">
                          {(navrh.pdfSoubor?.size / 1024 || 0).toFixed(1)} KB
                        </div>
                      </div>
                    </div>
                  </td>
                  {vybraneIndikatoryList.map(indikator => {
                    const hodnota = navrh.data[indikator.id];
                    console.log(`🔍 Hľadám hodnotu pre ${indikator.id}:`, hodnota);
                    console.log(`📊 navrh.data:`, navrh.data);
                    const isNejlepsi = isNejlepsiHodnota(navrh, indikator.id);
                    // Extrahujeme hodnotu z objektu alebo použijeme priamo číslo
                    const actualHodnota = hodnota && typeof hodnota === 'object' && 'value' in hodnota ? hodnota.value : hodnota;
                    return (
                      <td key={indikator.id} className={`px-4 py-3 text-sm text-text-dark border-b border-border text-center ${isNejlepsi ? 'bg-emerald-50 font-semibold' : ''}`}>
                        <div className="space-y-2">
                          <div className="font-semibold number-text">
                            {formatHodnota(actualHodnota, indikator.jednotka)}
                          </div>
                          {isNejlepsi && (
                            <div className="text-xs text-emerald-600 flex items-center gap-1 justify-center">
                              <Trophy size={14} /> Nejlepší
                            </div>
                          )}
                          <button
                            onClick={() => openEditModal(indikator, navrh)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Editovať hodnotu"
                          >
                            <Edit3 size={12} />
                            Upraviť
                          </button>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer s sekundárnymi tlačidlami */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pt-6 border-t border-gray-200">
          <button 
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            onClick={onBack}
          >
            ← Zpět na Výběr kritérií
          </button>
          
          <div className="flex justify-end gap-3">
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              onClick={() => {
                const exportSection = document.getElementById('export-section');
                if (exportSection) {
                  exportSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <BarChart3 size={16} /> Exportovat výsledky
            </button>
            <button 
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              onClick={onNext}
            >
              Pokračovat na Porovnání návrhů
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Edit Modal */}
      <EditIndicatorModal
        isOpen={editModal.isOpen}
        onClose={closeEditModal}
        indicator={editModal.indicator}
        currentValue={editModal.currentValue}
        onSave={saveEditedValue}
        proposalName={editModal.proposal?.nazev}
      />

      {/* Calculation Details Modal */}
      <AnimatePresence>
        {showCalculationModal && selectedProposal && (
          <CalculationDetailsModal
            proposal={selectedProposal}
            indicators={vybraneIndikatoryList}
            allProposals={scoredProposals}
            onClose={() => {
              setShowCalculationModal(false);
              setSelectedProposal(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Winner Calculation Breakdown */}
      {showWinnerBreakdown && (
        <WinnerCalculationBreakdown
          navrhy={navrhy}
          vybraneNavrhy={new Set(scoredProposals.map(p => p.id))}
          vybraneIndikatory={vybraneIndikatory}
          vahy={vahy}
          categoryWeights={categoryWeights || getCategoryWeights()}
          aiWeights={aiWeights}
          aiCategoryWeights={aiCategoryWeights}
          onBack={() => setShowWinnerBreakdown(false)}
        />
      )}
    </div>
  );
};

// Calculation Details Modal Component
const CalculationDetailsModal = ({ proposal, indicators, allProposals, onClose }) => {
  const categoryWeights = getCategoryWeights();
  
  // Group indicators by category
  const indicatorsByCategory = useMemo(() => {
    return indicators.reduce((acc, ind) => {
      if (!acc[ind.kategorie]) {
        acc[ind.kategorie] = [];
      }
      acc[ind.kategorie].push(ind);
      return acc;
    }, {});
  }, [indicators]);

  const formatValue = (value, unit) => {
    // Ak je hodnota null, undefined alebo prázdna
    if (value === null || value === undefined || value === '') {
      return '—';
    }
    
    // Ak je hodnota objekt, skúsme extrahovať číselnú hodnotu
    if (typeof value === 'object' && value !== null) {
      // Ak má objekt property 'value', použijeme ju
      if ('value' in value && value.value !== null && value.value !== undefined) {
        const numValue = Number(value.value);
        if (Number.isFinite(numValue)) {
          return `${numValue.toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} ${unit}`;
        }
      }
      // Ak objekt nemá 'value' property, skúsme nájsť číselnú hodnotu
      const numericValue = Object.values(value).find(v => Number.isFinite(Number(v)));
      if (numericValue !== undefined) {
        return `${Number(numericValue).toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} ${unit}`;
      }
      // Ak sa nenašla číselná hodnota, zobrazíme pomlčku
      return '—';
    }
    
    // Ak je hodnota číslo, formátujeme ju
    if (typeof value === 'number' && Number.isFinite(value)) {
      return `${value.toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} ${unit}`;
    }
    
    // Ak je hodnota string, skúsme ju konvertovať na číslo
    if (typeof value === 'string') {
      const numValue = Number(value);
      if (Number.isFinite(numValue)) {
        return `${numValue.toLocaleString('cs-CZ', { maximumFractionDigits: 2 })} ${unit}`;
      }
    }
    
    // Pre všetky ostatné prípady zobrazíme pomlčku
    return '—';
  };

  const getNormalizedValue = (indicator, value) => {
    if (value === null || value === undefined) return 0;
    
    const allValues = allProposals
      .map(p => {
        const v = p.data[indicator.id];
        return v && typeof v === 'object' && 'value' in v ? v.value : v;
      })
      .filter(v => v !== null && v !== undefined);
    
    if (allValues.length === 0) return 0;
    
    const min = Math.min(...allValues);
    const max = Math.max(...allValues);
    
    if (max === min) return 50;
    
    const normalized = ((value - min) / (max - min)) * 100;
    return indicator.lower_better ? 100 - normalized : normalized;
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-5xl flex flex-col max-h-[90vh]"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
              <Calculator size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Transparentný výpočet skóre</h2>
              <p className="text-sm text-gray-600">{proposal.nazev}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-50 to-green-50 border-2 border-blue-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Celkové skóre</h3>
                <p className="text-sm text-gray-600">Vážený priemer všetkých kategórií</p>
              </div>
              <div className="text-4xl font-bold text-blue-600">
                {Math.round(proposal.scores?.total || 0)}%
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          {Object.entries(indicatorsByCategory).map(([categoryId, categoryIndicators]) => {
            const categoryWeight = categoryWeights[categoryId] || (100 / Object.keys(indicatorsByCategory).length);
            const categoryInfo = kategorie.find(k => k.id === categoryId);
            
            return (
              <div key={categoryId} className="mb-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <span>{categoryInfo?.ikona || '📊'}</span>
                      {categoryId}
                    </h4>
                    <div className="text-sm font-medium text-gray-600">
                      Váha kategórie: <span className="text-blue-600 font-bold">{categoryWeight}%</span>
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Indikátor</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Hodnota</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Min/Max</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Normalizované</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Váha</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Body</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryIndicators.map(indicator => {
                        const value = proposal.data[indicator.id];
                        const actualValue = value && typeof value === 'object' && 'value' in value ? value.value : value;
                        
                        const allValues = allProposals
                          .map(p => {
                            const v = p.data[indicator.id];
                            return v && typeof v === 'object' && 'value' in v ? v.value : v;
                          })
                          .filter(v => v !== null && v !== undefined);
                        
                        const min = allValues.length > 0 ? Math.min(...allValues) : 0;
                        const max = allValues.length > 0 ? Math.max(...allValues) : 0;
                        const normalized = getNormalizedValue(indicator, actualValue);
                        const weight = indicator.vaha || 10;
                        const points = (normalized * weight) / 10;
                        
                        return (
                          <tr key={indicator.id} className="border-t border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div className="font-medium text-gray-900">{indicator.nazev}</div>
                              <div className="text-xs text-gray-500">{indicator.jednotka}</div>
                            </td>
                            <td className="px-4 py-3 text-center font-mono text-sm">
                              {formatValue(actualValue, indicator.jednotka)}
                            </td>
                            <td className="px-4 py-3 text-center text-xs text-gray-600">
                              {min.toFixed(1)} - {max.toFixed(1)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                {normalized.toFixed(1)}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center text-gray-600">
                              {weight}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-bold">
                                {points.toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Explanation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <div className="flex items-start gap-3">
              <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-2">Ako sa počíta skóre:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li><strong>Normalizované hodnoty:</strong> Každá hodnota sa prepočíta na škálu 0-100% podľa min/max hodnôt</li>
                  <li><strong>Body:</strong> Normalizovaná hodnota × váha indikátora ÷ 10</li>
                  <li><strong>Skóre kategórie:</strong> Vážený priemer bodov všetkých indikátorov v kategórii</li>
                  <li><strong>Celkové skóre:</strong> Vážený priemer skóre všetkých kategórií podľa ich váh</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Zavrieť
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Winner Calculation Breakdown Modal
const WinnerCalculationBreakdown = ({ 
  navrhy, 
  vybraneIndikatory, 
  vahy, 
  categoryWeights, 
  aiWeights, 
  aiCategoryWeights, 
  onBack 
}) => {
  const [sortBy, setSortBy] = useState('score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showDetails, setShowDetails] = useState({});

  const vybraneNavrhyData = navrhy.filter(navrh => navrh.status === 'zpracován');
  const vybraneIndikatoryList = getAllIndicators().filter(ind => vybraneIndikatory.has(ind.id));

  // Výpočet váženého skóre pre každý návrh s kategoriemi pomocou EvaluationEngine
  const navrhyWithScores = useMemo(() => {
    if (vybraneNavrhyData.length === 0) return [];
    
    // Vytvor štruktúru váh pre EvaluationEngine
    const weights = {};
    const allIndicators = getAllIndicators();
    
    // Skupina indikátorů podle kategorií
    const indicatorsByCategory = {};
    allIndicators.forEach(indikator => {
      if (!indicatorsByCategory[indikator.kategorie]) {
        indicatorsByCategory[indikator.kategorie] = [];
      }
      indicatorsByCategory[indikator.kategorie].push(indikator);
    });

    // Vytvor štruktúru váh pre EvaluationEngine
    Object.entries(indicatorsByCategory).forEach(([categoryId, categoryIndicators]) => {
      const categoryWeight = categoryWeights[categoryId] || (100 / Object.keys(indicatorsByCategory).length);
      
      weights[categoryId] = {
        weight: categoryWeight,
        indicators: {}
      };
      
      categoryIndicators.forEach(indikator => {
        const indicatorWeight = vahy[indikator.id] || 10;
        weights[categoryId].indicators[indikator.id] = {
          weight: indicatorWeight
        };
      });
    });

    // Použij EvaluationEngine pre konzistentný výpočet
    const scoredProposals = evaluateProjects(vybraneNavrhyData, weights);
    
    // Pridaj detailné informácie pre každý indikátor
    const navrhyWithDetails = scoredProposals.map(proposal => {
      const indicatorScores = [];
      
      // Skupina indikátorů podle kategorií
      const indicatorsByCategory = {};
      vybraneIndikatoryList.forEach(indikator => {
        if (!indicatorsByCategory[indikator.kategorie]) {
          indicatorsByCategory[indikator.kategorie] = [];
        }
        indicatorsByCategory[indikator.kategorie].push(indikator);
      });

      // Výpočet detailov pre každý indikátor
      Object.entries(indicatorsByCategory).forEach(([category, categoryIndicators]) => {
        categoryIndicators.forEach(indikator => {
          const hodnota = proposal.data[indikator.id];
          const actualValue = hodnota && typeof hodnota === 'object' && 'value' in hodnota ? hodnota.value : hodnota;
          
          if (actualValue !== null && actualValue !== undefined) {
            const weight = vahy[indikator.id] || 10;
            
            // Normalizácia hodnoty (0-100) - rovnaká logika ako v EvaluationEngine
            const allValues = vybraneNavrhyData
              .map(n => n.data[indikator.id])
              .map(v => v && typeof v === 'object' && 'value' in v ? v.value : v)
              .filter(v => v !== null && v !== undefined);
            
            const maxValue = Math.max(...allValues);
            const normalizedValue = maxValue > 0 
              ? (actualValue / maxValue) * 100 
              : 0; // Ak je maximum 0
            
            const weightedValue = normalizedValue * (weight / 100);

            indicatorScores.push({
              id: indikator.id,
              nazev: indikator.nazev,
              jednotka: indikator.jednotka,
              hodnota: actualValue,
              weight: weight,
              normalizedValue: normalizedValue,
              weightedValue: weightedValue,
              category: indikator.kategorie
            });
          }
        });
      });

      return {
        ...proposal,
        indicatorScores,
        totalIndicators: vybraneIndikatoryList.length,
        totalWeight: Object.values(vahy).reduce((sum, weight) => sum + (weight || 0), 0)
      };
    });

    // Zoradenie podľa zvoleného kritéria
    return navrhyWithDetails.sort((a, b) => {
      if (sortBy === 'score') {
        return sortOrder === 'asc' ? a.scores?.total - b.scores?.total : b.scores?.total - a.scores?.total;
      } else if (sortBy === 'completion') {
        return sortOrder === 'asc' ? a.completionRate - b.completionRate : b.completionRate - a.completionRate;
      } else {
        return sortOrder === 'asc' 
          ? a.nazev.localeCompare(b.nazev) 
          : b.nazev.localeCompare(a.nazev);
      }
    });
  }, [vybraneNavrhyData, vybraneIndikatory, vahy, categoryWeights, sortBy, sortOrder, vybraneIndikatoryList]);

  return (
    <motion.div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Trophy size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Hodnocení vítězných návrhů</h2>
                <p className="text-blue-100">Detailný výpočet skóre a porovnanie návrhov</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Sorting Controls */}
          <div className="mb-6 flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Seřadit podle:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="score">Skóre</option>
                <option value="completion">Dokončenie</option>
                <option value="name">Názov</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Poradie:</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="desc">Zostupne</option>
                <option value="asc">Vzostupne</option>
              </select>
            </div>
          </div>

          {/* Results Table */}
          <div className="space-y-4">
            {navrhyWithScores.map((proposal, index) => (
              <div key={proposal.id} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{proposal.nazev}</h3>
                      <p className="text-sm text-gray-600">
                        Celkové skóre: <span className="font-bold text-blue-600">{Number.isFinite(proposal.scores?.total) ? `${proposal.scores.total.toFixed(1)}%` : "0%"}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowDetails(prev => ({ ...prev, [proposal.id]: !prev[proposal.id] }))}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    {showDetails[proposal.id] ? 'Skrýt detaily' : 'Zobrazit detaily'}
                  </button>
                </div>

                {/* Detailed Breakdown */}
                {showDetails[proposal.id] && (
                  <div className="mt-4 space-y-4">
                    {/* Category Weights */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Váhy kategórií</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {Object.entries(categoryWeights).map(([categoryId, weight]) => {
                          const category = kategorie.find(cat => cat.id === categoryId);
                          return (
                            <div key={categoryId} className="bg-gray-50 rounded-lg p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-medium text-gray-900">{category?.nazev || categoryId}</h5>
                                  <p className="text-sm text-gray-600">Kategória</p>
                                </div>
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
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Indicator Details */}
                    <div>
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Detaily indikátorů</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-3 py-2 text-left font-medium text-gray-700">Indikátor</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700">Hodnota</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700">Váha</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700">Normalizované</th>
                              <th className="px-3 py-2 text-center font-medium text-gray-700">Vážené</th>
                            </tr>
                          </thead>
                          <tbody>
                            {proposal.indicatorScores.map((score) => (
                              <tr key={score.id} className="border-b border-gray-100">
                                <td className="px-3 py-2 text-gray-900">{score.nazev}</td>
                                <td className="px-3 py-2 text-center text-gray-600">
                                  {typeof score.hodnota === 'object' && score.hodnota !== null 
                                    ? (score.hodnota.value || '—') 
                                    : (score.hodnota || '—')} {score.jednotka}
                                </td>
                                <td className="px-3 py-2 text-center text-gray-600">
                                  <div className="flex items-center justify-center gap-1">
                                    <span>{score.weight}%</span>
                                    {aiWeights?.indicators?.[score.id] && (
                                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                                        <Star className="w-3 h-3" />
                                        AI
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center text-gray-600">
                                  {score.normalizedValue.toFixed(1)}%
                                </td>
                                <td className="px-3 py-2 text-center text-gray-600">
                                  {score.weightedValue.toFixed(1)}%
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default StepResults;