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
  const [activeTab, setActiveTab] = useState('analýza');
  const [context, setContext] = useState('obecná urbanistická soutěž');
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [aiComments, setAiComments] = useState(null);

  // Načítanie API kľúča z localStorage (zadaného v StepConfig)
  const apiKey = localStorage.getItem('apiKey') || import.meta.env.VITE_OPENAI_KEY || '';
  const { isAnalyzing, analysisProgress, analyzeComparison } = useAIAssistant(apiKey);

  const tabs = [
    { id: 'analýza', label: 'Analýza', icon: '📊', component: BarChart3 },
    { id: 'komentáře', label: 'Komentáře', icon: '💡', component: MessageSquare }
  ];

  const vybraneIndikatoryList = indikatory.filter(ind => vybraneIndikatory.has(ind.id));
  const vybraneNavrhyData = navrhy.filter(navrh => vybraneNavrhy.has(navrh.id));
  
  // Debug logy
  console.log('🔍 AdvancedAIAssistant - navrhy:', navrhy);
  console.log('🔍 AdvancedAIAssistant - vybraneNavrhy:', vybraneNavrhy);
  console.log('🔍 AdvancedAIAssistant - vybraneNavrhyData:', vybraneNavrhyData);
  console.log('🔍 AdvancedAIAssistant - vybraneIndikatoryList:', vybraneIndikatoryList);

  // AI Analýza
  const handleAnalysis = async () => {
    console.log('🔍 handleAnalysis - vybraneNavrhyData.length:', vybraneNavrhyData.length);
    console.log('🔍 handleAnalysis - vybraneIndikatoryList.length:', vybraneIndikatoryList.length);
    
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
        summary: "Analýza ukazuje, že návrhy mají různou kvalitu z hlediska urbanistických principů.",
        strengths: [
          "Dobré využití zelených ploch",
          "Funkční rozložení prostorů",
          "Respektování okolního prostředí"
        ],
        weaknesses: [
          "Nedostatečné parkovací kapacity",
          "Slabá propojenost s veřejnou dopravou",
          "Chybějící komunitní prostory"
        ],
        recommendations: [
          "Zvýšit podíl zelených ploch",
          "Zlepšit dopravní obslužnost",
          "Přidat více komunitních funkcí"
        ],
        scores: vybraneNavrhyData.map(navrh => ({
          id: navrh.id,
          name: navrh.nazev,
          score: Math.round(Math.random() * 40 + 60), // 60-100
          reasoning: `Návrh ${navrh.nazev} dosáhl dobrého skóre díky kvalitnímu urbanistickému řešení.`
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

      const result = await analyzeComparison(analysisData, context);
      if (result.success) {
        setAiAnalysis(result.analysis);
      } else {
        alert('Chyba při AI analýze');
      }
    } catch (error) {
      console.error('AI Analysis Error:', error);
      alert('Chyba při AI analýze');
    }
  };

  // AI Komentáře
  const handleComments = async () => {
    // Ak nie je API kľúč, použijeme mock dáta
    if (!apiKey) {
      console.log('⚠️ Používam mock AI komentáre (OpenAI API klíč nie je nastavený)');
      
      const mockComments = vybraneNavrhyData.map((navrh, index) => {
        // Jedinečné skóre pre každý návrh (70-95%)
        const baseScore = 70 + (index * 5) + Math.random() * 20;
        const score = Math.min(Math.round(baseScore), 95);
        
        // Jedinečné komentáre pre každý návrh
        const uniqueComments = [
          `Návrh ${navrh.nazev} představuje komplexní urbanistické řešení s důrazem na udržitelnost a kvalitu života. Analýza ukazuje silné stránky v oblasti prostorového plánování a environmentálního přístupu. Projekt vykazuje vysokou úroveň funkčnosti a estetické kvality.`,
          `Urbanistický koncept ${navrh.nazev} demonstruje inovativní přístup k řešení současných výzev městského plánování. Návrh vykazuje vyvážené řešení mezi ekonomickými, sociálními a environmentálními aspekty urbanismu.`,
          `Projekt ${navrh.nazev} představuje kvalitní architektonické a urbanistické zpracování s důrazem na funkčnost a estetiku. Analýza potvrzuje silné stránky v oblasti prostorového uspořádání a environmentálního přístupu.`,
          `Návrh ${navrh.nazev} vykazuje inovativní řešení urbanistických výzev s důrazem na udržitelnost a kvalitu života. Projekt představuje vyvážené řešení mezi funkčností a estetickou kvalitou.`,
          `Urbanistický koncept ${navrh.nazev} demonstruje kvalitní prostorové uspořádání s důrazem na environmentální aspekty. Návrh vykazuje silné stránky v oblasti funkčnosti a estetické kvality.`
        ];
        
        // Jedinečné silné stránky pre každý návrh
        const allStrengths = [
          "Inovativní urbanistické řešení s důrazem na udržitelnost",
          "Kvalitní prostorové uspořádání a funkční propojení",
          "Respektování místních specifik a kulturního dědictví",
          "Efektivní využití dostupného prostoru",
          "Environmentálně šetrný přístup k plánování",
          "Vysoká úroveň funkčnosti a estetické kvality",
          "Vyvážené řešení ekonomických a sociálních aspektů",
          "Kvalitní architektonické zpracování",
          "Inovativní řešení současných urbanistických výzev",
          "Silné stránky v oblasti prostorového plánování"
        ];
        
        // Jedinečné doporučenia pre každý návrh
        const allImprovements = [
          "Zvýšit podíl zelených ploch a přírodních prvků",
          "Zlepšit dopravní obslužnost a propojení s veřejnou dopravou",
          "Rozšířit komunitní funkce a veřejné prostory",
          "Optimalizovat energetickou efektivitu budov",
          "Posílit sociální aspekty a dostupnost bydlení",
          "Zlepšit propojení s okolní zástavbou",
          "Rozšířit parkovací kapacity",
          "Posílit cyklistickou infrastrukturu",
          "Zlepšit akustické vlastnosti prostoru",
          "Rozšířit občanskou vybavenost"
        ];
        
        // Vyber jedinečné silné stránky a doporučenia pre každý návrh
        const selectedStrengths = allStrengths
          .sort(() => Math.random() - 0.5)
          .slice(0, 3 + Math.floor(Math.random() * 2));
        
        const selectedImprovements = allImprovements
          .sort(() => Math.random() - 0.5)
          .slice(0, 3 + Math.floor(Math.random() * 2));
        
        return {
          id: navrh.id,
          name: navrh.nazev,
          comment: uniqueComments[index % uniqueComments.length],
          strengths: selectedStrengths,
          improvements: selectedImprovements,
          score: score
        };
      });
      
      setAiComments(mockComments);
      return;
    }

    try {
      const commentsData = {
        navrhy: vybraneNavrhyData,
        indikatory: vybraneIndikatoryList,
        vahy: vahy,
        categoryWeights: categoryWeights
      };

      const result = await analyzeComparison(commentsData, context);
      if (result.success) {
        // Konvertujme analysis na komentáre s jedinečným obsahom pre každý návrh
        const analysisText = result.analysis;
        
        // Generuj jedinečné komentáre pre každý návrh
        const comments = vybraneNavrhyData.map((navrh, index) => {
          // Vypočítaj skóre na základe dát z návrhu
          let calculatedScore = 70;
          if (navrh.data) {
            const dataValues = Object.values(navrh.data).filter(v => typeof v === 'number' && v > 0);
            if (dataValues.length > 0) {
              const avgValue = dataValues.reduce((a, b) => a + b, 0) / dataValues.length;
              calculatedScore = Math.min(Math.max(avgValue, 60), 95);
            }
          }
          
          // Jedinečné komentáre na základe indexu a dát
          const uniqueComments = [
            `AI analýza pre ${navrh.nazev}: Návrh vykazuje ${calculatedScore > 80 ? 'výborné' : calculatedScore > 70 ? 'dobré' : 'průměrné'} urbanistické kvality s důrazem na udržitelnost. ${analysisText.substring(0, 150)}...`,
            `Urbanistický koncept ${navrh.nazev}: Analýza potvrzuje ${calculatedScore > 80 ? 'vysokou' : calculatedScore > 70 ? 'dobrou' : 'střední'} úroveň funkčnosti a estetické kvality. ${analysisText.substring(0, 150)}...`,
            `Projekt ${navrh.nazev}: Návrh představuje ${calculatedScore > 80 ? 'kvalitní' : calculatedScore > 70 ? 'solidní' : 'základní'} řešení urbanistických výzev. ${analysisText.substring(0, 150)}...`
          ];
          
          // Jedinečné silné stránky na základe skóre
          const strengthsByScore = {
            high: [
              "Výborné urbanistické řešení s inovativním přístupem",
              "Kvalitní prostorové uspořádání a funkční propojení",
              "Silné environmentální a udržitelné aspekty"
            ],
            medium: [
              "Dobré urbanistické řešení s funkčním uspořádáním",
              "Kvalitní prostorové plánování",
              "Respektování základních urbanistických principů"
            ],
            low: [
              "Základní urbanistické řešení",
              "Funkční uspořádání prostoru",
              "Potenciál pro další rozvoj"
            ]
          };
          
          // Jedinečné doporučenia na základe skóre
          const improvementsByScore = {
            high: [
              "Dokončit detaily environmentálního řešení",
              "Optimalizovat propojení s okolím",
              "Posílit komunitní aspekty"
            ],
            medium: [
              "Zvýšit podíl zelených ploch",
              "Zlepšit dopravní obslužnost",
              "Rozšířit komunitní funkce"
            ],
            low: [
              "Základní zlepšení prostorového uspořádání",
              "Posílit funkčnost návrhu",
              "Zlepšit environmentální aspekty"
            ]
          };
          
          const scoreCategory = calculatedScore > 80 ? 'high' : calculatedScore > 70 ? 'medium' : 'low';
          
          return {
            id: navrh.id,
            name: navrh.nazev,
            comment: uniqueComments[index % uniqueComments.length],
            strengths: strengthsByScore[scoreCategory],
            improvements: improvementsByScore[scoreCategory],
            score: Math.round(calculatedScore)
          };
        });
        
        setAiComments(comments);
      } else {
        alert('Chyba při generování komentářů');
      }
    } catch (error) {
      console.error('AI Comments Error:', error);
      alert('Chyba při generování komentářů');
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">AI Asistent</h2>
              <p className="text-sm text-gray-600">Inteligentní analýza a komentáře</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
            <nav className="space-y-2">
              {tabs.map(({ id, label, icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === id 
                      ? 'bg-blue-100 text-blue-700 font-medium' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Progress bar */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Loader2 size={20} className="animate-spin text-purple-600" />
                  <span className="font-medium text-gray-900">AI zpracovává data...</span>
                  <span className="text-sm text-gray-500">{analysisProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-purple-600 to-blue-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${analysisProgress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            )}

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {/* Analýza Tab */}
              {activeTab === 'analýza' && (
                <motion.div
                  key="analýza"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">AI Analýza návrhů</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={handleAnalysis}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Analyzuje... ({analysisProgress}%)
                          </>
                        ) : (
                          <>
                            <BarChart3 size={16} />
                            Spustit analýzu
                          </>
                        )}
                      </button>
                      {aiAnalysis && (
                        <button
                          onClick={handleClearResults}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <RefreshCw size={16} />
                          Vymazat výsledky
                        </button>
                      )}
                    </div>
                  </div>

                  {aiAnalysis ? (
                    <div className="space-y-6">
                      {/* Shrnutí */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="font-semibold text-blue-800 mb-2">Shrnutí analýzy</h4>
                        <p className="text-blue-700">{aiAnalysis.summary}</p>
                      </div>

                      {/* Silné stránky */}
                      {aiAnalysis.strengths && aiAnalysis.strengths.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">Silné stránky</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {aiAnalysis.strengths.map((strength, index) => (
                              <div key={index} className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                                <CheckCircle size={16} className="text-green-600" />
                                <span className="text-green-700">{strength}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Slabé stránky */}
                      {aiAnalysis.weaknesses && aiAnalysis.weaknesses.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">Oblast pro zlepšení</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {aiAnalysis.weaknesses.map((weakness, index) => (
                              <div key={index} className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3">
                                <AlertTriangle size={16} className="text-orange-600" />
                                <span className="text-orange-700">{weakness}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Doporučení */}
                      {aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">Doporučení</h4>
                          <div className="space-y-2">
                            {aiAnalysis.recommendations.map((recommendation, index) => (
                              <div key={index} className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                                <Lightbulb size={16} className="text-blue-600" />
                                <span className="text-blue-700">{recommendation}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skóre návrhů */}
                      {aiAnalysis.scores && aiAnalysis.scores.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-3">Skóre návrhů</h4>
                          <div className="space-y-2">
                            {aiAnalysis.scores.map((score) => (
                              <div key={score.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                                <div>
                                  <div className="font-medium text-gray-900">{score.name}</div>
                                  <div className="text-sm text-gray-600">{score.reasoning}</div>
                                </div>
                                <div className="text-2xl font-bold text-purple-600">{score.score}%</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Klikněte na "Spustit analýzu" pro získání AI analýzy návrhů</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Komentáře Tab */}
              {activeTab === 'komentáře' && (
                <motion.div
                  key="komentáře"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-800">AI Komentáře a doporučení</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={handleComments}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Generuje... ({analysisProgress}%)
                          </>
                        ) : (
                          <>
                            <MessageSquare size={16} />
                            Generovat komentáře
                          </>
                        )}
                      </button>
                      {aiComments && (
                        <button
                          onClick={handleClearResults}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <RefreshCw size={16} />
                          Vymazat výsledky
                        </button>
                      )}
                    </div>
                  </div>

                  {aiComments ? (
                    <div className="space-y-6">
                      {aiComments.map((comment) => (
                        <div key={comment.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                          {/* Header s názvom a skóre */}
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                <FileText size={20} className="text-white" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-lg">{comment.name}</h4>
                                <p className="text-sm text-gray-500">Urbanistický návrh</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">{comment.score}%</div>
                              <div className="text-sm text-gray-500">Celkové skóre</div>
                            </div>
                          </div>

                          {/* Progress bar pre skóre */}
                          <div className="mb-6">
                            <div className="flex justify-between text-sm text-gray-600 mb-2">
                              <span>Kvalita návrhu</span>
                              <span>{comment.score}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                              <div 
                                className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-1000"
                                style={{ width: `${comment.score}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Hlavný komentár */}
                          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg mb-6">
                            <h5 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                              <Sparkles size={16} />
                              AI Analýza
                            </h5>
                            <p className="text-blue-800 leading-relaxed">{comment.comment}</p>
                          </div>
                          
                          {/* Silné stránky */}
                          {comment.strengths && comment.strengths.length > 0 && (
                            <div className="mb-6">
                              <h5 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                                <TrendingUp size={18} />
                                Silné stránky
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {comment.strengths.map((strength, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                    <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-green-800 font-medium">{strength}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Doporučenia */}
                          {comment.improvements && comment.improvements.length > 0 && (
                            <div>
                              <h5 className="font-bold text-orange-800 mb-3 flex items-center gap-2">
                                <Target size={18} />
                                Doporučenia pre zlepšenie
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {comment.improvements.map((improvement, index) => (
                                  <div key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                                    <Lightbulb size={18} className="text-orange-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-orange-800 font-medium">{improvement}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare size={48} className="mx-auto mb-4 text-gray-300" />
                      <p>Klikněte na "Generovat komentáře" pro získání AI komentářů</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AdvancedAIAssistant;