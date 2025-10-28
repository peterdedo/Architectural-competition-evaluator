/**
 * File Parser Utility
 * 
 * Parses different file formats (JSON, CSV, PDF) for Urban Analytics v2.0
 * - Auto-detects file format
 * - Parses JSON/CSV into internal data schema
 * - Converts to standard project format
 */

/**
 * Parse JSON file
 * @param {File} file - JSON file
 * @returns {Promise<Object>} Parsed data
 */
export const parseJSONFile = async (file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    // Convert to internal schema
    return {
      nazev: data.nazev || file.name.replace('.json', ''),
      data: data.data || data,
      status: 'zpracován',
      source: 'json'
    };
  } catch (error) {
    throw new Error(`Chyba při parsování JSON: ${error.message}`);
  }
};

/**
 * Parse CSV file
 * @param {File} file - CSV file
 * @returns {Promise<Object>} Parsed data
 */
export const parseCSVFile = async (file) => {
  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('CSV soubor musí mít alespoň hlavičku a jeden řádek dat');
    }
    
    // Parse header
    const headers = lines[0].split(',').map(h => h.trim());
    
    // Parse data rows
    const data = {};
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        console.warn(`CSV řádek ${i} má nekonzistentní počet hodnot, přeskočeno`);
        continue;
      }
      
      // Create data object from CSV row
      headers.forEach((header, index) => {
        data[header] = values[index];
      });
    }
    
    return {
      nazev: file.name.replace('.csv', ''),
      data: data,
      status: 'zpracován',
      source: 'csv'
    };
  } catch (error) {
    throw new Error(`Chyba při parsování CSV: ${error.message}`);
  }
};

/**
 * Auto-detect file format based on extension
 * @param {File} file - File to detect
 * @returns {string} Format type ('json', 'csv', 'pdf', 'unknown')
 */
export const detectFileFormat = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  
  switch (extension) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'pdf':
      return 'pdf';
    default:
      return 'unknown';
  }
};

/**
 * Parse file based on detected format
 * @param {File} file - File to parse
 * @returns {Promise<Object>} Parsed data
 */
export const parseFile = async (file) => {
  const format = detectFileFormat(file);
  
  switch (format) {
    case 'json':
      return await parseJSONFile(file);
    case 'csv':
      return await parseCSVFile(file);
    case 'pdf':
      // PDF files are handled by PDF processor
      return null;
    default:
      throw new Error(`Nepodporovaný formát souboru: ${file.name}`);
  }
};

/**
 * Get file type info for UI display
 * @param {string} format - File format
 * @returns {Object} Info object with icon and description
 */
export const getFileTypeInfo = (format) => {
  const info = {
    'json': {
      icon: '📄',
      description: 'JSON Data',
      color: 'text-blue-600'
    },
    'csv': {
      icon: '📊',
      description: 'CSV Data',
      color: 'text-green-600'
    },
    'pdf': {
      icon: '📑',
      description: 'PDF Document',
      color: 'text-red-600'
    },
    'unknown': {
      icon: '❓',
      description: 'Unknown Format',
      color: 'text-gray-600'
    }
  };
  
  return info[format] || info.unknown;
};


