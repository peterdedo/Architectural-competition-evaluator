import React, { useState } from 'react';
import { Save, Download, Trash2 } from 'lucide-react';
import { getVersions, saveVersion, restoreVersion, getCurrentProjectData, deleteVersion } from '../utils/versionManager';
import { useWizard } from '../contexts/WizardContext';
import { useToast } from '../hooks/useToast';

// Uložení/obnovení rozpracované konfigurace (návrhy, váhy, směry) pod pojmenovanou verzí.
// Dřív žilo v samostatném kroku "Konfigurace"; teď je to dostupné odkudkoliv přes menu v hlavičce.
const VersionManagerPanel = () => {
  const [versions, setVersions] = useState(() => getVersions());
  const [versionName, setVersionName] = useState('');
  const [versionNameError, setVersionNameError] = useState('');
  const wizardContext = useWizard();
  const { showToast } = useToast();

  const handleSaveVersion = () => {
    if (!versionName.trim()) {
      setVersionNameError('Zadejte název konfigurace.');
      showToast('Zadejte název konfigurace.', 'error', 5000);
      return;
    }
    setVersionNameError('');
    try {
      const currentData = getCurrentProjectData(wizardContext);
      const savedVersion = saveVersion(currentData, versionName);
      showToast(`Verze „${savedVersion.name}“ byla uložena`, 'success', 5000);
      setVersionName('');
      setVersions(getVersions());
    } catch (error) {
      showToast(`Chyba při ukládání verze: ${error.message}`, 'error', 0);
    }
  };

  const handleRestoreVersion = (versionId) => {
    try {
      restoreVersion(versionId);
      showToast('Verze byla obnovena', 'success', 4000);
    } catch (error) {
      showToast(`Chyba při obnovování verze: ${error.message}`, 'error', 0);
    }
  };

  const handleDeleteVersion = (versionId) => {
    if (confirm('Opravdu chcete smazat tuto verzi?')) {
      deleteVersion(versionId);
      setVersions(getVersions());
      showToast('Verze byla smazána', 'success', 4000);
    }
  };

  return (
    <div className="px-3 py-2 space-y-2 bg-gray-50 rounded-lg mx-1">
      <div className="flex gap-2">
        <input
          type="text"
          placeholder="Název verze..."
          value={versionName}
          onChange={(e) => {
            setVersionName(e.target.value);
            if (versionNameError) setVersionNameError('');
          }}
          aria-invalid={Boolean(versionNameError)}
          aria-describedby={versionNameError ? 'version-name-error' : undefined}
          className={`flex-1 min-w-0 px-2.5 py-1.5 border rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary ${
            versionNameError ? 'border-red-400 bg-red-50' : 'border-gray-300'
          }`}
        />
        <button
          onClick={handleSaveVersion}
          className="inline-flex items-center justify-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold bg-primary text-white hover:bg-primary/90 transition-colors shrink-0"
        >
          <Save size={14} />
          Uložit
        </button>
      </div>
      {versionNameError && (
        <p id="version-name-error" className="text-xs text-red-700">
          {versionNameError}
        </p>
      )}

      {versions.length > 0 ? (
        <div className="max-h-40 overflow-y-auto space-y-1.5">
          {versions.map((version) => (
            <div key={version.id} className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-900 truncate">{version.name}</p>
                <p className="text-[0.65rem] text-gray-500">{new Date(version.timestamp).toLocaleString('cs-CZ')}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <button
                  onClick={() => handleRestoreVersion(version.id)}
                  className="p-1 text-green-600 hover:bg-green-50 rounded"
                  title="Obnovit"
                  aria-label={`Obnovit verzi ${version.name}`}
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDeleteVersion(version.id)}
                  className="p-1 text-red-600 hover:bg-red-50 rounded"
                  title="Smazat"
                  aria-label={`Smazat verzi ${version.name}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center py-2">Žádné uložené verze</p>
      )}
    </div>
  );
};

export default VersionManagerPanel;
