import React, { useMemo, useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { colorForIndex } from '../utils/chartPalette.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { sectionNazev } from '../data/balanceSchema.js';

// Radar: osy = ukazatele se směrem. Výchozí sada je 8 s největším rozptylem mezi návrhy
// (čitelný tvar); porota si osy přidá/odebere. Při > 6 osách jsou na paprsku jen čísla,
// názvy jsou v seznamu vedle — jinak se popisky překrývají.

const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 138;
const VIEW_PAD = 56;
const RINGS = [25, 50, 75, 100];
const DEFAULT_AXIS_COUNT = 8;
const MIN_AXES = 3;

const axisLabel = (ind) => ind.shortLabel || ind.nazev;

const pointOnAxis = (index, count, fraction) => {
  const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count;
  return {
    x: CENTER + Math.cos(angle) * RADIUS * fraction,
    y: CENTER + Math.sin(angle) * RADIUS * fraction,
  };
};

const fmtValue = (value, unit) => {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${value.toLocaleString('cs-CZ', { maximumFractionDigits: 1 })} ${unit}`;
};

const DEFAULT_WEIGHT = 10;

const spreadOf = (ind, scoredProposals) => {
  const values = scoredProposals
    .map((p) => p.indicatorScores.find((s) => s.id === ind.id)?.normalized)
    .filter((v) => Number.isFinite(v));
  return values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
};

const defaultAxisIds = (indicators, scoredProposals) => {
  if (indicators.length <= DEFAULT_AXIS_COUNT) return indicators.map((i) => i.id);
  return [...indicators]
    .sort((a, b) => spreadOf(b, scoredProposals) - spreadOf(a, scoredProposals))
    .slice(0, DEFAULT_AXIS_COUNT)
    .map((i) => i.id);
};

const ScoreRadar = ({ scoredProposals, includedIndicators, weights = {} }) => {
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredVertex, setHoveredVertex] = useState(null);
  const [hoveredAxisId, setHoveredAxisId] = useState(null);
  const [storedAxisIds, setStoredAxisIds] = useLocalStorage('archieval-radar-axes', null);

  const fallbackIds = useMemo(
    () => defaultAxisIds(includedIndicators, scoredProposals),
    [includedIndicators, scoredProposals]
  );

  const selectedIds = useMemo(() => {
    const valid = new Set(includedIndicators.map((i) => i.id));
    const fromStore = Array.isArray(storedAxisIds) ? storedAxisIds.filter((id) => valid.has(id)) : [];
    return fromStore.length >= MIN_AXES ? fromStore : fallbackIds;
  }, [storedAxisIds, includedIndicators, fallbackIds]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const axes = useMemo(
    () => includedIndicators.filter((ind) => selectedSet.has(ind.id)),
    [includedIndicators, selectedSet]
  );

  const axisIndex = useMemo(() => {
    const map = new Map();
    axes.forEach((ind, i) => map.set(ind.id, i + 1));
    return map;
  }, [axes]);

  const groups = useMemo(() => {
    const out = [];
    includedIndicators.forEach((ind) => {
      const last = out[out.length - 1];
      if (last && last.code === ind.sectionCode) last.items.push(ind);
      else out.push({ code: ind.sectionCode, items: [ind] });
    });
    return out;
  }, [includedIndicators]);

  const count = axes.length;
  const numberOnlyLabels = count > 6;

  const commitAxes = (ids) => {
    const valid = new Set(includedIndicators.map((i) => i.id));
    setStoredAxisIds(includedIndicators.map((i) => i.id).filter((id) => ids.includes(id) && valid.has(id)));
  };

  const toggleAxis = (id) => {
    if (selectedSet.has(id)) {
      if (selectedIds.length <= MIN_AXES) return;
      commitAxes(selectedIds.filter((x) => x !== id));
    } else {
      commitAxes([...selectedIds, id]);
    }
  };

  const resetAxes = () => setStoredAxisIds(null);

  const toggleVisibility = (id) => {
    setHiddenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const visibleProposals = scoredProposals.filter((p) => !hiddenIds.has(p.id));
  const weightOf = (indId) => (Number.isFinite(weights[indId]) ? weights[indId] : DEFAULT_WEIGHT);

  const vertexOf = (proposal, ind, i) => {
    const score = proposal.indicatorScores.find((s) => s.id === ind.id);
    const fraction = score ? score.normalized / 100 : 0;
    return { ...pointOnAxis(i, count, fraction), score };
  };

  const verticesOf = (proposal) => axes.map((ind, i) => vertexOf(proposal, ind, i));

  const hoveredVertexScore =
    hoveredVertex &&
    scoredProposals
      .find((p) => p.id === hoveredVertex.proposalId)
      ?.indicatorScores.find((s) => s.id === hoveredVertex.indicatorId);
  const hoveredVertexIndicator = hoveredVertex && axes.find((i) => i.id === hoveredVertex.indicatorId);
  const hoveredVertexProposal = hoveredVertex && scoredProposals.find((p) => p.id === hoveredVertex.proposalId);
  const hoveredVertexHasData = Boolean(hoveredVertexScore);

  const usingDefault =
    !Array.isArray(storedAxisIds) ||
    storedAxisIds.filter((id) => includedIndicators.some((i) => i.id === id)).length < MIN_AXES;

  return (
    <div>
      <div className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Osy grafu ({count} z {includedIndicators.length})
          </p>
          <div className="flex items-center gap-2">
            {!usingDefault && (
              <button type="button" onClick={resetAxes} className="text-xs font-medium text-accent hover:underline">
                Výchozí ({Math.min(DEFAULT_AXIS_COUNT, includedIndicators.length)} s největším rozptylem)
              </button>
            )}
            {count < includedIndicators.length && (
              <button
                type="button"
                onClick={() => commitAxes(includedIndicators.map((i) => i.id))}
                className="text-xs font-medium text-slate-600 hover:underline"
              >
                Zobrazit všechny
              </button>
            )}
          </div>
        </div>
        <div className="space-y-2">
          {groups.map((g) => (
            <div key={g.code} className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 min-w-[7.5rem] shrink-0">
                {sectionNazev(g.code)}
              </span>
              {g.items.map((ind) => {
                const on = selectedSet.has(ind.id);
                const n = axisIndex.get(ind.id);
                return (
                  <button
                    key={ind.id}
                    type="button"
                    onClick={() => toggleAxis(ind.id)}
                    onMouseEnter={() => on && setHoveredAxisId(ind.id)}
                    onMouseLeave={() => setHoveredAxisId(null)}
                    disabled={on && count <= MIN_AXES}
                    title={ind.nazev}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium transition-colors ${
                      on
                        ? 'border-accent bg-accent/10 text-accent'
                        : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                    } disabled:opacity-50`}
                  >
                    {on && <span className="tabular-nums text-[10px] font-bold">{n}</span>}
                    {axisLabel(ind)}
                    <span className="text-[10px] text-slate-400 font-normal">v={weightOf(ind.id)}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="h-9 mb-2 flex items-center px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
        {hoveredVertex ? (
          <span className="text-slate-700">
            <strong className="text-slate-900">{hoveredVertexProposal?.nazev}</strong> · {hoveredVertexIndicator?.nazev}:{' '}
            {hoveredVertexHasData ? (
              <>
                <strong className="text-slate-900">{fmtValue(hoveredVertexScore.value, hoveredVertexIndicator?.jednotka)}</strong>
                <span className="text-slate-500"> (normalizováno {hoveredVertexScore.normalized.toFixed(0)} %)</span>
              </>
            ) : (
              <strong className="text-slate-400">bez dat – nepočítá se do skóre</strong>
            )}
          </span>
        ) : (
          <span className="text-slate-400">
            Kliknutím na štítek zapnete osu. Najeďte na vrchol pro hodnotu · v legendě skryjete návrh.
          </span>
        )}
      </div>

      <p className="text-xs text-slate-500 mb-3">
        Vzdálenost od středu = normalizované skóre (0–100 %) v rámci porovnávaných návrhů.
        Váha (v) ovlivňuje celkové body v legendě, ne délku paprsku. Přerušovaná hrana = chybí
        data (bod ve středu není „nejhorší výsledek“).
      </p>

      {count < MIN_AXES ? (
        <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
          Radarový graf potřebuje alespoň {MIN_AXES} osy (nyní: {count}). Přidejte ukazatele výše.
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row items-start justify-center gap-8">
          <div className="w-full max-w-lg mx-auto lg:mx-0 overflow-hidden shrink min-w-0">
            <svg
              viewBox={`${-VIEW_PAD} ${-VIEW_PAD} ${SIZE + VIEW_PAD * 2} ${SIZE + VIEW_PAD * 2}`}
              className="w-full h-auto overflow-hidden"
              role="img"
              aria-label="Radarový graf hodnocení návrhů"
            >
              {RINGS.map((r) => (
                <polygon
                  key={r}
                  points={axes
                    .map((_, i) => {
                      const { x, y } = pointOnAxis(i, count, r / 100);
                      return `${x},${y}`;
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
              ))}
              {axes.map((ind, i) => {
                const outer = pointOnAxis(i, count, 1);
                const label = pointOnAxis(i, count, numberOnlyLabels ? 1.14 : 1.22);
                const anchor = label.x > CENTER + 5 ? 'start' : label.x < CENTER - 5 ? 'end' : 'middle';
                const active = hoveredAxisId === ind.id;
                return (
                  <g key={ind.id}>
                    <line
                      x1={CENTER}
                      y1={CENTER}
                      x2={outer.x}
                      y2={outer.y}
                      stroke={active ? '#0066A4' : '#E2E8F0'}
                      strokeWidth={active ? 2 : 1}
                    />
                    <text
                      x={label.x}
                      y={label.y}
                      fontSize={numberOnlyLabels ? 12 : 10}
                      fontWeight={numberOnlyLabels ? 700 : 500}
                      fill={active ? '#0066A4' : '#475569'}
                      textAnchor={anchor}
                      dominantBaseline="middle"
                    >
                      <title>{ind.nazev}</title>
                      {numberOnlyLabels ? String(i + 1) : axisLabel(ind)}
                    </text>
                  </g>
                );
              })}
              {visibleProposals.map((proposal) => {
                const idx = scoredProposals.findIndex((p) => p.id === proposal.id);
                const color = colorForIndex(idx);
                const isDimmed = hoveredId && hoveredId !== proposal.id;
                const vertices = verticesOf(proposal);
                return (
                  <polygon
                    key={proposal.id}
                    points={vertices.map(({ x, y }) => `${x},${y}`).join(' ')}
                    fill={color}
                    fillOpacity={hoveredId === proposal.id ? 0.28 : isDimmed ? 0.05 : 0.14}
                    stroke="none"
                    style={{ transition: 'fill-opacity 0.15s' }}
                    onMouseEnter={() => setHoveredId(proposal.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  />
                );
              })}
              {visibleProposals.map((proposal) => {
                const idx = scoredProposals.findIndex((p) => p.id === proposal.id);
                const color = colorForIndex(idx);
                const isDimmed = hoveredId && hoveredId !== proposal.id;
                const vertices = verticesOf(proposal);
                return (
                  <g
                    key={proposal.id}
                    onMouseEnter={() => setHoveredId(proposal.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {vertices.map((v, i) => {
                      const next = vertices[(i + 1) % count];
                      const edgeMissing = !v.score || !next.score;
                      return (
                        <line
                          key={i}
                          x1={v.x}
                          y1={v.y}
                          x2={next.x}
                          y2={next.y}
                          stroke={color}
                          strokeWidth={hoveredId === proposal.id ? 3 : 2}
                          strokeOpacity={isDimmed ? 0.25 : 1}
                          strokeDasharray={edgeMissing ? '5 4' : undefined}
                          style={{ transition: 'stroke-width 0.15s, stroke-opacity 0.15s' }}
                        />
                      );
                    })}
                  </g>
                );
              })}
              {visibleProposals.map((proposal) => {
                const idx = scoredProposals.findIndex((p) => p.id === proposal.id);
                const color = colorForIndex(idx);
                return axes.map((ind, i) => {
                  const { x, y, score } = vertexOf(proposal, ind, i);
                  const isHovered =
                    hoveredVertex?.proposalId === proposal.id && hoveredVertex?.indicatorId === ind.id;
                  const hasData = Boolean(score);
                  return (
                    <circle
                      key={`${proposal.id}-${ind.id}`}
                      cx={x}
                      cy={y}
                      r={isHovered ? 5.5 : hasData ? 3 : 3.5}
                      fill={hasData ? color : '#fff'}
                      stroke={hasData ? '#fff' : '#64748B'}
                      strokeWidth={hasData ? 1 : 1.5}
                      strokeDasharray={hasData ? undefined : '1.5 1.5'}
                      style={{ cursor: 'pointer', transition: 'r 0.1s' }}
                      onMouseEnter={() => {
                        setHoveredVertex({ proposalId: proposal.id, indicatorId: ind.id });
                        setHoveredId(proposal.id);
                        setHoveredAxisId(ind.id);
                      }}
                      onMouseLeave={() => {
                        setHoveredVertex(null);
                        setHoveredId(null);
                        setHoveredAxisId(null);
                      }}
                    />
                  );
                });
              })}
            </svg>
          </div>

          <div className="flex flex-col gap-1 text-sm w-full lg:w-72 shrink-0 relative z-10 bg-white min-w-0">
            {scoredProposals.map((proposal, idx) => {
              const isHidden = hiddenIds.has(proposal.id);
              const scoredOnAxes = axes.filter((ind) =>
                proposal.indicatorScores.some((s) => s.id === ind.id)
              ).length;
              const isIncomplete = scoredOnAxes < count;
              return (
                <button
                  key={proposal.id}
                  type="button"
                  onClick={() => toggleVisibility(proposal.id)}
                  onMouseEnter={() => !isHidden && setHoveredId(proposal.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  className={`flex items-center gap-2 px-2 py-1 rounded-lg text-left transition-colors ${
                    hoveredId === proposal.id ? 'bg-slate-100' : 'hover:bg-slate-50'
                  } ${isHidden ? 'opacity-40' : ''}`}
                  title={isHidden ? 'Zobrazit v grafu' : 'Skrýt z grafu'}
                >
                  <span
                    className="w-3 h-3 rounded-sm flex-shrink-0"
                    style={{ background: colorForIndex(idx) }}
                    aria-hidden
                  />
                  <span className="text-slate-700 flex-1 min-w-0 truncate" title={proposal.nazev}>
                    {proposal.nazev}
                  </span>
                  {isIncomplete && (
                    <span
                      className="inline-flex items-center gap-0.5 text-amber-600"
                      title={`Neúplná data – ${scoredOnAxes}/${count} os má hodnotu`}
                    >
                      <AlertTriangle size={11} />
                      <span className="text-[10px] tabular-nums">
                        {scoredOnAxes}/{count}
                      </span>
                    </span>
                  )}
                  <span className="text-slate-400 tabular-nums text-xs">
                    {proposal.weightedScore === null ? '—' : `${proposal.weightedScore.toFixed(0)} b.`}
                  </span>
                  {isHidden ? (
                    <EyeOff size={13} className="text-slate-400 shrink-0" />
                  ) : (
                    <Eye size={13} className="text-slate-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreRadar;
