import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Info, 
  Maximize2, 
  Minimize2,
  Download,
  Filter,
  Search,
  Settings
} from 'lucide-react';

const AdvancedHeatmap = ({ 
  data, 
  proposals, 
  indicators, 
  weights = {}, 
  categoryWeights = {},
  onCellClick,
  onProposalSelect,
  onIndicatorSelect,
  className = ""
}) => {
  const [hoveredCell, setHoveredCell] = useState(null);
  const [selectedCells, setSelectedCells] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [sortBy, setSortBy] = useState('score'); // 'score', 'name', 'category'
  const [showWeights, setShowWeights] = useState(true);
  const [colorScheme, setColorScheme] = useState('blue-green'); // 'blue-green', 'red-blue', 'viridis'
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  const heatmapRef = useRef(null);
  const tooltipRef = useRef(null);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = data;
    
    if (filterText) {
      const searchLower = filterText.toLowerCase();
      filtered = filtered.filter(proposal => 
        proposal.name.toLowerCase().includes(searchLower) ||
        proposal.category?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort data
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return (b.totalScore || 0) - (a.totalScore || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'category':
          return (a.category || '').localeCompare(b.category || '');
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [data, filterText, sortBy]);

  // Calculate cell colors and values
  const cellData = useMemo(() => {
    const cells = [];
    const allValues = [];
    
    // Collect all values for normalization
    filteredData.forEach(proposal => {
      indicators.forEach(indicator => {
        const value = proposal.data?.[indicator.id]?.value;
        if (value !== null && value !== undefined) {
          allValues.push(value);
        }
      });
    });
    
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    
    filteredData.forEach((proposal, proposalIndex) => {
      indicators.forEach((indicator, indicatorIndex) => {
        const value = proposal.data?.[indicator.id]?.value;
        const weight = weights[indicator.id] || 1;
        const categoryWeight = categoryWeights[indicator.category] || 1;
        const finalWeight = (weight * categoryWeight) / 100;
        
        let normalizedValue = 0;
        let displayValue = 0;
        let colorIntensity = 0;
        
        if (value !== null && value !== undefined) {
          // Normalize value to 0-1 range
          normalizedValue = (value - minValue) / (maxValue - minValue);
          displayValue = value;
          
          // Calculate color intensity based on normalized value
          colorIntensity = indicator.lower_better ? 1 - normalizedValue : normalizedValue;
        }
        
        const weightedValue = displayValue * finalWeight;
        
        cells.push({
          proposalIndex,
          indicatorIndex,
          proposal,
          indicator,
          value: displayValue,
          normalizedValue,
          weightedValue,
          colorIntensity,
          weight: finalWeight,
          cellId: `${proposal.id}-${indicator.id}`
        });
      });
    });
    
    return cells;
  }, [filteredData, indicators, weights, categoryWeights]);

  // Color schemes
  const getColorScheme = (intensity) => {
    const alpha = Math.max(0.3, intensity);
    
    switch (colorScheme) {
      case 'red-blue':
        return intensity < 0.5 
          ? `rgba(59, 130, 246, ${alpha})` // Blue for low values
          : `rgba(239, 68, 68, ${alpha})`; // Red for high values
      case 'viridis':
        const hue = intensity * 240; // 0-240 degrees (blue to yellow)
        return `hsla(${hue}, 70%, 50%, ${alpha})`;
      default: // blue-green
        return intensity < 0.5
          ? `rgba(59, 130, 246, ${alpha})` // Blue for low values
          : `rgba(34, 197, 94, ${alpha})`; // Green for high values
    }
  };

  // Handle cell hover
  const handleCellHover = (cell, event) => {
    setHoveredCell(cell);
    
    if (tooltipRef.current) {
      const rect = event.currentTarget.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = rect.left + rect.width / 2;
      let y = rect.top - 10;
      
      // Adjust position to keep tooltip in viewport
      if (x + tooltipRect.width / 2 > window.innerWidth) {
        x = window.innerWidth - tooltipRect.width / 2 - 10;
      }
      if (x - tooltipRect.width / 2 < 0) {
        x = tooltipRect.width / 2 + 10;
      }
      if (y - tooltipRect.height < 0) {
        y = rect.bottom + 10;
      }
      
      setTooltipPosition({ x, y });
    }
  };

  // Handle cell click
  const handleCellClick = (cell) => {
    const newSelected = new Set(selectedCells);
    if (newSelected.has(cell.cellId)) {
      newSelected.delete(cell.cellId);
    } else {
      newSelected.add(cell.cellId);
    }
    setSelectedCells(newSelected);
    
    if (onCellClick) {
      onCellClick(cell, newSelected);
    }
  };

  // Export data
  const handleExport = () => {
    const csvData = [
      ['Proposal', 'Indicator', 'Value', 'Weight', 'Weighted Value', 'Category'],
      ...cellData.map(cell => [
        cell.proposal.name,
        cell.indicator.name,
        cell.value,
        cell.weight.toFixed(2),
        cell.weightedValue.toFixed(2),
        cell.indicator.category
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'heatmap-data.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filtrovať návrhy..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="score">Zoradiť podľa skóre</option>
            <option value="name">Zoradiť podľa názvu</option>
            <option value="category">Zoradiť podľa kategórie</option>
          </select>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Farebná schéma:</label>
            <select
              value={colorScheme}
              onChange={(e) => setColorScheme(e.target.value)}
              className="px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="blue-green">Modro-zelená</option>
              <option value="red-blue">Červeno-modrá</option>
              <option value="viridis">Viridis</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showWeights"
              checked={showWeights}
              onChange={(e) => setShowWeights(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showWeights" className="text-sm text-gray-600">
              Zobraziť váhy
            </label>
          </div>
          
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            {isFullscreen ? 'Zmenšiť' : 'Zväčšiť'}
          </button>
        </div>
      </div>

      {/* Heatmap Container */}
      <div 
        ref={heatmapRef}
        className={`
          relative overflow-auto bg-white rounded-xl shadow-sm border border-gray-200
          ${isFullscreen ? 'fixed inset-4 z-50' : ''}
        `}
      >
        <div className="min-w-full">
          {/* Header with indicators */}
          <div className="sticky top-0 z-10 bg-gray-50 border-b border-gray-200">
            <div className="flex">
              <div className="w-48 p-4 font-semibold text-gray-700 border-r border-gray-200">
                Návrh
              </div>
              {indicators.map((indicator) => (
                <div
                  key={indicator.id}
                  className="flex-1 min-w-32 p-4 text-center border-r border-gray-200 last:border-r-0"
                >
                  <div className="text-sm font-medium text-gray-700 mb-1">
                    {indicator.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {indicator.unit}
                  </div>
                  {showWeights && (
                    <div className="text-xs text-blue-600 font-medium mt-1">
                      {(weights[indicator.id] || 1).toFixed(1)}%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Heatmap rows */}
          <div className="divide-y divide-gray-200">
            {filteredData.map((proposal, proposalIndex) => (
              <motion.div
                key={proposal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: proposalIndex * 0.05 }}
                className="flex hover:bg-gray-50 transition-colors"
              >
                {/* Proposal name */}
                <div className="w-48 p-4 border-r border-gray-200 flex items-center">
                  <div>
                    <div className="font-medium text-gray-900">{proposal.name}</div>
                    <div className="text-sm text-gray-500">
                      Skóre: {(proposal.totalScore || 0).toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Indicator cells */}
                {indicators.map((indicator, indicatorIndex) => {
                  const cell = cellData.find(c => 
                    c.proposalIndex === proposalIndex && c.indicatorIndex === indicatorIndex
                  );
                  
                  if (!cell) return null;
                  
                  const isSelected = selectedCells.has(cell.cellId);
                  const isHovered = hoveredCell?.cellId === cell.cellId;
                  
                  return (
                    <motion.div
                      key={`${proposal.id}-${indicator.id}`}
                      className={`
                        flex-1 min-w-32 p-4 text-center border-r border-gray-200 last:border-r-0
                        cursor-pointer transition-all duration-200 relative
                        ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                        ${isHovered ? 'z-20' : ''}
                      `}
                      style={{
                        backgroundColor: getColorScheme(cell.colorIntensity)
                      }}
                      onMouseEnter={(e) => handleCellHover(cell, e)}
                      onMouseLeave={() => setHoveredCell(null)}
                      onClick={() => handleCellClick(cell)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="text-sm font-medium text-gray-900">
                        {cell.value !== null ? cell.value.toFixed(1) : 'N/A'}
                      </div>
                      {showWeights && (
                        <div className="text-xs text-gray-600 mt-1">
                          {(cell.weightedValue).toFixed(1)}
                        </div>
                      )}
                      
                      {/* Trend indicator */}
                      {cell.value !== null && (
                        <div className="absolute top-1 right-1">
                          {cell.normalizedValue > 0.7 ? (
                            <TrendingUp size={12} className="text-green-600" />
                          ) : cell.normalizedValue < 0.3 ? (
                            <TrendingDown size={12} className="text-red-600" />
                          ) : null}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      <AnimatePresence>
        {hoveredCell && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-xs"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
              transform: 'translate(-50%, -100%)'
            }}
          >
            <div className="space-y-2">
              <div className="font-semibold text-gray-900">
                {hoveredCell.proposal.name}
              </div>
              <div className="text-sm text-gray-600">
                {hoveredCell.indicator.name}
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Hodnota:</span>
                  <span className="font-medium">
                    {hoveredCell.value !== null ? hoveredCell.value.toFixed(2) : 'N/A'} {hoveredCell.indicator.unit}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Váha:</span>
                  <span className="font-medium">
                    {(hoveredCell.weight * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Vážená hodnota:</span>
                  <span className="font-medium text-blue-600">
                    {hoveredCell.weightedValue.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Kategória:</span>
                  <span className="font-medium">
                    {hoveredCell.indicator.category}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div className="text-sm font-medium text-gray-700">Legenda:</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getColorScheme(0) }} />
              <span className="text-sm text-gray-600">Nízke hodnoty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getColorScheme(0.5) }} />
              <span className="text-sm text-gray-600">Stredné hodnoty</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundColor: getColorScheme(1) }} />
              <span className="text-sm text-gray-600">Vysoké hodnoty</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedHeatmap;

