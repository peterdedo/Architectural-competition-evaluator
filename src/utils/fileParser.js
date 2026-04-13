/**
 * File Parser Utility
 * 
 * Parses different file formats (JSON, CSV, PDF) for Urban Analytics v2.0
 * - Auto-detects file format
 * - Parses JSON/CSV into internal data schema
 * - Converts to standard project format
 */
import { indikatory } from '../data/indikatory';

const normalizeHeader = (value) =>
  String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const indicatorAliases = {
  f01: ['hpp bydleni', 'bydleni hpp', 'podlazni plocha bydleni'],
  f02: ['hpp kancelare', 'hpp sluzby', 'administrativa hpp'],
  f03: ['hpp komerce', 'hpp obchod', 'retail hpp'],
  f04: ['hpp verejna vybavenost', 'vybavenost hpp', 'skoly hpp'],
  f05: ['hpp sport', 'hpp rekreace', 'volny cas hpp'],
  f06: ['hpp technicke', 'technicke hpp', 'zazemi hpp']
};

const buildHeaderToIndicatorMap = () => {
  const map = new Map();
  indikatory.forEach((indicator) => {
    const idKey = normalizeHeader(indicator.id);
    const nameKey = normalizeHeader(indicator.nazev);
    map.set(idKey, indicator.id);
    map.set(nameKey, indicator.id);
    (indicatorAliases[idKey] || []).forEach((alias) => {
      map.set(normalizeHeader(alias), indicator.id);
    });
  });
  return map;
};

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
    const headerMap = buildHeaderToIndicatorMap();
    
    // Parse data rows
    const mappedData = {};
    const unmappedColumns = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      
      if (values.length !== headers.length) {
        console.warn(`CSV řádek ${i} má nekonzistentní počet hodnot, přeskočeno`);
        continue;
      }
      
      // Create data object from CSV row
      headers.forEach((header, index) => {
        const key = normalizeHeader(header);
        const indicatorId = headerMap.get(key);
        if (!indicatorId) {
          if (!unmappedColumns.includes(header)) unmappedColumns.push(header);
          return;
        }

        const raw = values[index];
        const parsed = Number(String(raw).replace(',', '.'));
        mappedData[indicatorId] = Number.isFinite(parsed) ? parsed : raw;
      });
    }

    if (Object.keys(mappedData).length === 0) {
      throw new Error(
        `CSV se nepodařilo namapovat na indikátory. Nerozpoznané sloupce: ${unmappedColumns.join(', ')}`
      );
    }
    
    return {
      nazev: file.name.replace('.csv', ''),
      data: mappedData,
      status: 'zpracován',
      source: 'csv',
      mappingInfo: {
        mappedCount: Object.keys(mappedData).length,
        unmappedColumns
      }
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


