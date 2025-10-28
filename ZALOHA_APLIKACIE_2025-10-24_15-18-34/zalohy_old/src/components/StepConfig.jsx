import React, { useState, useEffect } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { useToast } from '../hooks/useToast';

const StepConfig = () => {
  const { config, setConfig, setStep } = useWizard();
  const { showToast } = useToast();
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [model, setModel] = useState(config.model || 'gpt-4o');
  const [isTesting, setIsTesting] = useState(false);
  const [isValid, setIsValid] = useState(null);

  // Validácia API kľúča
  const validateApiKey = (key) => {
    if (!key) return false;
    if (!key.startsWith('sk-')) return false;
    if (key.length < 20) return false;
    return true;
  };

  const isApiKeyValid = validateApiKey(apiKey);

  useEffect(() => {
    if (apiKey && isValid === null) {
      setIsValid(validateApiKey(apiKey));
    }
  }, [apiKey, isValid]);

  const handleSave = () => {
    if (!isApiKeyValid) {
      showToast('Zadajte platný API kľúč', 'error');
      return;
    }
    
    setConfig({ apiKey, model });
    showToast('Konfigurácia uložená', 'success');
  };

  const handleTestConnection = async () => {
    if (!isApiKeyValid) {
      showToast('Najprv zadajte platný API kľúč', 'error');
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
        showToast('✅ Pripojenie úspešné!', 'success');
      } else {
        setIsValid(false);
        const errorData = await response.json();
        showToast(`❌ Chyba: ${errorData.error?.message || response.statusText}`, 'error');
      }
    } catch (error) {
      setIsValid(false);
      showToast(`❌ Chyba: ${error.message}`, 'error');
    }
    setIsTesting(false);
  };

  const handleNext = () => {
    if (!isApiKeyValid) {
      showToast('Najprv uložte platnú konfiguráciu', 'error');
      return;
    }
    setStep('upload');
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">⚙️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Konfigurácia API</h2>
            <p className="text-indigo-100 text-sm">Nastavenie OpenAI API pre analýzu dokumentov</p>
          </div>
        </div>
      </div>
      
      <div className="card-content space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Tip pre začiatok</h4>
              <p className="text-blue-700 text-sm">
                Použite OpenAI API kľúč s prístupom k GPT-4 Vision. Kľúč nájdete v OpenAI dashboarde.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="form-group">
            <label htmlFor="apiKey" className="form-label">
              OpenAI API Kľúč
            </label>
            <div className="relative">
              <input
                type="password"
                id="apiKey"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setIsValid(null);
                }}
                className={`form-input pr-10 ${
                  isValid === true ? 'border-emerald-300 focus:border-emerald-500 focus:ring-emerald-500' :
                  isValid === false ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                  !isApiKeyValid && apiKey ? 'border-red-300 focus:border-red-500 focus:ring-red-500' :
                  ''
                }`}
              />
              {isValid === true && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-emerald-600">✓</span>
                </div>
              )}
              {(isValid === false || (!isApiKeyValid && apiKey)) && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <span className="text-red-600">✗</span>
                </div>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Váš API kľúč je uložený lokálne a nikdy nie je odoslaný na naše servery
            </p>
            {!isApiKeyValid && apiKey && (
              <p className="text-xs text-red-600 mt-1">
                API kľúč musí začínať s "sk-" a mať aspoň 20 znakov
              </p>
            )}
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
              <option value="gpt-4o">GPT-4o (Vision)</option>
              <option value="gpt-4-turbo">GPT-4 Turbo (Vision)</option>
            </select>
            <p className="text-xs text-slate-500 mt-1">
              Odporúčame GPT-4o pre najlepšie výsledky
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button 
            className="btn btn-primary flex-1" 
            onClick={handleSave}
            disabled={!isApiKeyValid}
          >
            <span className="text-lg">💾</span>
            Uložiť konfiguráciu
          </button>
          
          <button
            className="btn btn-secondary flex-1"
            onClick={handleTestConnection}
            disabled={isTesting || !isApiKeyValid}
          >
            {isTesting ? (
              <>
                <div className="spinner w-4 h-4"></div>
                Testovanie...
              </>
            ) : (
              <>
                <span className="text-lg">🔌</span>
                Testovať pripojenie
              </>
            )}
          </button>
        </div>

        <div className="flex justify-end pt-6 border-t border-slate-200">
          <button
            className="btn btn-primary btn-lg"
            onClick={handleNext}
            disabled={!isApiKeyValid}
          >
            Pokračovať na Nahrávanie
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepConfig;







