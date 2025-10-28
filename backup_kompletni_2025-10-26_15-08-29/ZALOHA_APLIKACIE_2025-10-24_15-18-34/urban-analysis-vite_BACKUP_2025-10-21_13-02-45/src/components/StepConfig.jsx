import React, { useState } from 'react';
import ApiTest from './ApiTest';
import { Settings } from 'lucide-react';

const StepConfig = ({ onNext }) => {
  const [apiKlic, setApiKlic] = useState(localStorage.getItem('apiKey') || '');
  const [apiTestPassed, setApiTestPassed] = useState(false);

  const isApiKlicPlatny = apiKlic.startsWith('sk-') && apiKlic.length >= 20;

  const handleApiKeyChange = (value) => {
    setApiKlic(value);
    localStorage.setItem('apiKey', value);
    setApiTestPassed(false); // Reset test při změně klíče
  };

  const handleTestComplete = (success) => {
    setApiTestPassed(success);
  };

  const handleNext = () => {
    if (!isApiKlicPlatny) {
      alert('Nejprve zadejte platný API klíč');
      return;
    }
    if (!apiTestPassed) {
      alert('Nejprve otestujte API klíč pomocí tlačítka "Testovat API"');
      return;
    }
    onNext();
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
            Váš API klíč je uložen lokálně a nikdy není odeslán na naše servery
          </p>
          {!isApiKlicPlatny && apiKlic && (
            <p className="text-xs text-red-600">
              API klíč musí začínat s "sk-" a mít alespoň 20 znaků
            </p>
          )}
        </div>

        <ApiTest 
          apiKey={apiKlic} 
          onTestComplete={handleTestComplete}
        />

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-lg"
            onClick={handleNext}
            disabled={!isApiKlicPlatny || !apiTestPassed}
          >
            Pokračovat na Nahrání návrhů
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepConfig;