import React, { useMemo } from 'react';
import {
  LayoutGrid,
  ArrowLeft,
  ArrowRight,
  Table2,
  Layers,
  TrendingUp,
  Building2,
  Grid3x3,
  Radar,
} from 'lucide-react';
import { useProposalSelection } from '../hooks/useProposalSelection.js';
import { useScoringSettings } from '../hooks/useScoringSettings.js';
import { SCORING_INDICATORS } from '../data/scoringIndicators.js';
import { scoreProjects, isIndicatorIncluded } from '../utils/balanceScore.js';
import BalanceCompositionChart from './BalanceCompositionChart';
import CostEfficiencyScatter from './CostEfficiencyScatter';
import FloorProfileChart from './FloorProfileChart';
import MetricComparisonTable from './MetricComparisonTable';
import ProposalFilterBar from './ProposalFilterBar';
import ScoreHeatmap from './ScoreHeatmap';
import ScoreRadar from './ScoreRadar';

const SECTION_TONE = {
  slate: { bar: 'bg-slate-500', head: 'bg-slate-50', kicker: 'text-slate-600', icon: 'bg-slate-200 text-slate-700' },
  teal: { bar: 'bg-teal-600', head: 'bg-teal-50', kicker: 'text-teal-800', icon: 'bg-teal-100 text-teal-800' },
  amber: { bar: 'bg-amber-500', head: 'bg-amber-50', kicker: 'text-amber-800', icon: 'bg-amber-100 text-amber-800' },
  violet: { bar: 'bg-violet-600', head: 'bg-violet-50', kicker: 'text-violet-800', icon: 'bg-violet-100 text-violet-800' },
  green: { bar: 'bg-primary', head: 'bg-primary/10', kicker: 'text-primary', icon: 'bg-primary/15 text-primary' },
  blue: { bar: 'bg-accent', head: 'bg-accent/10', kicker: 'text-accent', icon: 'bg-accent/15 text-accent' },
};

const ViewSection = ({ kicker, title, description, tone = 'slate', icon: Icon, children }) => {
  const t = SECTION_TONE[tone] || SECTION_TONE.slate;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className={`flex border-b border-slate-200 ${t.head}`}>
        <div className={`w-1.5 shrink-0 ${t.bar}`} aria-hidden />
        <div className="flex-1 min-w-0 px-5 py-3.5 flex items-start gap-3">
          {Icon && (
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${t.icon}`}>
              <Icon size={18} />
            </div>
          )}
          <div className="min-w-0">
            <p className={`text-[10px] font-bold uppercase tracking-wider ${t.kicker}`}>{kicker}</p>
            <h4 className="text-base font-bold text-slate-900 leading-snug">{title}</h4>
            {description && <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{description}</p>}
          </div>
        </div>
      </div>
      <div className="px-5 py-4">{children}</div>
    </section>
  );
};

// Samostatný krok "Datové pohledy" — všechny vizuální srovnávací pohledy na jednom místě:
// skladba bilance, cenová efektivita, podlažní profil (bez vážení) i heatmapa/radar (vážené
// skóre – směr/váhu volí porota v kroku "Návrhy v porovnání", zde se jen zobrazuje výsledek).
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

  const { directions, weights } = useScoringSettings();

  const scoredProposals = useMemo(
    () => scoreProjects(comparedNavrhy, SCORING_INDICATORS, directions, weights),
    [comparedNavrhy, directions, weights]
  );
  const includedIndicators = useMemo(
    () => SCORING_INDICATORS.filter((ind) => isIndicatorIncluded(directions, weights, ind.id)),
    [directions, weights]
  );

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

      <div className="p-8 space-y-5 bg-slate-100/90">
        {empty ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
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
              <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-4 text-center">
                Žádný návrh není vybraný k porovnání – vyberte alespoň jeden výše.
              </p>
            ) : (
              <>
                <ViewSection
                  kicker="Přehled"
                  title="Srovnání klíčových metrik"
                  description="Faktický přehled odvozených bilančních a ekonomických ukazatelů vedle sebe — neutrální, bez určení „vítěze“. Řádky můžete skrýt a znovu přidat; výběr se pamatuje v prohlížeči."
                  tone="slate"
                  icon={Table2}
                >
                  <MetricComparisonTable proposals={comparedNavrhy} />
                </ViewSection>

                <ViewSection
                  kicker="Plochy"
                  title="Skladba bilance ploch"
                  description="Poměr namísto pořadí — z čeho se plocha skládá, ne kdo je „nejzelenější“."
                  tone="teal"
                  icon={Layers}
                >
                  <BalanceCompositionChart proposals={comparedNavrhy} />
                </ViewSection>

                <ViewSection
                  kicker="Ekonomika"
                  title="Cenová efektivita"
                  description="Kritérium c) soutěžních podmínek — HPP vůči nabídkové ceně, bez dalšího dopočtu."
                  tone="amber"
                  icon={TrendingUp}
                >
                  <CostEfficiencyScatter proposals={comparedNavrhy} />
                </ViewSection>

                <ViewSection
                  kicker="Hmota"
                  title="Podlažní profil"
                  description="Hmota návrhu na první pohled — HPP po patrech, terénní linka ±0,000."
                  tone="violet"
                  icon={Building2}
                >
                  <FloorProfileChart proposals={comparedNavrhy} />
                </ViewSection>

                {includedIndicators.length > 0 ? (
                  <>
                    <ViewSection
                      kicker="Vážené hodnocení"
                      title="Heatmapa"
                      description="Na první pohled: pořadí vlevo, díry červeně, vítěz sloupce zeleně. Cena (Kč/m²) sem nepatří — ta je v grafu „Cenová efektivita“ výše."
                      tone="green"
                      icon={Grid3x3}
                    >
                      <ScoreHeatmap scoredProposals={scoredProposals} includedIndicators={includedIndicators} />
                    </ViewSection>

                    <ViewSection
                      kicker="Vážené hodnocení"
                      title="Radarový graf"
                      description="Doplněk k heatmapě pro rychlý tvar. Osy si zvolíte štítky — výchozí je osm ukazatelů s největším rozptylem mezi návrhy. Nad 6 osami jsou na paprscích čísla, názvy zůstanou ve štítcích."
                      tone="blue"
                      icon={Radar}
                    >
                      <ScoreRadar
                        scoredProposals={scoredProposals}
                        includedIndicators={includedIndicators}
                        weights={weights}
                      />
                    </ViewSection>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 bg-white border border-slate-200 rounded-2xl p-4 text-center">
                    Heatmapa a radar potřebují zvolený směr aspoň u jednoho ukazatele — nastavte v kroku „Návrhy v
                    porovnání”.
                  </p>
                )}
              </>
            )}
          </>
        )}

        <div className="flex items-center justify-between pt-2">
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-white rounded-lg transition-colors text-sm font-medium"
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
