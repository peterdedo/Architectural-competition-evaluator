import React, { useState, useContext, useEffect } from "react";
import { useWizard } from "../contexts/WizardContext";
import { Button } from "./ui/button";
import { useToast } from "../hooks/useToast";
import { Brain, Loader2, CheckCircle, AlertCircle, BarChart3, Settings } from "lucide-react";
import { kategorie } from "../data/indikatory";

export default function AIWeightManager({ 
  contextText: propContextText, 
  setContextText: setPropContextText,
  indikatory = [],
  vybraneIndikatory = new Set(),
  kategorie = []
}) {
  const { weights, categoryWeights, updateWeights } = useWizard();
  const { showToast } = useToast();
  const [contextText, setContextText] = useState(propContextText || "");
  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAIResponse] = useState(null);
  const [error, setError] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pendingWeights, setPendingWeights] = useState(null);

  // Synchronizácia medzi lokálnym a prop contextText
  useEffect(() => {
    if (propContextText !== undefined) {
      setContextText(propContextText);
    }
  }, [propContextText]);

  // Aktualizácia prop contextText pri zmene lokálneho
  const handleContextTextChange = (value) => {
    setContextText(value);
    if (setPropContextText) {
      setPropContextText(value);
    }
  };

  // Auditní log pro sledování změn váh
  const logWeightChange = (type, data, source = 'AI') => {
    try {
      const auditLog = JSON.parse(localStorage.getItem('weight_audit_log') || '[]');
      const logEntry = {
        timestamp: new Date().toISOString(),
        type,
        source,
        data,
        userAgent: navigator.userAgent,
        url: window.location.href
      };
      auditLog.push(logEntry);
      
      // Uchová pouze posledních 50 záznamů
      if (auditLog.length > 50) {
        auditLog.splice(0, auditLog.length - 50);
      }
      
      localStorage.setItem('weight_audit_log', JSON.stringify(auditLog));
      console.log('📝 Auditní log uložen:', logEntry);
    } catch (e) {
      console.warn('Nepodařilo se uložit auditní log:', e);
    }
  };

  const handleGetAIDoporučení = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const apiKey = localStorage.getItem('apiKey') || localStorage.getItem('openai_api_key');
      if (!apiKey) {
        throw new Error('OpenAI API kľúč nie je nastavený');
      }

      const prompt = `
      Na základě tohoto kontextu soutěže:
      "${contextText || "obecná urbanistická soutěž"}"

      Navrhni optimální rozložení vah mezi kategoriemi a indikátory
      pro vyhodnocení projektových návrhů.

      Dostupné kategorie:
      ${kategorie.map(cat => `- ${cat.nazev} (${cat.id})`).join('\n')}

      Vybrané indikátory pro hodnocení (MUSÍŠ navrhnout váhy pro VŠECHNY tyto indikátory):
      ${Array.from(vybraneIndikatory).map(id => {
        const ind = indikatory.find(i => i.id === id);
        return ind ? `- ${ind.nazev} (${ind.id}) - ${ind.jednotka} - kategorie: ${ind.kategorie}` : `- ${id}`;
      }).join('\n')}

      KRITICKÉ POŽADAVKY:
      1. Navrhni váhy pro VŠECHNY ${Array.from(vybraneIndikatory).length} vybraných indikátorů
      2. Každý indikátor musí mít váhu mezi 20-80 (optimálně kolem 50%)
      3. Váhy kategórií musí súčet 100%
      4. Vrať výsledek jako čistý JSON bez komentářů

      DŮLEŽITÉ PRO VÁHY INDIKÁTORŮ:
      - Používej vyššie váhy (20-80%) namiesto nízkych (5-15%)
      - Prioritizuj dôležité indikátory s váhami 60-80%
      - Menej dôležité indikátory daj 20-40%
      - Stredne dôležité indikátory daj 40-60%

      Formát odpovědi:
      {
        "kategorie": { "Bilance ploch řešeného území": 40, "Bilance HPP dle funkce": 40, "Bilance parkovacích ploch": 20 },
        "indikatory": { 
          "C01": 65, "C02": 45, "C03": 70, "C04": 35, "C05": 25, 
          "C06": 55, "C07": 60, "C08": 40, "C09": 50, "C10": 30,
          "C11": 75, "C12": 65, "C13": 45, "C14": 35, "C15": 25,
          "C16": 55, "C17": 60
        }
      }

      DŮLEŽITÉ: Musíš vrátit váhy pro VŠECHNY ${Array.from(vybraneIndikatory).length} vybraných indikátorů!
      `;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('AI nevrátil žádnou odpověď');
      }

      // Bezpečné parsovanie JSON
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (parseError) {
        // Fallback - pokus o opravu JSON
        const corrected = content
          .replace(/,\s*}/g, "}")  // Odstránenie trailing comma
          .replace(/,\s*]/g, "]")  // Odstránenie trailing comma v array
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":')  // Pridanie úvodzoviek k kľúčom
          .replace(/:\s*([^",{\[\s][^,}\]\s]*)/g, ': "$1"');  // Pridanie úvodzoviek k hodnotám
        
        parsed = JSON.parse(corrected);
      }

      if (!parsed.kategorie || !parsed.indikatory) {
        throw new Error('AI nevrátil správný formát dat');
      }

      // Validace dat před aplikací
      const isValidData = Object.values(parsed.kategorie).every(val => 
        typeof val === 'number' && val > 0 && val <= 100
      ) && Object.values(parsed.indikatory).every(val => 
        typeof val === 'number' && val > 0 && val <= 100
      );

      if (!isValidData) {
        throw new Error('AI vrátil neplatné hodnoty váh (musí být čísla 1-100)');
      }

      setAIResponse(parsed);
      setPendingWeights(parsed);
      setShowPreview(true);
      console.log('🔍 AIWeightManager - AI návrh připraven k potvrzení:', parsed);
      console.log('🔍 AIWeightManager - vybrané indikátory:', Array.from(vybraneIndikatory));
      console.log('🔍 AIWeightManager - AI vrátil váhy pro indikátory:', Object.keys(parsed.indikatory || {}));
      
      // Kontrola, či AI vrátil váhy pro všechny vybrané indikátory
      const missingIndicators = Array.from(vybraneIndikatory).filter(id => !parsed.indikatory || !parsed.indikatory[id]);
      if (missingIndicators.length > 0) {
        console.warn('⚠️ AIWeightManager - AI nevrátil váhy pro tyto indikátory:', missingIndicators);
        console.warn('⚠️ AIWeightManager - doplňuji chybějící váhy na 10%');
        
        // Doplň chybějící váhy na 10%
        missingIndicators.forEach(id => {
          parsed.indikatory[id] = 10;
        });
      }
      
      showToast("AI návrh je připraven k potvrzení. Zkontrolujte návrh a potvrďte nebo upravte váhy.", 'info');
    } catch (err) {
      console.error("AI Error:", err);
      setError(err.message);
      
      // Fallback na ruční úpravu váh
      showToast(
        `Nepodařilo se získat AI doporučení: ${err.message}. Můžete upravit váhy ručně.`, 
        'error'
      );
      
      // Loguj chybu do auditního logu
      logWeightChange('AI_ERROR', {
        error: err.message,
        context: contextText,
        timestamp: new Date().toISOString()
      }, 'AI_ERROR');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmWeights = () => {
    if (!pendingWeights) return;
    
    try {
      // Loguj změnu do auditního logu
      logWeightChange('AI_WEIGHTS_CONFIRMED', {
        kategorie: pendingWeights.kategorie,
        indikatory: pendingWeights.indikatory,
        context: contextText
      }, 'AI_CONFIRMED');
      
      // Aplikuj AI doporučení s automatickým přepočítáním výsledků
      updateWeights(pendingWeights.indikatory, pendingWeights.kategorie);
      showToast("AI doporučení bylo úspěšně aplikováno a výsledky přepočítány!", 'success');
      
      setShowPreview(false);
      setPendingWeights(null);
    } catch (err) {
      console.error("Chyba při aplikaci váh:", err);
      showToast(`Chyba při aplikaci váh: ${err.message}`, 'error');
    }
  };

  const handleCancelWeights = () => {
    setShowPreview(false);
    setPendingWeights(null);
    showToast("AI návrh byl zrušen. Můžete upravit váhy ručně.", 'info');
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Context-Aware AI Weight Manager
        </h3>
        <p className="text-sm text-gray-600">
          Zadejte kontext soutěže a AI optimalizuje váhy kategorií a indikátorů
        </p>
      </div>

      {/* Kontext soutěže */}
      <div className="bg-gray-50 p-4 rounded-lg border">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Kontext soutěže / projektu
        </label>
        <textarea
          value={contextText}
          onChange={(e) => handleContextTextChange(e.target.value)}
          placeholder="Např. Urbanistická soutěž zaměřená na udržitelný rozvoj městského centra, rezidenční čtvrť s důrazem na zelené plochy, kampus univerzity s moderními technologiemi..."
          className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          rows={3}
        />
        <p className="text-xs text-gray-500 mt-2">
          💡 Kontext pomáhá AI lépe pochopit charakter soutěže a navrhnout relevantní váhy
        </p>
      </div>

      {/* Tlačidlá */}
      <div className="flex items-center justify-center gap-3">
        <Button 
          onClick={handleGetAIDoporučení} 
          disabled={isLoading}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generuji komentáře...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Získat AI doporučení
            </>
          )}
        </Button>
      </div>

      {/* Model info */}
      <div className="text-center">
        <p className="text-xs text-gray-400">
          Použitý model: GPT-4o-mini (context-aware)
        </p>
      </div>

      {/* Error zobrazenie */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {/* AI Response zobrazenie */}
      {aiResponse && (
        <div className="bg-gray-50 p-4 rounded-lg shadow-inner mt-4">
          <div className="flex items-center gap-2 text-green-700 mb-4">
            <CheckCircle className="w-5 h-5" />
            <span className="font-semibold">AI doporučení bylo úspěšně aplikováno!</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Váhy kategorií
              </h4>
              <div className="space-y-2">
                {Object.entries(aiResponse.kategorie || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 truncate">{key}</span>
                    <span className="font-medium text-blue-600">{value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Váhy indikátorů
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(aiResponse.indikatory || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 truncate">{key}</span>
                    <span className="font-medium text-green-600">{value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview a potvrdenie AI návrhu */}
      {showPreview && pendingWeights && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
          <div className="flex items-center gap-2 text-blue-700 mb-4">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">AI návrh připraven k potvrzení</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="bg-white p-4 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Navrhované váhy kategorií
              </h4>
              <div className="space-y-2">
                {Object.entries(pendingWeights.kategorie || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 truncate">{key}</span>
                    <span className="font-medium text-blue-600">{value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg border">
              <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Navrhované váhy indikátorů
              </h4>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {Object.entries(pendingWeights.indikatory || {}).map(([key, value]) => {
                  const indicator = indikatory.find(ind => ind.id === key);
                  const displayName = indicator ? indicator.nazev : key;
                  return (
                    <div key={key} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 truncate" title={displayName}>{displayName}</span>
                      <span className="font-medium text-green-600">{value}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3">
            <Button 
              onClick={handleConfirmWeights}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <CheckCircle className="w-4 h-4" />
              Potvrdit a aplikovat
            </Button>
            
            <Button 
              onClick={handleCancelWeights}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium"
            >
              <AlertCircle className="w-4 h-4" />
              Zrušit
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}