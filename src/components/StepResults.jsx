import React, { useState, useMemo } from 'react';
import { getAllIndicators, getCategoryWeights } from '../utils/indicatorManager.js';
import { calculateProjectScore, evaluateProjects } from '../engine/EvaluationEngine.js';
import { BarChart3, File, Trophy, ArrowRight, Edit3, Save, Info, TrendingUp, Calculator, X, Award, Star, Check, AlertTriangle, Target, Weight, Eye, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { kategorie } from '../data/indikatory.js';
import EditIndicatorModal from './EditIndicatorModal';
import WinnerCalculationBreakdown from './WinnerCalculationBreakdown';
import { useWizard } from '../contexts/WizardContext';

const StepResults = ({ navrhy, vybraneIndikatory, onNext, onBack, setNavrhy, vahy = {}, categoryWeights, aiWeights = null, aiCategoryWeights = null }) => {
  
  // Parse numeric value function - handles all data formats including manually entered values
  const parseNumericValue = (val) => {
    if (val === null || val === undefined) return null;
    if (typeof val === "object" && "value" in val)
      return parseNumericValue(val.value);
    const numericStr = String(val)
      .replace(/[^\d.,-]/g, "")
      .replace(",", ".");
    const parsed = Number(numericStr);
    return isNaN(parsed) ? null : parsed;
  };
  
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

  // Lokálny výpočet skóre - podobne ako v StepComparison
  const scoredProposals = useMemo(() => {
    const zpracovaneNavrhy = navrhy.filter(navrh => navrh.status === 'zpracován' && navrh.data && Object.keys(navrh.data).length > 0);
    
    if (zpracovaneNavrhy.length === 0) {
      console.warn('[StepResults] Žádné zpracované návrhy');
      return [];
    }
    
    return zpracovaneNavrhy.map(navrh => {
      let totalScore = 0;
      let totalWeight = 0;
      let filledIndicators = 0;

      indicators.forEach(indikator => {
        const hodnota = navrh.data[indikator.id];
        const actualValue = parseNumericValue(hodnota);
        
        if (actualValue !== null && actualValue !== undefined) {
          filledIndicators++;
          const weight = vahy[indikator.id] || 10; // Default váha 10
          totalWeight += weight;
          
          // Normalizácia hodnoty (0-100)
          let normalizedValue = 0;
          
          // Získaj všetky hodnoty pre tento indikátor
          const allValues = zpracovaneNavrhy
            .map(n => parseNumericValue(n.data[indikator.id]))
            .filter(v => v !== null && !isNaN(v));
          
          if (allValues.length > 0) {
            const max = Math.max(...allValues);
            if (max > 0) {
              normalizedValue = (actualValue / max) * 100;
            } else {
              // Fallback: ak je hodnota platná ale max je 0, nastav na 100%
              normalizedValue = actualValue ? 100 : 0;
            }
          }
          
          totalScore += normalizedValue * (weight / 100);
        }
      });

      const completionRate = indicators.length > 0 
        ? (filledIndicators / indicators.length) * 100 
        : 0;

      const weightedScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0;

      return {
        ...navrh,
        weightedScore: Math.round(weightedScore),
        completionRate: Math.round(completionRate),
        filledIndicators,
        totalIndicators: indicators.length
      };
    }).sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0));
  }, [navrhy, indicators, vahy]);
  
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

  // Memoizované najlepšie hodnoty pre každý indikátor
  const nejlepsiHodnoty = useMemo(() => {
    const zpracovaneNavrhy = navrhy.filter(navrh => navrh.status === 'zpracován' && navrh.data && Object.keys(navrh.data).length > 0);
    const result = {};
    
    indicators.forEach(indikator => {
      const hodnoty = zpracovaneNavrhy
        .map(navrh => parseNumericValue(navrh.data[indikator.id]))
        .filter(v => v !== null && !isNaN(v));

      if (hodnoty.length > 0) {
        result[indikator.id] = indikator.lower_better 
          ? Math.min(...hodnoty)
          : Math.max(...hodnoty);
      }
    });
    
    return result;
  }, [navrhy, indicators]);

  const getNejlepsiHodnota = (indikatorId) => {
    return nejlepsiHodnoty[indikatorId] || null;
  };

  const isNejlepsiHodnota = (navrh, indikatorId) => {
    const nejlepsiHodnota = getNejlepsiHodnota(indikatorId);
    const actualNavrhHodnota = parseNumericValue(navrh.data[indikatorId]);
    
    if (nejlepsiHodnota === null || actualNavrhHodnota === null || actualNavrhHodnota === undefined) {
      return false;
    }
    
    // Použijeme toleranciu pre floating-point porovnania
    const tolerance = 0.0001;
    return Math.abs(Number(actualNavrhHodnota) - Number(nejlepsiHodnota)) < tolerance;
  };

  // Funkcie pre editovanie
  const openEditModal = (indicator, proposal) => {
    const currentValue = proposal.data[indicator.id];
    
    setEditModal({
      isOpen: true,
      indicator,
      proposal,
      currentValue: currentValue  // Pošleme celý objekt, nie len hodnotu
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
                    const isNejlepsi = isNejlepsiHodnota(navrh, indikator.id);
                    // Extrahujeme hodnotu z objektu alebo použijeme priamo číslo
                    const actualHodnota = hodnota && typeof hodnota === 'object' && 'value' in hodnota ? hodnota.value : hodnota;
                    // Kontrola source pre ručně doplnené hodnoty
                    const source = hodnota && typeof hodnota === 'object' && 'source' in hodnota ? hodnota.source : 'unknown';
                    const isManualEntry = source === 'uživatelský vstup' || source === 'Manuálně upraveno';
                    
                    return (
                      <td key={indikator.id} className={`px-4 py-3 text-sm text-text-dark border-b border-border text-center ${isNejlepsi ? 'bg-green-100 border-green-300 font-semibold' : ''} ${isManualEntry && !isNejlepsi ? 'bg-blue-50' : ''}`}>
                        <div className="space-y-2">
                          <div className="font-semibold number-text flex items-center justify-center gap-1">
                            {formatHodnota(actualHodnota, indikator.jednotka)}
                            {isManualEntry && <span className="text-blue-500" title="Ručně doplněná hodnota">✏️</span>}
                          </div>
                          {isNejlepsi && (
                            <div className="text-xs text-green-700 font-bold flex items-center gap-1 justify-center bg-green-200 px-2 py-1 rounded-full">
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

export default StepResults;