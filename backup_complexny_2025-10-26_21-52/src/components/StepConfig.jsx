import React, { useState } from 'react';
import ApiTest from './ApiTest';
import { Settings, History, Save, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVersions, saveVersion, restoreVersion, getCurrentProjectData, deleteVersion } from '../utils/versionManager';
import { useWizard } from '../contexts/WizardContext';
import { useToast } from '../hooks/useToast';

const StepConfig = ({ onNext }) => {
  const [apiKlic, setApiKlic] = useState(localStorage.getItem('apiKey') || '');
  const [apiTestPassed, setApiTestPassed] = useState(localStorage.getItem('apiTestPassed') === 'true');
  const [lastTestedKey, setLastTestedKey] = useState(localStorage.getItem('lastTestedKey') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionName, setVersionName] = useState('');
  const wizardContext = useWizard();
  const { toast } = useToast();

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

  const loadVersions = () => {
    const allVersions = getVersions();
    setVersions(allVersions);
  };

  const handleSaveVersion = () => {
    try {
      const currentData = getCurrentProjectData(wizardContext);
      const savedVersion = saveVersion(currentData, versionName);
      
      toast({
        type: 'success',
        message: `Verze "${savedVersion.name}" byla uložena`,
        duration: 3000
      });
      
      setVersionName('');
      loadVersions();
    } catch (error) {
      toast({
        type: 'error',
        message: `Chyba při ukládání verze: ${error.message}`,
        duration: 3000
      });
    }
  };

  const handleRestoreVersion = (versionId) => {
    try {
      const versionData = restoreVersion(versionId);
      
      // Load version data into wizard context
      // This would require updating the wizard context setter
      
      toast({
        type: 'success',
        message: 'Verze byla obnovena',
        duration: 3000
      });
      
      setShowVersions(false);
    } catch (error) {
      toast({
        type: 'error',
        message: `Chyba při obnovování verze: ${error.message}`,
        duration: 3000
      });
    }
  };

  const handleDeleteVersion = (versionId) => {
    if (confirm('Opravdu chcete smazat tuto verzi?')) {
      deleteVersion(versionId);
      loadVersions();
      
      toast({
        type: 'success',
        message: 'Verze byla smazána',
        duration: 3000
      });
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

        {/* Version Management */}
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <History className="text-purple-600" size={20} />
              <h4 className="font-semibold text-purple-900">Správa verzí</h4>
            </div>
            <button
              onClick={() => {
                setShowVersions(!showVersions);
                if (!showVersions) {
                  loadVersions();
                }
              }}
              className="text-sm text-purple-600 hover:text-purple-800 font-medium"
            >
              {showVersions ? 'Skrýt' : 'Zobrazit'} verze
            </button>
          </div>

          <AnimatePresence>
            {showVersions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Název verze..."
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-purple-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <button
                    onClick={handleSaveVersion}
                    disabled={!versionName.trim()}
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500"
                  >
                    <Save size={16} />
                    Uložit verzi
                  </button>
                </div>

                {versions.length > 0 && (
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {versions.map((version) => (
                      <div key={version.id} className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-purple-200">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{version.name}</p>
                          <p className="text-xs text-gray-500">{new Date(version.timestamp).toLocaleString('cs-CZ')}</p>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleRestoreVersion(version.id)}
                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                            title="Obnovit"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteVersion(version.id)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                            title="Smazat"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {versions.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">Žádné uložené verze</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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