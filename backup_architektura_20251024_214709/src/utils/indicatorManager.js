// Urban Analytics v2.1 - Indicator Manager
// Správa indikátorů, vah kategorií a validace konfigurace

import { indikatory, kategorie } from '../data/indikatory.js';

// Storage keys
const STORAGE_KEYS = {
  INDICATORS: 'urban-analysis-indicators',
  CATEGORY_WEIGHTS: 'urban-analysis-category-weights',
  CUSTOM_INDICATORS: 'urban-analysis-custom-indicators'
};

// Default category weights
const DEFAULT_CATEGORY_WEIGHTS = {
  "Bilance ploch řešeného území": 40,
  "Bilance HPP dle funkce": 40,
  "Bilance parkovacích ploch": 20
};

// Load from localStorage with fallback
const loadFromStorage = (key, defaultValue) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  } catch (error) {
    console.error(`Error loading ${key}:`, error);
    return defaultValue;
  }
};

// Save to localStorage
const saveToStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving ${key}:`, error);
  }
};

// Get all indicators (base + custom)
export const getAllIndicators = () => {
  const customIndicators = loadFromStorage(STORAGE_KEYS.CUSTOM_INDICATORS, []);
  return [...indikatory, ...customIndicators];
};

// Get category weights
export const getCategoryWeights = () => {
  return loadFromStorage(STORAGE_KEYS.CATEGORY_WEIGHTS, DEFAULT_CATEGORY_WEIGHTS);
};

// Set category weights
export const setCategoryWeights = (weights) => {
  saveToStorage(STORAGE_KEYS.CATEGORY_WEIGHTS, weights);
};

// Get category summary
export const getCategorySummary = () => {
  const allIndicators = getAllIndicators();
  const categoryWeights = getCategoryWeights();
  
  return kategorie.map(category => {
    const categoryIndicators = allIndicators.filter(ind => ind.kategorie === category.id);
    const totalWeight = categoryIndicators.reduce((sum, ind) => sum + (ind.vaha || 0), 0);
    
    return {
      key: category.id,
      nazev: category.nazev,
      indicatorCount: categoryIndicators.length,
      categoryWeight: categoryWeights[category.id] || 0,
      totalIndicatorWeight: totalWeight,
      ikona: category.ikona
    };
  });
};

// Add custom indicator
export const addCustomIndicator = (indicator) => {
  const customIndicators = loadFromStorage(STORAGE_KEYS.CUSTOM_INDICATORS, []);
  const newIndicator = {
    ...indicator,
    id: `custom_${Date.now()}`,
    type: 'custom',
    vaha: indicator.vaha || 10,
    comparison_method: indicator.comparison_method || 'numeric',
    lower_better: indicator.lower_better || false,
    created_at: new Date().toISOString()
  };
  
  const updatedIndicators = [...customIndicators, newIndicator];
  saveToStorage(STORAGE_KEYS.CUSTOM_INDICATORS, updatedIndicators);
  return newIndicator;
};

// Update custom indicator
export const updateCustomIndicator = (id, updates) => {
  const customIndicators = loadFromStorage(STORAGE_KEYS.CUSTOM_INDICATORS, []);
  const updatedIndicators = customIndicators.map(ind => 
    ind.id === id ? { ...ind, ...updates, updated_at: new Date().toISOString() } : ind
  );
  saveToStorage(STORAGE_KEYS.CUSTOM_INDICATORS, updatedIndicators);
  return updatedIndicators.find(ind => ind.id === id);
};

// Delete custom indicator
export const deleteIndicator = (id) => {
  const customIndicators = loadFromStorage(STORAGE_KEYS.CUSTOM_INDICATORS, []);
  const updatedIndicators = customIndicators.filter(ind => ind.id !== id);
  saveToStorage(STORAGE_KEYS.CUSTOM_INDICATORS, updatedIndicators);
  return true;
};

// Validate scoring configuration
export const validateScoringConfig = (indicators, categoryWeights) => {
  const errors = [];
  
  // Check if category weights sum to 100%
  const totalCategoryWeight = Object.values(categoryWeights).reduce((sum, weight) => sum + weight, 0);
  if (totalCategoryWeight !== 100) {
    errors.push(`Váhy kategorií musí součet 100%. Aktuálně: ${totalCategoryWeight}%`);
  }
  
  // Check if all categories have weights
  const categoriesWithWeights = Object.keys(categoryWeights).length;
  const totalCategories = kategorie.length;
  if (categoriesWithWeights !== totalCategories) {
    errors.push(`Chybí váhy pro ${totalCategories - categoriesWithWeights} kategorií`);
  }
  
  // Check if indicators have valid weights
  const invalidWeights = indicators.filter(ind => 
    !ind.vaha || ind.vaha < 0 || ind.vaha > 100
  );
  if (invalidWeights.length > 0) {
    errors.push(`${invalidWeights.length} indikátorů má neplatné váhy`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get indicator by ID
export const getIndicatorById = (id) => {
  const allIndicators = getAllIndicators();
  return allIndicators.find(ind => ind.id === id);
};

// Get indicators by category
export const getIndicatorsByCategory = (categoryId) => {
  const allIndicators = getAllIndicators();
  return allIndicators.filter(ind => ind.kategorie === categoryId);
};

// Search indicators
export const searchIndicators = (query, filters = {}) => {
  const allIndicators = getAllIndicators();
  const q = query.toLowerCase();
  
  return allIndicators.filter(indicator => {
    // Text search
    const matchesText = !q || 
      indicator.nazev.toLowerCase().includes(q) ||
      (indicator.popis || '').toLowerCase().includes(q) ||
      (indicator.jednotka || '').toLowerCase().includes(q);
    
    // Type filter
    const matchesType = !filters.type || filters.type === 'all' || 
      indicator.comparison_method === filters.type;
    
    // Category filter
    const matchesCategory = !filters.category || 
      indicator.kategorie === filters.category;
    
    return matchesText && matchesType && matchesCategory;
  });
};

// Export all data
export const exportData = () => {
  return {
    indicators: getAllIndicators(),
    categoryWeights: getCategoryWeights(),
    categories: kategorie,
    exportDate: new Date().toISOString()
  };
};

// Import data
export const importData = (data) => {
  try {
    if (data.indicators) {
      saveToStorage(STORAGE_KEYS.CUSTOM_INDICATORS, data.indicators.filter(ind => ind.type === 'custom'));
    }
    if (data.categoryWeights) {
      saveToStorage(STORAGE_KEYS.CATEGORY_WEIGHTS, data.categoryWeights);
    }
    return { success: true };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, error: error.message };
  }
};

// Reset to defaults
export const resetToDefaults = () => {
  saveToStorage(STORAGE_KEYS.CUSTOM_INDICATORS, []);
  saveToStorage(STORAGE_KEYS.CATEGORY_WEIGHTS, DEFAULT_CATEGORY_WEIGHTS);
  return true;
};

// Get statistics
export const getStatistics = () => {
  const allIndicators = getAllIndicators();
  const customIndicators = allIndicators.filter(ind => ind.type === 'custom');
  const categoryWeights = getCategoryWeights();
  
  return {
    totalIndicators: allIndicators.length,
    customIndicators: customIndicators.length,
    baseIndicators: allIndicators.length - customIndicators.length,
    categories: kategorie.length,
    categoryWeightsConfigured: Object.keys(categoryWeights).length,
    lastUpdated: new Date().toISOString()
  };
};
