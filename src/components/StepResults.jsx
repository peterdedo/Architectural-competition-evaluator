import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, File, Edit3, Plus, Trash2, ArrowRight } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { FLOOR_COLLECTIONS, OFFER_PRICE, BALANCE_SECTIONS, SCALAR_INPUT_FIELDS } from '../data/balanceSchema.js';
import {
  computeDerivedField,
  floorsTotal,
  roomsGrandTotal,
  offerPriceTotal,
  safeNum,
  setScalarValue,
} from '../utils/balanceCalculations.js';
import { useProposalSelection } from '../hooks/useProposalSelection.js';
import { generateNavrhId } from '../utils/generateId';
import BalanceForm from './BalanceForm';
import ProposalFilterBar from './ProposalFilterBar';

// Formátování hodnoty s jednotkou; prázdné (null) → '—'.
const fmt = (value, unit) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('cs-CZ')} ${unit}`;
};

const scalarDraft = (data, id) => {
  const n = safeNum(data?.[id]);
  return n === null ? '' : String(n);
};

const ScalarEditCell = ({ data, fieldId, unit, onCommit }) => {
  const [draft, setDraft] = useState(() => scalarDraft(data, fieldId));
  useEffect(() => {
    setDraft(scalarDraft(data, fieldId));
  }, [data, fieldId]);

  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== scalarDraft(data, fieldId)) onCommit(draft);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur();
        }}
        className="w-24 px-2 py-1 border border-slate-200 rounded-md text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent"
        placeholder="—"
        aria-label={unit ? `Hodnota (${unit})` : 'Hodnota'}
      />
    </div>
  );
};

// Kolik ze skalárních vstupů je vyplněno (hrubá míra kompletnosti bilance).
const completeness = (data = {}) => {
  const filled = SCALAR_INPUT_FIELDS.filter((f) => safeNum(data[f.id]) !== null).length;
  return SCALAR_INPUT_FIELDS.length > 0 ? Math.round((filled / SCALAR_INPUT_FIELDS.length) * 100) : 0;
};

const StepResults = ({ navrhy, onBack, onNext, setNavrhy }) => {
  const [balanceModalId, setBalanceModalId] = useState(null);

  const zpracovaneNavrhy = useMemo(
    () => navrhy.filter((n) => n.status === 'zpracován' && n.data && Object.keys(n.data).length > 0),
    [navrhy]
  );

  // Které návrhy jsou zahrnuté v detailní srovnávací tabulce – sdílený výběr se stejným
  // localStorage klíčem jako krok "Návrhy v porovnání", dá se přepínat i přímo tady.
  // Přehledový seznam nahoře zůstává vždy kompletní.
  const {
    isSelected: isCompared,
    toggle: toggleCompared,
    selectAll: selectAllCompared,
    selectNone: selectNoneCompared,
    selected: comparedNavrhy,
    selectedCount: comparedCount,
  } = useProposalSelection(zpracovaneNavrhy);

  const editingNavrh = useMemo(
    () => navrhy.find((n) => n.id === balanceModalId) || null,
    [navrhy, balanceModalId]
  );

  const saveBalance = (newData, extras = {}) => {
    setNavrhy((prev) =>
      prev.map((n) =>
        n.id === balanceModalId
          ? { ...n, data: newData, nazev: extras.nazev?.trim() ? extras.nazev.trim() : n.nazev }
          : n
      )
    );
    setBalanceModalId(null);
  };

  const patchScalar = (navrhId, fieldId, raw) => {
    setNavrhy((prev) =>
      prev.map((n) => (n.id === navrhId ? { ...n, data: setScalarValue(n.data, fieldId, raw) } : n))
    );
  };

  const createManualNavrh = () => {
    const id = generateNavrhId();
    const nazev = `Návrh ${navrhy.length + 1}`;
    setNavrhy((prev) => [...prev, { id, nazev, status: 'zpracován', source: 'manual', data: {} }]);
    setBalanceModalId(id);
  };

  const removeNavrh = (id) => {
    if (!window.confirm('Opravdu chcete tento návrh odebrat?')) return;
    setNavrhy((prev) => prev.filter((n) => n.id !== id));
  };

  // Vstupní pole seskupená podle sekcí (pro přehledovou tabulku).
  const scalarFieldsBySection = useMemo(
    () =>
      BALANCE_SECTIONS.map((s) => ({
        section: s,
        fields: s.fields.filter((f) => f.kind === 'input'),
      })).filter((g) => g.fields.length > 0),
    []
  );

  const empty = zpracovaneNavrhy.length === 0;

  return (
    <div className="card-active overflow-hidden animate-fade-in">
      <div className="bg-primary text-white px-8 py-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <BarChart3 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="heading-1 text-white">Bilanční údaje návrhů</h2>
              <p className="text-white/80 text-sm">
                {empty
                  ? 'Zatím žádná data – přidejte návrh nebo je nahrajte'
                  : `${zpracovaneNavrhy.length} návrhů · P03 a P06 lze opravit v tabulce nebo v úplném formuláři`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={createManualNavrh}
            className="inline-flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
          >
            <Plus size={16} /> Nový návrh (ručně)
          </button>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {empty ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <BarChart3 size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Žádná data k zobrazení</h3>
            <p className="text-slate-500 mb-6">
              Vytvořte nový návrh ručně, nebo se vraťte na nahrání souborů.
            </p>
            <div className="flex justify-center gap-3">
              <button className="btn-secondary" onClick={onBack}>
                ← Zpět na Nahrání návrhů
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium"
                onClick={createManualNavrh}
              >
                <Plus size={16} /> Nový návrh
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Přehledový seznam – kompaktní řádky místo karet, aby se vešly i desítky návrhů */}
            <div className="overflow-x-auto border border-gray-200 rounded-xl">
              <table className="w-full border-collapse bg-surface text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-2 text-left text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border sticky left-0 bg-slate-50 z-10">
                      Návrh
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border w-32">
                      Kompletnost
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border">Bilance ploch</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border">HPP</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border">Užitná</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border">Místnosti</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border">Cena</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {zpracovaneNavrhy.map((navrh) => {
                    const komplet = completeness(navrh.data);
                    const bilanceCelkem = computeDerivedField('bilance_celkem', navrh.data);
                    const hppTotal = floorsTotal(navrh.data.hpp);
                    const uzitnaTotal = floorsTotal(navrh.data.uzitna);
                    const mistTotal = roomsGrandTotal(navrh.data.mistnosti);
                    const cena = offerPriceTotal(navrh.data.nabidkovaCena);
                    return (
                      <tr key={navrh.id} className="table-row hover:bg-slate-50">
                        <td className="px-4 py-2 border-b border-border sticky left-0 bg-surface">
                          <div className="flex items-center gap-2 min-w-0">
                            <File size={14} className="text-primary shrink-0" />
                            <span className="font-medium text-gray-900 truncate max-w-[14rem]" title={navrh.nazev}>
                              {navrh.nazev}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 border-b border-border">
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full"
                                style={{ width: `${komplet}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-500 tabular-nums">{komplet}%</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right border-b border-border tabular-nums">{fmt(bilanceCelkem, 'm²')}</td>
                        <td className="px-3 py-2 text-right border-b border-border tabular-nums">{fmt(hppTotal, 'm²')}</td>
                        <td className="px-3 py-2 text-right border-b border-border tabular-nums">{fmt(uzitnaTotal, 'm²')}</td>
                        <td className="px-3 py-2 text-right border-b border-border tabular-nums">{fmt(mistTotal, 'm²')}</td>
                        <td className="px-3 py-2 text-right border-b border-border tabular-nums">{fmt(cena, 'Kč')}</td>
                        <td className="px-3 py-2 border-b border-border">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setBalanceModalId(navrh.id)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-accent text-white rounded-lg hover:bg-accent/90 font-medium"
                            >
                              <Edit3 size={12} /> Upravit
                            </button>
                            <button
                              onClick={() => removeNavrh(navrh.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Odebrat návrh"
                              aria-label={`Odebrat návrh ${navrh.nazev}`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <ProposalFilterBar
              navrhy={zpracovaneNavrhy}
              isSelected={isCompared}
              toggle={toggleCompared}
              selectAll={selectAllCompared}
              selectNone={selectNoneCompared}
              selectedCount={comparedCount}
            />

            {/* Přehledová tabulka skalárních vstupů + odvozených součtů – jen vybrané návrhy */}
            {comparedNavrhy.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                Žádný návrh není vybraný k porovnání – vyberte alespoň jeden výše.
              </p>
            ) : (
            <p className="text-xs text-slate-500 mb-2">
              Čísla v tabulce jdou upravit přímo (oprava špatného načtení). Patra, místnosti a položky
              nabídkové ceny otevřete tlačítkem Upravit u návrhu — tam je celá P03/P06.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-surface rounded-xl overflow-hidden shadow-card text-sm">
                <thead>
                  <tr>
                    <th className="table-header px-4 py-3 text-left text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border sticky left-0 bg-surface z-10">
                      Ukazatel
                    </th>
                    {comparedNavrhy.map((n) => (
                      <th key={n.id} className="table-header px-3 py-3 text-center text-xs font-semibold text-text-light uppercase tracking-wider border-b border-border min-w-36">
                        <div className="flex flex-col items-center gap-1">
                          <span className="normal-case text-slate-800 font-semibold truncate max-w-[10rem]" title={n.nazev}>
                            {n.nazev}
                          </span>
                          <button
                            type="button"
                            onClick={() => setBalanceModalId(n.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-accent text-white rounded-md hover:bg-accent/90"
                          >
                            <Edit3 size={10} /> Celá tabulka
                          </button>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {scalarFieldsBySection.map(({ section, fields }) => (
                    <React.Fragment key={section.id}>
                      <tr className="bg-slate-50">
                        <td colSpan={comparedNavrhy.length + 1} className="px-4 py-2 text-xs font-bold text-slate-700 border-b border-border">
                          {section.code}. {section.nazev} <span className="font-mono text-slate-400">({section.jednotka})</span>
                        </td>
                      </tr>
                      {fields.map((field) => (
                        <tr key={field.id} className="table-row">
                          <td className="px-4 py-2 text-slate-700 border-b border-border sticky left-0 bg-surface">
                            {field.nazev}
                          </td>
                          {comparedNavrhy.map((n) => (
                            <td key={n.id} className="px-2 py-1.5 text-center border-b border-border">
                              <ScalarEditCell
                                data={n.data}
                                fieldId={field.id}
                                unit={section.jednotka}
                                onCommit={(raw) => patchScalar(n.id, field.id, raw)}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                      {section.fields.filter((f) => f.kind === 'derived').map((d) => (
                        <tr key={d.id} className="bg-primary/5">
                          <td className="px-4 py-2 font-semibold text-slate-800 border-b border-border sticky left-0 bg-primary/5">{d.nazev} (auto)</td>
                          {comparedNavrhy.map((n) => {
                            const val = d.derivedRule === 'ratio'
                              ? (() => { const r = computeDerivedField(d.id, n.data); return r === null ? null : Number((r * 100).toFixed(1)); })()
                              : computeDerivedField(d.id, n.data);
                            return (
                              <td key={n.id} className="px-4 py-2 text-center font-semibold border-b border-border tabular-nums">
                                {fmt(val, d.jednotka || section.jednotka)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                  <tr className="bg-slate-50">
                    <td colSpan={comparedNavrhy.length + 1} className="px-4 py-2 text-xs font-bold text-slate-700 border-b border-border">
                      E–G, P06 — součty (úprava po podlažích / položkách v celé tabulce)
                    </td>
                  </tr>
                  {[
                    ...FLOOR_COLLECTIONS.map((c) => ({
                      id: c.key,
                      nazev: `${c.code}. ${c.nazev}`,
                      unit: c.jednotka,
                      get: (d) => (c.kind === 'rooms' ? roomsGrandTotal(d[c.key]) : floorsTotal(d[c.key])),
                    })),
                    {
                      id: 'nabidkovaCena',
                      nazev: `${OFFER_PRICE.code}. ${OFFER_PRICE.nazev}`,
                      unit: OFFER_PRICE.jednotka,
                      get: (d) => offerPriceTotal(d.nabidkovaCena),
                    },
                  ].map((row) => (
                    <tr key={row.id} className="table-row">
                      <td className="px-4 py-2 text-slate-700 border-b border-border sticky left-0 bg-surface">{row.nazev}</td>
                      {comparedNavrhy.map((n) => (
                        <td key={n.id} className="px-4 py-2 text-center border-b border-border tabular-nums">
                          {fmt(row.get(n.data || {}), row.unit)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </>
        )}

        {/* Navigace */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            onClick={onBack}
          >
            ← Zpět na Nahrání návrhů
          </button>
          {!empty && onNext && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              onClick={onNext}
            >
              Návrhy v porovnání <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editingNavrh && (
          <BalanceForm
            navrh={editingNavrh}
            onSave={saveBalance}
            onClose={() => setBalanceModalId(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepResults;
