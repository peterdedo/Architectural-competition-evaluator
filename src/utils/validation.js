/**
 * Validation Utility
 * 
 * Input data validation functions for Urban Analytics v2.0
 * - Validate weights sum
 * - Validate indicators
 * - Validate project configuration
 * 
 * Used in StepWeights, StepConfig, and other components
 */

/**
 * Validate if weights sum to 100%
 * @param {Object} weights - Object with weight values
 * @returns {Object} Validation result with isValid and message
 */
export const validateWeightsSum = (weights) => {
  try {
    const weightsArray = Object.values(weights);
    
    if (weightsArray.length === 0) {
      return {
        isValid: false,
        message: 'Nejsou nastaveny žádné váhy',
        error: 'NO_WEIGHTS'
      };
    }
    
    const sum = weightsArray.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const tolerance = 0.1; // Allow 0.1% tolerance for rounding
    
    // Check if sum is exactly 100% (with tolerance)
    if (Math.abs(sum - 100) > tolerance) {
      return {
        isValid: false,
        message: `Součet vah musí být 100%. Aktuální součet: ${sum.toFixed(2)}%`,
        error: 'INVALID_SUM',
        currentSum: sum
      };
    }
    
    return {
      isValid: true,
      message: 'Váhy jsou správně nastaveny',
      currentSum: sum
    };
  } catch (error) {
    console.error('[Validation] Error validating weights sum:', error);
    return {
      isValid: false,
      message: 'Chyba při validaci vah',
      error: 'VALIDATION_ERROR'
    };
  }
};

/**
 * Validate indicators for missing or invalid values
 * @param {Array} indicators - Array of indicator objects
 * @param {Object} projectData - Project data with indicator values
 * @returns {Object} Validation result with isValid and issues array
 */
export const validateIndicators = (indicators, projectData) => {
  try {
    const issues = [];
    
    // Check for missing indicators
    const missingIndicators = indicators.filter(ind => {
      // Skip if indicator doesn't exist in project data
      return !projectData[ind.id] || projectData[ind.id] === null || projectData[ind.id] === undefined;
    });
    
    if (missingIndicators.length > 0) {
      issues.push({
        type: 'MISSING',
        message: `Chybějící indikátory: ${missingIndicators.map(i => i.nazev).join(', ')}`,
        indicators: missingIndicators
      });
    }
    
    // Check for invalid numeric values
    const invalidNumericIndicators = indicators.filter(ind => {
      const value = projectData[ind.id];
      
      if (value === null || value === undefined) return false;
      
      // Try to parse as number
      const numericValue = parseFloat(value);
      
      if (isNaN(numericValue)) {
        return true;
      }
      
      // Check if value is negative (if not allowed)
      if (ind.lower_better === false && numericValue < 0) {
        return true;
      }
      
      return false;
    });
    
    if (invalidNumericIndicators.length > 0) {
      issues.push({
        type: 'INVALID_NUMERIC',
        message: `Neplatné číselné hodnoty: ${invalidNumericIndicators.map(i => i.nazev).join(', ')}`,
        indicators: invalidNumericIndicators
      });
    }
    
    // Check for required indicators
    const requiredIndicators = indicators.filter(ind => ind.required === true);
    const missingRequired = requiredIndicators.filter(ind => {
      const value = projectData[ind.id];
      return value === null || value === undefined || value === '';
    });
    
    if (missingRequired.length > 0) {
      issues.push({
        type: 'MISSING_REQUIRED',
        message: `Chybějící povinné indikátory: ${missingRequired.map(i => i.nazev).join(', ')}`,
        indicators: missingRequired
      });
    }
    
    return {
      isValid: issues.length === 0,
      message: issues.length === 0 ? 'Všechny indikátory jsou platné' : `Nalezeno ${issues.length} problémů`,
      issues: issues
    };
  } catch (error) {
    console.error('[Validation] Error validating indicators:', error);
    return {
      isValid: false,
      message: 'Chyba při validaci indikátorů',
      error: 'VALIDATION_ERROR',
      issues: []
    };
  }
};

/**
 * Validate project configuration
 * @param {Object} config - Project configuration
 * @returns {Object} Validation result with isValid and message
 */
export const validateProjectConfig = (config) => {
  try {
    const errors = [];
    
    // Check project name
    if (!config.nazev || config.nazev.trim() === '') {
      errors.push({
        field: 'nazev',
        message: 'Název projektu je povinný'
      });
    }
    
    // Check project description (optional, but should be present if name exists)
    if (config.popis && config.popis.length > 500) {
      errors.push({
        field: 'popis',
        message: 'Popis projektu je příliš dlouhý (max. 500 znaků)'
      });
    }
    
    // Check selected proposals
    if (!config.selectedNavrhy || config.selectedNavrhy.length === 0) {
      errors.push({
        field: 'selectedNavrhy',
        message: 'Nejsou vybrány žádné návrhy'
      });
    }
    
    return {
      isValid: errors.length === 0,
      message: errors.length === 0 ? 'Konfigurace projektu je platná' : `Nalezeno ${errors.length} chyb`,
      errors: errors
    };
  } catch (error) {
    console.error('[Validation] Error validating project config:', error);
    return {
      isValid: false,
      message: 'Chyba při validaci konfigurace',
      error: 'VALIDATION_ERROR',
      errors: []
    };
  }
};

/**
 * Validate category weights sum
 * @param {Object} categoryWeights - Object with category weight values
 * @returns {Object} Validation result with isValid and message
 */
export const validateCategoryWeightsSum = (categoryWeights) => {
  try {
    const weightsArray = Object.values(categoryWeights);
    
    if (weightsArray.length === 0) {
      return {
        isValid: false,
        message: 'Nejsou nastaveny žádné váhy kategorií',
        error: 'NO_CATEGORY_WEIGHTS'
      };
    }
    
    const sum = weightsArray.reduce((acc, val) => acc + (parseFloat(val) || 0), 0);
    const tolerance = 0.1;
    
    if (Math.abs(sum - 100) > tolerance) {
      return {
        isValid: false,
        message: `Součet vah kategorií musí být 100%. Aktuální součet: ${sum.toFixed(2)}%`,
        error: 'INVALID_SUM',
        currentSum: sum
      };
    }
    
    return {
      isValid: true,
      message: 'Váhy kategorií jsou správně nastaveny',
      currentSum: sum
    };
  } catch (error) {
    console.error('[Validation] Error validating category weights sum:', error);
    return {
      isValid: false,
      message: 'Chyba při validaci vah kategorií',
      error: 'VALIDATION_ERROR'
    };
  }
};

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateFileUpload = (file) => {
  try {
    const allowedTypes = ['application/pdf', 'text/csv', 'application/json'];
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: `Nepodporovaný formát souboru: ${file.type}`,
        error: 'INVALID_FILE_TYPE',
        allowedTypes: ['PDF', 'CSV', 'JSON']
      };
    }
    
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        message: `Soubor je příliš velký: ${(file.size / 1024 / 1024).toFixed(2)}MB (max. 10MB)`,
        error: 'FILE_TOO_LARGE',
        maxSize: maxSize
      };
    }
    
    // Check file name
    if (!file.name || file.name.trim() === '') {
      return {
        isValid: false,
        message: 'Název souboru je prázdný',
        error: 'EMPTY_FILE_NAME'
      };
    }
    
    return {
      isValid: true,
      message: 'Soubor je platný',
      fileType: file.type,
      fileName: file.name,
      fileSize: file.size
    };
  } catch (error) {
    console.error('[Validation] Error validating file upload:', error);
    return {
      isValid: false,
      message: 'Chyba při validaci souboru',
      error: 'VALIDATION_ERROR'
    };
  }
};


