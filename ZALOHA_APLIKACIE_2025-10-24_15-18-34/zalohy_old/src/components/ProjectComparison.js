import React, { useState } from 'react';
import '../App.css';
import './ProjectComparison.css';

function ProjectComparison({ results, criteria }) {
  const [selectedProjects, setSelectedProjects] = useState([]);
  const [comparisonMode, setComparisonMode] = useState('list');

  const toggleProjectSelection = (id) => {
    setSelectedProjects((prev) =>
      prev.includes(id)
        ? prev.filter((p) => p !== id)
        : [...prev.slice(-1), id] // Keep only last 2 selections
    );
  };

  const selectedResults = results.filter((r) => selectedProjects.includes(r.projectId));

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value.toLocaleString('cs-CZ');
    }
    return String(value);
  };

  if (results.length === 0) {
    return (
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: '1.5rem' }}>📈</span>
          <h2>Výsledky Analýzy</h2>
        </div>
        <div className="card-content">
          <div className="info-box" style={{ textAlign: 'center', borderLeft: 'none' }}>
            Zde se budou zobrazovat výsledky po zpracování souborů.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comparison-container">
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: '1.5rem' }}>📈</span>
          <h2>Výsledky Analýzy</h2>
        </div>
        <div className="card-content">
          {/* Mode Selector */}
          <div className="mode-selector">
            <button
              className={`mode-btn ${comparisonMode === 'list' ? 'active' : ''}`}
              onClick={() => setComparisonMode('list')}
            >
              📋 Seznam
            </button>
            <button
              className={`mode-btn ${comparisonMode === 'compare' ? 'active' : ''}`}
              onClick={() => setComparisonMode('compare')}
            >
              ⚖️ Porovnání
            </button>
          </div>

          {/* List View */}
          {comparisonMode === 'list' && (
            <div className="list-view">
              {results.map((result) => (
                <div
                  key={result.projectId}
                  className={`result-card ${
                    selectedProjects.includes(result.projectId) ? 'selected' : ''
                  }`}
                  onClick={() => toggleProjectSelection(result.projectId)}
                >
                  <div className="result-header">
                    <h3>{result.projectName}</h3>
                    <span className="select-hint">
                      {selectedProjects.includes(result.projectId) ? '✓ Vybrán' : 'Vybrat'}
                    </span>
                  </div>
                  <table className="mini-table">
                    <tbody>
                      {Object.entries(criteria)
                        .slice(0, 5)
                        .map(([key, criterion]) => {
                          const value = result.data[key];
                          const displayValue =
                            value?.value !== null && value?.value !== undefined
                              ? formatValue(value.value)
                              : '-';
                          return (
                            <tr key={key}>
                              <td className="criterion-name">{criterion.name}</td>
                              <td className="criterion-value">
                                {displayValue} {displayValue !== '-' ? criterion.unit : ''}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Comparison View */}
          {comparisonMode === 'compare' && (
            <div className="compare-view">
              {selectedResults.length === 0 ? (
                <div className="info-box">
                  Vyberte alespoň 2 projekty ze seznamu vlevo pro porovnání.
                </div>
              ) : (
                <div className="comparison-table-wrapper">
                  <table className="comparison-table">
                    <thead>
                      <tr>
                        <th>Kritérium</th>
                        {selectedResults.map((result) => (
                          <th key={result.projectId} className="comparison-project">
                            <div>{result.projectName}</div>
                            <button
                              className="close-btn"
                              onClick={() => toggleProjectSelection(result.projectId)}
                              title="Odstranit z porovnání"
                            >
                              ✕
                            </button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(criteria).map(([key, criterion]) => {
                        const values = selectedResults.map((r) => ({
                          projectName: r.projectName,
                          data: r.data[key]
                        }));

                        return (
                          <tr key={key}>
                            <td className="criterion-name">
                              <strong>{criterion.name}</strong>
                              <span className="unit">{criterion.unit}</span>
                            </td>
                            {values.map((v, idx) => {
                              const value =
                                v.data?.value !== null && v.data?.value !== undefined
                                  ? v.data.value
                                  : null;
                              const displayValue = formatValue(value);
                              return (
                                <td key={idx} className="comparison-value">
                                  <span className="value">{displayValue}</span>
                                  {value !== null && (
                                    <span className="source">{v.data?.source}</span>
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProjectComparison;

