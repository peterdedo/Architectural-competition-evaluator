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

  // Načítanie API kľúča z localStorage (zadaného v StepConfig)
  const apiKey = localStorage.getItem('apiKey') || import.meta.env.VITE_OPENAI_KEY || '';
  const { isAnalyzing, analysisProgress, analyzeComparison, generateComments } = useAIAssistant(apiKey);

  const vybraneIndikatoryList = indikatory.filter(ind => vybraneIndikatory.has(ind.id));
  const vybraneNavrhyData = navrhy.filter(navrh => vybraneNavrhy.has(navrh.id));
  
  // Debug logy
  console.log('🔍 AdvancedAIAssistant - navrhy:', navrhy);
  console.log('🔍 AdvancedAIAssistant - vybraneNavrhy:', vybraneNavrhy);
  console.log('🔍 AdvancedAIAssistant - vybraneNavrhyData:', vybraneNavrhyData);
  console.log('🔍 AdvancedAIAssistant - vybraneIndikatoryList:', vybraneIndikatoryList);

  // AI Analýza - spojená funkcia pre analýzu aj komentáre
  const handleAIAnalysis = async () => {
    console.log('🔍 handleAIAnalysis - vybraneNavrhyData.length:', vybraneNavrhyData.length);
    console.log('🔍 handleAIAnalysis - vybraneIndikatoryList.length:', vybraneIndikatoryList.length);
    
    // Ak nie sú dáta, zobrazíme chybu
    if (vybraneNavrhyData.length === 0) {
      console.log('⚠️ Žiadne vybrané návrhy pre analýzu');
      const errorAnalysis = {
        summary: "Chyba: Nie sú vybrané žiadne návrhy pre analýzu. Prosím, vyberte návrhy v predchádzajúcich krokoch.",
        strengths: [],
        weaknesses: [],
        recommendations: [],
        scores: []
      };
      setAiAnalysis(errorAnalysis);
      return;
    }
    
    // Ak nie je API kľúč, použijeme mock dáta
    if (!apiKey) {
      console.log('⚠️ Používam mock AI analýzu (OpenAI API klíč nie je nastavený)');
      
      const mockAnalysis = {
        summary: "Analýza ukazuje, že návrhy mají různou kvalitu z hlediska urbanistických principů. Návrhy vykazují různé přístupy k řešení urbanistických výzev, s důrazem na udržitelnost a funkčnost. Celkově soutěž přinesla kvalitní řešení s potenciálem pro další rozvoj.",
        strengths: [
          "Dobré využití zelených ploch a přírodních prvků",
          "Funkční rozložení prostorů s důrazem na účelnost",
          "Respektování okolního prostředí a kontextu",
          "Inovativní řešení dopravních problémů",
          "Kvalitní architektonické zpracování"
        ],
        weaknesses: [
          "Nedostatečné parkovací kapacity pro očekávaný provoz",
          "Slabá propojenost s veřejnou dopravou",
          "Chybějící komunitní prostory a veřejné funkce",
          "Nedostatečné řešení energetické efektivity",
          "Omezené možnosti budoucího rozvoje"
        ],
        recommendations: [
          "Zvýšit podíl zelených ploch na minimálně 30%",
          "Zlepšit dopravní obslužnost a propojení s MHD",
          "Přidat více komunitních funkcí a veřejných prostorů",
          "Implementovat energeticky úsporné technologie",
          "Zvýšit flexibilitu prostorového uspořádání"
        ],
        scores: vybraneNavrhyData.map((navrh, index) => ({
          id: navrh.id,
          name: navrh.nazev,
          score: Math.round(65 + (index * 8) + Math.random() * 20), // 65-95
          reasoning: `Návrh ${navrh.nazev} dosáhl dobrého skóre díky kvalitnímu urbanistickému řešení s důrazem na udržitelnost a funkčnost.`
        }))
      };
      
      setAiAnalysis(mockAnalysis);
      return;
    }

    try {
      const analysisData = {
        navrhy: vybraneNavrhyData,
        indikatory: vybraneIndikatoryList,
        vahy: vahy,
        categoryWeights: categoryWeights
      };

      // Spustíme analýzu aj komentáre súčasne
      const [analysisResult, commentsResult] = await Promise.all([
        analyzeComparison(analysisData, context),
        generateComments(vybraneNavrhyData, vybraneIndikatoryList, vahy, context)
      ]);

      if (analysisResult.success) {
        setAiAnalysis(analysisResult.analysis);
      } else {
        alert('Chyba při AI analýze: ' + analysisResult.error);
      }

      if (commentsResult.success) {
        setAiComments(commentsResult.comments);
      } else {
        alert('Chyba při generování komentářů: ' + commentsResult.error);
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      alert('Chyba při AI analýze: ' + error.message);
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

        {/* Content - zjednodušené bez sidebaru */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Progress bar */}
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-2">
                <Loader2 size={20} className="animate-spin text-blue-600" />
                <span className="font-medium text-blue-800">AI analyzuje návrhy...</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress}%` }}
                />
              </div>
              <div className="text-sm text-blue-600 mt-1">{analysisProgress}% dokončeno</div>
            </motion.div>
          )}

          {/* AI Analýza - zjednodušená sekcia */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-800">AI Analýza návrhů</h3>
              <div className="flex gap-3">
                <button
                  onClick={handleAIAnalysis}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Analyzuje... ({analysisProgress}%)
                    </>
                  ) : (
                    <>
                      <BarChart3 size={18} />
                      Spustit analýzu
                    </>
                  )}
                </button>
                {(aiAnalysis || aiComments) && (
                  <button
                    onClick={handleClearResults}
                    className="flex items-center gap-2 px-4 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
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
                  <BarChart3 size={20} />
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
                  <MessageSquare size={20} />
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
              <div className="text-center py-12 text-gray-500">
                <BarChart3 size={64} className="mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-700 mb-2">AI Analýza návrhů</h3>
                <p className="text-gray-500">Klikněte na "Spustit analýzu" pro získání AI analýzy návrhů</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedAIAssistant;