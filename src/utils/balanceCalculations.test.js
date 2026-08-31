import { describe, it, expect } from 'vitest';
import {
  safeNum,
  sumPresent,
  glazingRatio,
  asPercent,
  computeDerivedField,
  computeAllDerived,
  makeFloor,
  makeRoom,
  makeFloorsCollection,
  makeRoomsCollection,
  makeOfferPrice,
  floorsTotal,
  roomsFloorTotal,
  roomsGrandTotal,
  offerPriceTotal,
  setScalarValue,
  ensureFloorsCollection,
  ensureRoomsCollection,
  ensureOfferPrice,
} from './balanceCalculations.js';

describe('safeNum – prázdná hodnota není nula', () => {
  it('parses numbers, numeric strings and cs decimals', () => {
    expect(safeNum(42)).toBe(42);
    expect(safeNum('42')).toBe(42);
    expect(safeNum('1 234,5')).toBeCloseTo(1234.5);
    expect(safeNum({ value: 10, source: 'x' })).toBe(10);
  });
  it('returns null (not 0) for empty/invalid', () => {
    expect(safeNum('')).toBeNull();
    expect(safeNum(null)).toBeNull();
    expect(safeNum(undefined)).toBeNull();
    expect(safeNum('abc')).toBeNull();
    expect(safeNum(Infinity)).toBeNull();
    expect(safeNum(NaN)).toBeNull();
  });
});

describe('sumPresent', () => {
  it('sums only present values', () => {
    expect(sumPresent([100, '', 200, null, 50])).toBe(350);
  });
  it('returns null when nothing is present (empty ≠ 0)', () => {
    expect(sumPresent(['', null, undefined])).toBeNull();
    expect(sumPresent([])).toBeNull();
  });
});

describe('glazingRatio – guarded AW/AF', () => {
  it('computes AW/AF when both present and AF>0', () => {
    expect(glazingRatio(30, 120)).toBeCloseTo(0.25);
    expect(asPercent(glazingRatio(30, 120))).toBeCloseTo(25);
  });
  it('never emits Infinity/NaN — AF=0 or empty → null', () => {
    expect(glazingRatio(30, 0)).toBeNull();
    expect(glazingRatio(30, '')).toBeNull();
    expect(glazingRatio('', 120)).toBeNull();
    expect(glazingRatio('', '')).toBeNull();
    expect(Number.isFinite(glazingRatio(30, 0) ?? 0)).toBe(true);
  });
  it('asPercent guards null', () => {
    expect(asPercent(null)).toBeNull();
    expect(asPercent(undefined)).toBeNull();
  });
});

describe('computeDerivedField – area/volume totals', () => {
  it('A. Bilance ploch: Celkem = zastavěná + zpevněná + nezpevněná', () => {
    const data = { bilance_zastavena: 1200, bilance_zpevnena: 800, bilance_nezpevnena: 1546 };
    expect(computeDerivedField('bilance_celkem', data)).toBe(3546);
  });
  it('C. Obestavěný prostor: Celkem = podzemní + nadzemní', () => {
    expect(computeDerivedField('obestaveny_celkem', { obestaveny_podzemni: 500, obestaveny_nadzemni: 4000 })).toBe(4500);
  });
  it('H. Obálka: Celkem = fasády + střechy + konstrukce', () => {
    expect(computeDerivedField('obalka_celkem', { obalka_fasady: 300, obalka_strechy: 150, obalka_konstrukce: 90 })).toBe(540);
  });
  it('I. Podíl prosklení = AW/AF, guarded', () => {
    expect(computeDerivedField('proskleni_podil', { proskleni_aw: 30, proskleni_af: 120 })).toBeCloseTo(0.25);
    expect(computeDerivedField('proskleni_podil', { proskleni_aw: 30, proskleni_af: 0 })).toBeNull();
    expect(computeDerivedField('proskleni_podil', {})).toBeNull();
  });
  it('derived is null when all inputs empty (empty ≠ 0)', () => {
    expect(computeDerivedField('bilance_celkem', {})).toBeNull();
    expect(computeDerivedField('obestaveny_celkem', { obestaveny_podzemni: '', obestaveny_nadzemni: '' })).toBeNull();
  });
  it('computeAllDerived returns every derived id', () => {
    const all = computeAllDerived({ bilance_zastavena: 10, bilance_zpevnena: 20, bilance_nezpevnena: 30 });
    expect(all.bilance_celkem).toBe(60);
    expect(all).toHaveProperty('obalka_celkem');
    expect(all).toHaveProperty('proskleni_podil');
  });
});

describe('E/F floors – HPP & užitná plocha with varying floor counts', () => {
  it('seeds three default floors', () => {
    const c = makeFloorsCollection();
    expect(c.floors).toHaveLength(3);
    expect(c.floors.map((f) => f.label)).toEqual(['Podzemní podlaží', 'Nadzemní 1. NP', 'Nadzemní 2. NP']);
  });
  it('total sums floor values, ignoring empty', () => {
    const c = { floors: [makeFloor('PP', 200), makeFloor('1.NP', 500), makeFloor('2.NP', '')] };
    expect(floorsTotal(c)).toBe(700);
  });
  it('dynamic add/remove floors changes the total', () => {
    const c = makeFloorsCollection();
    c.floors[0].value = 100;
    c.floors[1].value = 100;
    c.floors[2].value = 100;
    expect(floorsTotal(c)).toBe(300);
    c.floors.push(makeFloor('Nadzemní 3. NP', 250)); // add
    expect(floorsTotal(c)).toBe(550);
    c.floors = c.floors.filter((f) => f.label !== 'Nadzemní 3. NP'); // remove
    expect(floorsTotal(c)).toBe(300);
  });
  it('empty collection total is null, not 0', () => {
    expect(floorsTotal(makeFloorsCollection())).toBeNull();
    expect(floorsTotal(null)).toBeNull();
  });
});

describe('G rooms – dynamic rooms & per-floor sums', () => {
  it('seeds floors with empty room lists', () => {
    const c = makeRoomsCollection();
    expect(c.floors).toHaveLength(3);
    expect(c.floors[0].rooms).toEqual([]);
  });
  it('per-floor total = sum of room areas', () => {
    const floor = { id: 'f', label: 'PP', rooms: [makeRoom('Sklad', 20), makeRoom('Technická', 15), makeRoom('Prázdná', '')] };
    expect(roomsFloorTotal(floor)).toBe(35);
  });
  it('grand total sums across floors; add/remove rooms updates it', () => {
    const c = makeRoomsCollection();
    c.floors[0].rooms.push(makeRoom('A', 10), makeRoom('B', 20));
    c.floors[1].rooms.push(makeRoom('C', 30));
    expect(roomsGrandTotal(c)).toBe(60);
    c.floors[0].rooms = c.floors[0].rooms.filter((r) => r.name !== 'B'); // remove B (20)
    expect(roomsGrandTotal(c)).toBe(40);
  });
  it('empty rooms → null, not 0', () => {
    expect(roomsFloorTotal({ rooms: [] })).toBeNull();
    expect(roomsGrandTotal(makeRoomsCollection())).toBeNull();
  });
});

describe('P06 offer price total', () => {
  it('has all nine schema items', () => {
    expect(makeOfferPrice().items).toHaveLength(9);
  });
  it('total = sum of present item prices', () => {
    const offer = makeOfferPrice();
    offer.items[0].price = 100000;
    offer.items[1].price = 250000;
    offer.items[4].price = ''; // empty ignored
    expect(offerPriceTotal(offer)).toBe(350000);
  });
  it('empty offer → null, not 0', () => {
    expect(offerPriceTotal(makeOfferPrice())).toBeNull();
    expect(offerPriceTotal(null)).toBeNull();
  });
});

describe('setScalarValue / ensure collections (oprava načtení)', () => {
  it('writes a primitive and strips the AI { value, source } envelope', () => {
    const after = setScalarValue({ bilance_zastavena: { value: 1200, source: 'xlsx' } }, 'bilance_zastavena', '1502');
    expect(after.bilance_zastavena).toBe('1502');
  });
  it('empty input removes the key', () => {
    const after = setScalarValue({ bilance_zastavena: 10 }, 'bilance_zastavena', '  ');
    expect(after.bilance_zastavena).toBeUndefined();
  });
  it('ensureFloorsCollection assigns ids when import omitted them', () => {
    const ensured = ensureFloorsCollection({ floors: [{ label: '1. NP', value: 100 }] });
    expect(ensured.floors).toHaveLength(1);
    expect(ensured.floors[0].id).toBeTruthy();
    expect(ensured.floors[0].value).toBe(100);
  });
  it('ensureOfferPrice keeps all nine FS items and fills known prices', () => {
    const ensured = ensureOfferPrice({ items: [{ id: 'fs1', price: 1000, note: 'x' }] });
    expect(ensured.items).toHaveLength(9);
    expect(ensured.items[0].price).toBe(1000);
    expect(ensured.items[0].label).toMatch(/^FS 1/);
    expect(ensured.items[1].price).toBe('');
  });
  it('ensureRoomsCollection seeds empty rooms lists', () => {
    const ensured = ensureRoomsCollection({ floors: [{ label: '1. NP' }] });
    expect(ensured.floors[0].rooms).toEqual([]);
    expect(ensured.floors[0].id).toBeTruthy();
  });
});
