import React from 'react';
import { safeNum } from '../utils/balanceCalculations.js';
import { colorForIndex } from '../utils/chartPalette.js';

const MAX_BAR_H = 96; // px – jen sloupce, popisky pater jsou mimo tento box

// Výchozí popisky (viz DEFAULT_FLOOR_LABELS v balanceSchema.js) jsou celé věty ("Podzemní
// podlaží", "Nadzemní 1. NP") – na 36px sloupec se nevejdou. Zkrátíme na "PP"/"1. NP" apod.,
// plný text zůstává v title tooltipu. Vlastní (přejmenované) podlaží jen oříznou přes truncate.
const shortFloorLabel = (label) => {
  if (!label) return '';
  const npMatch = label.match(/(\d+)\.\s*NP/i);
  if (npMatch) return `${npMatch[1]}. NP`;
  if (/podzemní/i.test(label)) return 'PP';
  return label;
};

// Podlažní profil: malé sloupcové grafy HPP po patrech, jeden na návrh, na společném měřítku.
const FloorProfileChart = ({ proposals }) => {
  const items = proposals
    .map((p, idx) => {
      const floors = Array.isArray(p.data?.hpp?.floors) ? p.data.hpp.floors : [];
      const values = floors.map((f) => ({ label: f.label, value: safeNum(f.value) }));
      const total = values.reduce((sum, f) => sum + (f.value || 0), 0);
      return { id: p.id, nazev: p.nazev, floors: values, total, color: colorForIndex(idx) };
    })
    .filter((p) => p.floors.some((f) => f.value !== null && f.value > 0));

  if (items.length === 0) {
    return (
      <div className="text-sm text-text-muted bg-bg-light border border-border rounded-lg p-4 text-center">
        Zatím žádný návrh nemá vyplněná podlaží (sekce E — Hrubá podlažní plocha).
      </div>
    );
  }

  const maxVal = Math.max(1, ...items.flatMap((p) => p.floors.map((f) => f.value || 0)));

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(9rem, 1fr))' }}>
      {items.map((p) => (
        <div key={p.id} className="text-center min-w-0">
          <div className="text-xs font-semibold text-text-light leading-snug line-clamp-2 min-h-[2.25rem] mb-2" title={p.nazev}>
            {p.nazev}
          </div>
          <div className="flex items-end justify-center gap-1.5 overflow-hidden" style={{ height: MAX_BAR_H }}>
            {p.floors.map((f, i) => (
              <div key={i} className="w-9 h-full flex flex-col justify-end">
                <div
                  className="w-full rounded-t shrink-0"
                  style={{
                    height: f.value ? `${Math.max(3, (f.value / maxVal) * MAX_BAR_H)}px` : '2px',
                    background: f.value ? p.color : '#E2E8F0',
                    opacity: f.value ? 1 : 0.4,
                  }}
                  title={f.value ? `${f.label}: ${f.value.toLocaleString('cs-CZ')} m²` : `${f.label}: —`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-1.5 mt-1">
            {p.floors.map((f, i) => (
              <span
                key={i}
                className="font-mono text-[0.6rem] text-text-muted w-9 truncate text-center"
                title={f.label}
              >
                {shortFloorLabel(f.label)}
              </span>
            ))}
          </div>
          <div className="font-mono text-xs text-text-light mt-2 pt-2 border-t border-border">
            HPP <span className="font-semibold text-text-dark">{p.total.toLocaleString('cs-CZ')} m²</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FloorProfileChart;
