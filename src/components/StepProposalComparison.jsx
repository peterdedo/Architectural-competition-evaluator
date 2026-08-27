import React, { useMemo } from 'react';
import { Layers, ArrowLeft, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import { useProposalSelection } from '../hooks/useProposalSelection.js';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import { useAiFeaturesEnabled } from '../hooks/useAiFeaturesEnabled.js';
import { SCORING_INDICATORS } from '../data/scoringIndicators.js';
import { scoreProjects } from '../utils/balanceScore.js';
import { floorsTotal, offerPriceTotal } from '../utils/balanceCalculations.js';
import ProposalFilterBar from './ProposalFilterBar';
import ScoringSettingsPanel from './ScoringSettingsPanel';
import AiEvaluationCommentary from './AiEvaluationCommentary';

// Samostatný krok "Návrhy v porovnání" — výběr platí sdíleně (localStorage) pro detailní
// tabulku v kroku Bilanční údaje i pro grafy v kroku Datové pohledy. Vážené hodnocení
// (směr/váha, žebříček, heatmapa, radar, AI komentář) žije tady, protože je to čistě
// srovnávací pohled na návrhy, které si tu porota vybrala – ne editace bilančních dat.
const StepProposalComparison = ({ navrhy, onBack, onNext }) => {
  const zpracovaneNavrhy = useMemo(
    () => navrhy.filter((n) => n.status === 'zpracován' && n.data && Object.keys(n.data).length > 0),
    [navrhy]
  );

  const { isSelected, toggle, selectAll, selectNone, selected: comparedNavrhy, selectedCount } = useProposalSelection(zpracovaneNavrhy);

  // Volba směru/váhy je výhradně na porotě – appka nic nepředvyplňuje (viz ScoringSettingsPanel).
  const [directions, setDirections] = useLocalStorage('archieval-scoring-directions', {});
  const [weights, setWeights] = useLocalStorage('archieval-scoring-weights', {});

  // AI funkce (návrh vah, evaluační komentář) jsou vypnuté, dokud si je porota sama nezapne.
  // Extrakce dat z PDF je samostatná explicitní akce (tlačítko „Zpracovat" u souboru) a tímto
  // přepínačem se neřídí.
  const [aiEnabled, setAiEnabled] = useAiFeaturesEnabled();

  // Vážené skóre (jen ukazatele se zvoleným směrem); cena (P06) do něj nevstupuje – je to
  // samostatné kritérium „ekonomická efektivita" dle soutěžních podmínek.
  const scoredProposals = useMemo(
    () => scoreProjects(comparedNavrhy, SCORING_INDICATORS, directions, weights),
    [comparedNavrhy, directions, weights]
  );
  const includedIndicators = useMemo(
    () => SCORING_INDICATORS.filter((ind) => directions[ind.id]),
    [directions]
  );

  // Kč/m² HPP – jen k zobrazení vedle skóre, aby porota viděla ekonomickou efektivitu (kritérium
  // c) hned vedle architektonického skóre. Do weightedScore se NIKDY nepočítá (viz komponenta).
  const kcM2 = (proposal) => {
    const hpp = floorsTotal(proposal.data?.hpp);
    const cena = offerPriceTotal(proposal.data?.nabidkovaCena);
    return hpp && hpp > 0 && cena && cena > 0 ? Math.round(cena / hpp) : null;
  };

  const empty = zpracovaneNavrhy.length === 0;

  return (
    <div className="card-active overflow-hidden animate-fade-in">
      <div className="bg-primary text-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h2 className="heading-1 text-white">Návrhy v porovnání</h2>
            <p className="text-white/80 text-sm">
              Výběr návrhů a vážené hodnocení — kritéria a) kvalita návrhu, b) provozní řešení; cena je samostatné kritérium c)
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {empty ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Layers size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Žádná data k zobrazení</h3>
            <p className="text-slate-500 mb-6">
              Nejdřív vyplňte bilanční tabulku alespoň u jednoho návrhu.
            </p>
            <button className="btn-secondary" onClick={onBack}>
              ← Zpět na Bilanční údaje
            </button>
          </div>
        ) : (
          <>
            <ProposalFilterBar
              navrhy={zpracovaneNavrhy}
              isSelected={isSelected}
              toggle={toggle}
              selectAll={selectAll}
              selectNone={selectNone}
              selectedCount={selectedCount}
            />

            {comparedNavrhy.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                Žádný návrh není vybraný – vážené hodnocení i datové pohledy zůstanou prázdné, dokud alespoň jeden nezapnete.
              </p>
            ) : (
              <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                <div className="flex items-center gap-2 flex-wrap">
                  <Trophy size={18} className="text-primary" />
                  <span className="text-base font-bold text-slate-900">Vážené hodnocení</span>
                </div>

                {/* Přepínač AI – vypnuto ve výchozím stavu, porota si zapíná sama */}
                <label className="flex items-center justify-between gap-3 px-4 py-3 bg-accent/5 border border-accent/30 rounded-xl cursor-pointer">
                  <span className="flex items-center gap-2 text-sm font-semibold text-accent">
                    <Sparkles size={16} /> AI asistence (GPT-5.6 Luna)
                    <span className="font-normal text-text-light">
                      — návrh vah a evaluační komentář; jen podklad, rozhoduje porota
                    </span>
                  </span>
                  <span className="relative inline-flex items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={aiEnabled}
                      onChange={(e) => setAiEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <span className="w-10 h-6 bg-slate-300 peer-checked:bg-accent rounded-full transition-colors" />
                    <span className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
                  </span>
                </label>

                <ScoringSettingsPanel
                  directions={directions}
                  setDirections={setDirections}
                  weights={weights}
                  setWeights={setWeights}
                  aiEnabled={aiEnabled}
                  proposals={comparedNavrhy}
                />

                {includedIndicators.length > 0 && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-bold text-slate-800">Pořadí podle zvolených ukazatelů</h4>
                        <span className="text-[11px] text-text-muted">Kč/m² = cenová efektivita (kritérium c), nepočítá se do skóre</span>
                      </div>
                      <div className="space-y-1.5">
                        {scoredProposals.map((p, idx) => {
                          const barPct = p.weightedScore === null ? 0 : Math.max(2, p.weightedScore);
                          const price = kcM2(p);
                          return idx === 0 ? (
                            <div key={p.id} className="relative overflow-hidden rounded-xl border-2 border-primary">
                              <div className="absolute inset-y-0 left-0 bg-primary/15" style={{ width: `${barPct}%` }} aria-hidden />
                              <div className="relative flex items-center gap-3 px-4 py-3">
                                <span className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                                  <Trophy size={18} />
                                </span>
                                <span className="flex-1 font-bold text-base text-slate-900 truncate">{p.nazev}</span>
                                {price !== null && (
                                  <span className="font-mono text-xs text-text-light shrink-0">{price.toLocaleString('cs-CZ')} Kč/m²</span>
                                )}
                                <span className="text-xs text-primary font-medium shrink-0">{p.scoredIndicatorCount} ukazatelů</span>
                                <span className="font-bold text-xl text-primary tabular-nums w-20 text-right shrink-0">
                                  {p.weightedScore === null ? '—' : `${p.weightedScore.toFixed(1)} b.`}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div key={p.id} className="relative overflow-hidden rounded-lg bg-slate-50">
                              <div className="absolute inset-y-0 left-0 bg-accent/10" style={{ width: `${barPct}%` }} aria-hidden />
                              <div className="relative flex items-center gap-3 px-3 py-2 text-sm">
                                <span className="w-6 text-center font-bold text-slate-400 shrink-0">{idx + 1}.</span>
                                <span className="flex-1 font-medium text-slate-800 truncate">{p.nazev}</span>
                                {price !== null && (
                                  <span className="font-mono text-xs text-text-muted shrink-0">{price.toLocaleString('cs-CZ')} Kč/m²</span>
                                )}
                                <span className="text-xs text-slate-500 shrink-0">{p.scoredIndicatorCount} ukazatelů</span>
                                <span className="font-bold text-accent tabular-nums w-16 text-right shrink-0">
                                  {p.weightedScore === null ? '—' : `${p.weightedScore.toFixed(1)} b.`}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}

                {aiEnabled && <AiEvaluationCommentary scoredProposals={scoredProposals} />}
              </div>
            )}

            <p className="text-xs text-slate-500">
              Kritéria hodnocení dle soutěžních podmínek nemají stanoveno pořadí významnosti ani
              číselné váhy – posouzení je plně v kompetenci poroty. Váhy a směr výše jsou proto
              nastavitelné porotou, appka je sama nevymýšlí.
            </p>
          </>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            onClick={onBack}
          >
            <ArrowLeft size={16} /> Zpět na Bilanční údaje
          </button>
          {!empty && onNext && (
            <button
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
              onClick={onNext}
            >
              Datové pohledy <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepProposalComparison;
