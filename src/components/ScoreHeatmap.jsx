import React, { useMemo, useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { sectionNazev } from '../data/balanceSchema.js';

// Heatmapa pro porotu: na první pohled má jít vidět (1) kdo vede, (2) kde má návrh díru,
// (3) kdo je v daném ukazateli nejlepší. Barva kóduje relativní skóre (poměr k nejlepšímu),
// ne surovou hodnotu — tu ukáže hover a volitelný režim „naměřené“.
// Řádky = návrhy (defaultně seřazené podle váženého skóre), sloupce = ukazatele se směrem.

const fmtValue = (value, unit) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  const n = value.toLocaleString('cs-CZ', { maximumFractionDigits: 1 });
  return unit ? `${n} ${unit}` : n;
};

const fmtPct = (normalized) => {
  if (normalized === null || normalized === undefined || !Number.isFinite(normalized)) return '—';
  return `${Math.round(normalized)}`;
};

/** Diskrétní 4 pásma: červená = slabé, zelená = dobře (brand primary #4BB349). */
const TONE = {
  best: { background: '#4BB349', color: '#FFFFFF' },
  strong: { background: '#C6EBC5', color: '#14532D' },
  mid: { background: '#F1F5F9', color: '#334155' },
  weak: { background: '#FECACA', color: '#7F1D1D' },
  empty: { background: '#F1F5F9', color: '#64748B' },
};

const cellTone = (normalized, isBest) => {
  if (normalized === null || normalized === undefined || !Number.isFinite(normalized)) return TONE.empty;
  if (isBest) return TONE.best;
  if (normalized >= 85) return TONE.strong;
  if (normalized >= 70) return TONE.mid;
  return TONE.weak;
};

const ScoreHeatmap = ({ scoredProposals, includedIndicators }) => {
  const [hover, setHover] = useState(null);
  const [sortBy, setSortBy] = useState(null);
  const [sortDir, setSortDir] = useState('desc');
  const [showRaw, setShowRaw] = useState(false);

  const groups = useMemo(() => {
    const out = [];
    includedIndicators.forEach((ind) => {
      const last = out[out.length - 1];
      if (last && last.code === ind.sectionCode) last.items.push(ind);
      else out.push({ code: ind.sectionCode, items: [ind] });
    });
    return out;
  }, [includedIndicators]);

  const bestByIndicator = useMemo(() => {
    const map = {};
    includedIndicators.forEach((ind) => {
      let max = -Infinity;
      scoredProposals.forEach((p) => {
        const n = p.indicatorScores.find((s) => s.id === ind.id)?.normalized;
        if (Number.isFinite(n) && n > max) max = n;
      });
      map[ind.id] = Number.isFinite(max) ? max : null;
    });
    return map;
  }, [scoredProposals, includedIndicators]);

  const rankById = useMemo(() => {
    const map = {};
    scoredProposals.forEach((p, i) => {
      map[p.id] = i + 1;
    });
    return map;
  }, [scoredProposals]);

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
  const directionOf = (ind) =>
    scoredProposals.find((p) => p.indicatorScores.some((s) => s.id === ind.id))?.indicatorScores.find(
      (s) => s.id === ind.id
    )?.direction;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="h-9 min-w-0 flex-1 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          {hover ? (
            <span className="text-slate-700 truncate">
              <strong className="text-slate-900">{hoveredProposal?.nazev}</strong>
              {' · '}
              {hoveredIndicator?.nazev}:{' '}
              <strong className="text-slate-900">{fmtValue(hoveredScore?.value, hoveredIndicator?.jednotka)}</strong>
              {hoveredScore && Number.isFinite(hoveredScore.normalized) && (
                <span className="text-slate-500">
                  {' '}
                  · {Math.round(hoveredScore.normalized)} % z nejlepšího v tomto sloupci
                </span>
              )}
            </span>
          ) : (
            <span className="text-slate-400">
              Červená = slabé místo · zelená = nejlepší v ukazateli · klik na sloupec seřadí
            </span>
          )}
        </div>
        <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => setShowRaw(false)}
            className={`px-3 py-1.5 ${!showRaw ? 'bg-accent text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Relativní %
          </button>
          <button
            type="button"
            onClick={() => setShowRaw(true)}
            className={`px-3 py-1.5 border-l border-slate-200 ${showRaw ? 'bg-accent text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
          >
            Naměřené
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="border-collapse text-xs min-w-full" onMouseLeave={() => setHover(null)}>
          <thead>
            <tr>
              <th
                colSpan={2}
                className="sticky left-0 z-20 bg-white border-b border-slate-200"
                aria-hidden="true"
              />
              <th className="bg-slate-50 border-b border-l border-slate-200 w-16" aria-hidden="true" />
              {groups.map((g) => (
                <th
                  key={g.code}
                  colSpan={g.items.length}
                  className="px-1 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 border-b border-l border-slate-200"
                >
                  {sectionNazev(g.code)}
                </th>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 z-20 bg-white px-2 py-2 text-left font-semibold text-slate-500 border-b border-slate-200 w-8">
                #
              </th>
              <th className="sticky left-8 z-20 bg-white px-3 py-2 text-left font-semibold text-slate-600 border-b border-slate-200">
                Návrh
              </th>
              <th
                className="px-2 py-2 text-center font-semibold text-slate-700 border-b border-l border-slate-200 bg-slate-50 whitespace-nowrap"
                title="Vážený průměr normalizovaných ukazatelů"
              >
                Skóre
              </th>
              {includedIndicators.map((ind, idx) => {
                const isSortCol = sortBy === ind.id;
                const isHoverCol = hover?.indicatorId === ind.id;
                const dir = directionOf(ind);
                const newGroup = idx === 0 || includedIndicators[idx - 1].sectionCode !== ind.sectionCode;
                return (
                  <th
                    key={ind.id}
                    onClick={() => toggleSort(ind.id)}
                    className={`px-1.5 py-2 text-center font-semibold border-b cursor-pointer select-none max-w-[5.5rem] ${
                      newGroup ? 'border-l border-slate-200' : ''
                    } ${isSortCol ? 'text-accent border-accent/40 bg-accent/10' : 'text-slate-600 border-slate-200'} ${
                      isHoverCol && !isSortCol ? 'bg-slate-50' : ''
                    }`}
                    title={`${ind.nazev} (${ind.jednotka}) – klikněte pro seřazení`}
                  >
                    <span className="inline-flex flex-col items-center gap-0.5 leading-tight">
                      <span className="line-clamp-3 font-semibold">{ind.shortLabel || ind.nazev}</span>
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-normal text-slate-400">
                        {dir === 'higher' ? '↑ víc' : dir === 'lower' ? '↓ míň' : null}
                        {ind.jednotka}
                        {isSortCol ? (
                          sortDir === 'desc' ? (
                            <ArrowDown size={10} className="text-accent" />
                          ) : (
                            <ArrowUp size={10} className="text-accent" />
                          )
                        ) : (
                          <ArrowUpDown size={10} className="opacity-30" />
                        )}
                      </span>
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((proposal) => {
              const isHoverRow = hover?.proposalId === proposal.id;
              const rank = rankById[proposal.id];
              const score = proposal.weightedScore;
              return (
                <tr key={proposal.id}>
                  <td
                    className={`sticky left-0 z-10 px-2 py-2 text-center tabular-nums border-b border-slate-100 ${
                      isHoverRow ? 'bg-slate-100' : 'bg-white'
                    } ${rank === 1 ? 'font-bold text-primary' : 'text-slate-400'}`}
                  >
                    {rank}
                  </td>
                  <td
                    onMouseEnter={() =>
                      setHover({
                        proposalId: proposal.id,
                        indicatorId: includedIndicators[0].id,
                      })
                    }
                    className={`sticky left-8 z-10 px-3 py-2 font-medium border-b border-slate-100 whitespace-nowrap ${
                      isHoverRow ? 'bg-slate-100 text-slate-900' : 'bg-white text-slate-800'
                    }`}
                  >
                    {proposal.nazev}
                  </td>
                  <td className="px-2 py-2 text-center border-b border-l border-slate-100 bg-slate-50">
                    <div className="font-semibold tabular-nums text-slate-900">
                      {score === null || score === undefined ? '—' : score.toFixed(0)}
                    </div>
                    {Number.isFinite(score) && (
                      <div className="mt-0.5 h-1 w-full rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${Math.max(2, Math.min(100, score))}%` }}
                        />
                      </div>
                    )}
                  </td>
                  {includedIndicators.map((ind, idx) => {
                    const cell = proposal.indicatorScores.find((s) => s.id === ind.id);
                    const isThisHovered = hover?.proposalId === proposal.id && hover?.indicatorId === ind.id;
                    const isBest =
                      cell &&
                      Number.isFinite(cell.normalized) &&
                      bestByIndicator[ind.id] !== null &&
                      cell.normalized === bestByIndicator[ind.id];
                    const newGroup = idx === 0 || includedIndicators[idx - 1].sectionCode !== ind.sectionCode;
                    const tone = cellTone(cell?.normalized, isBest);
                    return (
                      <td
                        key={ind.id}
                        onMouseEnter={() => setHover({ proposalId: proposal.id, indicatorId: ind.id })}
                        className={`px-1.5 py-2 text-center border-b border-slate-100 tabular-nums ${
                          newGroup ? 'border-l border-slate-200' : ''
                        } ${isThisHovered ? 'ring-2 ring-accent ring-inset font-semibold' : ''}`}
                        style={tone}
                      >
                        {showRaw
                          ? cell
                            ? fmtValue(cell.value)
                            : '—'
                          : cell
                            ? fmtPct(cell.normalized)
                            : '—'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-sm" style={{ background: TONE.weak.background }} />
          Slabé (&lt; 70 % z nejlepšího)
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-sm bg-slate-100 border border-slate-200" />
          Střed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-sm" style={{ background: TONE.strong.background }} />
          Silné
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-3.5 h-3.5 rounded-sm bg-primary" />
          Nejlepší v ukazateli
        </span>
        <span className="text-slate-400">
          Číslo v buňce = {showRaw ? 'naměřená hodnota (jednotka v hlavičce)' : '% z nejlepšího návrhu v daném sloupci'}
        </span>
      </div>
    </div>
  );
};

export default ScoreHeatmap;
