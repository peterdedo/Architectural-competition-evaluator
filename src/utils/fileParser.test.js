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

  // Reálný bug: soubor s titulním řádkem ("P03 Bilanční tabulka" osamocené v 1 buňce) nad
  // skutečnou hlavičkou selhával s "Nerozpoznané sloupce: P03 Bilanční tabulka", protože
  // se slepě bral rows[0] jako hlavička. Viz findHeaderRowIndex/isLikelyTitleRow.
  it('skips a lone title row above the real wide-format header', () => {
    const items = mapAoaToProposals(
      [
        ['P03 Bilanční tabulka'],
        ['Zastavěná plocha', 'Zpevněná plocha', 'Nezpevněná plocha'],
        [1200, 800, 600],
      ],
      'Návrh_10_Bilanční tabulka.xlsx'
    );
    expect(items).toHaveLength(1);
    expect(items[0].data.bilance_zastavena).toBe(1200);
    expect(items[0].data.bilance_zpevnena).toBe(800);
    expect(items[0].data.bilance_nezpevnena).toBe(600);
  });

  it('skips up to two stacked title rows', () => {
    const items = mapAoaToProposals(
      [
        ['Soutěž — kulturní dům'],
        ['P03 Bilanční tabulka'],
        ['Zastavěná plocha', 'Zpevněná plocha'],
        [500, 300],
      ],
      'Návrh_x.xlsx'
    );
    expect(items[0].data.bilance_zastavena).toBe(500);
  });

  it('never mistakes a title row for the transposed proposal-name row (no regression)', () => {
    // Řádek se jmény návrhů má vždy víc buněk než osamocený titulek – neměl by se přeskočit.
    const items = mapAoaToProposals(
      [
        ['Ukazatel', 'Návrh A', 'Návrh B'],
        ['Zastavěná plocha', 1450, 2100],
        ['Zpevněná plocha', 800, 1200],
      ],
      'porovnani.xlsx'
    );
    expect(items[0].nazev).toBe('Návrh A');
    expect(items[1].nazev).toBe('Návrh B');
  });

  it('still gives a clear error for a genuinely unrecognized file', () => {
    expect(() =>
      mapAoaToProposals(
        [
          ['Foo', 'Bar', 'Baz'],
          [1, 2, 3],
        ],
        'garbage.xlsx'
      )
    ).toThrow(/Nerozpoznané sloupce/);
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
