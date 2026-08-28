import React from 'react';
import { floorsTotal, offerPriceTotal } from '../utils/balanceCalculations.js';
import { colorForIndex } from '../utils/chartPalette.js';

// Cenová efektivita: HPP celkem × nabídková cena celkem. Přímo kritérium c) soutěžních
// podmínek ("ekonomická efektivita návrhu") – žádné vážení, jen dva už sesbírané údaje
// vynesené proti sobě. Vodítka konstantní Kč/m² se odvozují z dat (nejnižší/medián/nejvyšší
// pozorovaná sazba), body jsou přímo označené a nejnižší Kč/m² je zvýrazněné jako orientační
// extrém (ne hodnotový soud – ekonomickou váhu posuzuje porota).
const W = 500, H = 320, M = { l: 62, r: 64, t: 16, b: 40 };
const PLOT_W = W - M.l - M.r, PLOT_H = H - M.t - M.b;

const fmtM2 = (v) => v.toLocaleString('cs-CZ');
const fmtMil = (v) => `${(v / 1000000).toFixed(1)} mil.`;

// Krátký štítek bodu: "Návrh A – …" → "A"; jinak iniciály/prvních pár znaků.
const shortTag = (nazev, idx) => {
  const m = /N[áa]vrh\s+([^\s–-]+)/i.exec(nazev || '');
  if (m) return m[1];
  const t = (nazev || '').trim();
  return t ? t.slice(0, 2) : String.fromCharCode(65 + idx);
};

const median = (arr) => {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const CostEfficiencyScatter = ({ proposals }) => {
  const points = proposals
    .map((p, idx) => {
      const hpp = floorsTotal(p.data?.hpp);
      const cena = offerPriceTotal(p.data?.nabidkovaCena);
      return { id: p.id, nazev: p.nazev, hpp, cena, tag: shortTag(p.nazev, idx), color: colorForIndex(idx) };
    })
    .filter((p) => p.hpp !== null && p.hpp > 0 && p.cena !== null && p.cena > 0)
    .map((p) => ({ ...p, rate: p.cena / p.hpp }));

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

  // Vodítka Kč/m² odvozená z dat: nejnižší, medián, nejvyšší pozorovaná sazba.
  const rates = points.map((p) => p.rate);
  const isoRates = Array.from(new Set([Math.min(...rates), median(rates), Math.max(...rates)].map((r) => Math.round(r))));

  const sortedByRate = [...points].sort((a, b) => a.rate - b.rate);
  const bestId = sortedByRate[0].id;
  const rateMin = Math.min(...rates), rateMax = Math.max(...rates);

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

        {/* Vodítka konstantní Kč/m² odvozená z dat, popsaná sazbou u pravého okraje. */}
        {isoRates.map((rate) => {
          const y1 = clampY(rate * hppMin);
          const y2 = clampY(rate * hppMax);
          return (
            <g key={rate}>
              <line x1={xPix(hppMin)} y1={yPix(y1)} x2={xPix(hppMax)} y2={yPix(y2)} className="stroke-border" strokeWidth={1} strokeDasharray="3 4" />
              <text x={xPix(hppMax) + 4} y={yPix(y2) + 3} className="fill-text-muted" fontSize="9">{rate.toLocaleString('cs-CZ')} Kč/m²</text>
            </g>
          );
        })}

        {points.map((p) => {
          const cx = xPix(p.hpp), cy = yPix(p.cena);
          const isBest = p.id === bestId;
          return (
            <g key={p.id}>
              <title>{`${p.nazev} — ${Math.round(p.rate).toLocaleString('cs-CZ')} Kč/m² HPP`}</title>
              {isBest && <circle cx={cx} cy={cy} r={10} fill="none" className="stroke-primary" strokeWidth={1.5} />}
              <circle cx={cx} cy={cy} r={6} fill={p.color} className="stroke-surface" strokeWidth={2} />
              <text x={cx + 10} y={cy + 3} fontSize="10" fontWeight="600" fill={p.color}>{p.tag}</text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-col gap-2 min-w-[13rem]">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wide">Kč/m² HPP (od nejnižší)</div>
        {sortedByRate.map((p) => {
          const rate = Math.round(p.rate);
          const barPct = rateMax > rateMin ? ((p.rate - rateMin) / (rateMax - rateMin)) * 100 : 0;
          const isBest = p.id === bestId;
          return (
            <div key={p.id} className="text-sm">
              <div className="flex items-baseline gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="font-semibold text-text-light truncate">{p.nazev}</span>
                {isBest && <span className="text-[0.6rem] font-semibold text-primary bg-primary/10 rounded px-1 shrink-0">nejnižší</span>}
                <span className="font-mono text-xs text-text-muted ml-auto tabular-nums">{rate.toLocaleString('cs-CZ')}</span>
              </div>
              <div className="h-1.5 rounded-full bg-bg-light overflow-hidden mt-1 ml-4">
                <div className="h-full rounded-full" style={{ width: `${Math.max(4, barPct)}%`, background: p.color }} />
              </div>
            </div>
          );
        })}
        <p className="text-[0.65rem] text-text-muted mt-1">
          Kratší pruh = nižší cena za m² HPP. Ekonomickou váhu posuzuje porota.
        </p>
      </div>
    </div>
  );
};

export default CostEfficiencyScatter;
