import React from 'react';
import {
  safeNum,
  asPercent,
  computeDerivedField,
  floorsTotal,
  roomsGrandTotal,
  offerPriceTotal,
} from '../utils/balanceCalculations.js';
import { colorForIndex } from '../utils/chartPalette.js';

// Srovnání klíčových metrik: faktická tabulka odvozených bilančních a ekonomických ukazatelů
// vedle sebe, aby porota viděla celý obraz najednou (ne jen tři grafy). ZÁMĚRNĚ NEUTRÁLNÍ –
// neoznačuje „vítěze" ani směr (co je lepší/horší je věc poroty, viz vážené hodnocení); jen
// ukazuje hodnoty a jejich relativní velikost v rámci každého řádku (pruh ∝ maximu řádku).
// Barvy sloupců sdílí identitu návrhů s grafem cenové efektivity a podlažním profilem.

const num = (v) => (v === null || v === undefined ? null : v);
const pctOf = (a, b) => (a !== null && b !== null && b > 0 ? asPercent(a / b) : null);

const METRICS = [
  { label: 'Zastavěná plocha', unit: 'm²', get: (d) => safeNum(d.bilance_zastavena) },
  { label: 'Podíl zastavění', unit: '%', get: (d) => pctOf(safeNum(d.bilance_zastavena), computeDerivedField('bilance_celkem', d)) },
  { label: 'Nezpevněná (propustná) plocha', unit: 'm²', get: (d) => safeNum(d.bilance_nezpevnena) },
  { label: 'Podíl nezpevněných ploch', unit: '%', get: (d) => pctOf(safeNum(d.bilance_nezpevnena), computeDerivedField('bilance_celkem', d)) },
  { label: 'Obestavěný prostor celkem', unit: 'm³', get: (d) => computeDerivedField('obestaveny_celkem', d) },
  { label: 'Podíl podzemního obestavěného', unit: '%', get: (d) => pctOf(safeNum(d.obestaveny_podzemni), computeDerivedField('obestaveny_celkem', d)) },
  { label: 'Obálka budovy', unit: 'm²', get: (d) => computeDerivedField('obalka_celkem', d) },
  { label: 'Podíl prosklení', unit: '%', get: (d) => asPercent(computeDerivedField('proskleni_podil', d)) },
  { label: 'Demolice', unit: 'm³', get: (d) => computeDerivedField('demolice_celkem', d) },
  { label: 'HPP celkem', unit: 'm²', get: (d) => floorsTotal(d.hpp) },
  { label: 'Užitná plocha celkem', unit: 'm²', get: (d) => floorsTotal(d.uzitna) },
  { label: 'Účinnost (užitná / HPP)', unit: '%', get: (d) => pctOf(floorsTotal(d.uzitna), floorsTotal(d.hpp)) },
  { label: 'Bilance místností', unit: 'm²', get: (d) => roomsGrandTotal(d.mistnosti) },
  { label: 'Nabídková cena', unit: 'Kč', get: (d) => offerPriceTotal(d.nabidkovaCena) },
  { label: 'Cena za m² HPP', unit: 'Kč/m²', get: (d) => { const c = offerPriceTotal(d.nabidkovaCena), h = floorsTotal(d.hpp); return c !== null && h ? Math.round(c / h) : null; } },
  { label: 'Cena za m² užitné', unit: 'Kč/m²', get: (d) => { const c = offerPriceTotal(d.nabidkovaCena), u = floorsTotal(d.uzitna); return c !== null && u ? Math.round(c / u) : null; } },
];

const fmt = (v) => (v === null ? '—' : v.toLocaleString('cs-CZ'));

const MetricComparisonTable = ({ proposals }) => {
  const cols = proposals.map((p, idx) => ({ id: p.id, nazev: p.nazev, data: p.data || {}, color: colorForIndex(idx) }));

  const rows = METRICS.map((m) => {
    const values = cols.map((c) => num(m.get(c.data)));
    const present = values.filter((v) => v !== null);
    const rowMax = present.length > 0 ? Math.max(...present) : 0;
    return { ...m, values, rowMax, hasData: present.length > 0 };
  }).filter((r) => r.hasData);

  if (cols.length === 0 || rows.length === 0) {
    return (
      <div className="text-sm text-text-muted bg-bg-light border border-border rounded-lg p-4 text-center">
        Zatím není vyplněno dost bilančních dat pro srovnání metrik.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm min-w-[36rem]">
        <thead>
          <tr className="border-b-2 border-border">
            <th className="text-left py-2 pr-3 font-semibold text-text-muted align-bottom">Metrika</th>
            {cols.map((c) => (
              <th key={c.id} className="text-right py-2 px-3 align-bottom min-w-[8rem]">
                <span className="inline-flex items-center gap-1.5 justify-end">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="font-semibold text-text-light truncate max-w-[9rem]" title={c.nazev}>{c.nazev}</span>
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-b border-border/60">
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
                      <div className="h-full rounded-full" style={{ width: `${v !== null ? Math.max(3, barPct) : 0}%`, background: cols[i].color, opacity: 0.85 }} />
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-[0.7rem] text-text-muted mt-3">
        Pruh v každém řádku je relativní k nejvyšší hodnotě řádku — slouží jen k rychlé orientaci
        v poměrech. Co je pro daný ukazatel „lepší" (vyšší/nižší) a jakou má váhu, posuzuje výhradně
        porota ve váženém hodnocení.
      </p>
    </div>
  );
};

export default MetricComparisonTable;
