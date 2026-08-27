import { describe, it, expect } from 'vitest';
import { normalizeExtractedBalance } from './useBalanceExtractor.js';
import { SCALAR_INPUT_FIELDS, OFFER_PRICE } from '../data/balanceSchema.js';
import { floorsTotal, roomsGrandTotal, offerPriceTotal } from '../utils/balanceCalculations.js';

describe('normalizeExtractedBalance', () => {
  it('maps every scalar field, filling missing ones with null/"nenalezeno"', () => {
    const raw = { bilance_zastavena: { value: 1200, source: 'strana 3' } };
    const data = normalizeExtractedBalance(raw);

    expect(data.bilance_zastavena).toEqual({ value: 1200, source: 'strana 3', unit: 'm²' });
    // pole, které model vůbec nevrátil, musí přesto existovat s value: null (ne chybět)
    const missing = SCALAR_INPUT_FIELDS.find((f) => f.id !== 'bilance_zastavena');
    expect(data[missing.id].value).toBeNull();
    expect(data[missing.id].source).toBe('nenalezeno v dokumentu');
  });

  it('never lets a non-numeric or malformed value through as NaN', () => {
    const raw = { bilance_zastavena: { value: 'nevím', source: 'x' } };
    const data = normalizeExtractedBalance(raw);
    expect(data.bilance_zastavena.value).toBeNull();
    expect(Number.isNaN(data.bilance_zastavena.value)).toBe(false);
  });

  it('normalizes floor collections (hpp/uzitna), computing a correct total', () => {
    const raw = {
      hpp: { floors: [{ label: 'Podzemní', value: 500 }, { label: '1.NP', value: 800 }] },
      uzitna: { floors: [{ label: 'Podzemní', value: 300 }] },
    };
    const data = normalizeExtractedBalance(raw);
    expect(floorsTotal(data.hpp)).toBe(1300);
    expect(floorsTotal(data.uzitna)).toBe(300);
    expect(data.hpp.floors.every((f) => typeof f.id === 'string' && f.id.length > 0)).toBe(true);
  });

  it('seeds default floors when the model returns none (does not silently produce an empty, uneditable collection)', () => {
    const data = normalizeExtractedBalance({});
    expect(data.hpp.floors.length).toBeGreaterThan(0);
    expect(data.uzitna.floors.length).toBeGreaterThan(0);
    expect(data.mistnosti.floors.length).toBeGreaterThan(0);
  });

  it('normalizes rooms per floor with a correct grand total', () => {
    const raw = {
      mistnosti: {
        floors: [
          { label: '1.NP', rooms: [{ name: 'Sál', area: 400 }, { name: 'Foyer', area: 120 }] },
          { label: '2.NP', rooms: [{ name: 'Učebna', area: 80 }] },
        ],
      },
    };
    const data = normalizeExtractedBalance(raw);
    expect(roomsGrandTotal(data.mistnosti)).toBe(600);
  });

  it('normalizes offer price items keyed to the canonical schema ids, ignoring unknown ids', () => {
    const raw = {
      nabidkovaCena: {
        items: [
          { id: 'fs1', price: 100000, note: 'test' },
          { id: 'neexistujici_polozka', price: 999 },
        ],
      },
    };
    const data = normalizeExtractedBalance(raw);
    expect(data.nabidkovaCena.items).toHaveLength(OFFER_PRICE.items.length); // vždy přesně 9, ne 10
    const fs1 = data.nabidkovaCena.items.find((i) => i.id === 'fs1');
    expect(fs1.price).toBe(100000);
    expect(fs1.note).toBe('test');
    expect(offerPriceTotal(data.nabidkovaCena)).toBe(100000);
  });

  it('leaves offer price empty (not 0) when the document does not contain it at all', () => {
    const data = normalizeExtractedBalance({});
    expect(offerPriceTotal(data.nabidkovaCena)).toBeNull();
  });

  it('handles a completely malformed/empty response without throwing', () => {
    expect(() => normalizeExtractedBalance(null)).not.toThrow();
    expect(() => normalizeExtractedBalance(undefined)).not.toThrow();
    expect(() => normalizeExtractedBalance({})).not.toThrow();
  });
});
