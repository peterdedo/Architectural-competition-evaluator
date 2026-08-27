import React, { useState } from 'react';
import { Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { colorForIndex } from '../utils/chartPalette.js';

// Interaktivní radarový graf (inline SVG, žádná externí knihovna). Osy = ukazatele zahrnuté
// do skóre, jeden mnohoúhelník na návrh, hodnoty = normalizované skóre (0–100) daného
// ukazatele napříč porovnávanými návrhy. Reaguje živě na data (props se přepočítávají při
// každé změně směru/váhy/vstupů v rodiči) a navíc je interaktivní: klik na legendu skryje/
// zobrazí návrh, najetí myší na vrchol zvýrazní jeho hodnotu a zvýrazní celý polygon návrhu.
//
// Chybějící hodnota (návrh nemá vyplněný daný ukazatel) NENÍ totéž co skóre 0 % – scoreProject
// takový ukazatel do indicatorScores vůbec nezahrne (viz utils/balanceScore.js). Graf proto
// takové vrcholy kreslí odlišně (prázdný šedý bod, přerušovaná hrana), aby "chybí data"
// nevypadalo jako "nejhorší v soutěži".
const SIZE = 420;
const CENTER = SIZE / 2;
const RADIUS = 150;
const RINGS = [25, 50, 75, 100];

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

const DEFAULT_WEIGHT = 10; // musí sedět s DEFAULT_WEIGHT v utils/balanceScore.js

/**
 * @param {Array} scoredProposals - výstup scoreProjects
 * @param {Array} includedIndicators - SCORING_INDICATORS filtrované na ty se zvoleným směrem
 * @param {Object} weights - { [indicatorId]: number } ze ScoringSettingsPanel – NE odvozeno
 *   z indicatorScores, protože ty chybí pro ukazatele, které nemá vyplněný žádný srovnávaný návrh
 *   (váha je nastavení poroty, existuje nezávisle na tom, jestli k ní jsou zatím data).
 */
const ScoreRadar = ({ scoredProposals, includedIndicators, weights = {} }) => {
  const [hiddenIds, setHiddenIds] = useState(() => new Set());
  const [hoveredId, setHoveredId] = useState(null);
  const [hoveredVertex, setHoveredVertex] = useState(null); // { proposalId, indicatorId }

  const count = includedIndicators.length;

  if (count < 3) {
    return (
      <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
        Radarový graf potřebuje alespoň 3 zahrnuté ukazatele (nyní: {count}).
      </div>
    );
  }

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

  const verticesOf = (proposal) => includedIndicators.map((ind, i) => vertexOf(proposal, ind, i));

  const hoveredVertexScore =
    hoveredVertex &&
    scoredProposals
      .find((p) => p.id === hoveredVertex.proposalId)
      ?.indicatorScores.find((s) => s.id === hoveredVertex.indicatorId);
  const hoveredVertexIndicator = hoveredVertex && includedIndicators.find((i) => i.id === hoveredVertex.indicatorId);
  const hoveredVertexProposal = hoveredVertex && scoredProposals.find((p) => p.id === hoveredVertex.proposalId);
  const hoveredVertexHasData = Boolean(hoveredVertexScore);

  return (
    <div>
      {/* Živý detail najetí myší na vrchol */}
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
          <span className="text-slate-400">Najeďte na vrchol pro detail · klikněte v legendě pro skrytí/zobrazení návrhu</span>
        )}
      </div>

      {/* Trvalé vysvětlení – co graf ukazuje se nemá schovávat jen v hover tooltipu */}
      <p className="text-xs text-slate-500 mb-3">
        Vzdálenost od středu = normalizované skóre (0–100 %) v rámci porovnávaných návrhů, ne
        absolutní hodnota. Každá osa má stejné měřítko bez ohledu na váhu (v = váha u popisku) –
        velikost tvaru proto neodpovídá 1:1 celkovému skóre v legendě, to je vážený průměr.
        Přerušovaná hrana u konkrétní osy = návrh pro ni nemá vyplněná data (bod leží ve
        středu, ne že by tam měl nejhorší možnou hodnotu).
      </p>

      <div className="flex flex-col lg:flex-row items-center justify-center gap-10">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          overflow="visible"
          className="w-full max-w-2xl"
          role="img"
          aria-label="Radarový graf hodnocení návrhů"
        >
          {/* mřížka */}
          {RINGS.map((r) => (
            <polygon
              key={r}
              points={includedIndicators
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
          {/* osy + popisky (s váhou – jinak tvar zavádějícně vypadá jako by byly osy rovnocenné) */}
          {includedIndicators.map((ind, i) => {
            const outer = pointOnAxis(i, count, 1);
            const label = pointOnAxis(i, count, 1.16);
            const weight = weightOf(ind.id);
            const anchor = label.x > CENTER + 5 ? 'start' : label.x < CENTER - 5 ? 'end' : 'middle';
            return (
              <g key={ind.id}>
                <line x1={CENTER} y1={CENTER} x2={outer.x} y2={outer.y} stroke="#E2E8F0" strokeWidth={1} />
                <text x={label.x} y={label.y - 5} fontSize={10} fill="#475569" textAnchor={anchor} dominantBaseline="middle">
                  {ind.nazev.length > 14 ? `${ind.nazev.slice(0, 14)}…` : ind.nazev}
                </text>
                {Number.isFinite(weight) && (
                  <text x={label.x} y={label.y + 8} fontSize={9} fill="#64748B" textAnchor={anchor} dominantBaseline="middle">
                    v={weight}
                  </text>
                )}
              </g>
            );
          })}
          {/* polygony návrhů (skryté se nevykreslují) – jen výplň, obrys se kreslí zvlášť
              po hranách níže, aby šlo přesně vidět KTERÁ osa chybí (ne jen "něco chybí") */}
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
          {/* obrysy po jednotlivých hranách – hrana je přerušovaná, pokud JEDEN z jejích
              dvou vrcholů nemá data (jinak by celý mnohoúhelník vypadal "neúplně" i tam,
              kde ve skutečnosti data jsou). */}
          {visibleProposals.map((proposal) => {
            const idx = scoredProposals.findIndex((p) => p.id === proposal.id);
            const color = colorForIndex(idx);
            const isDimmed = hoveredId && hoveredId !== proposal.id;
            const vertices = verticesOf(proposal);
            return (
              <g key={proposal.id} onMouseEnter={() => setHoveredId(proposal.id)} onMouseLeave={() => setHoveredId(null)}>
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
          {/* vrcholy s hover detailem – bez dat = prázdný šedý bod, ne plná barva */}
          {visibleProposals.map((proposal) => {
            const idx = scoredProposals.findIndex((p) => p.id === proposal.id);
            const color = colorForIndex(idx);
            return includedIndicators.map((ind, i) => {
              const { x, y, score } = vertexOf(proposal, ind, i);
              const isHovered = hoveredVertex?.proposalId === proposal.id && hoveredVertex?.indicatorId === ind.id;
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
                  }}
                  onMouseLeave={() => {
                    setHoveredVertex(null);
                    setHoveredId(null);
                  }}
                />
              );
            });
          })}
        </svg>

        <div className="flex flex-col gap-1 text-sm">
          {scoredProposals.map((proposal, idx) => {
            const isHidden = hiddenIds.has(proposal.id);
            const isIncomplete = proposal.scoredIndicatorCount < count;
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
                <span className="text-slate-700 flex-1">{proposal.nazev}</span>
                {isIncomplete && (
                  <span
                    className="inline-flex items-center gap-0.5 text-amber-600"
                    title={`Neúplná data – ${proposal.scoredIndicatorCount}/${count} zahrnutých ukazatelů má hodnotu`}
                  >
                    <AlertTriangle size={11} />
                    <span className="text-[10px] tabular-nums">{proposal.scoredIndicatorCount}/{count}</span>
                  </span>
                )}
                <span className="text-slate-400 tabular-nums text-xs">
                  {proposal.weightedScore === null ? '—' : `${proposal.weightedScore.toFixed(0)} b.`}
                </span>
                {isHidden ? <EyeOff size={13} className="text-slate-400" /> : <Eye size={13} className="text-slate-400" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ScoreRadar;
