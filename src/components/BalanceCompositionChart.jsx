import React from 'react';
import { safeNum } from '../utils/balanceCalculations.js';

// Skladba bilance ploch: vodorovné skládané pruhy (zastavěná/zpevněná/nezpevněná) per návrh.
// Barvy jsou kategorie (typ plochy), ne návrh – proto samostatná paleta od chartPalette.js,
// zvolená sémanticky: tmavší = zastavěno, teplá = zpevněno, zelená = nezpevněno/propustné.
const CAT = {
  zastavena: { label: 'Zastavěná', color: '#475569' },
  zpevnena: { label: 'Zpevněná', color: '#D97706' },
  nezpevnena: { label: 'Nezpevněná', color: '#22C55E' },
};

const BalanceCompositionChart = ({ proposals }) => {
  const rows = proposals.map((p) => {
    const zastavena = safeNum(p.data?.bilance_zastavena) ?? 0;
    const zpevnena = safeNum(p.data?.bilance_zpevnena) ?? 0;
    const nezpevnena = safeNum(p.data?.bilance_nezpevnena) ?? 0;
    const total = zastavena + zpevnena + nezpevnena;
    return { id: p.id, nazev: p.nazev, zastavena, zpevnena, nezpevnena, total };
  });

  const hasAnyData = rows.some((r) => r.total > 0);

  if (!hasAnyData) {
    return (
      <div className="text-sm text-text-muted bg-bg-light border border-border rounded-lg p-4 text-center">
        Zatím žádný návrh nemá vyplněnou bilanci ploch (sekce A).
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-2">
        {rows.map((r) => (
          <div key={r.id} className="grid grid-cols-[7rem_1fr_5rem] sm:grid-cols-[9rem_1fr_5.5rem] items-center gap-3">
            <div className="text-sm font-semibold text-text-light truncate" title={r.nazev}>{r.nazev}</div>
            <div className="flex h-5 rounded-md overflow-hidden bg-bg-light">
              {r.total > 0 ? (
                <>
                  <div style={{ width: `${(r.zastavena / r.total) * 100}%`, background: CAT.zastavena.color }} title={`Zastavěná ${r.zastavena.toLocaleString('cs-CZ')} m²`} />
                  <div style={{ width: `${(r.zpevnena / r.total) * 100}%`, background: CAT.zpevnena.color }} title={`Zpevněná ${r.zpevnena.toLocaleString('cs-CZ')} m²`} />
                  <div style={{ width: `${(r.nezpevnena / r.total) * 100}%`, background: CAT.nezpevnena.color }} title={`Nezpevněná ${r.nezpevnena.toLocaleString('cs-CZ')} m²`} />
                </>
              ) : (
                <div className="w-full flex items-center justify-center text-[0.65rem] text-text-muted">bez dat</div>
              )}
            </div>
            <div className="font-mono text-xs text-text-muted text-right">{r.total > 0 ? `${r.total.toLocaleString('cs-CZ')} m²` : '—'}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-4 mt-4 pt-3 border-t border-border">
        {Object.values(CAT).map((c) => (
          <span key={c.label} className="flex items-center gap-1.5 text-xs text-text-light">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
};

export default BalanceCompositionChart;
