import React, { useState } from 'react';
import ApiTest from './ApiTest';
import { Settings, History, Save, Download, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getVersions, saveVersion, restoreVersion, getCurrentProjectData, deleteVersion } from '../utils/versionManager';
import { useWizard } from '../contexts/WizardContext';
import { useToast } from '../hooks/useToast';

const StepConfig = ({ onNext }) => {
  const [apiTestPassed, setApiTestPassed] = useState(localStorage.getItem('apiTestPassed') === 'true');
  const [isLoading, setIsLoading] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState([]);
  const [versionName, setVersionName] = useState('');
  const wizardContext = useWizard();
  const { showToast } = useToast();

  const isTestMode = localStorage.getItem('skipApiValidation') === 'true';
  const canContinue = isTestMode || apiTestPassed;

  const handleTestComplete = (success) => {
    setApiTestPassed(success);
    localStorage.setItem('apiTestPassed', success.toString());
  };

  const loadVersions = () => {
    const allVersions = getVersions();
    setVersions(allVersions);
  };

  const handleSaveVersion = () => {
    try {
      const currentData = getCurrentProjectData(wizardContext);
      const savedVersion = saveVersion(currentData, versionName);

      showToast(`Verze „${savedVersion.name}“ byla uložena`, 'success', 5000);

      setVersionName('');
      loadVersions();
    } catch (error) {
      showToast(`Chyba při ukládání verze: ${error.message}`, 'error', 0);
    }
  };

  const handleRestoreVersion = (versionId) => {
    try {
      restoreVersion(versionId);

      showToast('Verze byla obnovena', 'success', 4000);

      setShowVersions(false);
    } catch (error) {
      showToast(`Chyba při obnovování verze: ${error.message}`, 'error', 0);
    }
  };

  const handleDeleteVersion = (versionId) => {
    if (confirm('Opravdu chcete smazat tuto verzi?')) {
      deleteVersion(versionId);
      loadVersions();

      showToast('Verze byla smazána', 'success', 4000);
    }
  };

  const handleNext = async () => {
    if (!canContinue) {
      alert('Nejprve otestujte připojení k serverovému proxy (tlačítko „Testovat API“) nebo použijte testovací režim.');
      return;
    }

    setIsLoading(true);
    try {
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
            <p className="text-white/80 text-sm">Ověření serverového OpenAI proxy a volitelné nastavení</p>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Jak to funguje</h4>
              <p className="text-blue-700 text-sm">
                Aplikace neposílá API klíč z prohlížeče. Volání jdou na <code className="text-xs bg-blue-100 px-1 rounded">/api/openai/…</code>;
                klíč <code className="text-xs bg-blue-100 px-1 rounded">OPENAI_API_KEY</code> drží server (Vercel) nebo lokální proxy při{' '}
                <code className="text-xs bg-blue-100 px-1 rounded">npm run dev</code>.
              </p>
            </div>
          </div>
        </div>

        <ApiTest onTestComplete={handleTestComplete} />

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
              localStorage.setItem('skipApiValidation', 'true');
              setIsLoading(true);
              try {
                await new Promise(resolve => setTimeout(resolve, 500));
                onNext();
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={isLoading}
            title="Použít pro testování bez ověření proxy"
          >
            {isLoading ? '⏳ Načítám...' : '🧪 Testovací režim'}
          </button>

          <button
            className="inline-flex items-center justify-center gap-2 rounded-lg px-6 py-3 text-base font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-lg"
            onClick={handleNext}
            disabled={!canContinue || isLoading}
            title={!canContinue ? 'Nejprve úspěšně otestujte proxy nebo použijte testovací režim' : ''}
          >
            {isLoading ? '⏳ Načítám...' : 'Pokračovat na výběr kritérií'}
            <span className="text-lg">{isLoading ? '' : '→'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepConfig;
