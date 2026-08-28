import React from 'react';
import { safeNum } from '../utils/balanceCalculations.js';
import { colorForIndex } from '../utils/chartPalette.js';

// Podlažní profil jako ARCHITEKTONICKÝ ŘEZ: patra každého návrhu stojí na společné úrovni terénu
// (podzemní pod ní), šířka pruhu ∝ HPP patra na jednom sdíleném měřítku napříč všemi návrhy.
// Návrh se tak čte jako silueta hmoty – porota na první pohled srovná výšku, objem i to, kolik
// provozu jde pod terén. Patra jsou zarovnaná na společnou terénní linku, aby stejné úrovně
// ležely ve stejné výšce vedle sebe.

const shortFloorLabel = (label) => {
  if (!label) return '';
  const npMatch = label.match(/(\d+)\.\s*NP/i);
  if (npMatch) return `${npMatch[1]}. NP`;
  const ppMatch = label.match(/(\d+)\.\s*PP/i);
  if (ppMatch) return `${ppMatch[1]}. PP`;
  if (/podzemní|podzem/i.test(label)) return 'PP';
  return label;
};

const isBelowGrade = (label) => /podzem|\bPP\b|\d+\.\s*PP/i.test(label || '');

const ROW_H = 20; // px na jedno podlaží
const ROW_GAP = 3;
const MAX_BAR_W = 132; // px – nejširší patro (nejvyšší HPP) napříč všemi návrhy

const FloorProfileChart = ({ proposals }) => {
  const items = proposals
    .map((p, idx) => {
      const floors = Array.isArray(p.data?.hpp?.floors) ? p.data.hpp.floors : [];
      const parsed = floors
        .map((f) => ({ label: f.label, value: safeNum(f.value), below: isBelowGrade(f.label) }))
        .filter((f) => f.value !== null && f.value > 0);
      const above = parsed.filter((f) => !f.below); // pořadí vstupu: 1.NP … výš
      const below = parsed.filter((f) => f.below); // 1.PP … hlouběji
      const total = parsed.reduce((sum, f) => sum + f.value, 0);
      const totalAbove = above.reduce((sum, f) => sum + f.value, 0);
      const totalBelow = below.reduce((sum, f) => sum + f.value, 0);
      return { id: p.id, nazev: p.nazev, above, below, total, totalAbove, totalBelow, color: colorForIndex(idx) };
    })
    .filter((p) => p.total > 0);

  if (items.length === 0) {
    return (
      <div className="text-sm text-text-muted bg-bg-light border border-border rounded-lg p-4 text-center">
        Zatím žádný návrh nemá vyplněná podlaží (sekce E — Hrubá podlažní plocha).
      </div>
    );
  }

  // Sdílené měřítko: nejvyšší HPP jednoho patra napříč vším → nejširší pruh.
  const maxFloorVal = Math.max(1, ...items.flatMap((p) => [...p.above, ...p.below].map((f) => f.value)));
  // Zarovnání terénních linek: každá karta dostane stejný počet nadzemních i podzemních řad.
  const maxAbove = Math.max(1, ...items.map((p) => p.above.length));
  const maxBelow = Math.max(0, ...items.map((p) => p.below.length));

  const barW = (v) => Math.max(6, (v / maxFloorVal) * MAX_BAR_W);

  const FloorBar = ({ f, color, dim }) => (
    <div className="flex items-center justify-center gap-2" style={{ height: ROW_H }} title={`${f.label}: ${f.value.toLocaleString('cs-CZ')} m²`}>
      <span className="font-mono text-[0.6rem] text-text-muted w-9 text-right shrink-0">{shortFloorLabel(f.label)}</span>
      <div className="rounded-sm shrink-0" style={{ width: barW(f.value), height: ROW_H - 6, background: color, opacity: dim ? 0.55 : 1 }} />
      <span className="font-mono text-[0.6rem] text-text-muted w-12 text-left shrink-0 tabular-nums">{f.value.toLocaleString('cs-CZ')}</span>
    </div>
  );

  const EmptyRow = () => <div style={{ height: ROW_H }} />;

  return (
    <div>
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))' }}>
        {items.map((p) => {
          const abovePad = maxAbove - p.above.length;
          const belowPad = maxBelow - p.below.length;
          const aboveTopDown = [...p.above].reverse(); // nejvyšší patro nahoře
          return (
            <div key={p.id} className="min-w-0 rounded-xl border border-border p-3">
              <div className="text-xs font-semibold text-text-light leading-snug line-clamp-2 min-h-[2.25rem] mb-2 text-center" title={p.nazev}>
                {p.nazev}
              </div>

              <div className="flex flex-col" style={{ gap: ROW_GAP }}>
                {Array.from({ length: abovePad }).map((_, i) => <EmptyRow key={`ap${i}`} />)}
                {aboveTopDown.map((f, i) => <FloorBar key={`a${i}`} f={f} color={p.color} />)}
              </div>

              {/* Terénní linka – společná úroveň pro všechny návrhy */}
              <div className="relative my-1">
                <div className="border-t-2 border-text-light/60" />
                <span className="absolute right-0 -top-2 text-[0.55rem] text-text-muted bg-surface px-1">±0,000</span>
              </div>

              <div className="flex flex-col" style={{ gap: ROW_GAP }}>
                {p.below.map((f, i) => <FloorBar key={`b${i}`} f={f} color={p.color} dim />)}
                {Array.from({ length: belowPad }).map((_, i) => <EmptyRow key={`bp${i}`} />)}
              </div>

              <div className="mt-2 pt-2 border-t border-border text-center space-y-0.5">
                <div className="font-mono text-xs text-text-light">
                  HPP <span className="font-semibold text-text-dark">{p.total.toLocaleString('cs-CZ')} m²</span>
                </div>
                {p.totalBelow > 0 && (
                  <div className="font-mono text-[0.6rem] text-text-muted">
                    nad ±0: {p.totalAbove.toLocaleString('cs-CZ')} · pod: {p.totalBelow.toLocaleString('cs-CZ')} m²
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-[0.7rem] text-text-muted mt-3">
        Šířka pruhu odpovídá HPP patra na společném měřítku všech návrhů; podzemní podlaží jsou pod
        terénní linkou (±0,000). Vyšší a širší silueta = větší hmota.
      </p>
    </div>
  );
};

export default FloorProfileChart;
