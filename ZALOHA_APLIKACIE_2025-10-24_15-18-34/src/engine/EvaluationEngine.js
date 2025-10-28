/**
 * EvaluationEngine.js - Robustní výpočet skóre projektů
 * 
 * Funkcie:
 * - Normalizácia indikátorov
 * - Vážené skóre kategórií a indikátorov
 * - Celkové skóre projektu
 * - Bezpečné ošetrenie NaN a prázdnych dát
 */

/**
 * Vypočíta skóre projektu na základe váh a hodnôt indikátorov
 * @param {Object} project - Projekt s kategóriami a indikátormi
 * @param {Object} weights - Váhy kategórií a indikátorov
 * @returns {number} Celkové skóre v percentách (0-100)
 */
export function calculateProjectScore(project, weights) {
  if (!project || !weights) {
    console.warn('[EvaluationEngine] Chýbajúce dáta pre výpočet skóre');
    return 0;
  }

  let totalWeightedScore = 0;
  let totalPossibleScore = 0;

  try {
    // Prejdi všetky kategórie
    Object.entries(project.categories || {}).forEach(([catId, category]) => {
      const categoryWeight = weights[catId]?.weight ?? 0;
      
      if (categoryWeight <= 0) return; // Preskoč kategórie bez váhy

      // Prejdi všetky indikátory v kategórii
      Object.entries(category.indicators || {}).forEach(([indId, indicator]) => {
        const indicatorWeight = weights[catId]?.indicators?.[indId]?.weight ?? 0;
        
        if (indicatorWeight <= 0) return; // Preskoč indikátory bez váhy

        // Normalizácia hodnoty indikátora
        const indicatorValue = getIndicatorValue(indicator);
        const normalizedValue = normalizeIndicatorValue(indicatorValue, indicator);
        
        // Vážené skóre indikátora
        const weightedScore = normalizedValue * (indicatorWeight / 100) * (categoryWeight / 100);
        
        if (Number.isFinite(weightedScore)) {
          totalWeightedScore += weightedScore;
          totalPossibleScore += (indicatorWeight / 100) * (categoryWeight / 100) * 100;
        }
      });
    });

    // Výpočet finálneho skóre
    const finalScore = totalPossibleScore > 0 ? (totalWeightedScore / totalPossibleScore) * 100 : 0;
    
    return Number.isFinite(finalScore) ? Number(finalScore.toFixed(2)) : 0;
    
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri výpočte skóre:', error);
    return 0;
  }
}

/**
 * Získa hodnotu indikátora z rôznych možných štruktúr
 * @param {Object} indicator - Indikátor
 * @returns {number} Číselná hodnota indikátora
 */
function getIndicatorValue(indicator) {
  if (typeof indicator === 'number') return indicator;
  if (typeof indicator === 'string') return parseFloat(indicator) || 0;
  if (indicator && typeof indicator === 'object') {
    return indicator.value ?? indicator.number ?? indicator.score ?? 0;
  }
  return 0;
}

/**
 * Normalizuje hodnotu indikátora na percentá (0-100)
 * @param {number} value - Hodnota indikátora
 * @param {Object} indicator - Indikátor s možnými referenčnými hodnotami
 * @returns {number} Normalizovaná hodnota (0-100)
 */
function normalizeIndicatorValue(value, indicator) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  
  // Ak má indikátor definované maximum, použij ho
  const maxValue = indicator.maxValue ?? indicator.max ?? 100;
  
  if (maxValue > 0) {
    const normalized = Math.min((value / maxValue) * 100, 100);
    return Number.isFinite(normalized) ? normalized : 0;
  }
  
  // Ak nie je definované maximum, použij hodnotu ako percento
  return Math.min(value, 100);
}

/**
 * Vypočíta skóre pre konkrétnu kategóriu
 * @param {Object} category - Kategória s indikátormi
 * @param {Object} categoryWeights - Váhy pre kategóriu
 * @returns {number} Skóre kategórie v percentách
 */
export function calculateCategoryScore(category, categoryWeights) {
  if (!category || !categoryWeights) return 0;

  let totalWeightedScore = 0;
  let totalPossibleScore = 0;

  try {
    Object.entries(category.indicators || {}).forEach(([indId, indicator]) => {
      const indicatorWeight = categoryWeights[indId]?.weight ?? 0;
      
      if (indicatorWeight <= 0) return;

      const indicatorValue = getIndicatorValue(indicator);
      const normalizedValue = normalizeIndicatorValue(indicatorValue, indicator);
      const weightedScore = normalizedValue * (indicatorWeight / 100);
      
      if (Number.isFinite(weightedScore)) {
        totalWeightedScore += weightedScore;
        totalPossibleScore += indicatorWeight;
      }
    });

    const categoryScore = totalPossibleScore > 0 ? (totalWeightedScore / totalPossibleScore) * 100 : 0;
    return Number.isFinite(categoryScore) ? Number(categoryScore.toFixed(2)) : 0;
    
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri výpočte skóre kategórie:', error);
    return 0;
  }
}

/**
 * Vypočíta skóre pre všetky projekty
 * @param {Array} projects - Pole projektov
 * @param {Object} weights - Váhy kategórií a indikátorov
 * @returns {Array} Projekty s vypočítanými skóre
 */
export function evaluateProjects(projects, weights) {
  if (!Array.isArray(projects) || !weights) {
    console.warn('[EvaluationEngine] Neplatné vstupné dáta');
    return [];
  }

  try {
    return projects.map(project => {
      const score = calculateProjectScore(project, weights);
      
      return {
        ...project,
        scores: {
          total: score,
          categories: calculateCategoryScores(project, weights),
          indicators: calculateIndicatorScores(project, weights)
        }
      };
    }).sort((a, b) => b.scores.total - a.scores.total);
    
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri vyhodnocovaní projektov:', error);
    return projects.map(project => ({
      ...project,
      scores: { total: 0, categories: {}, indicators: {} }
    }));
  }
}

/**
 * Vypočíta skóre pre všetky kategórie projektu
 * @param {Object} project - Projekt
 * @param {Object} weights - Váhy
 * @returns {Object} Skóre kategórií
 */
function calculateCategoryScores(project, weights) {
  const categoryScores = {};
  
  Object.entries(project.categories || {}).forEach(([catId, category]) => {
    const categoryWeights = weights[catId]?.indicators || {};
    categoryScores[catId] = calculateCategoryScore(category, categoryWeights);
  });
  
  return categoryScores;
}

/**
 * Vypočíta skóre pre všetky indikátory projektu
 * @param {Object} project - Projekt
 * @param {Object} weights - Váhy
 * @returns {Object} Skóre indikátorov
 */
function calculateIndicatorScores(project, weights) {
  const indicatorScores = {};
  
  Object.entries(project.categories || {}).forEach(([catId, category]) => {
    Object.entries(category.indicators || {}).forEach(([indId, indicator]) => {
      const indicatorValue = getIndicatorValue(indicator);
      const normalizedValue = normalizeIndicatorValue(indicatorValue, indicator);
      indicatorScores[`${catId}.${indId}`] = normalizedValue;
    });
  });
  
  return indicatorScores;
}

/**
 * Validuje štruktúru váh
 * @param {Object} weights - Váhy na validáciu
 * @returns {boolean} True ak sú váhy platné
 */
export function validateWeights(weights) {
  if (!weights || typeof weights !== 'object') return false;
  
  try {
    // Skontroluj, či má aspoň jednu kategóriu s váhou
    const hasValidCategory = Object.values(weights).some(category => 
      category && typeof category === 'object' && 
      Number.isFinite(category.weight) && category.weight > 0
    );
    
    return hasValidCategory;
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri validácii váh:', error);
    return false;
  }
}

/**
 * Vytvorí štandardizovanú štruktúru váh
 * @param {Object} rawWeights - Surové váhy
 * @returns {Object} Štandardizované váhy
 */
export function standardizeWeights(rawWeights) {
  if (!rawWeights || typeof rawWeights !== 'object') {
    return {};
  }

  const standardized = {};
  
  try {
    Object.entries(rawWeights).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        standardized[key] = {
          weight: Number.isFinite(value.weight) ? value.weight : 0,
          indicators: value.indicators || {}
        };
      } else if (Number.isFinite(value)) {
        standardized[key] = {
          weight: value,
          indicators: {}
        };
      }
    });
    
    return standardized;
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri štandardizácii váh:', error);
    return {};
  }
}

/**
 * Vypočíta skóre pre všetky projekty s novou štruktúrou dát
 * @param {Array} projects - Zoznam projektov
 * @param {Object} weights - Váhy indikátorů
 * @param {Object} categoryWeights - Váhy kategórií
 * @returns {Array} Projekty s vypočítanými skóre
 */
export function computeScores(projects, weights, categoryWeights) {
  if (!Array.isArray(projects) || !weights || !categoryWeights) {
    console.warn('[EvaluationEngine] Neplatné vstupné dáta pre computeScores');
    return [];
  }

  try {
    // Nejprve vypočítej skóre pro všechny projekty
    const projectsWithScores = projects.map(project => {
      if (!project.data || Object.keys(project.data).length === 0) {
        return {
          ...project,
          weightedScore: 0,
          completionRate: 0,
          indicatorScores: []
        };
      }

      let totalWeightedScore = 0;
      const indicatorScores = [];
      let totalPossibleWeight = 0;

      // Prejdi všetky indikátory v projekte
      Object.entries(project.data).forEach(([indicatorId, value]) => {
        const indicatorWeight = weights[indicatorId] || 0;
        const categoryWeight = categoryWeights[project.data[indicatorId]?.category] || 0;
        
        if (indicatorWeight > 0 && categoryWeight > 0) {
          // Normalizácia hodnoty - najdi min/max pre tento indikátor
          const allValues = projects
            .map(p => {
              const v = p.data?.[indicatorId];
              const val = v && typeof v === 'object' && 'value' in v ? v.value : v;
              return typeof val === 'number' ? val : 0;
            })
            .filter(v => v > 0);
          
          let normalizedValue = 0;
          if (allValues.length > 0) {
            const maxValue = Math.max(...allValues);
            const minValue = Math.min(...allValues);
            const actualValue = Number(value) || 0;
            
            if (maxValue > minValue) {
              normalizedValue = Math.min(Math.max(((actualValue - minValue) / (maxValue - minValue)) * 100, 0), 100);
            } else {
              // Ak sú všetky hodnoty rovnaké, použij 50%
              normalizedValue = 50;
            }
          } else {
            normalizedValue = Math.min(Math.max(Number(value) || 0, 0), 100);
          }
          
          // Vážené skóre
          const weightedScore = normalizedValue * (indicatorWeight / 100) * (categoryWeight / 100);
          
          if (Number.isFinite(weightedScore)) {
            totalWeightedScore += weightedScore;
            totalPossibleWeight += (indicatorWeight / 100) * (categoryWeight / 100);
            
            indicatorScores.push({
              id: indicatorId,
              value: value,
              normalizedValue: normalizedValue,
              weight: indicatorWeight,
              categoryWeight: categoryWeight,
              weightedScore: weightedScore * 100 // Prevod na percentá
            });
          }
        }
      });

      // Celkové skóre v percentách
      const finalScore = totalPossibleWeight > 0 ? (totalWeightedScore / totalPossibleWeight) * 100 : 0;
      
      return {
        ...project,
        weightedScore: Number.isFinite(finalScore) ? Number(finalScore.toFixed(2)) : 0,
        completionRate: Math.round((indicatorScores.length / Object.keys(project.data).length) * 100),
        indicatorScores: indicatorScores
      };
    });

    // Najdi maximum skóre pro normalizaci
    const maxScore = Math.max(...projectsWithScores.map(p => p.weightedScore));
    
    // Normalizuj skóre jako procento z maxima
    const normalizedProjects = projectsWithScores.map(project => ({
      ...project,
      normalizedScore: maxScore > 0 ? Number(((project.weightedScore / maxScore) * 100).toFixed(2)) : 0,
      originalScore: project.weightedScore
    }));

    return normalizedProjects.sort((a, b) => b.normalizedScore - a.normalizedScore);
    
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri computeScores:', error);
    return projects.map(project => ({
      ...project,
      weightedScore: 0,
      normalizedScore: 0,
      completionRate: 0,
      indicatorScores: []
    }));
  }
}