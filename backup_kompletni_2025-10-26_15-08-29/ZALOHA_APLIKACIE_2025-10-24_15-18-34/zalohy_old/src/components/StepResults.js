import React, { useState } from 'react';

const StepResults = ({ onNext, onBack, projects, selectedCriteria, onProjectToggle }) => {
  const [viewMode, setViewMode] = useState('matrix');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrovat jen vybrané projekty
  const selectedProjects = projects.filter(p => p.selected);

  // Simulace analýzy (placeholder pro budoucí OpenAI integraci)
  const handleAnalyze = async () => {
    setIsProcessing(true);
    
    // Simulace zpracování
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulace výsledků
    const mockResults = projects.map(project => ({
      ...project,
      status: 'completed',
      extractedData: {
        indicators: Object.fromEntries(
          Array.from(selectedCriteria).map(key => [
            key,
            {
              value: Math.random() * 1000,
              source: `Simulovaný zdroj pro ${project.name}`
            }
          ])
        )
      }
    }));
    
    // Aktualizace projektů s výsledky
    projects.forEach((project, index) => {
      Object.assign(project, mockResults[index]);
    });
    
    setIsProcessing(false);
    alert('✅ Analýza dokončena! (Simulované výsledky)');
  };

  // Funkce pro získání hodnoty kritéria pro projekt
  const getProjectValue = (project, criterionKey) => {
    const data = project.extractedData?.indicators?.[criterionKey];
    return data?.value !== null && data?.value !== undefined ? data.value : null;
  };

  // Funkce pro formátování hodnoty
  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return `${value.toLocaleString('cs-CZ')} ${unit}`;
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
              <p className="text-indigo-100 text-sm">Zobrazení výsledků analýzy projektů</p>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📁</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Nejdříve nahrajte projekty</h3>
            <p className="text-slate-500 mb-6">Přejděte na krok "Nahrávání" a nahrajte PDF dokumenty projektů.</p>
            <button className="btn btn-primary" onClick={() => onBack('upload')}>
              ← Zpět na Nahrávání
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Výsledky Analýzy</h2>
            <p className="text-indigo-100 text-sm">
              Analýza {projects.length} projektů podle {selectedCriteria.size} vybraných kritérií
            </p>
          </div>
        </div>
      </div>
      
      <div className="card-content space-y-6">
        {/* Project Selection */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-800">Vyberte projekty pro analýzu:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(project => (
              <label key={project.id} className={`project-card cursor-pointer ${project.selected ? 'selected' : ''}`}>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={project.selected || false}
                    onChange={() => onProjectToggle(project.id)}
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
                        project.status === 'converted' ? 'badge-info' :
                        project.status === 'error' ? 'badge-error' :
                        'badge-warning'
                      }`}>
                        {project.status === 'pending' && '⏳ Připraveno'}
                        {project.status === 'converted' && '🔄 Zpracovává se'}
                        {project.status === 'completed' && '✅ Hotovo'}
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
            disabled={isProcessing || selectedProjects.length === 0}
          >
            {isProcessing ? (
              <>
                <div className="spinner w-4 h-4"></div>
                Zpracovává se...
              </>
            ) : (
              <>
                <span className="text-lg">🚀</span>
                Spustit analýzu
              </>
            )}
          </button>
        </div>

        {/* View Mode Selection */}
        {selectedProjects.length > 0 && (
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'matrix' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setViewMode('matrix')}
            >
              📊 Matice
            </button>
            <button
              className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-all ${
                viewMode === 'table' 
                  ? 'bg-white text-indigo-600 shadow-sm' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              onClick={() => setViewMode('table')}
            >
              📋 Tabulka
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
            
            {viewMode === 'matrix' && (
              <div className="overflow-x-auto">
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th className="w-64">Projekt</th>
                      {Array.from(selectedCriteria).map(criterionKey => (
                        <th key={criterionKey} className="text-center min-w-32">
                          <div className="font-semibold text-xs">{criterionKey}</div>
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
                        {Array.from(selectedCriteria).map(criterionKey => {
                          const value = getProjectValue(project, criterionKey);
                          return (
                            <td key={criterionKey} className="text-center">
                              <div className="font-semibold">
                                {formatValue(value, '')}
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
                        {Array.from(selectedCriteria).map(criterionKey => {
                          const value = getProjectValue(project, criterionKey);
                          return (
                            <div key={criterionKey} className="p-3 rounded-lg border border-slate-200">
                              <div className="font-semibold text-sm text-slate-800">{criterionKey}</div>
                              <div className="text-lg font-bold text-indigo-600 mt-1">
                                {formatValue(value, '')}
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
          <button className="btn btn-secondary" onClick={() => onBack('criteria')}>
            ← Zpět na Kritéria
          </button>
          <div className="flex gap-3">
            <button className="btn btn-secondary">
              📊 Exportovat Výsledky
            </button>
            <button className="btn btn-primary" onClick={() => onNext('comparison')}>
              Pokračovat na Porovnání
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepResults;