import React, { useMemo } from 'react';
import { EyeOff, Plus } from 'lucide-react';
import {
  safeNum,
  asPercent,
  computeDerivedField,
  floorsTotal,
  roomsGrandTotal,
  offerPriceTotal,
} from '../utils/balanceCalculations.js';
import { colorForIndex } from '../utils/chartPalette.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';

// Srovnání klíčových metrik: faktická tabulka odvozených bilančních a ekonomických ukazatelů.
// Viditelné řádky si porota skládá sama (skrýt / přidat); výběr se pamatuje v localStorage.

const num = (v) => (v === null || v === undefined ? null : v);
const pctOf = (a, b) => (a !== null && b !== null && b > 0 ? asPercent(a / b) : null);

const METRICS = [
  { id: 'zastavena', label: 'Zastavěná plocha', unit: 'm²', get: (d) => safeNum(d.bilance_zastavena) },
  { id: 'podil_zastaveni', label: 'Podíl zastavění', unit: '%', get: (d) => pctOf(safeNum(d.bilance_zastavena), computeDerivedField('bilance_celkem', d)) },
  { id: 'nezpevnena', label: 'Nezpevněná plocha', unit: 'm²', get: (d) => safeNum(d.bilance_nezpevnena) },
  { id: 'podil_nezpevnenych', label: 'Podíl nezpevněných ploch', unit: '%', get: (d) => pctOf(safeNum(d.bilance_nezpevnena), computeDerivedField('bilance_celkem', d)) },
  { id: 'obestaveny_celkem', label: 'Celkový obestavěný prostor', unit: 'm³', get: (d) => computeDerivedField('obestaveny_celkem', d) },
  { id: 'podil_podzemniho', label: 'Podíl podzemního obestavěného', unit: '%', get: (d) => pctOf(safeNum(d.obestaveny_podzemni), computeDerivedField('obestaveny_celkem', d)) },
  { id: 'obalka', label: 'Plocha obálky vytápěné části budovy', unit: 'm²', get: (d) => computeDerivedField('obalka_celkem', d) },
  { id: 'proskleni', label: 'Podíl prosklených ploch', unit: '%', get: (d) => asPercent(computeDerivedField('proskleni_podil', d)) },
  { id: 'demolice', label: 'Demolice stávající stavby', unit: 'm³', get: (d) => computeDerivedField('demolice_celkem', d) },
  { id: 'hpp', label: 'Hrubá podlažní plocha', unit: 'm²', get: (d) => floorsTotal(d.hpp) },
  { id: 'uzitna', label: 'Celková užitná plocha', unit: 'm²', get: (d) => floorsTotal(d.uzitna) },
  { id: 'ucinnost', label: 'Účinnost (užitná / HPP)', unit: '%', get: (d) => pctOf(floorsTotal(d.uzitna), floorsTotal(d.hpp)) },
  { id: 'mistnosti', label: 'Bilance místností', unit: 'm²', get: (d) => roomsGrandTotal(d.mistnosti) },
  { id: 'cena', label: 'Nabídková cena', unit: 'Kč', get: (d) => offerPriceTotal(d.nabidkovaCena) },
  { id: 'cena_hpp', label: 'Cena za m² HPP', unit: 'Kč/m²', get: (d) => { const c = offerPriceTotal(d.nabidkovaCena), h = floorsTotal(d.hpp); return c !== null && h ? Math.round(c / h) : null; } },
  { id: 'cena_uzitne', label: 'Cena za m² užitné', unit: 'Kč/m²', get: (d) => { const c = offerPriceTotal(d.nabidkovaCena), u = floorsTotal(d.uzitna); return c !== null && u ? Math.round(c / u) : null; } },
];

const fmt = (v) => (v === null ? '—' : v.toLocaleString('cs-CZ'));

const MetricComparisonTable = ({ proposals }) => {
  const [hiddenIds, setHiddenIds] = useLocalStorage('archieval-metrics-hidden', []);
  const hiddenSet = useMemo(() => new Set(hiddenIds), [hiddenIds]);

  const cols = useMemo(
    () => proposals.map((p, idx) => ({ id: p.id, nazev: p.nazev, data: p.data || {}, color: colorForIndex(idx) })),
    [proposals]
  );

  const computed = useMemo(
    () =>
      METRICS.map((m) => {
        const values = cols.map((c) => num(m.get(c.data)));
        const present = values.filter((v) => v !== null);
        const rowMax = present.length > 0 ? Math.max(...present) : 0;
        return { ...m, values, rowMax, hasData: present.length > 0 };
      }),
    [cols]
  );

  const available = computed.filter((r) => r.hasData);
  const visible = available.filter((r) => !hiddenSet.has(r.id));
  const hiddenAvailable = available.filter((r) => hiddenSet.has(r.id));

  const hideMetric = (id) => setHiddenIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  const showMetric = (id) => setHiddenIds((prev) => prev.filter((x) => x !== id));
  const showAll = () => setHiddenIds((prev) => prev.filter((id) => !available.some((r) => r.id === id)));

  if (cols.length === 0 || available.length === 0) {
    return (
      <div className="text-sm text-text-muted bg-bg-light border border-border rounded-lg p-4 text-center">
        Zatím není vyplněno dost bilančních dat pro srovnání metrik.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[36rem]">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left py-2 pr-3 font-semibold text-text-muted align-bottom">Metrika</th>
              {cols.map((c) => (
                <th key={c.id} className="text-right py-2 px-3 align-bottom min-w-[8rem]">
                  <span className="inline-flex items-center gap-1.5 justify-end">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                    <span className="font-semibold text-text-light truncate max-w-[9rem]" title={c.nazev}>
                      {c.nazev}
                    </span>
                  </span>
                </th>
              ))}
              <th className="w-8" aria-label="Skrýt metriku" />
            </tr>
          </thead>
          <tbody>
            {visible.map((r, rowIdx) => (
              <tr key={r.id} className={`border-b border-border/60 group ${rowIdx % 2 === 1 ? 'bg-slate-50/80' : ''}`}>
                <td className="py-2.5 pr-3 text-text-light">
                  <span className="font-medium">{r.label}</span>
                  <span className="text-text-muted text-xs ml-1">({r.unit})</span>
                </td>
                {r.values.map((v, i) => {
                  const barPct = v !== null && r.rowMax > 0 ? (v / r.rowMax) * 100 : 0;
                  return (
                    <td key={cols[i].id} className="py-2.5 px-3">
                      <div className="font-mono text-xs text-text-dark text-right tabular-nums">{fmt(v)}</div>
                      <div className="h-1.5 rounded-full bg-bg-light overflow-hidden mt-1">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${v !== null ? Math.max(3, barPct) : 0}%`,
                            background: cols[i].color,
                            opacity: 0.85,
                          }}
                        />
                      </div>
                    </td>
                  );
                })}
                <td className="py-2.5 pl-1 pr-1 align-middle">
                  <button
                    type="button"
                    onClick={() => hideMetric(r.id)}
                    className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title={`Skrýt „${r.label}“`}
                    aria-label={`Skrýt metriku ${r.label}`}
                  >
                    <EyeOff size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3 text-center mt-3">
          Všechny metriky s daty jsou skryté — přidejte je zpět níže.
        </p>
      )}

      {hiddenAvailable.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Přidat metriku</p>
            <button
              type="button"
              onClick={showAll}
              className="text-xs font-medium text-accent hover:underline"
            >
              Zobrazit všechny ({hiddenAvailable.length})
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {hiddenAvailable.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => showMetric(r.id)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:border-accent hover:text-accent"
              >
                <Plus size={12} />
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <p className="text-[0.7rem] text-text-muted mt-3">
        Řádek skryjete ikonou oka vpravo. Skryté metriky přidáte zpět tlačítky níže.
        Pruh v řádku je relativní k nejvyšší hodnotě — jen orientace v poměrech, ne „vítěz“.
      </p>
    </div>
  );
};

export default MetricComparisonTable;
