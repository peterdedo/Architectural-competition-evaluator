import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Star,
  TrendingUp,
  TrendingDown,
  Calendar,
  Tag,
  BarChart3,
  Settings,
  RotateCcw
} from 'lucide-react';

const AdvancedSearch = ({
  data = [],
  onFilteredDataChange,
  searchFields = ['name', 'description'],
  filterOptions = {},
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
  const [quickFilters, setQuickFilters] = useState([]);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = [...data];

    // Text search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => {
        return searchFields.some(field => {
          const value = item[field];
          return value && value.toString().toLowerCase().includes(query);
        });
      });
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value.length > 0) {
        filtered = filtered.filter(item => {
          const itemValue = item[key];
          if (Array.isArray(value)) {
            return value.includes(itemValue);
          }
          return itemValue === value;
        });
      }
    });

    // Sort data
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      // Handle nested properties
      if (sortBy.includes('.')) {
        const keys = sortBy.split('.');
        aValue = keys.reduce((obj, key) => obj?.[key], a);
        bValue = keys.reduce((obj, key) => obj?.[key], b);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

    return filtered;
  }, [data, searchQuery, filters, sortBy, sortOrder, searchFields]);

  // Update parent component with filtered data
  useEffect(() => {
    if (onFilteredDataChange) {
      onFilteredDataChange(filteredData);
    }
  }, [filteredData, onFilteredDataChange]);

  // Get unique values for filter options
  const getFilterOptions = (field) => {
    const values = data.map(item => {
      const value = item[field];
      return value && typeof value === 'object' ? value.name || value.id : value;
    }).filter(Boolean);
    
    return [...new Set(values)].sort();
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    setSortBy('name');
    setSortOrder('asc');
  };

  // Save search
  const saveSearch = () => {
    const searchId = Date.now();
    const newSearch = {
      id: searchId,
      name: `Hľadanie ${new Date().toLocaleDateString()}`,
      query: searchQuery,
      filters,
      sortBy,
      sortOrder,
      createdAt: new Date()
    };
    
    setSavedSearches(prev => [newSearch, ...prev.slice(0, 9)]);
  };

  // Load saved search
  const loadSearch = (search) => {
    setSearchQuery(search.query);
    setFilters(search.filters);
    setSortBy(search.sortBy);
    setSortOrder(search.sortOrder);
  };

  // Quick filter presets
  const quickFilterPresets = [
    {
      id: 'high_score',
      name: 'Vysoké skóre',
      icon: TrendingUp,
      color: 'green',
      filter: { totalScore: { min: 80 } }
    },
    {
      id: 'low_score',
      name: 'Nízke skóre',
      icon: TrendingDown,
      color: 'red',
      filter: { totalScore: { max: 40 } }
    },
    {
      id: 'recent',
      name: 'Najnovšie',
      icon: Calendar,
      color: 'blue',
      sort: { field: 'createdAt', order: 'desc' }
    },
    {
      id: 'favorites',
      name: 'Obľúbené',
      icon: Star,
      color: 'yellow',
      filter: { isFavorite: true }
    }
  ];

  // Apply quick filter
  const applyQuickFilter = (preset) => {
    if (preset.filter) {
      Object.entries(preset.filter).forEach(([key, value]) => {
        handleFilterChange(key, value);
      });
    }
    if (preset.sort) {
      setSortBy(preset.sort.field);
      setSortOrder(preset.sort.order);
    }
  };

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="relative">
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Hľadať v projektoch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Filter size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickFilterPresets.map((preset) => {
            const IconComponent = preset.icon;
            return (
              <motion.button
                key={preset.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => applyQuickFilter(preset)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  preset.color === 'green' ? 'bg-green-100 text-green-700 hover:bg-green-200' :
                  preset.color === 'red' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                  preset.color === 'blue' ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' :
                  'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                <IconComponent size={16} />
                {preset.name}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Pokročilé filtre</h3>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Settings size={16} />
                    {showAdvanced ? 'Skryť' : 'Zobraziť'} pokročilé
                  </button>
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 transition-colors"
                  >
                    <RotateCcw size={16} />
                    Vymazať všetko
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(filterOptions).map(([field, options]) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {options.label || field}
                    </label>
                    {options.type === 'select' ? (
                      <select
                        value={filters[field] || ''}
                        onChange={(e) => handleFilterChange(field, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Všetky</option>
                        {getFilterOptions(field).map(value => (
                          <option key={value} value={value}>{value}</option>
                        ))}
                      </select>
                    ) : options.type === 'multiselect' ? (
                      <div className="space-y-2">
                        {getFilterOptions(field).map(value => (
                          <label key={value} className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={filters[field]?.includes(value) || false}
                              onChange={(e) => {
                                const currentValues = filters[field] || [];
                                if (e.target.checked) {
                                  handleFilterChange(field, [...currentValues, value]);
                                } else {
                                  handleFilterChange(field, currentValues.filter(v => v !== value));
                                }
                              }}
                              className="rounded"
                            />
                            <span className="text-sm text-gray-700">{value}</span>
                          </label>
                        ))}
                      </div>
                    ) : options.type === 'range' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            placeholder="Min"
                            value={filters[field]?.min || ''}
                            onChange={(e) => handleFilterChange(field, {
                              ...filters[field],
                              min: e.target.value ? Number(e.target.value) : undefined
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="text-gray-500">-</span>
                          <input
                            type="number"
                            placeholder="Max"
                            value={filters[field]?.max || ''}
                            onChange={(e) => handleFilterChange(field, {
                              ...filters[field],
                              max: e.target.value ? Number(e.target.value) : undefined
                            })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={filters[field] || ''}
                        onChange={(e) => handleFilterChange(field, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Advanced Options */}
              <AnimatePresence>
                {showAdvanced && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-gray-200"
                  >
                    {/* Sorting */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Zoradiť podľa
                        </label>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="name">Názov</option>
                          <option value="totalScore">Skóre</option>
                          <option value="createdAt">Dátum vytvorenia</option>
                          <option value="category">Kategória</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Poradie
                        </label>
                        <select
                          value={sortOrder}
                          onChange={(e) => setSortOrder(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="asc">Vzostupne</option>
                          <option value="desc">Zostupne</option>
                        </select>
                      </div>
                    </div>

                    {/* Saved Searches */}
                    {savedSearches.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Uložené hľadania
                        </label>
                        <div className="space-y-2">
                          {savedSearches.map((search) => (
                            <div
                              key={search.id}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                            >
                              <div>
                                <div className="text-sm font-medium text-gray-900">{search.name}</div>
                                <div className="text-xs text-gray-500">
                                  {search.createdAt.toLocaleDateString()}
                                </div>
                              </div>
                              <button
                                onClick={() => loadSearch(search)}
                                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                Načítať
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Actions */}
              <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Nájdených {filteredData.length} z {data.length} projektov
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={saveSearch}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    Uložiť hľadanie
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Aplikovať
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdvancedSearch;


