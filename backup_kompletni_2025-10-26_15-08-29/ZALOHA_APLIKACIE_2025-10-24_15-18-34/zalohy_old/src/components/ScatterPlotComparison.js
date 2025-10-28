import React, { useState, useMemo } from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import '../App.css';
import './ScatterPlotComparison.css';

function ScatterPlotComparison({ projects, criteria, selectedCriteria }) {
  const [xAxis, setXAxis] = useState('investment_cost');
  const [yAxis, setYAxis] = useState('energy_efficiency');
  const [sizeMetric, setSizeMetric] = useState('total_area');
  const [colorScheme, setColorScheme] = useState('category');

  // Filtrovat jen vybrané projekty
  const selectedProjects = projects.filter(p => p.selected);

  // Připravit data pro scatter plot
  const chartData = useMemo(() => {
    return selectedProjects.map(project => {
      const xValue = getProjectValue(project, xAxis);
      const yValue = getProjectValue(project, yAxis);
      const sizeValue = getProjectValue(project, sizeMetric);

      // Normalizovat velikost bubliny (0-100)
      const normalizedSize = sizeValue ? Math.max(20, Math.min(100, (sizeValue / 10000) * 50)) : 20;

      return {
        name: project.name,
        x: xValue || 0,
        y: yValue || 0,
        size: normalizedSize,
        projectId: project.id,
        image: project.image,
        category: getProjectCategory(project)
      };
    }).filter(point => point.x !== null && point.y !== null);
  }, [selectedProjects, xAxis, yAxis, sizeMetric]);

  // Funkce pro získání hodnoty kritéria pro projekt
  function getProjectValue(project, criterionKey) {
    const data = project.extractedData?.indicators?.[criterionKey];
    return data?.value !== null && data?.value !== undefined ? data.value : null;
  }

  // Funkce pro určení kategorie projektu
  function getProjectCategory(project) {
    // Můžeme přidat logiku pro kategorizaci projektů
    return 'default';
  }

  // Barvy pro různé kategorie
  const categoryColors = {
    'environment': '#4CAF50',
    'economic': '#2196F3',
    'social': '#FF9800',
    'urban': '#9C27B0',
    'technical': '#607D8B',
    'default': '#757575'
  };

  // Dostupné osy
  const axisOptions = Object.entries(criteria || {}).map(([key, criterion]) => ({
    key,
    name: criterion.name,
    unit: criterion.unit,
    category: criterion.category
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="scatter-tooltip">
          <div className="tooltip-header">
            {data.image && (
              <img src={data.image} alt={data.name} className="tooltip-image" />
            )}
            <strong>{data.name}</strong>
          </div>
          <div className="tooltip-content">
               <div>X: {data.x?.toLocaleString()} ({criteria?.[xAxis]?.unit})</div>
               <div>Y: {data.y?.toLocaleString()} ({criteria?.[yAxis]?.unit})</div>
               <div>Size: {data.size} ({criteria?.[sizeMetric]?.unit})</div>
          </div>
        </div>
      );
    }
    return null;
  };

  if (selectedProjects.length === 0) {
    return (
      <div className="scatter-comparison">
        <div className="scatter-header">
          <h3>Interactive Scatter Plot</h3>
          <div className="scatter-controls">
            <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
              <option value="">Vyberte X osu</option>
              {axisOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.name} ({option.unit})
                </option>
              ))}
            </select>
            <select value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
              <option value="">Vyberte Y osu</option>
              {axisOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.name} ({option.unit})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="no-data">
          Vyberte projekty pro zobrazení scatter plotu.
        </div>
      </div>
    );
  }

  return (
    <div className="scatter-comparison">
      <div className="scatter-header">
        <h3>Interactive Scatter Plot</h3>
        <div className="scatter-controls">
          <div className="axis-selector">
            <label>X osa:</label>
            <select value={xAxis} onChange={(e) => setXAxis(e.target.value)}>
              <option value="">Vyberte metriku</option>
              {axisOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.name} ({option.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="axis-selector">
            <label>Y osa:</label>
            <select value={yAxis} onChange={(e) => setYAxis(e.target.value)}>
              <option value="">Vyberte metriku</option>
              {axisOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.name} ({option.unit})
                </option>
              ))}
            </select>
          </div>
          <div className="axis-selector">
            <label>Velikost bublin:</label>
            <select value={sizeMetric} onChange={(e) => setSizeMetric(e.target.value)}>
              <option value="">Žádná</option>
              {axisOptions.map(option => (
                <option key={option.key} value={option.key}>
                  {option.name} ({option.unit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {xAxis && yAxis ? (
        <div className="scatter-container">
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart
              margin={{
                top: 20,
                right: 20,
                bottom: 60,
                left: 60,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
                   <XAxis
                     type="number"
                     dataKey="x"
                     name={criteria?.[xAxis]?.name}
                     unit={criteria?.[xAxis]?.unit}
                     tickFormatter={(value) => value?.toLocaleString()}
                   />
                   <YAxis
                     type="number"
                     dataKey="y"
                     name={criteria?.[yAxis]?.name}
                     unit={criteria?.[yAxis]?.unit}
                     tickFormatter={(value) => value?.toLocaleString()}
                   />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Scatter name="Projects" data={chartData} fill="#8884d8">
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={categoryColors[entry.category] || categoryColors.default}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="scatter-setup">
          <p>Vyberte X a Y osu pro zobrazení scatter plotu.</p>
        </div>
      )}

      {/* Summary statistics */}
      <div className="scatter-summary">
        <h4>Scatter Plot Summary</h4>
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-label">Počet projektů:</span>
            <span className="stat-value">{chartData.length}</span>
          </div>
          <div className="stat">
            <span className="stat-label">Průměr X:</span>
            <span className="stat-value">
              {(chartData.reduce((sum, p) => sum + p.x, 0) / chartData.length || 0).toLocaleString()}
            </span>
          </div>
          <div className="stat">
            <span className="stat-label">Průměr Y:</span>
            <span className="stat-value">
              {(chartData.reduce((sum, p) => sum + p.y, 0) / chartData.length || 0).toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScatterPlotComparison;
