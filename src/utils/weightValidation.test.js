import { describe, it, expect } from 'vitest';
import { validateWeightModalState, parseWeightInput } from './weightValidation.js';

const cats = [
  { id: 'A', nazev: 'Kat A' },
  { id: 'B', nazev: 'Kat B' },
];

const inds = [
  { id: 'i1', nazev: 'I1', kategorie: 'A' },
  { id: 'i2', nazev: 'I2', kategorie: 'A' },
];

describe('parseWeightInput', () => {
  it('parses and clamps', () => {
    expect(parseWeightInput('50')).toBe(50);
    expect(parseWeightInput('101')).toBe(100);
    expect(parseWeightInput('-1')).toBe(0);
    expect(parseWeightInput('')).toBe(null);
    expect(parseWeightInput('abc')).toBe(null);
  });
});

describe('validateWeightModalState', () => {
  it('requires category sum 100', () => {
    const r = validateWeightModalState({
      kategorieDef: cats,
      categoryWeights: { A: 50, B: 40 },
      indicatorWeights: { i1: 50, i2: 50 },
      selectedIndicatorIds: new Set(['i1', 'i2']),
      allIndicators: inds,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('Součet vah kategorií'))).toBe(true);
  });

  it('errors when category has weight but no selected indicators', () => {
    const r = validateWeightModalState({
      kategorieDef: cats,
      categoryWeights: { A: 50, B: 50 },
      indicatorWeights: { i1: 50, i2: 50 },
      selectedIndicatorIds: new Set(['i1', 'i2']),
      allIndicators: inds,
    });
    expect(r.errors.some((e) => e.includes('Kat B'))).toBe(true);
  });

  it('requires indicator weights per category sum to 100', () => {
    const r = validateWeightModalState({
      kategorieDef: [{ id: 'A', nazev: 'Kat A' }],
      categoryWeights: { A: 100 },
      indicatorWeights: { i1: 30, i2: 30 },
      selectedIndicatorIds: new Set(['i1', 'i2']),
      allIndicators: inds,
    });
    expect(r.ok).toBe(false);
    expect(r.errors.some((e) => e.includes('Kat A') && e.includes('100'))).toBe(true);
  });

  it('passes for balanced valid config', () => {
    const r = validateWeightModalState({
      kategorieDef: [{ id: 'A', nazev: 'Kat A' }],
      categoryWeights: { A: 100 },
      indicatorWeights: { i1: 50, i2: 50 },
      selectedIndicatorIds: new Set(['i1', 'i2']),
      allIndicators: inds,
    });
    expect(r.ok).toBe(true);
  });
});
