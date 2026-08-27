import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { floorsTotal, offerPriceTotal } from '../utils/balanceCalculations.js';

// Interaktivní heatmapa (CSS grid/table, žádná externí knihovna): řádky = návrhy, sloupce =
// ukazatele zahrnuté do skóre. Barva buňky = normalizovaná hodnota (0–100 %) v rámci daného
// ukazatele napříč porovnávanými návrhy – nejlepší návrh vždy 100 %, ostatní poměrem k němu
// (viz utils/balanceScore.js), ne pozice v rozsahu min–max.
// Reaguje živě na data (props se přepočítávají při každé změně směru/váhy/vstupů v rodiči)
// a navíc je interaktivní: hover zvýrazní řádek i sloupec a ukáže detail, klik na hlavičku
// sloupce řadí návrhy podle daného ukazatele.
const cellStyle = (normalized, isDimmed) => {
  if (normalized === null || normalized === undefined) {
    return { background: '#F1F5F9', color: '#64748B', opacity: isDimmed ? 0.5 : 1 }; // 4,8:1 na bílé (AA)
  }
  const alpha = 0.12 + (Math.max(0, Math.min(100, normalized)) / 100) * 0.75;
  return {
    background: `rgba(75, 179, 73, ${alpha})`,
    color: normalized > 55 ? '#064E3B' : '#334155',
    opacity: isDimmed ? 0.45 : 1,
  };
};

const fmtValue = (value, unit) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} ${unit}`;
};

// Kč/m² HPP – jen k zobrazení vedle skóre (kritérium c, ekonomická efektivita), NIKDY se
// nepočítá do weightedScore ani nepoužívá zelenou intenzitní škálu skóre – je to jiná osa.
const kcM2 = (proposal) => {
  const hpp = floorsTotal(proposal.data?.hpp);
  const cena = offerPriceTotal(proposal.data?.nabidkovaCena);
  return hpp && hpp > 0 && cena && cena > 0 ? Math.round(cena / hpp) : null;
};

/**
 * @param {Array} scoredProposals - výstup scoreProjects (má .nazev, .indicatorScores)
 * @param {Array} includedIndicators - SCORING_INDICATORS filtrované na ty se zvoleným směrem
 */
const ScoreHeatmap = ({ scoredProposals, includedIndicators }) => {
  const [hover, setHover] = useState(null); // { proposalId, indicatorId }
  const [sortBy, setSortBy] = useState(null); // indicatorId | null (= pořadí dle skóre)
  const [sortDir, setSortDir] = useState('desc');

  const rows = useMemo(() => {
    if (!sortBy) return scoredProposals;
    const withScore = scoredProposals.map((p) => ({
      p,
      v: p.indicatorScores.find((s) => s.id === sortBy)?.normalized ?? -1,
    }));
    withScore.sort((a, b) => (sortDir === 'asc' ? a.v - b.v : b.v - a.v));
    return withScore.map((x) => x.p);
  }, [scoredProposals, sortBy, sortDir]);

  if (includedIndicators.length === 0) {
    return (
      <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
        Nejdřív zvolte směr alespoň u jednoho ukazatele v panelu výše.
      </div>
    );
  }

  const toggleSort = (indicatorId) => {
    if (sortBy !== indicatorId) {
      setSortBy(indicatorId);
      setSortDir('desc');
    } else if (sortDir === 'desc') {
      setSortDir('asc');
    } else {
      setSortBy(null);
    }
  };

  const hoveredScore =
    hover &&
    scoredProposals.find((p) => p.id === hover.proposalId)?.indicatorScores.find((s) => s.id === hover.indicatorId);
  const hoveredIndicator = hover && includedIndicators.find((i) => i.id === hover.indicatorId);
  const hoveredProposal = hover && scoredProposals.find((p) => p.id === hover.proposalId);

  return (
    <div>
      {/* Živý detail najetí myší – ukazuje přesnou hodnotu i normalizaci, aktualizuje se okamžitě */}
      <div className="h-9 mb-2 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        {hover ? (
          <span className="text-slate-700">
            <strong className="text-slate-900">{hoveredProposal?.nazev}</strong> · {hoveredIndicator?.nazev}:{' '}
            <strong className="text-slate-900">{fmtValue(hoveredScore?.value, hoveredIndicator?.jednotka)}</strong>
            {hoveredScore && (
              <span className="text-slate-500"> (normalizováno {hoveredScore.normalized.toFixed(0)} %)</span>
            )}
          </span>
        ) : (
          <span className="text-slate-400">Najeďte myší na buňku pro detail · klikněte na sloupec pro seřazení</span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="border-collapse text-xs min-w-full" onMouseLeave={() => setHover(null)}>
          <thead>
            <tr>
              <th className="sticky left-0 bg-white px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200 z-10">
                Návrh
              </th>
              {includedIndicators.map((ind) => {
                const isSortCol = sortBy === ind.id;
                const isHoverCol = hover?.indicatorId === ind.id;
                return (
                  <th
                    key={ind.id}
                    onClick={() => toggleSort(ind.id)}
                    onMouseEnter={() => setHover((h) => (h ? { ...h, indicatorId: ind.id } : null))}
                    className={`px-2 py-2 text-center font-semibold border-b whitespace-nowrap cursor-pointer select-none transition-colors ${
                      isSortCol ? 'text-accent border-accent/40 bg-accent/10' : 'text-slate-600 border-slate-200'
                    } ${isHoverCol && !isSortCol ? 'bg-slate-50' : ''}`}
                    title={`${ind.nazev} – klikněte pro seřazení`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {ind.nazev.length > 16 ? `${ind.nazev.slice(0, 16)}…` : ind.nazev}
                      {isSortCol ? (
                        sortDir === 'desc' ? <ArrowDown size={11} /> : <ArrowUp size={11} />
                      ) : (
                        <ArrowUpDown size={11} className="opacity-30" />
                      )}
                    </span>
                  </th>
                );
              })}
              <th
                className="px-2 py-2 text-center font-semibold border-b border-slate-200 border-l-2 border-l-slate-300 whitespace-nowrap text-text-light"
                title="Kč/m² HPP – kritérium c) ekonomická efektivita, nepočítá se do skóre"
              >
                Cena (Kč/m²)
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((proposal) => {
              const isHoverRow = hover?.proposalId === proposal.id;
              return (
                <tr key={proposal.id} className={isHoverRow ? 'bg-slate-50/60' : ''}>
                  <td
                    onMouseEnter={() => setHover((h) => (h ? { ...h, proposalId: proposal.id } : { proposalId: proposal.id, indicatorId: includedIndicators[0].id }))}
                    className={`sticky left-0 px-3 py-2 font-medium border-b border-slate-100 whitespace-nowrap transition-colors ${
                      isHoverRow ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-800'
                    }`}
                  >
                    {proposal.nazev}
                  </td>
                  {includedIndicators.map((ind) => {
                    const score = proposal.indicatorScores.find((s) => s.id === ind.id);
                    const isThisHovered = hover?.proposalId === proposal.id && hover?.indicatorId === ind.id;
                    const isDimmed = hover && !isThisHovered && !isHoverRow && hover.indicatorId !== ind.id;
                    return (
                      <td
                        key={ind.id}
                        onMouseEnter={() => setHover({ proposalId: proposal.id, indicatorId: ind.id })}
                        className={`px-2 py-2 text-center border-b border-slate-100 tabular-nums transition-all cursor-default ${
                          isThisHovered ? 'ring-2 ring-accent ring-inset font-semibold' : ''
                        }`}
                        style={cellStyle(score?.normalized, isDimmed)}
                      >
                        {score ? fmtValue(score.value, ind.jednotka) : '—'}
                      </td>
                    );
                  })}
                  <td className="px-2 py-2 text-center border-b border-slate-100 border-l-2 border-l-slate-200 tabular-nums font-mono text-text-light">
                    {kcM2(proposal) !== null ? kcM2(proposal).toLocaleString('cs-CZ') : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* legenda barevné škály */}
      <div className="flex items-center gap-2 mt-3 text-[11px] text-slate-500">
        <span>Horší v rámci ukazatele</span>
        <div className="flex h-2.5 w-32 rounded-full overflow-hidden border border-slate-200">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} style={{ flex: 1, background: `rgba(75, 179, 73, ${0.12 + (i / 9) * 0.75})` }} />
          ))}
        </div>
        <span>Lepší v rámci ukazatele</span>
      </div>
    </div>
  );
};

export default ScoreHeatmap;
