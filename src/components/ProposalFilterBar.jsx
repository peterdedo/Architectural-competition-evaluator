import React from 'react';
import { Check, Layers } from 'lucide-react';

// Vlastní karta pro výběr návrhů do porovnání – místo posouvání desítek sloupců tabulky
// nebo přeplněné heatmapy/radaru si porota vybere jen podmnožinu k porovnání. Stejný vizuální
// jazyk jako ostatní hlavní sekce (ikona v odznaku, progress bar, karta s okrajem a stínem).
const ProposalFilterBar = ({ navrhy, isSelected, toggle, selectAll, selectNone, selectedCount }) => {
  if (navrhy.length === 0) return null;

  const pct = navrhy.length > 0 ? Math.round((selectedCount / navrhy.length) * 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Layers size={16} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Návrhy v porovnání</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
              {selectedCount} / {navrhy.length} vybráno
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <button type="button" onClick={selectAll} className="px-3 py-2 rounded-lg text-primary hover:bg-primary/10">Vše</button>
            <button type="button" onClick={selectNone} className="px-3 py-2 rounded-lg text-slate-600 hover:bg-slate-100">Žádný</button>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {navrhy.map((n) => {
          const active = isSelected(n.id);
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => toggle(n.id)}
              aria-pressed={active}
              title={n.nazev}
              className={`inline-flex items-center gap-2 pl-2 pr-3.5 py-2 rounded-full text-sm font-medium border transition-colors ${
                active
                  ? 'bg-primary/10 border-primary/40 text-primary'
                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ${
                  active ? 'bg-primary border-primary' : 'border-slate-400 bg-white'
                }`}
              >
                {active && <Check size={12} className="text-white" strokeWidth={3} />}
              </span>
              <span className="max-w-[10rem] truncate">{n.nazev}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ProposalFilterBar;
