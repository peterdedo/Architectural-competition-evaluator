import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Bot,
  X,
  Loader2,
  CheckCircle,
  BarChart3,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import useAIAssistant from '../hooks/useAIAssistant';
import { useWizard } from '../contexts/WizardContext';
import AIReportPanel from './AIReportPanel';

const AdvancedAIAssistant = ({
  indikatory,
  vybraneIndikatory,
  vahy,
  setVahy,
  categoryWeights,
  setCategoryWeights,
  navrhy,
  vybraneNavrhy,
  onClose
}) => {
  const [context, setContext] = useState('obecná urbanistická soutěž');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisError, setAnalysisError] = useState('');
  const [slowHint, setSlowHint] = useState(false);

  const { results } = useWizard();

  const { isAnalyzing, analyzeComparison } = useAIAssistant();

  useEffect(() => {
    if (!isAnalyzing) {
      setSlowHint(false);
      return undefined;
    }
    const t = window.setTimeout(() => setSlowHint(true), 25000);
    return () => window.clearTimeout(t);
  }, [isAnalyzing]);

  const vybraneIndikatoryList = indikatory.filter((ind) => vybraneIndikatory.has(ind.id));

  const vybraneNavrhyData = navrhy
    .filter((navrh) => vybraneNavrhy.has(navrh.id))
    .map((navrh) => {
      const result = results?.find((r) => r.id === navrh.id);
      return {
        ...navrh,
        weightedScore: result?.weightedScore ?? navrh.weightedScore ?? 0,
        completionRate: result?.completionRate ?? navrh.completionRate ?? 0,
        filledIndicators: result?.filledIndicators ?? navrh.filledIndicators ?? 0,
        totalIndicators: result?.totalIndicators ?? navrh.totalIndicators ?? 0
      };
    });

  const handleAIAnalysis = async () => {
    if (vybraneNavrhyData.length === 0) {
      setAnalysisError('Vyberte alespoň jeden návrh pro analýzu.');
      setAiAnalysis(null);
      return;
    }

    setAnalysisError('');
    try {
      const analysisData = {
        navrhy: vybraneNavrhyData,
        indikatory: vybraneIndikatoryList,
        vahy,
        categoryWeights
      };

      const analysisResult = await analyzeComparison(analysisData, context);

      if (analysisResult.success) {
        setAiAnalysis(analysisResult.analysis);
        setAnalysisError('');
      } else {
        setAiAnalysis(null);
        setAnalysisError(analysisResult.error || 'Nepodařilo se získat AI analýzu. Zkuste to znovu.');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAiAnalysis(null);
      setAnalysisError('Nepodařilo se získat AI analýzu. Zkuste to znovu.');
    }
  };

  const handleClearResults = () => {
    setAiAnalysis(null);
    setAnalysisError('');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Asistent</h2>
              <p className="text-gray-600">Analýza podle dostupných dat v aplikaci</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
            aria-label="Zavřít"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-3">
                <Loader2 size={20} className="animate-spin text-blue-600 shrink-0" />
                <div>
                  <span className="font-medium text-blue-800">Generuji analýzu...</span>
                  {slowHint && (
                    <p className="text-sm text-blue-700 mt-1">
                      Analýza trvá déle než obvykle…
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {analysisError && !isAnalyzing && (
            <div
              className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
              role="alert"
            >
              {analysisError}
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-semibold text-gray-800">AI analýza návrhů</h3>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Generuji analýzu...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Spustit AI analýzu
                    </>
                  )}
                </button>
                {aiAnalysis && (
                  <button
                    type="button"
                    onClick={handleClearResults}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    <RefreshCw size={18} />
                    Vymazat výsledky
                  </button>
                )}
              </div>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontext soutěže (volitelné)
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="např. zadání nebo zaměření soutěže"
              />
            </div>

            {aiAnalysis && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-600" />
                  Výstup analýzy
                </h4>
                <AIReportPanel reportText={aiAnalysis} />
              </div>
            )}

            {!aiAnalysis && !isAnalyzing && !analysisError && (
              <div className="text-center py-16 text-gray-500">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={32} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">AI analýza návrhů</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Klikněte na „Spustit AI analýzu“ pro textové shrnutí podle aktuálních dat v tabulce.
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <CheckCircle size={16} />
                  <span>Pouze dostupná čísla a indikátory</span>
                  <span>•</span>
                  <span>Bez HTML ve výstupu</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedAIAssistant;
