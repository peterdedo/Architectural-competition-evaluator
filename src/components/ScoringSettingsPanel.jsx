import React, { useState } from 'react';
import { Sparkles, Loader2, Check, X as XIcon, ArrowUp, ArrowDown, Ban, Target } from 'lucide-react';
import { SCORING_INDICATORS } from '../data/scoringIndicators.js';
import { sectionNazev } from '../data/balanceSchema.js';
import { DIRECTIONS } from '../utils/balanceScore.js';
import { useWeightSuggestions } from '../hooks/useWeightSuggestions.js';
import { colorForIndex } from '../utils/chartPalette.js';

const DirectionToggle = ({ value, onChange, color }) => {
  const options = [
    { key: DIRECTIONS.HIGHER, icon: ArrowUp, label: 'Vyšší lepší', title: 'Vyšší hodnota je lepší' },
    { key: DIRECTIONS.LOWER, icon: ArrowDown, label: 'Nižší lepší', title: 'Nižší hodnota je lepší' },
    { key: null, icon: Ban, label: 'Mimo skóre', title: 'Nezahrnout tento ukazatel do skóre' },
  ];
  return (
    <div className="inline-flex flex-wrap rounded-full border border-slate-200 bg-slate-50 p-0.5 text-sm font-semibold shrink-0" role="group">
      {options.map(({ key, icon: Icon, label, title }) => {
        const active = value === key || (!value && key === null);
        return (
          <button
            key={label}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={active}
            title={title}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-full transition-colors ${
              active ? 'text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
            style={active ? { background: key === null ? '#64748B' : color } : undefined}
          >
            <Icon size={14} />
            {/* Popisek je vždy vidět (ne jen na širokých obrazovkách) – "jen ikona" u
                rozhodnutí, které porota dělá 15×, není dost srozumitelné bez vysvětlení. */}
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};

/**
 * Panel pro porotu: pro každý bilanční ukazatel volí směr (vyšší/nižší lepší, nebo mimo
 * skóre) a váhu. Appka žádný směr ani váhu sama nevymýšlí – dokud porota nezvolí, ukazatel
 * se do vypočteného skóre vůbec nepromítá (viz utils/balanceScore.js).
 *
 * Volitelně (jen když aiEnabled) nabízí AI NÁVRH směru/váhy – ten se nikdy nezapíše přímo,
 * porota si v review kroku vybere, které návrhy přijme, a teprve pak se propíšou.
 */
const ScoringSettingsPanel = ({ directions, setDirections, weights, setWeights, aiEnabled = false, proposals = [] }) => {
  const { suggest, isLoading: isSuggesting } = useWeightSuggestions();
  const [review, setReview] = useState(null); // { [id]: { direction, weight, duvod } } | null
  const [selected, setSelected] = useState(() => new Set());
  const [suggestError, setSuggestError] = useState(null);

  const setDirection = (id, dir) => {
    setDirections((prev) => {
      const next = { ...prev };
      if (dir) next[id] = dir;
      else delete next[id];
      return next;
    });
  };

  const setWeight = (id, weight) => {
    setWeights((prev) => ({ ...prev, [id]: weight }));
  };

  const bySection = SCORING_INDICATORS.reduce((acc, ind) => {
    (acc[ind.sectionCode] = acc[ind.sectionCode] || []).push(ind);
    return acc;
  }, {});
  const sectionEntries = Object.entries(bySection);

  const includedCount = SCORING_INDICATORS.filter((i) => directions[i.id]).length;
  const includedPct = SCORING_INDICATORS.length > 0 ? Math.round((includedCount / SCORING_INDICATORS.length) * 100) : 0;

  const handleSuggest = async () => {
    setSuggestError(null);
    const result = await suggest(proposals);
    if (!result.success) {
      setSuggestError(result.error || 'Návrh se nepodařilo získat.');
      return;
    }
    setReview(result.suggestions);
    // Ve výchozím stavu vybrané jen ty, kde AI navrhla směr (ne null).
    setSelected(new Set(Object.entries(result.suggestions).filter(([, v]) => v.direction).map(([id]) => id)));
  };

  const toggleSelected = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applySuggestions = () => {
    if (!review) return;
    const newDirections = { ...directions };
    const newWeights = { ...weights };
    selected.forEach((id) => {
      const s = review[id];
      if (!s || !s.direction) return;
      newDirections[id] = s.direction;
      newWeights[id] = s.weight;
    });
    setDirections(newDirections);
    setWeights(newWeights);
    setReview(null);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Target size={16} className="text-primary" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Nastavení hodnocení (porota)</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-slate-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${includedPct}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
              {includedCount} / {SCORING_INDICATORS.length} zahrnuto
            </span>
          </div>
          {aiEnabled && (
            <button
              type="button"
              onClick={handleSuggest}
              disabled={isSuggesting || proposals.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50"
              title={proposals.length === 0 ? 'Nejdřív musí existovat alespoň jeden návrh' : 'AI navrhne směr a váhu – vy rozhodnete, co přijmete'}
            >
              {isSuggesting ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
              Navrhnout váhy (AI)
            </button>
          )}
        </div>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        U žádného ukazatele není směr předvyplněn – vyberte jej sami. Nabídková cena je samostatné
        kritérium a do tohoto skóre nevstupuje.
      </p>

      {suggestError && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
          {suggestError}
        </div>
      )}

      {review && (
        <div className="mb-5 border border-accent/30 bg-accent/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-accent flex items-center gap-1.5">
              <Sparkles size={14} /> AI návrh – vyberte, co chcete přijmout
            </h4>
            <span className="text-xs text-accent">{selected.size} vybráno</span>
          </div>
          <p className="text-xs text-text-light mb-3">
            Nic se ještě nezapsalo. Odškrtněte, co nechcete, a potvrďte tlačítkem dole.
          </p>
          <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
            {SCORING_INDICATORS.map((ind) => {
              const s = review[ind.id];
              if (!s) return null;
              const checked = selected.has(ind.id);
              return (
                <label
                  key={ind.id}
                  className={`flex items-start gap-2 px-2 py-1.5 rounded-lg text-xs cursor-pointer ${
                    !s.direction ? 'opacity-50' : checked ? 'bg-white' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    disabled={!s.direction}
                    onChange={() => toggleSelected(ind.id)}
                    className="mt-0.5"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-800">
                      {ind.nazev}{' '}
                      {s.direction ? (
                        <span className="text-accent">
                          · {s.direction === 'higher' ? '↑ vyšší lepší' : '↓ nižší lepší'} · váha {s.weight}
                        </span>
                      ) : (
                        <span className="text-slate-400">· AI doporučuje ponechat mimo skóre</span>
                      )}
                    </div>
                    {s.duvod && <div className="text-slate-500">{s.duvod}</div>}
                  </div>
                </label>
              );
            })}
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              type="button"
              onClick={() => setReview(null)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <XIcon size={13} /> Zahodit
            </button>
            <button
              type="button"
              onClick={applySuggestions}
              disabled={selected.size === 0}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
            >
              <Check size={13} /> Použít vybrané ({selected.size})
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {sectionEntries.map(([code, inds], sectionIdx) => {
          const color = colorForIndex(sectionIdx);
          const sectionIncluded = inds.filter((ind) => directions[ind.id]).length;
          return (
            <div key={code} className="rounded-xl border border-slate-200 overflow-hidden">
              <div
                className="flex items-center gap-3 px-4 py-2.5"
                style={{ backgroundColor: `${color}14` }}
              >
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
                  style={{ backgroundColor: color }}
                >
                  {code}
                </span>
                <h4 className="text-sm font-bold text-slate-800">{sectionNazev(code)}</h4>
                <span className="ml-auto text-xs font-medium text-slate-500 tabular-nums whitespace-nowrap">
                  {sectionIncluded} / {inds.length} zahrnuto
                </span>
              </div>
              <div className="divide-y divide-slate-100 bg-white">
                {inds.map((ind) => {
                  const dir = directions[ind.id] || null;
                  const weight = Number.isFinite(weights[ind.id]) ? weights[ind.id] : 10;
                  return (
                    <div key={ind.id} className={`px-4 py-3 transition-colors ${dir ? '' : 'bg-slate-50/60'}`}>
                      <div className="flex flex-col lg:flex-row lg:flex-wrap lg:items-center gap-2.5 lg:gap-4">
                        <div className="flex items-center gap-2 lg:w-52 shrink-0">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: dir ? color : '#CBD5E1' }}
                            aria-hidden
                          />
                          <span className="text-sm font-medium text-slate-800">{ind.nazev}</span>
                        </div>
                        <DirectionToggle value={dir} onChange={(v) => setDirection(ind.id, v)} color={color} />
                        <div className={`flex items-center gap-3 flex-1 min-w-[8rem] ${dir ? '' : 'opacity-40 pointer-events-none'}`}>
                          <input
                            type="range"
                            min={1}
                            max={100}
                            value={weight}
                            onChange={(e) => setWeight(ind.id, Number(e.target.value))}
                            className="flex-1 accent-current h-6"
                            style={{ color }}
                            aria-label={`Váha (tažením) – ${ind.nazev}`}
                            disabled={!dir}
                          />
                          {/* Váhu jde i napsat, ne jen natáhnout myší – přesnější pro někoho,
                              komu nevyhovuje jemné tažení malého posuvníku. */}
                          <input
                            type="number"
                            min={1}
                            max={100}
                            value={weight}
                            onChange={(e) => {
                              const v = Number(e.target.value);
                              if (Number.isFinite(v)) setWeight(ind.id, Math.min(100, Math.max(1, v)));
                            }}
                            disabled={!dir}
                            aria-label={`Váha (číslem) – ${ind.nazev}`}
                            className="w-16 h-9 px-2 rounded-lg border border-slate-300 text-sm font-bold tabular-nums text-center shrink-0 focus:outline-none focus:ring-2 focus:ring-accent"
                            style={dir ? { borderColor: color, color } : undefined}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ScoringSettingsPanel;
