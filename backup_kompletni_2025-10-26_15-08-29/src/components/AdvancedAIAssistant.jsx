import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  TrendingUp,
  Target,
  FileText,
  BarChart3,
  Sparkles,
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import useAIAssistant from '../hooks/useAIAssistant';

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
  const [aiComments, setAiComments] = useState(null);

  // Načítanie API kľúča z localStorage
  const apiKey = localStorage.getItem('apiKey') || import.meta.env.VITE_OPENAI_KEY || '';
  const { isAnalyzing, analysisProgress, analyzeComparison, generateComments } = useAIAssistant(apiKey);

  const vybraneIndikatoryList = indikatory.filter(ind => vybraneIndikatory.has(ind.id));
  const vybraneNavrhyData = navrhy.filter(navrh => vybraneNavrhy.has(navrh.id));

  // AI Analýza
  const handleAIAnalysis = async () => {
    if (vybraneNavrhyData.length === 0) {
      setAiAnalysis("Chyba: Nie sú vybrané žiadne návrhy pre analýzu.");
      return;
    }
    
    if (!apiKey) {
      setAiAnalysis("Mock analýza: Návrhy vykazují různou kvalitu z hlediska urbanistických principů.");
      return;
    }

    try {
      const analysisData = {
        navrhy: vybraneNavrhyData,
        indikatory: vybraneIndikatoryList,
        vahy: vahy,
        categoryWeights: categoryWeights
      };

      const [analysisResult, commentsResult] = await Promise.all([
        analyzeComparison(analysisData, context),
        generateComments(vybraneNavrhyData, vybraneIndikatoryList, vahy, context)
      ]);

      if (analysisResult.success) {
        setAiAnalysis(analysisResult.analysis);
      } else {
        setAiAnalysis(`Chyba při AI analýze: ${analysisResult.error}`);
      }

      if (commentsResult.success) {
        setAiComments(commentsResult.comments);
      } else {
        setAiComments(`Chyba při generování komentářů: ${commentsResult.error}`);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      setAiAnalysis(`Chyba při AI analýze: ${error.message}`);
      setAiComments(`Chyba při generování komentářů: ${error.message}`);
    }
  };

  const handleClearResults = () => {
    setAiAnalysis(null);
    setAiComments(null);
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
              <Bot size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">AI Asistent</h2>
              <p className="text-gray-600">Inteligentní analýza a komentáře</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Progress bar */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Loader2 size={20} className="animate-spin text-blue-600" />
                <span className="font-medium text-blue-800">AI analyzuje návrhy...</span>
                <span className="ml-auto text-sm text-blue-600 font-semibold">{analysisProgress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3 mb-2">
                <div 
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
            </motion.div>
          )}

          {/* AI Analýza */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">AI Analýza návrhů</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analyzuje... ({analysisProgress}%)
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Spustit AI analýzu
                    </>
                  )}
                </button>
                {(aiAnalysis || aiComments) && (
                  <button
                    onClick={handleClearResults}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                  >
                    <RefreshCw size={18} />
                    Vymazat výsledky
                  </button>
                )}
              </div>
            </div>

            {/* Kontext súťaže */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Kontext súťaže
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Zadajte kontext súťaže..."
              />
            </div>

            {/* Výsledky analýzy */}
            {aiAnalysis && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <BarChart3 size={20} className="text-blue-600" />
                  Shrnutí analýzy
                </h4>
                <div className="prose max-w-none">
                  <div 
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: aiAnalysis }}
                  />
                </div>
              </div>
            )}

            {/* Výsledky komentárov */}
            {aiComments && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <MessageSquare size={20} className="text-green-600" />
                  AI Komentáře a doporučení
                </h4>
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: aiComments }}
                />
              </div>
            )}

            {/* Prázdny stav */}
            {!aiAnalysis && !aiComments && (
              <div className="text-center py-16 text-gray-500">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Sparkles size={32} className="text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-3">AI Analýza návrhů</h3>
                <p className="text-gray-500 mb-4 max-w-md mx-auto">
                  Klikněte na "Spustit AI analýzu" pro získání detailní analýzy a komentářů k návrhům
                </p>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                  <CheckCircle size={16} />
                  <span>Automatická analýza skóre</span>
                  <span>•</span>
                  <span>Detailní komentáře</span>
                  <span>•</span>
                  <span>Doporučení pro zlepšení</span>
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