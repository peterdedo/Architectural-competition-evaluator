import { describe, it, expect } from 'vitest';
import { mapAoaToProposals, detectFileFormat, normalizeHeader } from './fileParser.js';

describe('mapAoaToProposals', () => {
  it('maps a wide table (headers = indicators, one row = one proposal)', () => {
    const items = mapAoaToProposals(
      [
        ['Název', 'Zastavěná plocha', 'Zpevněná plocha'],
        ['Kompakt', '1450', '800'],
      ],
      'soubor.xlsx'
    );
    expect(items).toHaveLength(1);
    expect(items[0].nazev).toBe('Kompakt');
    expect(items[0].data.bilance_zastavena).toBe(1450);
    expect(items[0].data.bilance_zpevnena).toBe(800);
  });

  it('maps a transposed table (rows = indicators, columns = proposals)', () => {
    const items = mapAoaToProposals(
      [
        ['Ukazatel', 'Návrh A', 'Návrh B'],
        ['Zastavěná plocha', 1450, 2100],
        ['Zpevněná plocha', 800, 1200],
        ['Nezpevněná plocha', 1296, 246],
      ],
      'porovnani.xlsx'
    );
    expect(items).toHaveLength(2);
    expect(items[0].nazev).toBe('Návrh A');
    expect(items[1].nazev).toBe('Návrh B');
    expect(items[0].data.bilance_zastavena).toBe(1450);
    expect(items[1].data.bilance_zastavena).toBe(2100);
  });

  it('parses Czech decimal comma', () => {
    const items = mapAoaToProposals(
      [
        ['Zastavěná plocha'],
        ['1 450,5'],
      ],
      'a.csv'
    );
    expect(items[0].data.bilance_zastavena).toBe(1450.5);
  });
});

describe('detectFileFormat', () => {
  it('detects xlsx and xls', () => {
    expect(detectFileFormat({ name: 'a.XLSX' })).toBe('xlsx');
    expect(detectFileFormat({ name: 'b.xls' })).toBe('xlsx');
    expect(detectFileFormat({ name: 'c.csv' })).toBe('csv');
  });
});

describe('normalizeHeader', () => {
  it('strips diacritics', () => {
    expect(normalizeHeader('Zastavěná plocha')).toBe('zastavena plocha');
  });
});
