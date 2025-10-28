import React, { useState, useMemo } from 'react';
import '../App.css';
import './SmartFilters.css';

function SmartFilters({ criteria, projects, selectedCriteria, onCriteriaChange, onProjectsFilter }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [filterSuggestions] = useState([
    'Projekty s nejlepší udržitelností',
    'Nejekonomičtější varianty',
    'Projekty vhodné pro rodiny',
    'Nejrychlejší na realizaci',
    'Projekty s nejvyšší návratností',
    'Environmentálně příznivé projekty'
  ]);

  // AI-powered návrhy filtrů
  const aiSuggestions = useMemo(() => {
    const suggestions = [];

    // Nejlepší projekty podle různých kritérií
    if (projects.length > 0) {
      const completedProjects = projects.filter(p => p.status === 'completed');

      if (completedProjects.length > 0) {
        // Nejlepší udržitelnost
        const bestSustainability = completedProjects
          .map(p => ({ project: p, score: getSustainabilityScore(p) }))
          .filter(item => item.score > 0)
          .sort((a, b) => b.score - a.score)[0];

        if (bestSustainability) {
          suggestions.push({
            name: 'Nejudržitelnější projekty',
            description: `${bestSustainability.project.name} vede s udržitelností`,
            filter: { sustainability: 'high' }
          });
        }

        // Nejekonomičtější
        const bestEconomic = completedProjects
          .map(p => ({ project: p, score: getEconomicScore(p) }))
          .filter(item => item.score > 0)
          .sort((a, b) => a.score - b.score)[0];

        if (bestEconomic) {
          suggestions.push({
            name: 'Nejekonomičtější projekty',
            description: `${bestEconomic.project.name} má nejlepší ekonomiku`,
            filter: { economic: 'high' }
          });
        }
      }
    }

    return suggestions;
  }, [projects]);

  // Pomocné funkce pro výpočet skóre
  function getSustainabilityScore(project) {
    const indicators = project.extractedData?.indicators || {};
    const greenAreas = indicators.green_areas?.value || 0;
    const carbonFootprint = indicators.carbon_footprint?.value || 0;
    const energyEfficiency = indicators.energy_efficiency?.value || 0;

    return greenAreas * 0.4 + (carbonFootprint > 0 ? 1000 / carbonFootprint : 0) * 0.3 + energyEfficiency * 0.3;
  }

  function getEconomicScore(project) {
    const indicators = project.extractedData?.indicators || {};
    const investmentCost = indicators.investment_cost?.value || 0;
    const roi = indicators.roi?.value || 0;
    const rentalIncome = indicators.rental_income?.value || 0;

    return roi * 0.5 + (rentalIncome / Math.max(investmentCost, 1)) * 0.3 + (investmentCost > 0 ? 1000000 / investmentCost : 0) * 0.2;
  }

  // Funkce pro použití návrhu filtru
  const applySuggestion = (suggestion) => {
    const filter = suggestion.filter;
    const newActiveFilters = { ...activeFilters, ...filter };
    setActiveFilters(newActiveFilters);

    // Automaticky aplikovat filtr
    applyFilters(newActiveFilters);
  };

  // Funkce pro aplikaci filtrů
  const applyFilters = (filters) => {
    const filteredProjectIds = new Set();

    projects.forEach(project => {
      let include = true;

      if (filters.sustainability === 'high') {
        const score = getSustainabilityScore(project);
        if (score < 50) include = false;
      }

      if (filters.economic === 'high') {
        const score = getEconomicScore(project);
        if (score < 30) include = false;
      }

      if (include) {
        filteredProjectIds.add(project.id);
      }
    });

    // Aktualizovat vybrané projekty
    onProjectsFilter(filteredProjectIds);
  };

  // Funkce pro vyhledávání
  const handleSearch = (query) => {
    setSearchQuery(query);

    if (query.trim()) {
      const filteredIds = new Set();

      projects.forEach(project => {
        if (project.name.toLowerCase().includes(query.toLowerCase()) ||
            project.extractedData?.indicators) {
          filteredIds.add(project.id);
        }
      });

      onProjectsFilter(filteredIds);
    } else {
      onProjectsFilter(new Set(projects.map(p => p.id)));
    }
  };

  // Funkce pro výběr kritérií
  const handleCriterionToggle = (criterionKey) => {
    const newSelected = new Set(selectedCriteria);
    if (newSelected.has(criterionKey)) {
      newSelected.delete(criterionKey);
    } else {
      newSelected.add(criterionKey);
    }
    onCriteriaChange(newSelected);
  };

  return (
    <div className="smart-filters">
      <div className="filters-header">
        <h3>Smart Filters & Search</h3>
        <div className="search-box">
          <input
            type="text"
            placeholder="🔍 Hledat projekty nebo kritéria..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* AI návrhy */}
      <div className="ai-suggestions">
        <h4>🤖 AI Návrhy</h4>
        <div className="suggestions-grid">
          {aiSuggestions.map((suggestion, index) => (
            <div
              key={index}
              className="suggestion-card"
              onClick={() => applySuggestion(suggestion)}
            >
              <div className="suggestion-name">{suggestion.name}</div>
              <div className="suggestion-description">{suggestion.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Rychlé filtry */}
      <div className="quick-filters">
        <h4>⚡ Rychlé Filtry</h4>
        <div className="filter-buttons">
          <button
            className={`filter-btn ${activeFilters.sustainability ? 'active' : ''}`}
            onClick={() => {
              const newFilters = { ...activeFilters };
              if (newFilters.sustainability) {
                delete newFilters.sustainability;
              } else {
                newFilters.sustainability = 'high';
              }
              setActiveFilters(newFilters);
              applyFilters(newFilters);
            }}
          >
            🌱 Udržitelné
          </button>
          <button
            className={`filter-btn ${activeFilters.economic ? 'active' : ''}`}
            onClick={() => {
              const newFilters = { ...activeFilters };
              if (newFilters.economic) {
                delete newFilters.economic;
              } else {
                newFilters.economic = 'high';
              }
              setActiveFilters(newFilters);
              applyFilters(newFilters);
            }}
          >
            💰 Ekonomické
          </button>
          <button
            className={`filter-btn ${activeFilters.family ? 'active' : ''}`}
            onClick={() => {
              const newFilters = { ...activeFilters };
              if (newFilters.family) {
                delete newFilters.family;
              } else {
                newFilters.family = 'high';
              }
              setActiveFilters(newFilters);
              applyFilters(newFilters);
            }}
          >
            👨‍👩‍👧‍👦 Rodinné
          </button>
        </div>
      </div>

      {/* Výběr kritérií */}
      <div className="criteria-selection">
        <h4>📋 Výběr Kritérií</h4>
        <div className="criteria-summary">
          Vybráno: {selectedCriteria.size} z {Object.keys(criteria).length} kritérií
        </div>
        <div className="criteria-buttons">
          <button
            className="criteria-btn all"
            onClick={() => onCriteriaChange(new Set(Object.keys(criteria)))}
          >
            ✅ Vybrat vše
          </button>
          <button
            className="criteria-btn none"
            onClick={() => onCriteriaChange(new Set())}
          >
            ❌ Zrušit výběr
          </button>
        </div>
      </div>

      {/* Aktivní filtry */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="active-filters">
          <h4>🔍 Aktivní Filtry</h4>
          <div className="filter-tags">
            {Object.entries(activeFilters).map(([key, value]) => (
              <span key={key} className="filter-tag">
                {key}: {value}
                <button onClick={() => {
                  const newFilters = { ...activeFilters };
                  delete newFilters[key];
                  setActiveFilters(newFilters);
                  applyFilters(newFilters);
                }}>
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartFilters;




