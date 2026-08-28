import React, { useEffect, useMemo, useState } from 'react';
import { Users, ArrowLeft, Loader2, AlertCircle, Trophy } from 'lucide-react';

// Samostatný krok "Souhrn poroty" — protože každý porotce hodnotí nezávisle (vlastní
// směr/váha, viz useScoringSettings), appka jinak nikde neukáže, jak dopadli všichni
// dohromady. Server (api/scoring/summary.js) spočítá vážené skóre pro každého porotce
// zvlášť stejnou funkcí jako zbytek appky (utils/balanceScore.js) a tady se to jen srovná
// vedle sebe do jedné tabulky.
const StepJurySummary = ({ onBack }) => {
  const [porotci, setPorotci] = useState(null); // null = ještě se načítá
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    fetch('/api/scoring/summary', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('Souhrn se nepodařilo načíst'))))
      .then((data) => {
        if (cancelled) return;
        setPorotci(Array.isArray(data?.porotci) ? data.porotci : []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : 'Souhrn se nepodařilo načíst');
        setPorotci([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const navrhyRows = useMemo(() => {
    if (!porotci || porotci.length === 0) return [];
    const byId = new Map();
    porotci.forEach((p) => {
      p.scoredProposals.forEach((sp) => {
        if (!byId.has(sp.id)) byId.set(sp.id, { id: sp.id, nazev: sp.nazev, scores: [] });
        if (Number.isFinite(sp.weightedScore)) byId.get(sp.id).scores.push(sp.weightedScore);
      });
    });
    return Array.from(byId.values())
      .map((n) => ({
        ...n,
        average: n.scores.length > 0 ? n.scores.reduce((a, b) => a + b, 0) / n.scores.length : null,
      }))
      .sort((a, b) => (b.average ?? -Infinity) - (a.average ?? -Infinity));
  }, [porotci]);

  const scoreFor = (navrhId, userId) => {
    const juror = porotci?.find((p) => p.userId === userId);
    const sp = juror?.scoredProposals.find((s) => s.id === navrhId);
    return sp && Number.isFinite(sp.weightedScore) ? sp.weightedScore : null;
  };

  const loading = porotci === null;
  const noScoring = !loading && porotci.length === 0;

  return (
    <div className="card-active overflow-hidden animate-fade-in">
      <div className="bg-primary text-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-white" />
          </div>
          <div>
            <h2 className="heading-1 text-white">Souhrn poroty</h2>
            <p className="text-white/80 text-sm">Vážené skóre podle jednotlivých porotců a jejich průměr</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        {loading && (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <Loader2 size={20} className="animate-spin" /> Načítám souhrn…
          </div>
        )}

        {error && !loading && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-error/10 border-2 border-error/30 text-error text-sm font-medium">
            <AlertCircle size={18} className="shrink-0" /> {error}
          </div>
        )}

        {noScoring && !error && (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
              <Users size={32} className="text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Zatím žádné hodnocení</h3>
            <p className="text-slate-500">
              Souhrn se zobrazí, jakmile aspoň jeden porotce nastaví směr u některého ukazatele v kroku „Návrhy v porovnání“.
            </p>
          </div>
        )}

        {!loading && !noScoring && navrhyRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  <th className="text-left py-3 pr-4 font-bold text-slate-800">Návrh</th>
                  {porotci.map((p) => (
                    <th key={p.userId} className="text-right py-3 px-3 font-semibold text-slate-600 whitespace-nowrap">
                      {p.jmeno}
                    </th>
                  ))}
                  <th className="text-right py-3 pl-4 font-bold text-primary whitespace-nowrap">Průměr</th>
                </tr>
              </thead>
              <tbody>
                {navrhyRows.map((n, idx) => (
                  <tr key={n.id} className={idx === 0 ? 'bg-primary/5' : 'border-b border-slate-100'}>
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      <span className="flex items-center gap-2">
                        {idx === 0 && <Trophy size={16} className="text-primary shrink-0" />}
                        {n.nazev}
                      </span>
                    </td>
                    {porotci.map((p) => {
                      const score = scoreFor(n.id, p.userId);
                      return (
                        <td key={p.userId} className="text-right py-3 px-3 tabular-nums text-slate-600">
                          {score === null ? '—' : score.toFixed(1)}
                        </td>
                      );
                    })}
                    <td className="text-right py-3 pl-4 font-bold text-primary tabular-nums">
                      {n.average === null ? '—' : `${n.average.toFixed(1)} b.`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center pt-6 border-t border-gray-200">
          <button
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            onClick={onBack}
          >
            <ArrowLeft size={16} /> Zpět na Datové pohledy
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepJurySummary;
