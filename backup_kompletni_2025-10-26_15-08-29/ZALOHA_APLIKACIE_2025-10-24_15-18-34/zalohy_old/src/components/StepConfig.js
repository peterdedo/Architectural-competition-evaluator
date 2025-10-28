import React, { useState, useEffect } from 'react';

const StepConfig = ({ onNext, onConfigSave }) => {
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4-turbo');
  const [isTesting, setIsTesting] = useState(false);
  const [isValid, setIsValid] = useState(null);

  useEffect(() => {
    // Načtení uložené konfigurace
    const savedKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('gpt_model');
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setModel(savedModel);
  }, []);

  const handleSave = () => {
    if (!apiKey.trim()) {
      alert('Zadejte API klíč');
      return;
    }
    
    // Uložení do localStorage
    localStorage.setItem('openai_api_key', apiKey);
    localStorage.setItem('gpt_model', model);
    
    // Zavolání callbacku
    onConfigSave(apiKey, model);
    
    alert('✅ Konfigurace uložena!');
  };

  const handleTestConnection = async () => {
    if (!apiKey.trim()) {
      alert('Nejdříve zadejte API klíč');
      return;
    }

    setIsTesting(true);
    setIsValid(null);
    
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });

      if (response.ok) {
        setIsValid(true);
        alert('✅ Připojení úspěšné!');
      } else {
        setIsValid(false);
        alert('❌ Chyba: ' + response.statusText);
      }
    } catch (error) {
      setIsValid(false);
      alert('❌ Chyba: ' + error.message);
    }
    setIsTesting(false);
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">⚙️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Konfigurace API</h2>
            <p className="text-indigo-100 text-sm">Nastavení OpenAI API pro analýzu dokumentů</p>
          </div>
        </div>
      </div>
      
      <div className="card-content space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Tip pro začátek</h4>
              <p className="text-blue-700 text-sm">
                Použijte OpenAI API klíč s přístupem k GPT-4 Vision. Klíč najdete v OpenAI dashboardu.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="apiKey" className="form-label">
              OpenAI API Klíč
            </label>
            <div className="relative">
              <input
                type="password"
                id="apiKey"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className={`form-input pr-10 ${
                  isValid === true ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500' :
                  isValid === false ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                  ''
                }`}
              />
              {isValid === true && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-emerald-600">✓</span>
                </div>
              )}
              {isValid === false && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-red-600">✗</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Váš API klíč je uložen lokálně a nikdy není odeslán na naše servery
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="model" className="form-label">
              AI Model
            </label>
            <select
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="form-select"
            >
              <option value="gpt-4-turbo">GPT-4 Turbo (Vision)</option>
              <option value="gpt-4o">GPT-4o (Vision)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Doporučujeme GPT-4 Turbo pro nejlepší výsledky
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            className="btn btn-primary flex-1" 
            onClick={handleSave}
            disabled={!apiKey.trim()}
          >
            <span className="text-lg">💾</span>
            Uložit konfiguraci
          </button>
          
          <button
            className="btn btn-secondary flex-1"
            onClick={handleTestConnection}
            disabled={isTesting || !apiKey.trim()}
          >
            {isTesting ? (
              <>
                <div className="spinner w-4 h-4"></div>
                Testování...
              </>
            ) : (
              <>
                <span className="text-lg">🔌</span>
                Testovat připojení
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onNext('upload')}
            disabled={!apiKey.trim()}
          >
            Pokračovat na Nahrávání
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepConfig;