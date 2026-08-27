import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw } from 'lucide-react';
import { useEvaluationCommentary } from '../hooks/useEvaluationCommentary.js';

/**
 * AI evaluační komentář: faktické shrnutí rozdílů mezi návrhy z bilančních dat.
 * Vždy jen na vyžádání (tlačítko) a jen když je aiEnabled – appka nic negeneruje sama.
 * Explicitně NENAHRAZUJE posouzení kvality architektury/provozního řešení porotou.
 */
const AiEvaluationCommentary = ({ scoredProposals }) => {
  const { generate, isLoading, error } = useEvaluationCommentary();
  const [komentar, setKomentar] = useState(null);

  const handleGenerate = async () => {
    const result = await generate(scoredProposals);
    if (result.success) setKomentar(result.komentar);
  };

  return (
    <div className="bg-accent/5 border border-accent/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-accent flex items-center gap-1.5">
          <Sparkles size={14} /> AI evaluační komentář
        </h4>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || scoredProposals.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : komentar ? <RefreshCw size={13} /> : <Sparkles size={13} />}
          {komentar ? 'Vygenerovat znovu' : 'Vygenerovat komentář'}
        </button>
      </div>
      <p className="text-xs text-text-light mb-3">
        Faktické shrnutí rozdílů v bilančních datech. Nehodnotí kvalitu architektury ani provozní
        řešení – to posuzuje výhradně porota.
      </p>

      {error && (
        <div className="text-xs text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {komentar && (
        <div className="bg-white rounded-lg border border-accent/20 p-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
          {komentar}
        </div>
      )}

      {!komentar && !error && !isLoading && (
        <div className="text-xs text-text-muted text-center py-3">
          Zatím nevygenerováno.
        </div>
      )}
    </div>
  );
};

export default AiEvaluationCommentary;
