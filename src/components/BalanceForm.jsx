import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import {
  BALANCE_SECTIONS,
  FLOOR_COLLECTIONS,
  OFFER_PRICE,
  SCALAR_INPUT_FIELDS,
} from '../data/balanceSchema.js';
import {
  computeDerivedField,
  floorsTotal,
  roomsFloorTotal,
  roomsGrandTotal,
  offerPriceTotal,
  makeFloor,
  makeRoom,
  ensureFloorsCollection,
  ensureRoomsCollection,
  ensureOfferPrice,
} from '../utils/balanceCalculations.js';

// Bezpečné načtení hodnoty skalárního pole z navrh.data (podporuje i starý tvar { value }, tedy i AI extrakci).
const readScalar = (data, id) => {
  const raw = data?.[id];
  if (raw && typeof raw === 'object' && 'value' in raw) return raw.value ?? '';
  return raw ?? '';
};

// Formátování odvozené hodnoty; null → '—' (prázdné není nula).
const fmt = (value, unit) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('cs-CZ')} ${unit}`;
};

const numberInputProps = {
  type: 'number',
  min: 0, // žádné záporné plochy/objemy/ceny
  step: 'any', // desetinná čísla
  inputMode: 'decimal',
};

const inputClass =
  'w-full px-3 py-2 border border-slate-300 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent';
const derivedClass =
  'w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-right font-semibold text-slate-800';

// Kotvy v jednom scrollu — všechny sekce P03/P06 jsou vidět, tlačítka jen posunou pohled.
const TABS = [
  { id: 'plochy', label: 'A–D Plochy a objemy' },
  { id: 'podlazi', label: 'E–F Podlaží (HPP, užitná)' },
  { id: 'mistnosti', label: 'G Místnosti' },
  { id: 'obalka', label: 'H–I Obálka a prosklení' },
  { id: 'cena', label: 'P06 Nabídková cena' },
];
const PLOCHY_CODES = new Set(['A', 'B', 'C', 'D']);
const OBALKA_CODES = new Set(['H', 'I']);

const BalanceForm = ({ navrh, onSave, onClose }) => {
  const initialData = navrh?.data || {};
  const [nazev, setNazev] = useState(() => navrh?.nazev || '');

  // Skalární vstupy (A/B/C/D/H/I)
  const [scalars, setScalars] = useState(() => {
    const s = {};
    SCALAR_INPUT_FIELDS.forEach((f) => {
      s[f.id] = readScalar(initialData, f.id);
    });
    return s;
  });

  // Dynamické kolekce
  const [hpp, setHpp] = useState(() => ensureFloorsCollection(initialData.hpp));
  const [uzitna, setUzitna] = useState(() => ensureFloorsCollection(initialData.uzitna));
  const [mistnosti, setMistnosti] = useState(() => ensureRoomsCollection(initialData.mistnosti));
  const [nabidkovaCena, setNabidkovaCena] = useState(() => ensureOfferPrice(initialData.nabidkovaCena));

  const setScalar = (id, value) => setScalars((prev) => ({ ...prev, [id]: value }));

  // --- Patra (E/F) ---
  const collectionSetters = { hpp: setHpp, uzitna: setUzitna };
  const collectionState = { hpp, uzitna };

  const addFloor = (key) =>
    collectionSetters[key]((prev) => ({ ...prev, floors: [...prev.floors, makeFloor()] }));
  const removeFloor = (key, floorId) =>
    collectionSetters[key]((prev) => ({ ...prev, floors: prev.floors.filter((f) => f.id !== floorId) }));
  const updateFloor = (key, floorId, patch) =>
    collectionSetters[key]((prev) => ({
      ...prev,
      floors: prev.floors.map((f) => (f.id === floorId ? { ...f, ...patch } : f)),
    }));

  // --- Místnosti (G) ---
  const addRoomFloor = () =>
    setMistnosti((prev) => ({ ...prev, floors: [...prev.floors, { id: makeFloor().id, label: 'Další podlaží', rooms: [] }] }));
  const removeRoomFloor = (floorId) =>
    setMistnosti((prev) => ({ ...prev, floors: prev.floors.filter((f) => f.id !== floorId) }));
  const updateRoomFloorLabel = (floorId, label) =>
    setMistnosti((prev) => ({
      ...prev,
      floors: prev.floors.map((f) => (f.id === floorId ? { ...f, label } : f)),
    }));
  const addRoom = (floorId) =>
    setMistnosti((prev) => ({
      ...prev,
      floors: prev.floors.map((f) => (f.id === floorId ? { ...f, rooms: [...f.rooms, makeRoom()] } : f)),
    }));
  const removeRoom = (floorId, roomId) =>
    setMistnosti((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.id === floorId ? { ...f, rooms: f.rooms.filter((r) => r.id !== roomId) } : f
      ),
    }));
  const updateRoom = (floorId, roomId, patch) =>
    setMistnosti((prev) => ({
      ...prev,
      floors: prev.floors.map((f) =>
        f.id === floorId
          ? { ...f, rooms: f.rooms.map((r) => (r.id === roomId ? { ...r, ...patch } : r)) }
          : f
      ),
    }));

  // --- P06 ---
  const updateOfferItem = (itemId, patch) =>
    setNabidkovaCena((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    }));

  const derived = useMemo(() => {
    const scalarData = {};
    SCALAR_INPUT_FIELDS.forEach((f) => {
      scalarData[f.id] = scalars[f.id];
    });
    return {
      scalarData,
      bilanceCelkem: computeDerivedField('bilance_celkem', scalarData),
      hppTotal: floorsTotal(hpp),
      uzitnaTotal: floorsTotal(uzitna),
      mistnostiTotal: roomsGrandTotal(mistnosti),
      offerTotal: offerPriceTotal(nabidkovaCena),
    };
  }, [scalars, hpp, uzitna, mistnosti, nabidkovaCena]);

  const handleSave = () => {
    // Ulož jen vstupy a kolekce; odvozené hodnoty se NIKDY neukládají (počítají se za běhu).
    const cleanedScalars = {};
    SCALAR_INPUT_FIELDS.forEach((f) => {
      const v = scalars[f.id];
      if (v !== '' && v !== null && v !== undefined) cleanedScalars[f.id] = v;
    });

    // Zachovej případné neznámé (legacy) klíče beze změny, přepiš jen naše.
    const preserved = { ...(navrh?.data || {}) };
    // odstraň staré odvozené/derived klíče, pokud tam náhodou jsou
    SCALAR_INPUT_FIELDS.forEach((f) => delete preserved[f.id]);

    const newData = {
      ...preserved,
      ...cleanedScalars,
      hpp,
      uzitna,
      mistnosti,
      nabidkovaCena,
    };
    onSave(newData, { nazev: nazev.trim() || navrh?.nazev });
  };

  const floorCollectionMeta = FLOOR_COLLECTIONS.filter((c) => c.kind === 'floors');
  const roomsMeta = FLOOR_COLLECTIONS.find((c) => c.kind === 'rooms');
  const plochySections = BALANCE_SECTIONS.filter((s) => PLOCHY_CODES.has(s.code));
  const obalkaSections = BALANCE_SECTIONS.filter((s) => OBALKA_CODES.has(s.code));

  const renderStaticSection = (section) => (
    <section key={section.id}>
      <div className="flex items-baseline gap-2 mb-1">
        <span className="text-lg">{section.ikona}</span>
        <h3 className="text-base font-bold text-slate-900">
          {section.code}. {section.nazev}
        </h3>
        <span className="text-xs text-slate-400 font-mono">{section.jednotka}</span>
      </div>
      {section.popis && <p className="text-xs text-slate-500 mb-3">{section.popis}</p>}
      {section.referenceNote && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-3">
          ℹ️ {section.referenceNote}
        </p>
      )}
      <div className="space-y-2">
        {section.fields.map((field) => {
          const unit = field.jednotka || section.jednotka;
          if (field.kind === 'derived') {
            const value =
              field.derivedRule === 'ratio'
                ? (() => {
                    const r = computeDerivedField(field.id, derived.scalarData);
                    return r === null ? null : Number((r * 100).toFixed(1));
                  })()
                : computeDerivedField(field.id, derived.scalarData);
            return (
              <div key={field.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
                <label className="text-sm font-semibold text-slate-700">{field.nazev}</label>
                <div className="flex items-center gap-2 w-56">
                  <div className={derivedClass} aria-readonly="true">
                    {fmt(value, unit)}
                  </div>
                </div>
              </div>
            );
          }
          return (
            <div key={field.id} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <label htmlFor={`f_${field.id}`} className="text-sm text-slate-700">
                {field.nazev}
                {field.popis && (
                  <span className="block text-xs text-slate-400" title={field.popis}>
                    {field.popis.length > 70 ? `${field.popis.slice(0, 70)}…` : field.popis}
                  </span>
                )}
              </label>
              <div className="flex items-center gap-2 w-56">
                <input
                  id={`f_${field.id}`}
                  {...numberInputProps}
                  value={scalars[field.id]}
                  onChange={(e) => setScalar(field.id, e.target.value)}
                  className={inputClass}
                  placeholder="—"
                />
                <span className="text-xs text-slate-500 w-8 shrink-0">{unit}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-accent text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Bilanční tabulka P03 / P06</h2>
            <input
              type="text"
              value={nazev}
              onChange={(e) => setNazev(e.target.value)}
              className="mt-1 w-full max-w-md bg-white/15 border border-white/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/60"
              placeholder="Název návrhu"
              aria-label="Název návrhu"
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Zavřít"
          >
            <X size={22} />
          </button>
        </div>

        {/* Souhrnný pruh – klíčové součty vidět i bez scrollu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-200 text-xs">
          {[
            ['Bilance ploch', derived.bilanceCelkem, 'm²'],
            ['HPP celkem', derived.hppTotal, 'm²'],
            ['Užitná plocha', derived.uzitnaTotal, 'm²'],
            ['Nabídková cena', derived.offerTotal, 'Kč'],
          ].map(([label, value, unit]) => (
            <div key={label} className="bg-white px-3 py-2">
              <div className="text-slate-400">{label}</div>
              <div className="font-bold text-slate-800 tabular-nums">{fmt(value, unit)}</div>
            </div>
          ))}
        </div>

        <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50 px-2 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => document.getElementById(`bf-${tab.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="shrink-0 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:text-primary hover:bg-white rounded-t-lg"
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-6 overflow-y-auto space-y-10 flex-1">
          <div id="bf-plochy" className="space-y-8 scroll-mt-2">
            {plochySections.map(renderStaticSection)}
          </div>

          <div id="bf-podlazi" className="space-y-8 scroll-mt-2">
            {floorCollectionMeta.map((meta) => {
              const state = collectionState[meta.key];
              const total = meta.key === 'hpp' ? derived.hppTotal : derived.uzitnaTotal;
              return (
                <section key={meta.id}>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-lg">{meta.ikona}</span>
                    <h3 className="text-base font-bold text-slate-900">
                      {meta.code}. {meta.nazev}
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">{meta.jednotka}</span>
                  </div>
                  {meta.popis && <p className="text-xs text-slate-500 mb-3">{meta.popis}</p>}
                  <div className="space-y-2">
                    {state.floors.map((floor) => (
                      <div key={floor.id} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={floor.label}
                          onChange={(e) => updateFloor(meta.key, floor.id, { label: e.target.value })}
                          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                          aria-label="Název podlaží"
                        />
                        <input
                          {...numberInputProps}
                          value={floor.value}
                          onChange={(e) => updateFloor(meta.key, floor.id, { value: e.target.value })}
                          className={`${inputClass} w-40`}
                          placeholder="—"
                          aria-label={`Plocha – ${floor.label}`}
                        />
                        <span className="text-xs text-slate-500 w-8 shrink-0">{meta.jednotka}</span>
                        <button
                          type="button"
                          onClick={() => removeFloor(meta.key, floor.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Odebrat podlaží"
                          aria-label={`Odebrat podlaží ${floor.label}`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <button
                      type="button"
                      onClick={() => addFloor(meta.key)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 rounded-lg font-medium"
                    >
                      <Plus size={16} /> Přidat podlaží
                    </button>
                    <div className="text-sm">
                      <span className="text-slate-500">Celkem: </span>
                      <span className="font-bold text-slate-900">{fmt(total, meta.jednotka)}</span>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {roomsMeta && (
            <section id="bf-mistnosti" className="scroll-mt-2">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg">{roomsMeta.ikona}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {roomsMeta.code}. {roomsMeta.nazev}
                </h3>
                <span className="text-xs text-slate-400 font-mono">{roomsMeta.jednotka}</span>
              </div>
              {roomsMeta.popis && <p className="text-xs text-slate-500 mb-3">{roomsMeta.popis}</p>}
              <div className="space-y-4">
                {mistnosti.floors.map((floor) => (
                  <div key={floor.id} className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <input
                        type="text"
                        value={floor.label}
                        onChange={(e) => updateRoomFloorLabel(floor.id, e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-accent"
                        aria-label="Název podlaží"
                      />
                      <button
                        type="button"
                        onClick={() => removeRoomFloor(floor.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Odebrat podlaží"
                        aria-label={`Odebrat podlaží ${floor.label}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="space-y-2 pl-2">
                      {floor.rooms.map((room) => (
                        <div key={room.id} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={room.name}
                            onChange={(e) => updateRoom(floor.id, room.id, { name: e.target.value })}
                            className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                            placeholder="Název místnosti"
                            aria-label="Název místnosti"
                          />
                          <input
                            {...numberInputProps}
                            value={room.area}
                            onChange={(e) => updateRoom(floor.id, room.id, { area: e.target.value })}
                            className={`${inputClass} w-32`}
                            placeholder="—"
                            aria-label="Užitná plocha místnosti"
                          />
                          <span className="text-xs text-slate-500 w-8 shrink-0">{roomsMeta.jednotka}</span>
                          <button
                            type="button"
                            onClick={() => removeRoom(floor.id, room.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Odebrat místnost"
                            aria-label="Odebrat místnost"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between mt-2 pl-2">
                      <button
                        type="button"
                        onClick={() => addRoom(floor.id)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-xs text-accent hover:bg-accent/10 rounded-lg font-medium"
                      >
                        <Plus size={14} /> Přidat místnost
                      </button>
                      <div className="text-xs">
                        <span className="text-slate-500">Celkem podlaží: </span>
                        <span className="font-bold text-slate-900">
                          {fmt(roomsFloorTotal(floor), roomsMeta.jednotka)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-3">
                <button
                  type="button"
                  onClick={addRoomFloor}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-accent hover:bg-accent/10 rounded-lg font-medium"
                >
                  <Plus size={16} /> Přidat podlaží
                </button>
                <div className="text-sm">
                  <span className="text-slate-500">Celkem místnosti: </span>
                  <span className="font-bold text-slate-900">{fmt(derived.mistnostiTotal, roomsMeta.jednotka)}</span>
                </div>
              </div>
            </section>
          )}

          <div id="bf-obalka" className="space-y-8 scroll-mt-2">
            {obalkaSections.map(renderStaticSection)}
          </div>

          <section id="bf-cena" className="scroll-mt-2">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-lg">{OFFER_PRICE.ikona}</span>
                <h3 className="text-base font-bold text-slate-900">
                  {OFFER_PRICE.code} – {OFFER_PRICE.nazev}
                </h3>
                <span className="text-xs text-slate-400 font-mono">{OFFER_PRICE.jednotka} bez DPH</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Nabídková cena je data návrhu, nevstupuje do architektonického hodnocení.
              </p>
              <div className="space-y-2">
                {nabidkovaCena.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 md:grid-cols-[1fr_10rem_1fr] items-center gap-2">
                    <label className="text-sm text-slate-700">{item.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        {...numberInputProps}
                        value={item.price}
                        onChange={(e) => updateOfferItem(item.id, { price: e.target.value })}
                        className={inputClass}
                        placeholder="—"
                        aria-label={`Cena bez DPH – ${item.label}`}
                      />
                      <span className="text-xs text-slate-500 shrink-0">Kč</span>
                    </div>
                    <input
                      type="text"
                      value={item.note}
                      onChange={(e) => updateOfferItem(item.id, { note: e.target.value })}
                      className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                      placeholder="Poznámka / specifikace"
                      aria-label={`Poznámka – ${item.label}`}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end mt-3 pt-3 border-t border-slate-200">
                <span className="text-slate-500 text-sm mr-2">Celková nabídková cena:</span>
                <span className="font-bold text-lg text-slate-900">{fmt(derived.offerTotal, 'Kč')}</span>
              </div>
            </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50"
          >
            Zrušit
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary/90"
          >
            <Save size={16} /> Uložit bilanci
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default BalanceForm;
