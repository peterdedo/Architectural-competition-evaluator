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
  Sparkles
} from 'lucide-react';
import useAIAssistant from '../hooks/useAIAssistant';

const AIAssistant = ({ isOpen, onClose, data }) => {
  const [activeTab, setActiveTab] = useState('analysis');
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [comparisonProposals, setComparisonProposals] = useState({ first: null, second: null });
  const [contextText, setContextText] = useState('');
  const [aiComments, setAiComments] = useState('');

  const { 
    analyzeProposals, 
    generateComment, 
    compareProposals,
    generateComments,
    isAnalyzing, 
    analysisProgress, 
    lastAnalysis 
  } = useAIAssistant();

  const handleAnalyzeAll = async () => {
    const result = await analyzeProposals(data.navrhy, data.indicators, data.weights);
    if (result.success) {
      console.log('AI analýza dokončena:', result.analysis);
    }
  };

  const handleGenerateComment = async (navrh) => {
    const result = await generateComment(navrh, data.indicators, data.weights);
    if (result.success) {
      console.log('Komentář vygenerován:', result.comment);
    }
  };

  const handleCompareProposals = async () => {
    if (!comparisonProposals.first || !comparisonProposals.second) return;
    
    const result = await compareProposals(
      comparisonProposals.first, 
      comparisonProposals.second, 
      data.indicators, 
      data.weights
    );
    if (result.success) {
      console.log('Porovnání dokončeno:', result.comparison);
    }
  };

  const handleGenerateComments = async () => {
    const result = await generateComments(data.navrhy, data.indicators, data.weights, contextText);
    if (result.success) {
      setAiComments(result.comments);
      console.log('AI hodnocení vygenerováno:', result.comments);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Bot size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Asistent</h2>
                  <p className="text-white/80">Inteligentní analýza a doporučení</p>
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          <div className="flex h-[calc(90vh-120px)]">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200 p-4">
              <nav className="space-y-2">
                {[
                  { id: 'analysis', label: 'Celková analýza', icon: BarChart3 },
                  { id: 'comments', label: 'Komentáře k návrhům', icon: FileText },
                  { id: 'comparison', label: 'Porovnání návrhů', icon: TrendingUp },
                  { id: 'insights', label: 'Insights', icon: Lightbulb }
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === id 
                        ? 'bg-blue-100 text-blue-700 font-medium' 
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon size={18} />
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
                {activeTab === 'analysis' && (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">Celková analýza návrhů</h3>
                      <motion.button
                        onClick={handleAnalyzeAll}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Sparkles size={18} />
                        Spustit AI analýzu
                      </motion.button>
                    </div>

                    {lastAnalysis ? (
                      <div className="space-y-6">
                        {/* Shrnutí */}
                        <div className="bg-blue-50 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-blue-900 mb-4">Shrnutí analýzy</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-900">{lastAnalysis.summary.totalProposals}</div>
                              <div className="text-sm text-blue-700">Návrhů analyzováno</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-900">{lastAnalysis.summary.averageScore}%</div>
                              <div className="text-sm text-blue-700">Průměrné skóre</div>
                            </div>
                            <div className="text-center">
                              <div className="text-2xl font-bold text-blue-900">{lastAnalysis.summary.totalIndicators}</div>
                              <div className="text-sm text-blue-700">Indikátorů</div>
                            </div>
                          </div>
                        </div>

                        {/* Doporučení */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">Doporučení</h4>
                          {lastAnalysis.recommendations.map((rec, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="flex items-start gap-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getPriorityColor(rec.priority)}`}>
                                  {rec.type === 'strength' ? <CheckCircle size={16} /> : 
                                   rec.type === 'improvement' ? <AlertTriangle size={16} /> : 
                                   <Target size={16} />}
                                </div>
                                <div className="flex-1">
                                  <h5 className="font-semibold text-gray-900">{rec.title}</h5>
                                  <p className="text-gray-600 mt-1">{rec.description}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Rizikové faktory */}
                        <div className="space-y-4">
                          <h4 className="text-lg font-semibold text-gray-900">Rizikové faktory</h4>
                          {lastAnalysis.riskFactors.map((risk, index) => (
                            <div key={index} className="bg-white border border-gray-200 rounded-xl p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-semibold text-gray-900">{risk.factor}</h5>
                                  <p className="text-sm text-gray-600">Ovlivněno {risk.affectedProposals} návrhy</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(risk.severity)}`}>
                                  {risk.severity === 'high' ? 'Vysoké' : risk.severity === 'medium' ? 'Střední' : 'Nízké'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Bot size={48} className="text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Spusťte AI analýzu</h4>
                        <p className="text-gray-600">Klikněte na tlačítko výše pro zahájení inteligentní analýzy všech návrhů.</p>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'comments' && (
                  <motion.div
                    key="comments"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold text-gray-900">AI Hodnocení návrhů</h3>
                      <motion.button
                        onClick={handleGenerateComments}
                        disabled={isAnalyzing}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FileText size={16} />
                        {isAnalyzing ? 'Generuji...' : 'Generovat hodnocení'}
                      </motion.button>
                    </div>

                    {/* Kontext soutěže */}
                    <div className="bg-gray-50 p-4 rounded-lg border">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kontext soutěže / projektu
                      </label>
                      <textarea
                        value={contextText}
                        onChange={(e) => setContextText(e.target.value)}
                        placeholder="Např. Urbanistická soutěž zaměřená na udržitelný rozvoj městského centra, rezidenční čtvrť s důrazem na zelené plochy..."
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        rows={3}
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        💡 Kontext pomáhá AI lépe pochopit charakter soutěže a navrhnout relevantní hodnocení
                      </p>
                    </div>

                    {/* AI komentáře */}
                    {aiComments && (
                      <div className="ai-comments-container mt-4">
                        <div className="ai-comments-header">
                          <CheckCircle className="w-6 h-6 text-green-600" />
                          <h4 className="text-lg font-semibold text-gray-900">AI Hodnocení návrhů</h4>
                        </div>
                        <div className="ai-comments-content" dangerouslySetInnerHTML={{ __html: aiComments }} />
                      </div>
                    )}

                    {/* Model info */}
                    <div className="text-center">
                      <p className="text-xs text-gray-400">
                        Použitý model: GPT-4o-mini (context-aware)
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'comparison' && (
                  <motion.div
                    key="comparison"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900">Porovnání návrhů</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">První návrh</label>
                        <select
                          value={comparisonProposals.first?.id || ''}
                          onChange={(e) => {
                            const navrh = data.navrhy?.find(n => n.id === e.target.value);
                            setComparisonProposals(prev => ({ ...prev, first: navrh }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Vyberte návrh</option>
                          {data.navrhy?.map(navrh => (
                            <option key={navrh.id} value={navrh.id}>{navrh.nazev}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Druhý návrh</label>
                        <select
                          value={comparisonProposals.second?.id || ''}
                          onChange={(e) => {
                            const navrh = data.navrhy?.find(n => n.id === e.target.value);
                            setComparisonProposals(prev => ({ ...prev, second: navrh }));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Vyberte návrh</option>
                          {data.navrhy?.map(navrh => (
                            <option key={navrh.id} value={navrh.id}>{navrh.nazev}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <motion.button
                      onClick={handleCompareProposals}
                      disabled={isAnalyzing || !comparisonProposals.first || !comparisonProposals.second}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg transition-all disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <TrendingUp size={18} />
                      Porovnat návrhy
                    </motion.button>
                  </motion.div>
                )}

                {activeTab === 'insights' && (
                  <motion.div
                    key="insights"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900">AI Insights</h3>
                    
                    {lastAnalysis?.insights ? (
                      <div className="space-y-4">
                        {lastAnalysis.insights.map((insight, index) => (
                          <div key={index} className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-200">
                            <div className="flex items-start gap-3">
                              <Lightbulb size={20} className="text-blue-600 mt-1" />
                              <p className="text-gray-800">{insight}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Lightbulb size={48} className="text-gray-400 mx-auto mb-4" />
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">Žádné insights</h4>
                        <p className="text-gray-600">Spusťte celkovou analýzu pro zobrazení AI insights.</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AIAssistant;
