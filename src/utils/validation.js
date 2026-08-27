/**
 * Validation Utility
 *
 * Validace nahrávaných souborů (PDF/CSV/JSON). Používá StepUpload.
 * Stará validace indikátorů a vah byla odstraněna spolu se scoring systémem
 * (bilanční údaje nemají váhy – viz balanceSchema.js / balanceCalculations.js).
 */

/**
 * Validate file upload
 * @param {File} file - File to validate
 * @returns {Object} Validation result with isValid and message
 */
export const validateFileUpload = (file) => {
  try {
    const allowedTypes = ['application/pdf', 'text/csv', 'application/json'];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        message: `Nepodporovaný formát souboru: ${file.type}`,
        error: 'INVALID_FILE_TYPE',
        allowedTypes: ['PDF', 'CSV', 'JSON'],
      };
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        message: `Soubor je příliš velký: ${(file.size / 1024 / 1024).toFixed(2)}MB (max. 10MB)`,
        error: 'FILE_TOO_LARGE',
        maxSize,
      };
    }

    if (!file.name || file.name.trim() === '') {
      return {
        isValid: false,
        message: 'Název souboru je prázdný',
        error: 'EMPTY_FILE_NAME',
      };
    }

    return {
      isValid: true,
      message: 'Soubor je platný',
      fileType: file.type,
      fileName: file.name,
      fileSize: file.size,
    };
  } catch (error) {
    console.error('[Validation] Error validating file upload:', error);
    return {
      isValid: false,
      message: 'Chyba při validaci souboru',
      error: 'VALIDATION_ERROR',
    };
  }
};
