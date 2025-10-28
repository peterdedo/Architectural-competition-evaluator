import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bot, 
  Target, 
  Lightbulb, 
  CheckCircle, 
  RefreshCw,
  Star,
  Settings
} from 'lucide-react';

const AIAssistant = ({ onWeightsUpdate }) => {
  const [activeTab, setActiveTab] = useState('váhy');
  const [context, setContext] = useState('obecná urbanistická soutěž');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiRecommendations, setAiRecommendations] = useState(null);

  const tabs = [
    { id: 'analýza', label: 'Analýza', icon: '📊' },
    { id: 'váhy', label: 'Váhy', icon: '⚖️' },
    { id: 'komentáře', label: 'Komentáře', icon: '💡' }
  ];

  const handleSuggestWeights = async () => {
    setIsGenerating(true);
    
    // Simulácia AI generovania váh
    setTimeout(() => {
      const recommendations = {
        categoryWeights: {
          'Bilance ploch řešeného území': 40,
          'Bilance HPP dle funkce': 40,
          'Bilance parkovacích ploch': 20
        },
        explanation: 'Doporučené váhy reflektují důležitost jednotlivých indikátorů pro celkovou urbanistickou koncepci. Kategorii "Bilance ploch řešeného území" a "Bilance HPP dle funkce" jsme přiřadili vyšší váhu, neboť jsou klíčové pro funkčnost a kvalitu urbanistického návrhu. Kategorii "Bilance parkovacích ploch" jsme přidělili nižší váhu, jelikož parkování je důležité, ale nemělo by dominovat nad ostatními aspekty.'
      };
      
      setAiRecommendations(recommendations);
      setIsGenerating(false);
    }, 2000);
  };

  const handleApplyWeights = () => {
    if (aiRecommendations && onWeightsUpdate) {
      const suggestions = Object.entries(aiRecommendations.categoryWeights).map(([category, weight]) => ({
        category,
        suggestedWeight: weight,
        reason: 'AI doporučení pro kategorii'
      }));
      
      onWeightsUpdate(suggestions);
    }
  };

  const handleClearResults = () => {
    setAiRecommendations(null);
  };

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">AI Asistent</h2>
            <p className="text-purple-100 text-sm">Inteligentní analýza a doporučení</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500 rounded-full">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-white text-sm font-semibold">Připojeno</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-purple-600 shadow-md'
                : 'text-purple-100 hover:bg-white/10'
            }`}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl p-6">
        {activeTab === 'váhy' && (
          <div className="space-y-6">
            {/* Kontext soutěže */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Kontext soutěže
              </label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Zadejte kontext soutěže..."
              />
            </div>

            {/* Doporučení vah */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Doporučení vah</h3>
                <button
                  onClick={handleSuggestWeights}
                  disabled={isGenerating}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Generuje...
                    </>
                  ) : (
                    <>
                      <Star size={16} />
                      Navrhnout váhy
                    </>
                  )}
                </button>
              </div>

              {aiRecommendations ? (
                <div className="space-y-4">
                  {/* AI Doporučení */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle size={20} className="text-green-600" />
                      <span className="font-semibold text-green-800">AI Doporučení</span>
                    </div>
                    <p className="text-green-700 text-sm leading-relaxed">
                      {aiRecommendations.explanation}
                    </p>
                  </div>

                  {/* Doporučené váhy kategorií */}
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3">Doporučené váhy kategorií:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(aiRecommendations.categoryWeights).map(([category, weight]) => (
                        <div key={category} className="bg-gray-50 rounded-lg p-4 text-center">
                          <div className="text-sm text-gray-600 mb-1">{category}</div>
                          <div className="text-2xl font-bold text-blue-600">{weight}%</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleApplyWeights}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle size={16} />
                      Aplikovat váhy
                    </button>
                    <button
                      onClick={handleClearResults}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <RefreshCw size={16} />
                      Vymazat výsledky
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Target size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>Klikněte na "Navrhnout váhy" pro získání AI doporučení</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analýza' && (
          <div className="text-center py-8 text-gray-500">
            <Target size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Analýza funkcionalita bude implementována v budoucí verzi</p>
          </div>
        )}

        {activeTab === 'komentáře' && (
          <div className="text-center py-8 text-gray-500">
            <Lightbulb size={48} className="mx-auto mb-4 text-gray-300" />
            <p>Komentáře funkcionalita bude implementována v budoucí verzi</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;



