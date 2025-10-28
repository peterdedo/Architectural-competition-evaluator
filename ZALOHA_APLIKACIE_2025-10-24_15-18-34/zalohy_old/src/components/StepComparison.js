import React, { useState } from 'react';

const StepComparison = ({ onBack, projects, selectedCriteria }) => {
  const [viewMode, setViewMode] = useState('matrix');

  // Filtrovat jen vybrané projekty
  const selectedProjects = projects.filter(p => p.selected);

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

  // Funkce pro určení nejlepší hodnoty
  const getBestValue = (criterionKey) => {
    const values = selectedProjects
      .map(p => getProjectValue(p, criterionKey))
      .filter(v => v !== null);

    if (values.length === 0) return null;

    const higherIsBetter = ['gfa_living', 'green_areas', 'blue_infrastructure', 'biodiversity_index',
                           'social_infrastructure', 'affordable_housing', 'walkability_score',
                           'public_spaces_ratio', 'mixed_use_index', 'connectivity'].includes(criterionKey);

    return higherIsBetter ? Math.max(...values) : Math.min(...values);
  };

  // Funkce pro určení barvy podle hodnoty
  const getValueColor = (value, criterionKey) => {
    if (value === null) return 'neutral';

    const bestValue = getBestValue(criterionKey);
    if (bestValue === null) return 'neutral';

    const diff = Math.abs(value - bestValue);
    const threshold = Math.abs(bestValue) * 0.1;

    if (diff <= threshold) return 'best';
    return 'neutral';
  };

  // Export výsledků
  const handleExport = () => {
    const exportData = selectedProjects.map(project => ({
      project: project.name,
      fileSize: project.file?.size || 0,
      status: project.status,
      indicators: Object.fromEntries(
        Array.from(selectedCriteria).map(key => [
          key,
          getProjectValue(project, key)
        ])
      )
    }));

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `urban_analysis_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (selectedProjects.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Porovnání Projektů</h2>
              <p className="text-indigo-100 text-sm">Vizuální porovnání projektů</p>
            </div>
          </div>
        </div>
        <div className="card-content">
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">📊</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Vyberte projekty pro porovnání</h3>
            <p className="text-slate-500 mb-6">Přejděte na krok "Výsledky" a vyberte alespoň jeden projekt.</p>
            <button className="btn btn-primary" onClick={() => onBack('results')}>
              ← Zpět na Výsledky
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
            <h2 className="text-xl font-bold">Porovnání Projektů</h2>
            <p className="text-indigo-100 text-sm">
              Porovnání {selectedProjects.length} projektů podle {selectedCriteria.size} vybraných kritérií
            </p>
          </div>
        </div>
      </div>
      
      <div className="card-content space-y-6">
        {/* View Mode Selection */}
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

        {/* Matrix View */}
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
                      const colorClass = getValueColor(value, criterionKey);

                      return (
                        <td key={criterionKey} className={`text-center ${colorClass}`}>
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

        {/* Table View */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="comparison-table">
              <thead>
                <tr>
                  <th className="w-64">Kritérium</th>
                  {selectedProjects.map(project => (
                    <th key={project.id} className="text-center min-w-32">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-100 rounded flex items-center justify-center">
                          <span className="text-xs">📄</span>
                        </div>
                        <span className="font-semibold text-sm">{project.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(selectedCriteria).map(criterionKey => (
                  <tr key={criterionKey}>
                    <td className="bg-slate-50">
                      <div className="font-semibold">{criterionKey}</div>
                    </td>
                    {selectedProjects.map(project => {
                      const value = getProjectValue(project, criterionKey);
                      const colorClass = getValueColor(value, criterionKey);

                      return (
                        <td key={project.id} className={`text-center ${colorClass}`}>
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

        {/* Cards View */}
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
                      const colorClass = getValueColor(value, criterionKey);

                      return (
                        <div key={criterionKey} className={`p-3 rounded-lg border ${colorClass}`}>
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

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <button className="btn btn-secondary" onClick={() => onBack('results')}>
            ← Zpět na Výsledky
          </button>
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={handleExport}>
              📊 Exportovat Výsledky
            </button>
            <button className="btn btn-primary">
              💾 Uložit Analýzu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StepComparison;