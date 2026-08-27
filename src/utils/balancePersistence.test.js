import { describe, it, expect } from 'vitest';
import {
  makeFloorsCollection,
  makeRoomsCollection,
  makeOfferPrice,
  makeFloor,
  makeRoom,
  floorsTotal,
  roomsGrandTotal,
  offerPriceTotal,
  computeDerivedField,
} from './balanceCalculations.js';
import { SCALAR_INPUT_FIELDS } from '../data/balanceSchema.js';

// Simuluje localStorage cyklus, jak jej dělá WizardContext/useLocalStorage:
// navrh.data → JSON.stringify → JSON.parse → zpět.
const roundTrip = (data) => JSON.parse(JSON.stringify(data));

// Sestaví realistický navrh.data přesně v tom tvaru, který ukládá BalanceForm.handleSave.
const buildNavrhData = () => {
  const hpp = makeFloorsCollection();
  hpp.floors[0].value = '100';
  hpp.floors[1].value = '250.5';
  hpp.floors.push(makeFloor('Nadzemní 3. NP', '80')); // dynamicky přidané patro

  const uzitna = makeFloorsCollection();
  uzitna.floors[0].value = '90';

  const mistnosti = makeRoomsCollection();
  mistnosti.floors[1].rooms.push(makeRoom('Obývací pokoj', '35'));
  mistnosti.floors[1].rooms.push(makeRoom('Kuchyně', '15'));

  const nabidkovaCena = makeOfferPrice();
  nabidkovaCena.items[0].price = '1000000';
  nabidkovaCena.items[0].note = 'vč. průzkumů';
  nabidkovaCena.items[8].price = '500000';

  return {
    bilance_zastavena: '1200',
    bilance_zpevnena: '800',
    bilance_nezpevnena: '400',
    hpp,
    uzitna,
    mistnosti,
    nabidkovaCena,
  };
};

describe('persistence – navrh.data survives save/reload (JSON round-trip)', () => {
  it('scalar inputs survive and derived totals recompute identically', () => {
    const before = buildNavrhData();
    const after = roundTrip(before);

    SCALAR_INPUT_FIELDS.slice(0, 3).forEach((f) => {
      expect(after[f.id]).toBe(before[f.id]);
    });
    // A. Bilance ploch Celkem = 1200 + 800 + 400
    expect(computeDerivedField('bilance_celkem', after)).toBe(2400);
  });

  it('dynamically added floors are not lost and totals hold', () => {
    const after = roundTrip(buildNavrhData());
    expect(after.hpp.floors).toHaveLength(4); // 3 seed + 1 added
    expect(floorsTotal(after.hpp)).toBeCloseTo(430.5); // 100 + 250.5 + 80
  });

  it('dynamic rooms and per-floor structure survive reload', () => {
    const after = roundTrip(buildNavrhData());
    const floorWithRooms = after.mistnosti.floors[1];
    expect(floorWithRooms.rooms).toHaveLength(2);
    expect(floorWithRooms.rooms.map((r) => r.name)).toEqual(['Obývací pokoj', 'Kuchyně']);
    expect(roomsGrandTotal(after.mistnosti)).toBe(50); // 35 + 15
  });

  it('offer price items (incl. note) survive and total recomputes', () => {
    const after = roundTrip(buildNavrhData());
    expect(after.nabidkovaCena.items).toHaveLength(9);
    expect(after.nabidkovaCena.items[0].note).toBe('vč. průzkumů');
    expect(offerPriceTotal(after.nabidkovaCena)).toBe(1500000); // 1000000 + 500000
  });

  it('empty fields stay empty after reload (empty ≠ 0)', () => {
    const data = { bilance_zastavena: '', hpp: makeFloorsCollection() };
    const after = roundTrip(data);
    expect(after.bilance_zastavena).toBe('');
    expect(computeDerivedField('bilance_celkem', after)).toBeNull(); // nothing filled → null, not 0
    expect(floorsTotal(after.hpp)).toBeNull();
  });

  it('ids of floors/rooms remain stable across reload (no data reshuffle)', () => {
    const before = buildNavrhData();
    const after = roundTrip(before);
    expect(after.hpp.floors.map((f) => f.id)).toEqual(before.hpp.floors.map((f) => f.id));
    expect(after.mistnosti.floors[1].rooms.map((r) => r.id)).toEqual(
      before.mistnosti.floors[1].rooms.map((r) => r.id)
    );
  });
});
