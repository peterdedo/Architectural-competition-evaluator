/**
 * Validace nahrávaných souborů (PDF / CSV / JSON / XLSX). Používá StepUpload.
 * Typ MIME z prohlížeče je nespolehlivý (Excel často posílá prázdný type nebo octet-stream),
 * proto se rozhoduje podle přípony.
 */

const ALLOWED_EXT = new Set(['pdf', 'json', 'csv', 'xlsx', 'xls']);

export const validateFileUpload = (file) => {
  try {
    const ext = (file.name.split('.').pop() || '').toLowerCase();

    if (!ALLOWED_EXT.has(ext)) {
      return {
        isValid: false,
        message: `Nepodporovaný formát souboru: ${file.name}`,
        error: 'INVALID_FILE_TYPE',
        allowedTypes: ['PDF', 'CSV', 'JSON', 'XLSX'],
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
