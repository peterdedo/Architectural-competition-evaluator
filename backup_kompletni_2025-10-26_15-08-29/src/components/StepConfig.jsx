import React, { useState } from 'react';
import ApiTest from './ApiTest';
import { Settings } from 'lucide-react';

const StepConfig = ({ onNext }) => {
  const [apiKlic, setApiKlic] = useState(localStorage.getItem('apiKey') || '');
  const [apiTestPassed, setApiTestPassed] = useState(localStorage.getItem('apiTestPassed') === 'true');
  const [lastTestedKey, setLastTestedKey] = useState(localStorage.getItem('lastTestedKey') || '');
  const [isLoading, setIsLoading] = useState(false);

  const isTestMode = localStorage.getItem('skipApiValidation') === 'true';
  const isApiKlicPlatny = isTestMode || (apiKlic.startsWith('sk-') && apiKlic.length >= 20);
  const isKeyUnchanged = apiKlic === lastTestedKey && apiTestPassed;

  const handleApiKeyChange = (value) => {
    setApiKlic(value);
    // Uložíme API kľúč do localStorage pre použitie v ďalších krokoch
    localStorage.setItem('apiKey', value);
    
    // Reset test only if key actually changed
    if (value !== lastTestedKey) {
      setApiTestPassed(false);
      localStorage.setItem('apiTestPassed', 'false');
    }
  };

  const handleTestComplete = (success) => {
    setApiTestPassed(success);
    localStorage.setItem('apiTestPassed', success.toString());
    if (success) {
      setLastTestedKey(apiKlic);
      localStorage.setItem('lastTestedKey', apiKlic);
    }
  };

  const handleNext = async () => {
    if (!isApiKlicPlatny && !isTestMode) {
      alert('Nejprve zadejte platný API klíč nebo použijte testovací režim');
      return;
    }
    if (!isKeyUnchanged && !apiTestPassed && !isTestMode) {
      alert('Nejprve otestujte API klíč pomocí tlačítka "Testovat API" nebo použijte testovací režim');
      return;
    }
    
    setIsLoading(true);
    try {
      // Simulácia krátkeho loading stavu pre lepšiu UX
      await new Promise(resolve => setTimeout(resolve, 500));
      onNext();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card-active overflow-hidden animate-fade-in">
      <div className="bg-primary text-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Konfigurace API</h2>
            <p className="text-white/80 text-sm">Nastavení OpenAI API pro analýzu dokumentů</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
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

        <div className="space-y-2">
          <label htmlFor="apiKlic" className="block text-sm font-semibold text-slate-700">
            OpenAI API Klíč
          </label>
          <input
            type="password"
            id="apiKlic"
            placeholder="sk-..."
            value={apiKlic}
            onChange={(e) => handleApiKeyChange(e.target.value)}
            className={`block w-full rounded-lg border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm transition-all duration-200 ${
              !isApiKlicPlatny && apiKlic ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''
            }`}
          />
          <p className="text-xs text-slate-500">
            Váš API klíč je uložen lokálně a nikdy není odeslán na naše servery. Bude použit v kroku "Nahrání návrhů" pro AI analýzu PDF dokumentů.
          </p>
          {!isApiKlicPlatny && apiKlic && (
            <p className="text-xs text-red-600">
              API klíč musí začínat s "sk-" a mít alespoň 20 znaků
            </p>
          )}
          {isKeyUnchanged && (
            <p className="text-xs text-green-600 flex items-center gap-1">
              ✅ API klíč byl již otestován a je platný
            </p>
          )}
        </div>

        <ApiTest 
          apiKey={apiKlic} 
          onTestComplete={handleTestComplete}
        />

        <div className="flex justify-between pt-6 border-t border-slate-200">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-500 disabled:opacity-50 disabled:pointer-events-none"
            onClick={async () => {
              // Obísť API validáciu pre testovacie účely
              localStorage.setItem('skipApiValidation', 'true');
              // Aktualizovať stav pre okamžité použitie
              setIsLoading(true);
              try {
                await new Promise(resolve => setTimeout(resolve, 500));
                onNext();
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            title="Použiť pre testovanie bez API kľúča"
          >
            {isLoading ? '⏳ Načítavam...' : '🧪 Testovací režim'}
          </button>
          
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-lg"
            onClick={handleNext}
            disabled={(!isApiKlicPlatny || (!isKeyUnchanged && !apiTestPassed)) || isLoading}
          >
            {isLoading ? '⏳ Načítavam...' : 'Pokračovat na Nahrání návrhů'}
            <span className="text-lg">{isLoading ? '' : '→'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepConfig;