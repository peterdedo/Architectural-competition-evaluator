/**
 * Parsování nahraných návrhů (JSON, CSV, XLSX/XLS).
 * CSV/XLSX se mapují na skalární bilanční pole (P03) podle hlaviček / prvního sloupce.
 */
import * as XLSX from 'xlsx';
import { indikatory } from '../data/indikatory';

const NAME_KEYS = new Set(['nazev', 'navrh', 'projekt', 'varianta', 'name', 'title', 'soubor']);

const indicatorAliases = {
  bilance_zastavena: ['zastavena plocha', 'zastavena'],
  bilance_zpevnena: ['zpevnena plocha', 'zpevnena'],
  bilance_nezpevnena: ['nezpevnena plocha', 'nezpevnena'],
  demolice_nadzemni: ['demolice nadzemni', 'nadzemni demolice'],
  obestaveny_podzemni: ['obestaveny prostor podzemni', 'celkovy obestaveny prostor podzemni', 'obest podzemi'],
  obestaveny_nadzemni: ['obestaveny prostor nadzemni', 'celkovy obestaveny prostor nadzemni', 'obest nadzemi'],
  nove_podzemni: ['nove objemy podzemni', 'obestaveny prostor novych objemu podzemni', 'nove podzemi'],
  nove_nadzemni: ['nove objemy nadzemni', 'obestaveny prostor novych objemu nadzemni', 'nove nadzemi'],
  obalka_fasady: ['fasady', 'obalka fasady'],
  obalka_strechy: ['strechy', 'obalka strechy'],
  obalka_konstrukce: ['konstrukce', 'obalka konstrukce'],
  proskleni_aw: ['aw'],
  proskleni_af: ['af'],
};

export const normalizeHeader = (value) =>
  String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const buildHeaderToIndicatorMap = () => {
  const map = new Map();
  indikatory.forEach((indicator) => {
    map.set(normalizeHeader(indicator.id), indicator.id);
    map.set(normalizeHeader(indicator.nazev), indicator.id);
    (indicatorAliases[indicator.id] || []).forEach((alias) => {
      map.set(normalizeHeader(alias), indicator.id);
    });
  });
  return map;
};

const parseNumeric = (raw) => {
  if (raw === null || raw === undefined || raw === '') return null;
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const parsed = Number(String(raw).replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : String(raw).trim();
};

const isEmptyRow = (row) => !row || !row.some((c) => c !== '' && c != null);

const countMapped = (cells, headerMap) =>
  cells.filter((c) => c !== '' && c != null && headerMap.has(normalizeHeader(c))).length;

/**
 * Skutečná hlavička (wide tvar) nebo řádek se jmény návrhů (transponovaný tvar) nemusí být
 * nutně na 1. řádku listu – časté je, že soubor má nad ní ještě titulní řádek (např.
 * "P03 Bilanční tabulka" osamocené v jedné buňce). Slepé použití rows[0] pak najde jen tenhle
 * titulek jako jediný "sloupec" a namapování selže na všem.
 *
 * Řádek je "titulní" (a přeskočí se), jen když je ZÁROVEŇ řídký (≤ 2 vyplněné buňky) A
 * neobsahuje žádný rozpoznaný ukazatel – to spolehlivě pozná osamocený titulek, ale nikdy
 * nesáhne na řádek se jmény návrhů (transponovaný tvar má jich v 1. řádku vždy víc, napříč
 * sloupci) ani na řádek se štítkem ukazatele (ten už jeden match MÁ, takže není "titulní").
 * Přeskočí se maximálně pár řádků, ne libovolně hluboko do dat.
 */
const isLikelyTitleRow = (row, headerMap) => {
  const nonEmptyCount = row.filter((c) => c !== '' && c != null).length;
  return nonEmptyCount > 0 && nonEmptyCount <= 2 && countMapped(row, headerMap) === 0;
};

const findHeaderRowIndex = (rows, headerMap, maxSkip = 2) => {
  let index = 0;
  while (index < maxSkip && index < rows.length - 1 && isLikelyTitleRow(rows[index], headerMap)) {
    index += 1;
  }
  return index;
};

const fileBaseName = (fileName) =>
  String(fileName || 'návrh').replace(/\.(csv|xlsx|xls|json)$/i, '');

const proposalFromWideRow = (headers, values, headerMap, fallbackName) => {
  const mappedData = {};
  const unmappedColumns = [];
  let nazev = fallbackName;

  headers.forEach((header, index) => {
    const key = normalizeHeader(header);
    if (!key) return;
    if (NAME_KEYS.has(key)) {
      const raw = values[index];
      if (raw !== '' && raw != null) nazev = String(raw).trim();
      return;
    }
    const indicatorId = headerMap.get(key);
    if (!indicatorId) {
      if (!unmappedColumns.includes(header)) unmappedColumns.push(header);
      return;
    }
    const parsed = parseNumeric(values[index]);
    if (parsed !== null) mappedData[indicatorId] = parsed;
  });

  return { nazev, mappedData, unmappedColumns };
};

const parseWide = (rows, headerMap, fallbackName) => {
  const headers = rows[0].map((h) => (h == null ? '' : String(h).trim()));
  const items = [];
  const unmappedColumns = [];

  for (let i = 1; i < rows.length; i += 1) {
    const values = rows[i];
    const { nazev, mappedData, unmappedColumns: rowUnmapped } = proposalFromWideRow(
      headers,
      values,
      headerMap,
      rows.length > 2 ? `${fallbackName} (${i})` : fallbackName
    );
    rowUnmapped.forEach((h) => {
      if (!unmappedColumns.includes(h)) unmappedColumns.push(h);
    });
    if (Object.keys(mappedData).length === 0) continue;
    items.push({
      nazev,
      data: mappedData,
      status: 'zpracován',
      mappingInfo: { mappedCount: Object.keys(mappedData).length, unmappedColumns: rowUnmapped },
    });
  }

  if (items.length === 0) {
    throw new Error(
      `Tabulku se nepodařilo namapovat na bilanční údaje. Nerozpoznané sloupce: ${unmappedColumns.join(', ') || '—'}`
    );
  }

  return items.map((item) => ({
    ...item,
    mappingInfo: { ...item.mappingInfo, unmappedColumns },
  }));
};

const parseTransposed = (rows, headerMap, fallbackName) => {
  const nameRow = rows[0];
  const colCount = Math.max(...rows.map((r) => r.length));
  const items = [];

  for (let j = 1; j < colCount; j += 1) {
    const mappedData = {};
    const unmappedRows = [];
    const rawName = nameRow[j];
    const nazev =
      rawName !== '' && rawName != null ? String(rawName).trim() : `${fallbackName} (${j})`;

    for (let i = 1; i < rows.length; i += 1) {
      const label = rows[i][0];
      const key = normalizeHeader(label);
      if (!key) continue;
      const indicatorId = headerMap.get(key);
      if (!indicatorId) {
        const labelStr = String(label ?? '').trim();
        if (labelStr && !unmappedRows.includes(labelStr)) unmappedRows.push(labelStr);
        continue;
      }
      const parsed = parseNumeric(rows[i][j]);
      if (parsed !== null) mappedData[indicatorId] = parsed;
    }

    if (Object.keys(mappedData).length === 0) continue;
    items.push({
      nazev,
      data: mappedData,
      status: 'zpracován',
      mappingInfo: { mappedCount: Object.keys(mappedData).length, unmappedColumns: unmappedRows },
    });
  }

  if (items.length === 0) {
    throw new Error('V Excelu se nenašel žádný sloupec s rozpoznatelnými bilančními údaji.');
  }
  return items;
};

/** @param {Array<Array>} aoa 2D tabulka (první neprázdný list) */
export const mapAoaToProposals = (aoa, fileName = 'návrh') => {
  const rows = (aoa || [])
    .map((r) => (Array.isArray(r) ? r : []))
    .filter((r) => !isEmptyRow(r));
  if (rows.length < 2) {
    throw new Error('Soubor musí mít hlavičku a alespoň jeden řádek dat');
  }

  const headerMap = buildHeaderToIndicatorMap();
  const fallbackName = fileBaseName(fileName);

  // Přeskočit případný titulní řádek nad skutečnou hlavičkou (viz findHeaderRowIndex výše).
  const headerRowIndex = findHeaderRowIndex(rows, headerMap);
  const bodyRows = rows.slice(headerRowIndex);

  const rowMapped = countMapped(bodyRows[0], headerMap);
  const colMapped = countMapped(
    bodyRows.slice(1).map((r) => r[0]),
    headerMap
  );

  const items =
    colMapped > rowMapped && colMapped >= 2
      ? parseTransposed(bodyRows, headerMap, fallbackName)
      : parseWide(bodyRows, headerMap, fallbackName);

  return items;
};

export const parseJSONFile = async (file) => {
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    return {
      nazev: data.nazev || fileBaseName(file.name),
      data: data.data || data,
      status: 'zpracován',
      source: 'json',
    };
  } catch (error) {
    throw new Error(`Chyba při parsování JSON: ${error.message}`);
  }
};

export const parseCSVFile = async (file) => {
  try {
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    const aoa = lines.map((line) => line.split(',').map((v) => v.trim()));
    const items = mapAoaToProposals(aoa, file.name);
    return { items: items.map((item) => ({ ...item, source: 'csv' })) };
  } catch (error) {
    throw new Error(`Chyba při parsování CSV: ${error.message}`);
  }
};

export const parseXLSXFile = async (file) => {
  try {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: 'array', cellDates: false });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) throw new Error('Soubor neobsahuje žádný list');
    const sheet = workbook.Sheets[sheetName];
    const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true, blankrows: false });
    const items = mapAoaToProposals(aoa, file.name);
    return { items: items.map((item) => ({ ...item, source: 'xlsx' })) };
  } catch (error) {
    throw new Error(`Chyba při parsování Excelu: ${error.message}`);
  }
};

export const detectFileFormat = (file) => {
  const extension = file.name.split('.').pop().toLowerCase();
  switch (extension) {
    case 'json':
      return 'json';
    case 'csv':
      return 'csv';
    case 'xlsx':
    case 'xls':
      return 'xlsx';
    case 'pdf':
      return 'pdf';
    default:
      return 'unknown';
  }
};

export const parseFile = async (file) => {
  const format = detectFileFormat(file);
  switch (format) {
    case 'json':
      return parseJSONFile(file);
    case 'csv':
      return parseCSVFile(file);
    case 'xlsx':
      return parseXLSXFile(file);
    case 'pdf':
      return null;
    default:
      throw new Error(`Nepodporovaný formát souboru: ${file.name}`);
  }
};

export const getFileTypeInfo = (format) => {
  const info = {
    json: { icon: '📄', description: 'JSON Data', color: 'text-blue-600' },
    csv: { icon: '📊', description: 'CSV Data', color: 'text-green-600' },
    xlsx: { icon: '📊', description: 'Excel', color: 'text-emerald-700' },
    pdf: { icon: '📑', description: 'PDF Document', color: 'text-red-600' },
    unknown: { icon: '❓', description: 'Unknown Format', color: 'text-gray-600' },
  };
  return info[format] || info.unknown;
};
