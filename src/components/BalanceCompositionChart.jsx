import React, { useState } from 'react';
import { safeNum } from '../utils/balanceCalculations.js';

// Skladba bilance ploch: vodorovné skládané pruhy (zastavěná/zpevněná/nezpevněná) per návrh.
// Barvy jsou kategorie (typ plochy), ne návrh – proto samostatná paleta, zvolená sémanticky:
// tmavší = zastavěno, teplá = zpevněno, zelená = nezpevněno/propustné.
//
// Pro srovnání jsou dva režimy: PODÍL (%) = z čeho se plocha skládá (pruhy 100 %), a PLOCHA (m²)
// = pruhy na společném měřítku, aby šla srovnat i absolutní velikost pozemku. V obou režimech
// jsou hodnoty vepsané do segmentů, ne jen v tooltipu – porota čísla srovná bez najíždění myší.
const CAT = {
  zastavena: { key: 'zastavena', label: 'Zastavěná', color: '#475569' },
  zpevnena: { key: 'zpevnena', label: 'Zpevněná', color: '#D97706' },
  nezpevnena: { key: 'nezpevnena', label: 'Nezpevněná', color: '#22C55E' },
};
const CATS = Object.values(CAT);

const BalanceCompositionChart = ({ proposals }) => {
  const [mode, setMode] = useState('podil'); // 'podil' | 'plocha'

  const rows = proposals.map((p) => {
    const zastavena = safeNum(p.data?.bilance_zastavena) ?? 0;
    const zpevnena = safeNum(p.data?.bilance_zpevnena) ?? 0;
    const nezpevnena = safeNum(p.data?.bilance_nezpevnena) ?? 0;
    const total = zastavena + zpevnena + nezpevnena;
    return { id: p.id, nazev: p.nazev, zastavena, zpevnena, nezpevnena, total };
  });

  const hasAnyData = rows.some((r) => r.total > 0);
  const maxTotal = Math.max(1, ...rows.map((r) => r.total));

  if (!hasAnyData) {
    return (
      <div className="text-sm text-text-muted bg-bg-light border border-border rounded-lg p-4 text-center">
        Zatím žádný návrh nemá vyplněnou bilanci ploch (sekce A).
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-end mb-3">
        <div className="inline-flex rounded-lg border border-border overflow-hidden text-xs font-semibold">
          {[
            { id: 'podil', label: 'Podíl (%)' },
            { id: 'plocha', label: 'Plocha (m²)' },
          ].map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className={`px-3 py-1.5 transition-colors ${mode === opt.id ? 'bg-primary text-white' : 'bg-surface text-text-light hover:bg-bg-light'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2.5">
        {rows.map((r) => {
          // Šířka celého pruhu: v režimu podíl vždy 100 %, v režimu plocha ∝ největšímu pozemku.
          const trackPct = mode === 'podil' ? 100 : (r.total / maxTotal) * 100;
          return (
            <div key={r.id} className="grid grid-cols-[7rem_1fr_5rem] sm:grid-cols-[10rem_1fr_5.5rem] items-center gap-3">
              <div className="text-sm font-semibold text-text-light truncate" title={r.nazev}>{r.nazev}</div>
              <div className="h-6 rounded-md bg-bg-light overflow-hidden">
                {r.total > 0 ? (
                  <div className="flex h-full" style={{ width: `${trackPct}%` }}>
                    {CATS.map((c) => {
                      const val = r[c.key];
                      const pct = (val / r.total) * 100;
                      if (pct <= 0) return null;
                      const label = mode === 'podil'
                        ? `${Math.round(pct)} %`
                        : val.toLocaleString('cs-CZ');
                      return (
                        <div
                          key={c.key}
                          className="h-full flex items-center justify-center text-[0.65rem] font-semibold text-white/95 overflow-hidden whitespace-nowrap"
                          style={{ width: `${pct}%`, background: c.color }}
                          title={`${c.label}: ${val.toLocaleString('cs-CZ')} m² (${Math.round(pct)} %)`}
                        >
                          {pct >= 12 ? label : ''}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[0.65rem] text-text-muted">bez dat</div>
                )}
              </div>
              <div className="font-mono text-xs text-text-muted text-right">{r.total > 0 ? `${r.total.toLocaleString('cs-CZ')} m²` : '—'}</div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border">
        {CATS.map((c) => (
          <span key={c.label} className="flex items-center gap-1.5 text-xs text-text-light">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
            {c.label}
          </span>
        ))}
        <span className="text-xs text-text-muted ml-auto">
          {mode === 'podil' ? 'Pruhy = 100 %, čísla jsou podíly typů ploch.' : 'Šířka pruhu ∝ největšímu pozemku, čísla jsou m².'}
        </span>
      </div>
    </div>
  );
};

export default BalanceCompositionChart;
