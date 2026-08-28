import React, { useMemo } from 'react';
import { LayoutGrid, ArrowLeft, ArrowRight } from 'lucide-react';
import { useProposalSelection } from '../hooks/useProposalSelection.js';
import { useScoringSettings } from '../hooks/useScoringSettings.js';
import { SCORING_INDICATORS } from '../data/scoringIndicators.js';
import { scoreProjects } from '../utils/balanceScore.js';
import BalanceCompositionChart from './BalanceCompositionChart';
import CostEfficiencyScatter from './CostEfficiencyScatter';
import FloorProfileChart from './FloorProfileChart';
import ProposalFilterBar from './ProposalFilterBar';
import ScoreHeatmap from './ScoreHeatmap';
import ScoreRadar from './ScoreRadar';

// Samostatný krok "Datové pohledy" — všechny vizuální srovnávací pohledy na jednom místě:
// skladba bilance, cenová efektivita, podlažní profil (bez vážení) i heatmapa/radar (vážené
// skóre – směr/váhu volí porota v kroku "Návrhy v porovnání", zde se jen zobrazuje výsledek).
// Výběr návrhů je sdílený (stejný localStorage klíč) a dá se přepínat i přímo tady.
const StepDataViews = ({ navrhy, onBack, onNext }) => {
  const zpracovaneNavrhy = useMemo(
    () => navrhy.filter((n) => n.status === 'zpracován' && n.data && Object.keys(n.data).length > 0),
    [navrhy]
  );

  const {
    isSelected: isCompared,
    toggle: toggleCompared,
    selectAll: selectAllCompared,
    selectNone: selectNoneCompared,
    selected: comparedNavrhy,
    selectedCount: comparedCount,
  } = useProposalSelection(zpracovaneNavrhy);

  // Stejný server-backed hook jako ScoringSettingsPanel v kroku "Návrhy v porovnání" – směr
  // a váhu tam volí porota (nezávisle za každého porotce), appka je sama nevymýšlí (viz utils/balanceScore.js).
  const { directions, weights } = useScoringSettings();

  const scoredProposals = useMemo(
    () => scoreProjects(comparedNavrhy, SCORING_INDICATORS, directions, weights),
    [comparedNavrhy, directions, weights]
  );
  const includedIndicators = useMemo(
    () => SCORING_INDICATORS.filter((ind) => directions[ind.id]),
    [directions]
  );

  // Radar se s víc než ~8 osami/návrhy stává nečitelným chumelem překrývajících se tvarů –
  // heatmapa výše zvládne zobrazit všechny zvolené ukazatele přesně, radar proto dostane jen
  // těch pár, co mezi porovnávanými návrhy nejvíc rozlišují (největší rozptyl normalizovaného
  // skóre), zbytek je „doplněk pro gestalt", ne primární zdroj přesných čísel.
  const RADAR_MAX_INDICATORS = 8;
  const radarIndicators = useMemo(() => {
    if (includedIndicators.length <= RADAR_MAX_INDICATORS) return includedIndicators;
    const withSpread = includedIndicators.map((ind) => {
      const values = scoredProposals
        .map((p) => p.indicatorScores.find((s) => s.id === ind.id)?.normalized)
        .filter((v) => Number.isFinite(v));
      const spread = values.length > 1 ? Math.max(...values) - Math.min(...values) : 0;
      return { ind, spread };
    });
    return withSpread
      .sort((a, b) => b.spread - a.spread)
      .slice(0, RADAR_MAX_INDICATORS)
      .map((x) => x.ind);
  }, [includedIndicators, scoredProposals]);

  const empty = zpracovaneNavrhy.length === 0;

  return (
    <div className="card-active overflow-hidden animate-fade-in">
      <div className="bg-primary text-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <LayoutGrid size={20} className="text-white" />
          </div>
          <div>
            <h2 className="heading-1 text-white">Datové pohledy</h2>
            <p className="text-white/80 text-sm">
              Skladba, cenová efektivita, podlažní profil a vážené hodnocení (heatmapa, radar)
            </p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8">
        {empty ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <LayoutGrid size={32} className="text-slate-600" />
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
              isSelected={isCompared}
              toggle={toggleCompared}
              selectAll={selectAllCompared}
              selectNone={selectNoneCompared}
              selectedCount={comparedCount}
            />

            {comparedNavrhy.length === 0 ? (
              <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                Žádný návrh není vybraný k porovnání – vyberte alespoň jeden výše.
              </p>
            ) : (
              <>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Skladba bilance ploch</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Poměr namísto pořadí — z čeho se plocha skládá, ne kdo je „nejzelenější&rdquo;.
                  </p>
                  <BalanceCompositionChart proposals={comparedNavrhy} />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Cenová efektivita</h4>
                  <p className="text-xs text-slate-500 mb-3">
                    Kritérium c) soutěžních podmínek — HPP vůči nabídkové ceně, bez dalšího dopočtu.
                  </p>
                  <CostEfficiencyScatter proposals={comparedNavrhy} />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Podlažní profil</h4>
                  <p className="text-xs text-slate-500 mb-3">Hmota návrhu na první pohled — HPP po patrech.</p>
                  <FloorProfileChart proposals={comparedNavrhy} />
                </div>

                {includedIndicators.length > 0 ? (
                  <>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Heatmapa</h4>
                      <p className="text-xs text-slate-500 mb-3">
                        Vážené skóre dle ukazatelů zvolených porotou v kroku „Návrhy v porovnání&rdquo;.
                      </p>
                      <ScoreHeatmap scoredProposals={scoredProposals} includedIndicators={includedIndicators} />
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Radarový graf</h4>
                      <p className="text-xs text-slate-500 mb-3">
                        Doplněk k heatmapě pro rychlý tvar, ne náhrada přesných čísel.
                        {radarIndicators.length < includedIndicators.length && (
                          <> Zobrazeno {radarIndicators.length} z {includedIndicators.length} zvolených ukazatelů –
                          ty, které mezi porovnávanými návrhy nejvíc rozlišují (kompletní přehled je v heatmapě výše).</>
                        )}
                      </p>
                      <ScoreRadar scoredProposals={scoredProposals} includedIndicators={radarIndicators} weights={weights} />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4 text-center">
                    Heatmapa a radar potřebují zvolený směr aspoň u jednoho ukazatele — nastavte v kroku „Návrhy v porovnání&rdquo;.
                  </p>
                )}
              </>
            )}
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
              Souhrn poroty <ArrowRight size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StepDataViews;
