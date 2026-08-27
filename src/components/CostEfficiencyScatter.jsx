import React from 'react';
import { floorsTotal, offerPriceTotal } from '../utils/balanceCalculations.js';
import { colorForIndex } from '../utils/chartPalette.js';

// Cenová efektivita: HPP celkem × nabídková cena celkem. Přímo kritérium c) soutěžních
// podmínek ("ekonomická efektivita návrhu") – žádné vážení, jen dva už sesbírané údaje
// vynesené proti sobě. Tečkované čáry jsou vodítka konstantní Kč/m² HPP.
const W = 480, H = 320, M = { l: 60, r: 20, t: 16, b: 40 };
const PLOT_W = W - M.l - M.r, PLOT_H = H - M.t - M.b;
const ISO_RATES = [550, 650, 750];

const fmtM2 = (v) => v.toLocaleString('cs-CZ');
const fmtMil = (v) => `${(v / 1000000).toFixed(1)} mil.`;

const CostEfficiencyScatter = ({ proposals }) => {
  const points = proposals
    .map((p, idx) => {
      const hpp = floorsTotal(p.data?.hpp);
      const cena = offerPriceTotal(p.data?.nabidkovaCena);
      return { id: p.id, nazev: p.nazev, hpp, cena, color: colorForIndex(idx) };
    })
    .filter((p) => p.hpp !== null && p.hpp > 0 && p.cena !== null && p.cena > 0);

  if (points.length < 2) {
    return (
      <div className="text-sm text-text-muted bg-bg-light border border-border rounded-lg p-4 text-center">
        Potřeba alespoň 2 návrhy s vyplněnou HPP (E) i nabídkovou cenou (P06) — zatím: {points.length}.
      </div>
    );
  }

  const hppVals = points.map((p) => p.hpp);
  const cenaVals = points.map((p) => p.cena);
  const hppPad = Math.max(200, (Math.max(...hppVals) - Math.min(...hppVals)) * 0.15);
  const cenaPad = Math.max(50000, (Math.max(...cenaVals) - Math.min(...cenaVals)) * 0.2);
  const hppMin = Math.max(0, Math.min(...hppVals) - hppPad);
  const hppMax = Math.max(...hppVals) + hppPad;
  const cenaMin = Math.max(0, Math.min(...cenaVals) - cenaPad);
  const cenaMax = Math.max(...cenaVals) + cenaPad;

  const xPix = (hpp) => M.l + ((hpp - hppMin) / (hppMax - hppMin)) * PLOT_W;
  const yPix = (cena) => M.t + PLOT_H - ((cena - cenaMin) / (cenaMax - cenaMin)) * PLOT_H;
  const clampY = (v) => Math.max(cenaMin, Math.min(cenaMax, v));

  const xTicks = Array.from(new Set([hppMin, (hppMin + hppMax) / 2, hppMax].map((v) => Math.round(v / 100) * 100)));
  const yTicks = Array.from(new Set([cenaMin, (cenaMin + cenaMax) / 2, cenaMax].map((v) => Math.round(v / 50000) * 50000)));

  const sortedByRate = [...points].sort((a, b) => a.cena / a.hpp - b.cena / b.hpp);

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full max-w-3xl" role="img" aria-label="Graf cenové efektivity: HPP vůči nabídkové ceně">
        <line x1={M.l} y1={M.t} x2={M.l} y2={M.t + PLOT_H} className="stroke-border" strokeWidth={1} />
        <line x1={M.l} y1={M.t + PLOT_H} x2={M.l + PLOT_W} y2={M.t + PLOT_H} className="stroke-border" strokeWidth={1} />

        <text x={M.l + PLOT_W / 2} y={H - 4} textAnchor="middle" className="fill-text-muted" fontSize="11">HPP celkem (m²) →</text>
        <text x={12} y={M.t + PLOT_H / 2} textAnchor="middle" transform={`rotate(-90 12 ${M.t + PLOT_H / 2})`} className="fill-text-muted" fontSize="11">Nabídková cena →</text>

        {xTicks.map((v) => (
          <text key={v} x={xPix(v)} y={M.t + PLOT_H + 16} textAnchor="middle" className="fill-text-muted" fontSize="10">{fmtM2(v)}</text>
        ))}
        {yTicks.map((v) => (
          <text key={v} x={M.l - 8} y={yPix(v) + 3} textAnchor="end" className="fill-text-muted" fontSize="10">{fmtMil(v)}</text>
        ))}

        {ISO_RATES.map((rate) => {
          const y1 = clampY(rate * hppMin);
          const y2 = clampY(rate * hppMax);
          return (
            <line key={rate} x1={xPix(hppMin)} y1={yPix(y1)} x2={xPix(hppMax)} y2={yPix(y2)} className="stroke-border" strokeWidth={1} strokeDasharray="3 4" />
          );
        })}

        {points.map((p) => {
          const cx = xPix(p.hpp), cy = yPix(p.cena);
          return (
            <g key={p.id}>
              <circle cx={cx} cy={cy} r={6} fill={p.color} className="stroke-surface" strokeWidth={2} />
              <text x={cx + 9} y={cy - 8} className="fill-text-light font-mono" fontSize="10.5" fontWeight={500}>{p.nazev}</text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-col gap-1.5 min-w-[11rem]">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-1">Kč/m² HPP (od nejnižší)</div>
        {sortedByRate.map((p) => (
          <div key={p.id} className="flex items-baseline gap-2 text-sm">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
            <span className="font-semibold text-text-light truncate">{p.nazev}</span>
            <span className="font-mono text-xs text-text-muted ml-auto">{Math.round(p.cena / p.hpp).toLocaleString('cs-CZ')}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostEfficiencyScatter;
