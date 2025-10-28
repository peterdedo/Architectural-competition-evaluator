import React, { useState } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { useVisionAnalyzer } from '../hooks/useVisionAnalyzer';
import { useToast } from '../hooks/useToast';
import { CRITERIA } from '../models/CriteriaModel';
import AIAssistant from './AIAssistant';

const StepResults = () => {
  const { projects, selectedCriteria, setAnalysisResults, setStep, config, updateProject } = useWizard();
  const { analyze, isAnalyzing } = useVisionAnalyzer();
  const { showToast } = useToast();
  const [viewMode, setViewMode] = useState('table');

  const handleProjectToggle = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      updateProject(projectId, { selected: !project.selected });
    }
  };

  // Filtrovat jen vybrané projekty
  const selectedProjects = projects.filter(p => p.selected);
  const completedProjects = projects.filter(p => p.status === 'completed');

  // Filtrovat jen vybraná kritéria
  const filteredCriteria = Object.fromEntries(
    Object.entries(CRITERIA).filter(([key]) => selectedCriteria.has(key))
  );

  const handleAnalyze = async () => {
    if (completedProjects.length === 0) {
      showToast('Najprv spracujte PDF dokumenty', 'warning');
      return;
    }

    if (selectedCriteria.size === 0) {
      showToast('Vyberte aspoň jedno kritérium', 'warning');
      return;
    }

    const results = [];
    
    for (const project of completedProjects) {
      // Použijte skutečné API volání s uloženým API klíčem
      const result = await analyze(project, filteredCriteria, config.apiKey, config.model, false); // Real API mode
      results.push(result);
      
      // Uložte výsledek do projektu
      updateProject(project.id, { analysisResult: result });
    }

    setAnalysisResults(results);
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.length - successCount;

    if (errorCount > 0) {
      showToast(`Analýza dokončená s ${errorCount} chybami. Úspešných: ${successCount}`, 'warning');
    } else {
      showToast(`Analýza dokončená! Všetkých ${successCount} projektov úspešne spracovaných.`, 'success');
    }
  };

  // Funkce pro získání hodnoty kritéria pro projekt
  const getProjectValue = (project, criterionKey) => {
    const result = project.analysisResult;
    if (!result || !result.data) return null;
    return result.data[criterionKey]?.value || null;
  };

  // Funkce pro získání zdroje
  const getProjectSource = (project, criterionKey) => {
    const result = project.analysisResult;
    if (!result || !result.data) return 'Nenalezeno';
    return result.data[criterionKey]?.source || 'Nenalezeno';
  };

  // Funkce pro formátování hodnoty
  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return `${value.toLocaleString('sk-SK')} ${unit}`;
    }
    return `${String(value)} ${unit}`;
  };

  if (projects.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Výsledky Analýzy</h2>
              <p className="text-indigo-100 text-sm">Zobrazenie výsledkov analýzy projektov</p>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📁</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Najprv nahrajte projekty</h3>
            <p className="text-slate-500 mb-6">Prejdite na krok "Nahrávanie" a nahrajte PDF dokumenty projektov.</p>
            <button className="btn btn-primary" onClick={() => setStep('upload')}>
              ← Späť na Nahrávanie
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* AI Assistant */}
      <AIAssistant onWeightsUpdate={(suggestions) => {
        console.log('AI váhy doporučení:', suggestions);
        showToast('AI váhy úspešne aplikované!', 'success');
      }} />

      <div className="card animate-fade-in">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Výsledky Analýzy</h2>
              <p className="text-indigo-100 text-sm">
                Analýza {projects.length} projektov podľa {selectedCriteria.size} vybraných kritérií
              </p>
            </div>
          </div>
        </div>
      
      <div className="card-content space-y-6">
        {/* Project Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Vyberte projekty pre analýzu:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <label key={project.id} className={`project-card cursor-pointer ${project.selected ? 'selected' : ''}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={project.selected || false}
                    onChange={() => handleProjectToggle(project.id)}
                    className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                  />
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <span className="text-lg">📄</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-slate-800 truncate">{project.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        {(project.file?.size / 1024 || 0).toFixed(1)} KB
                      </span>
                      <span className={`badge ${
                        project.status === 'completed' ? 'badge-success' :
                        project.status === 'processing' ? 'badge-info' :
                        project.status === 'error' ? 'badge-error' :
                        'badge-warning'
                      }`}>
                        {project.status === 'pending' && '⏳ Pripravené'}
                        {project.status === 'processing' && '🔄 Spracováva sa'}
                        {project.status === 'completed' && '✅ Hotové'}
                        {project.status === 'error' && '❌ Chyba'}
                      </span>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Analysis Button */}
        <div className="flex justify-center">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleAnalyze}
            disabled={isAnalyzing || completedProjects.length === 0}
          >
            {isAnalyzing ? (
              <>
                <div className="spinner w-4 h-4"></div>
                Spracováva sa...
              </>
            ) : (
              <>
                <span className="text-lg">🚀</span>
                Spustiť analýzu
              </>
            )}
          </button>
        </div>

        {/* View Mode Selection */}
        {selectedProjects.length > 0 && (
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setViewMode('table')}
            >
              📋 Tabuľka
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'cards' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setViewMode('cards')}
            >
              🃏 Karty
            </button>
          </div>
        )}

        {/* Results Display */}
        {selectedProjects.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-800">Výsledky analýzy:</h3>
            
            {viewMode === 'table' && (
              <div className="overflow-x-auto">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th className="w-64">Projekt</th>
                      {Object.entries(filteredCriteria).map(([key, criterion]) => (
                        <th key={key} className="text-center min-w-32">
                          <div className="space-y-1">
                            <div className="font-semibold text-xs">{criterion.name}</div>
                            <div className="text-xs text-slate-500">{criterion.unit}</div>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedProjects.map(project => (
                      <tr key={project.id}>
                        <td className="font-semibold">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                              <span className="text-sm">📄</span>
                            </div>
                            <div>
                              <div className="font-semibold">{project.name}</div>
                              <div className="text-xs text-slate-500">
                                {(project.file?.size / 1024 || 0).toFixed(1)} KB
                              </div>
                            </div>
                          </div>
                        </td>
                        {Object.entries(filteredCriteria).map(([key, criterion]) => {
                          const value = getProjectValue(project, key);
                          return (
                            <td key={key} className="text-center">
                              <div className="font-semibold">
                                {formatValue(value, criterion.unit)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedProjects.map(project => (
                  <div key={project.id} className="card">
                    <div className="card-header">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <span className="text-lg">📄</span>
                        </div>
                        <div>
                          <h4 className="font-semibold">{project.name}</h4>
                          <p className="text-indigo-100 text-sm">
                            {(project.file?.size / 1024 || 0).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="space-y-3">
                        {Object.entries(filteredCriteria).map(([key, criterion]) => {
                          const value = getProjectValue(project, key);
                          const source = getProjectSource(project, key);
                          return (
                            <div key={key} className="p-3 rounded-lg border border-slate-200">
                              <div className="font-semibold text-sm text-slate-800">{criterion.name}</div>
                              <div className="text-lg font-bold text-indigo-600 mt-1">
                                {formatValue(value, criterion.unit)}
                              </div>
                              <div className="text-xs text-slate-500 mt-1 truncate" title={source}>
                                {source}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <button className="btn btn-secondary" onClick={() => setStep('criteria')}>
            ← Späť na Kritériá
          </button>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              📊 Exportovať Výsledky
            </button>
            <button className="btn btn-primary" onClick={() => setStep('comparison')}>
              Pokračovať na Porovnanie
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default StepResults;
