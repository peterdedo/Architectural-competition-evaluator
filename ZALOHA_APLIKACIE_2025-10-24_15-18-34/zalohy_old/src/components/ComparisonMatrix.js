import React, { useState, useMemo } from 'react';
import '../App.css';
import './ComparisonMatrix.css';

function ComparisonMatrix({ projects, criteria, selectedCriteria, viewMode = 'table', colorScheme = 'default' }) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filterValues, setFilterValues] = useState({});
  const [viewOptions, setViewOptions] = useState({
    showHeatmap: true,
    showSparklines: false,
    showTrendLines: false,
    normalizeValues: false
  });

  // Filtrovat jen vybrané projekty a kritéria
  const filteredProjects = projects.filter(p => p.selected);
  const filteredCriteria = Object.fromEntries(
    Object.entries(criteria || {}).filter(([key]) => selectedCriteria.has(key))
  );

  // Funkce pro získání hodnoty kritéria pro projekt
  const getProjectValue = (project, criterionKey) => {
    const data = project.extractedData?.indicators?.[criterionKey];
    return data?.value !== null && data?.value !== undefined ? data.value : null;
  };

  // Funkce pro normalizaci hodnot (0-100 scale)
  const normalizeValue = (value, criterionKey) => {
    if (!viewOptions.normalizeValues || value === null) return value;

    const allValues = filteredProjects
      .map(p => getProjectValue(p, criterionKey))
      .filter(v => v !== null);

    if (allValues.length === 0) return value;

    const min = Math.min(...allValues);
    const max = Math.max(...allValues);

    if (max === min) return 50; // Všechny hodnoty stejné

    return ((value - min) / (max - min)) * 100;
  };

  // Funkce pro určení barvy podle hodnoty
  const getValueColor = (value, criterionKey) => {
    if (value === null) return '#f5f5f5';

    const normalizedValue = normalizeValue(value, criterionKey);

    // Color schemes
    switch (colorScheme) {
      case 'heatmap':
        return `hsl(${normalizedValue * 1.2}, 70%, 50%)`;
      case 'diverging':
        if (normalizedValue < 33) return `hsl(0, 70%, ${50 + normalizedValue}%)`;
        if (normalizedValue < 66) return `hsl(60, 70%, ${50 + (normalizedValue - 33) * 0.75}%)`;
        return `hsl(120, 70%, ${50 + (normalizedValue - 66) * 0.75}%)`;
      case 'sequential':
        return `hsl(210, 70%, ${90 - normalizedValue * 0.4}%)`;
      default:
        return normalizedValue > 50 ? '#4CAF50' : normalizedValue > 25 ? '#FF9800' : '#F44336';
    }
  };

  // Funkce pro formátování hodnoty
  const formatValue = (value, unit) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return `${value.toLocaleString('cs-CZ')} ${unit}`;
    }
    return `${String(value)} ${unit}`;
  };

  // Funkce pro řazení
  const handleSort = (criterionKey) => {
    let direction = 'asc';
    if (sortConfig.key === criterionKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key: criterionKey, direction });
  };

  // Seřazené projekty
  const sortedProjects = useMemo(() => {
    if (!sortConfig.key) return filteredProjects;

    return [...filteredProjects].sort((a, b) => {
      const aValue = getProjectValue(a, sortConfig.key);
      const bValue = getProjectValue(b, sortConfig.key);

      if (aValue === null && bValue === null) return 0;
      if (aValue === null) return 1;
      if (bValue === null) return -1;

      if (sortConfig.direction === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });
  }, [filteredProjects, sortConfig]);

  // Agregované statistiky
  const getStatsForCriterion = (criterionKey) => {
    const values = filteredProjects
      .map(p => getProjectValue(p, criterionKey))
      .filter(v => v !== null);

    if (values.length === 0) return null;

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      median: values.sort((a, b) => a - b)[Math.floor(values.length / 2)],
      count: values.length
    };
  };

  if (filteredProjects.length === 0) {
    return (
      <div className="comparison-matrix">
        <div className="matrix-header">
          <h3>Multi-Dimensional Comparison Matrix</h3>
          <div className="matrix-controls">
            <select value={colorScheme} onChange={(e) => setViewOptions({...viewOptions, colorScheme: e.target.value})}>
              <option value="default">Default</option>
              <option value="heatmap">Heatmap</option>
              <option value="diverging">Diverging</option>
              <option value="sequential">Sequential</option>
            </select>
          </div>
        </div>
        <div className="no-data">
          Vyberte projekty pro zobrazení porovnávací matice.
        </div>
      </div>
    );
  }

  return (
    <div className="comparison-matrix">
      <div className="matrix-header">
        <h3>Multi-Dimensional Comparison Matrix</h3>
        <div className="matrix-controls">
          <label>
            <input
              type="checkbox"
              checked={viewOptions.showHeatmap}
              onChange={(e) => setViewOptions({...viewOptions, showHeatmap: e.target.checked})}
            />
            Heatmap
          </label>
          <label>
            <input
              type="checkbox"
              checked={viewOptions.normalizeValues}
              onChange={(e) => setViewOptions({...viewOptions, normalizeValues: e.target.checked})}
            />
            Normalize Values
          </label>
          <select value={colorScheme} onChange={(e) => setViewOptions({...viewOptions, colorScheme: e.target.value})}>
            <option value="default">Default</option>
            <option value="heatmap">Heatmap</option>
            <option value="diverging">Diverging</option>
            <option value="sequential">Sequential</option>
          </select>
        </div>
      </div>

      <div className="matrix-container">
        <table className="matrix-table">
          <thead>
            <tr>
              <th className="project-header">Projekt</th>
              {Object.entries(filteredCriteria).map(([key, criterion]) => (
                <th
                  key={key}
                  className="criterion-header"
                  onClick={() => handleSort(key)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="criterion-title">
                    <span>{criterion.name}</span>
                    <span className="criterion-unit">{criterion.unit}</span>
                    {sortConfig.key === key && (
                      <span className="sort-indicator">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                  {getStatsForCriterion(key) && (
                    <div className="criterion-stats">
                      <small>
                        Min: {formatValue(getStatsForCriterion(key).min, criterion.unit)} |
                        Max: {formatValue(getStatsForCriterion(key).max, criterion.unit)}
                      </small>
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map(project => (
              <tr key={project.id} className="project-row">
                <td className="project-cell">
                  <div className="project-info">
                    {project.image && (
                      <img src={project.image} alt={project.name} className="project-avatar" />
                    )}
                    <div className="project-details">
                      <strong>{project.name}</strong>
                      <div className="project-meta">
                        <span>{(project.file?.size / 1024 || 0).toFixed(1)} KB</span>
                        <span className={`status ${project.status}`}>
                          {project.status === 'completed' ? '✓' : '○'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>
                {Object.keys(filteredCriteria).map(criterionKey => {
                  const value = getProjectValue(project, criterionKey);
                  const normalizedValue = normalizeValue(value, criterionKey);
                  const backgroundColor = viewOptions.showHeatmap ? getValueColor(value, criterionKey) : 'transparent';

                  return (
                    <td
                      key={criterionKey}
                      className="value-cell"
                      style={{ backgroundColor }}
                      title={`${filteredCriteria[criterionKey].name}: ${formatValue(value, filteredCriteria[criterionKey].unit)}`}
                    >
                      <div className="value-content">
                        <span className="value-text">
                          {viewOptions.normalizeValues ? normalizedValue?.toFixed(1) : formatValue(value, filteredCriteria[criterionKey].unit)}
                        </span>
                        {viewOptions.showSparklines && (
                          <div className="mini-sparkline">
                            {/* Mini sparkline bude implementována později */}
                          </div>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary statistics */}
      <div className="matrix-summary">
        <h4>Summary Statistics</h4>
        <div className="summary-grid">
          {Object.entries(filteredCriteria).slice(0, 6).map(([key, criterion]) => {
            const stats = getStatsForCriterion(key);
            if (!stats) return null;

            return (
              <div key={key} className="summary-card">
                <h5>{criterion.name}</h5>
                <div className="stats">
                  <div>Avg: {formatValue(stats.avg, criterion.unit)}</div>
                  <div>Min: {formatValue(stats.min, criterion.unit)}</div>
                  <div>Max: {formatValue(stats.max, criterion.unit)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ComparisonMatrix;
