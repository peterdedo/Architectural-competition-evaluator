import React, { useState } from 'react';
import { indikatory } from '../data/indikatory';
import { BarChart3, File, Trophy, ArrowRight, Edit3, Save } from 'lucide-react';
import EditIndicatorModal from './EditIndicatorModal';

const StepResults = ({ navrhy, vybraneIndikatory, onNext, onBack, setNavrhy }) => {
  console.log('StepResults - navrhy:', navrhy);
  console.log('StepResults - vybraneIndikatory:', vybraneIndikatory);
  
  // State pre editovanie
  const [editModal, setEditModal] = useState({
    isOpen: false,
    indicator: null,
    proposal: null,
    currentValue: null
  });
  
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
  
  const zpracovaneNavrhy = navrhy.filter(navrh => {
    console.log(`Kontrolujem návrh ${navrh.nazev}:`, {
      status: navrh.status,
      hasData: !!navrh.data,
      dataKeys: navrh.data ? Object.keys(navrh.data) : [],
      dataValues: navrh.data ? Object.values(navrh.data) : []
    });
    
    if (navrh.status !== 'zpracován' || !navrh.data) return false;
    
    // Kontrolujeme, či má aspoň jeden indikátor s hodnotou
    const hasValidData = Object.values(navrh.data).some(indicator => 
      indicator && typeof indicator === 'object' && 
      'value' in indicator && 
      indicator.value !== null && 
      indicator.value !== undefined
    );
    
    console.log(`Návrh ${navrh.nazev} má platné dáta:`, hasValidData);
    return hasValidData;
  });
  
  console.log('Zpracované návrhy:', zpracovaneNavrhy);
  const vybraneIndikatoryList = indikatory.filter(ind => vybraneIndikatory.has(ind.id));

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

    const hodnoty = zpracovaneNavrhy
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

  if (zpracovaneNavrhy.length === 0) {
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
      <div className="bg-primary text-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <BarChart3 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="heading-1">Výsledky analýzy</h2>
            <p className="text-white/80 text-sm">
              Přehled {zpracovaneNavrhy.length} zpracovaných návrhů podle {vybraneIndikatoryList.length} vybraných indikátorů
            </p>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        {/* Přehled návrhů */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {zpracovaneNavrhy.map(navrh => {
            const pocetIndikatoru = Object.keys(navrh.data).length;
            const kompletnost = Math.round((pocetIndikatoru / vybraneIndikatoryList.length) * 100);
            
            return (
              <div key={navrh.id} className="step-card hover:step-card-active" style={{ transition: 'transform .2s ease, box-shadow .2s ease' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                    <File size={16} className="text-primary" />
                  </div>
                  <div className="font-semibold text-text-dark truncate">{navrh.nazev}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-light">Kompletnost dat</span>
                    <span className="font-semibold text-text-dark">{kompletnost}%</span>
                  </div>
                  <div className="w-full bg-neutral rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        kompletnost >= 80 ? 'bg-secondary' :
                        kompletnost >= 60 ? 'bg-accent' :
                        'bg-error'
                      }`}
                      style={{ width: `${kompletnost}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-text-light">
                    {pocetIndikatoru} z {vybraneIndikatoryList.length} indikátorů
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tabulka výsledků */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-surface rounded-xl overflow-hidden shadow-card">
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
              {zpracovaneNavrhy.map(navrh => (
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

        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <button className="btn-secondary" onClick={onBack}>
            ← Zpět na Výběr kritérií
          </button>
          <div className="flex gap-3">
            <button 
              className="btn-primary"
              onClick={() => {
                // Scroll to export section
                const exportSection = document.querySelector('[data-export-section]');
                if (exportSection) {
                  exportSection.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <BarChart3 size={16} /> Exportovat výsledky
            </button>
            <button className="btn-primary" onClick={onNext}>
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
    </div>
  );
};

export default StepResults;