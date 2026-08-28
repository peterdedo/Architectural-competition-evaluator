import React, { useState } from 'react';
import { Sparkles, Loader2, RefreshCw, Compass, Building2, Scale, HelpCircle, TrendingUp } from 'lucide-react';
import { useEvaluationCommentary } from '../hooks/useEvaluationCommentary.js';

/**
 * AI evaluační komentář: odborné ČTENÍ bilančních dat očima architekta kulturních staveb —
 * co čísla naznačují o charakteru návrhů a na co se má porota zaměřit. Vždy jen na vyžádání
 * (tlačítko) a jen když je aiEnabled. Explicitně NENAHRAZUJE posouzení kvality architektury
 * ani pořadí porotou — nabízí hypotézy a otázky k ověření, ne verdikty.
 */

const SectionTitle = ({ icon: Icon, children }) => (
  <h5 className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-2">
    <span className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
      <Icon size={14} className="text-accent" />
    </span>
    {children}
  </h5>
);

const CommentaryDocument = ({ komentar }) => (
  <div className="space-y-5">
    {komentar.synteza && (
      <section>
        <SectionTitle icon={Compass}>Syntéza pole návrhů</SectionTitle>
        <p className="text-sm text-slate-700 leading-relaxed">{komentar.synteza}</p>
      </section>
    )}

    {komentar.navrhy.length > 0 && (
      <section>
        <SectionTitle icon={Building2}>Odborné čtení jednotlivých návrhů</SectionTitle>
        <div className="space-y-3">
          {komentar.navrhy.map((n, i) => (
            <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="font-bold text-slate-900 mb-1.5">{n.nazev}</div>
              {n.charakter && <p className="text-sm text-slate-700 leading-relaxed mb-2">{n.charakter}</p>}
              {n.prilezitosti && (
                <p className="text-sm text-slate-700 leading-relaxed">
                  <span className="font-semibold text-primary">Slibné k ověření: </span>
                  {n.prilezitosti}
                </p>
              )}
              {n.otazky && (
                <p className="text-sm text-slate-700 leading-relaxed mt-1">
                  <span className="font-semibold text-warning">Napětí k prověření: </span>
                  {n.otazky}
                </p>
              )}
            </div>
          ))}
        </div>
      </section>
    )}

    {komentar.napeti.length > 0 && (
      <section>
        <SectionTitle icon={Scale}>Klíčová napětí napříč polem</SectionTitle>
        <ul className="space-y-1.5">
          {komentar.napeti.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
              <span className="text-accent font-bold shrink-0">·</span>
              <span>{t}</span>
            </li>
          ))}
        </ul>
      </section>
    )}

    {komentar.ekonomika && (
      <section>
        <SectionTitle icon={TrendingUp}>Ekonomika životního cyklu</SectionTitle>
        <p className="text-sm text-slate-700 leading-relaxed">{komentar.ekonomika}</p>
      </section>
    )}

    {komentar.otazkyProPorotu.length > 0 && (
      <section>
        <SectionTitle icon={HelpCircle}>Otázky pro porotu nad výkresy a modely</SectionTitle>
        <ol className="space-y-1.5 list-none">
          {komentar.otazkyProPorotu.map((q, i) => (
            <li key={i} className="flex gap-2.5 text-sm text-slate-700 leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                {i + 1}
              </span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </section>
    )}

    {komentar.zaver && (
      <p className="text-xs text-text-muted italic border-t border-slate-200 pt-3">{komentar.zaver}</p>
    )}
  </div>
);

const AiEvaluationCommentary = ({ scoredProposals }) => {
  const { generate, isLoading, error } = useEvaluationCommentary();
  const [komentar, setKomentar] = useState(null);

  const handleGenerate = async () => {
    const result = await generate(scoredProposals);
    if (result.success) setKomentar(result.komentar);
  };

  return (
    <div className="bg-accent/5 border border-accent/30 rounded-xl p-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h4 className="text-sm font-bold text-accent flex items-center gap-1.5">
          <Sparkles size={14} /> AI odborné čtení dat (architekt kulturních staveb)
        </h4>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isLoading || scoredProposals.length === 0}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-accent text-white rounded-lg hover:bg-accent/90 disabled:opacity-50 shrink-0"
        >
          {isLoading ? <Loader2 size={13} className="animate-spin" /> : komentar ? <RefreshCw size={13} /> : <Sparkles size={13} />}
          {isLoading ? 'Analyzuji…' : komentar ? 'Vygenerovat znovu' : 'Vygenerovat čtení'}
        </button>
      </div>
      <p className="text-xs text-text-light mb-3">
        Hloubkové čtení bilančních dat očima zkušeného porotce-architekta — hypotézy o charakteru
        návrhů a otázky k ověření. Nehodnotí kvalitu ani pořadí; to posuzuje výhradně porota.
      </p>

      {error && (
        <div className="text-xs text-error bg-error/10 border border-error/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {komentar && (
        <div className="bg-white rounded-lg border border-accent/20 p-4">
          <CommentaryDocument komentar={komentar} />
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
