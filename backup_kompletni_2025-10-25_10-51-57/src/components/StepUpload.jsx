import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  File, 
  Check, 
  X, 
  AlertTriangle, 
  Eye, 
  EyeOff,
  Download,
  Trash2,
  RefreshCw,
  Zap,
  Edit3,
  Save
} from 'lucide-react';
import { useWizard } from '../contexts/WizardContext';
import { useToast } from '../hooks/useToast';
import { usePdfProcessor } from '../hooks/usePdfProcessor';
import { useVisionAnalyzer } from '../hooks/useVisionAnalyzer';
import { indikatory } from '../data/indikatory';

const StepUpload = ({ navrhy, setNavrhy, onNext, onBack }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  
  // Použitie WizardContext pre centralizované ukladanie návrhov
  const wizardContext = useWizard();
  const { setProjects } = wizardContext;
  
  // API kľúč sa načítava z localStorage (nastavený v StepConfig)
  const apiKey = localStorage.getItem('apiKey') || '';
  const { processPdf, isProcessing, progress } = usePdfProcessor();
  const { analyze, isAnalyzing: visionAnalyzing } = useVisionAnalyzer();
  const { showToast } = useToast();

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleFileUpload = useCallback((files) => {
    const noveNavrhy = Array.from(files).map((file, index) => ({
      id: Date.now() + Math.random() + index,
      nazev: file.name.replace('.pdf', ''),
      pdfSoubor: file,
      obrazek: null,
      status: 'připraven',
      data: {},
      vybrany: false
    }));
    
    // Ulož do lokálneho stavu
    setNavrhy(prev => [...prev, ...noveNavrhy]);
    
    // Ulož aj do WizardContext
    setProjects(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return [...prevArray, ...noveNavrhy];
    });
    
    showToast(`Nahrané ${noveNavrhy.length} návrhů`, 'success');
  }, [setNavrhy, setProjects, showToast]);

  const handleZpracovani = async (navrhId) => {
    const navrh = navrhy.find(n => n.id === navrhId);
    if (!navrh || !navrh.pdfSoubor) return;

    setNavrhy(prev => prev.map(n => 
      n.id === navrhId 
        ? { ...n, status: 'zpracovává se' }
        : n
    ));

    setIsAnalyzing(true);
    
    try {
      console.log('🚀 Začínám zpracování PDF:', navrh.nazev);
      
      // Krok 1: Konvertuj PDF na obrázky
      const pdfResult = await processPdf(navrh.pdfSoubor);
      
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || 'Chyba při konverzi PDF');
      }
      
      console.log('✅ PDF konvertováno na obrázky:', pdfResult.images.length, 'stránek');
      
      // Krok 2: AI Vision analýza
      const project = {
        name: navrh.nazev,
        images: pdfResult.images
      };
      
      const criteria = Object.fromEntries(
        indikatory.map(indikator => [
          indikator.id, 
          { 
            name: indikator.nazev, 
            unit: indikator.jednotka,
            description: indikator.popis 
          }
        ])
      );
      
      console.log('📋 criteria:', criteria);
      console.log('🤖 Spouštím AI Vision analýzu...');
      const analysisResult = await analyze(project, criteria, apiKey, 'gpt-4o', !apiKey);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Chyba při AI analýze');
      }
      
      console.log('✅ AI analýza dokončena:', Object.keys(analysisResult.data).length, 'indikátorů');
      console.log('📊 analysisResult.data:', analysisResult.data);
      
      // Krok 3: Ulož výsledky
      const updatedNavrhy = navrhy.map(n => 
            n.id === navrhId 
              ? { 
                  ...n, 
                  status: 'zpracován',
              data: analysisResult.data,
                  errorMessage: null
                }
              : n
      );
      
      setNavrhy(updatedNavrhy);
      
      // Aktualizuj aj v WizardContext
      setProjects(updatedNavrhy);
      
      showToast(`Návrh "${navrh.nazev}" úspěšně zpracován`, 'success');
      
    } catch (error) {
      console.error('❌ Chyba při zpracování:', error);
      
      const errorNavrhy = navrhy.map(n => 
        n.id === navrhId 
          ? { 
              ...n, 
              status: 'chyba',
              errorMessage: error.message
            }
          : n
      );
      
      setNavrhy(errorNavrhy);
      
      // Aktualizuj aj v WizardContext
      setProjects(errorNavrhy);
      
      showToast(`Chyba při zpracování "${navrh.nazev}": ${error.message}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleVymazani = (navrhId) => {
    setNavrhy(prev => prev.filter(n => n.id !== navrhId));
    showToast('Návrh smazán', 'success');
  };

  const handleVybrani = (navrhId) => {
    setNavrhy(prev => prev.map(n => 
      n.id === navrhId 
        ? { ...n, vybrany: !n.vybrany }
        : n
    ));
  };

  // Funkcie pre editáciu názvov
  const startEditingName = (id, currentName) => {
    setEditingName(id);
    setEditingValue(currentName);
  };

  const cancelEditingName = () => {
    setEditingName(null);
    setEditingValue('');
  };

  const saveEditingName = (id) => {
    if (editingValue.trim()) {
      setNavrhy(prev => prev.map(navrh => 
        navrh.id === id ? { ...navrh, nazev: editingValue.trim() } : navrh
      ));
      setProjects(prev => prev.map(navrh => 
        navrh.id === id ? { ...navrh, nazev: editingValue.trim() } : navrh
      ));
    }
    setEditingName(null);
    setEditingValue('');
  };

  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter') {
      saveEditingName(id);
    } else if (e.key === 'Escape') {
      cancelEditingName();
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'připraven': return '⏳';
      case 'zpracovává se': return '🔄';
      case 'zpracován': return '✅';
      case 'chyba': return '❌';
      default: return '📄';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'připraven': return 'Připraven';
      case 'zpracovává se': return 'Zpracovává se';
      case 'zpracován': return 'Zpracován';
      case 'chyba': return 'Chyba';
      default: return 'Neznámý';
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'připraven': return 'badge-warning';
      case 'zpracovává se': return 'badge-info';
      case 'zpracován': return 'badge-success';
      case 'chyba': return 'badge-error';
      default: return 'badge-info';
    }
  };

  const zpracovaneNavrhy = navrhy.filter(n => n.status === 'zpracován');
  const vybraneNavrhy = navrhy.filter(n => n.vybrany);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">📄</span>
          </div>
          <div>
                <h2 className="text-2xl font-bold">Nahrání návrhů</h2>
                <p className="text-indigo-100 text-sm">Nahrajte PDF dokumenty pro analýzu</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        {/* API Key Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">🔑</span>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">OpenAI API klíč</h4>
              <p className="text-blue-700 text-sm">
                {apiKey ? '✅ API klíč je nastaven' : '⚠️ Pro plnou funkcionalnost nastavte OpenAI API klíč v kroku "Konfigurace API"'}
              </p>
            </div>
          </div>
        </div>

            {/* Upload Area */}
            <div className={`upload-area ${dragActive ? 'drag-active' : ''}`}
             onDragEnter={handleDrag}
             onDragLeave={handleDrag}
             onDragOver={handleDrag}
             onDrop={handleDrop}>
          <input
            type="file"
                id="navrhyFiles"
            accept=".pdf"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="hidden"
          />
              <label htmlFor="navrhyFiles" className="cursor-pointer">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Klikněte pro nahrání PDF návrhů
              </h3>
              <p className="text-slate-500 mb-4">
                nebo přetáhněte soubory sem
              </p>
                  <div className="btn btn-secondary">
                <span className="text-lg">📁</span>
                    Vybrat soubory
              </div>
            </div>
          </label>
        </div>

            {/* Návrhy List */}
        {navrhy.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-800">
                Nahrané návrhy ({navrhy.length})
              </h3>
                  <div className="flex gap-2">
                    <button 
                      className="btn btn-primary"
                      onClick={() => {
                        const pendingNavrhy = navrhy.filter(n => n.status === 'připraven');
                        pendingNavrhy.forEach(navrh => handleZpracovani(navrh.id));
                      }}
                      disabled={isAnalyzing || navrhy.every(n => n.status === 'zpracován')}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="spinner w-4 h-4"></div>
                          Zpracovává se... ({Math.round(progress)}%)
                        </>
                      ) : (
                        <>
                          <span className="text-lg">🚀</span>
                          Zpracovat všechny
                        </>
                      )}
                    </button>
                  </div>
            </div>
            
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {navrhy.map((navrh) => (
                    <motion.div
                      key={navrh.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={`project-card ${navrh.vybrany ? 'selected' : ''}`}
                    >
                      <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={navrh.vybrany || false}
                          onChange={() => handleVybrani(navrh.id)}
                      className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                    />
                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-lg">{getStatusIcon(navrh.status)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingName === navrh.id ? (
                            <div className="flex items-center gap-2">
                          <input
                            type="text"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                onKeyDown={(e) => handleKeyPress(e, navrh.id)}
                                className="flex-1 px-2 py-1 text-sm font-semibold text-slate-800 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                autoFocus
                              />
                              <button
                                onClick={() => saveEditingName(navrh.id)}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                title="Uložiť"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={cancelEditingName}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                title="Zrušiť"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-800 truncate flex-1">{navrh.nazev}</h4>
                              <button
                                onClick={() => startEditingName(navrh.id, navrh.nazev)}
                                className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                title="Editovať názov"
                              >
                                <Edit3 size={14} />
                              </button>
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-slate-500">
                              {(navrh.pdfSoubor?.size / 1024).toFixed(1)} KB
                            </span>
                            <span className={`badge ${getStatusClass(navrh.status)}`}>
                              {getStatusText(navrh.status)}
                            </span>
                          </div>
                          
                          {navrh.status === 'chyba' && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">
                              ❌ {navrh.errorMessage}
                        </div>
                          )}
                          
                          {navrh.status === 'zpracován' && (
                            <div className="mt-2 text-xs text-emerald-600 bg-emerald-50 rounded px-2 py-1">
                              ✅ Úspěšně zpracováno ({Object.keys(navrh.data || {}).length} indikátorů)
                            </div>
                        )}
                      </div>
                        <div className="flex gap-1">
                          {navrh.status === 'připraven' && (
                        <button
                          className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-lg"
                          onClick={() => handleZpracovani(navrh.id)}
                          disabled={navrh.status === 'zpracovává se' || navrh.status === 'zpracován'}
                        >
                          {navrh.status === 'zpracovává se' ? (
                            <>
                              <div className="animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 w-3 h-3"></div>
                                  Zpracovává se...
                            </>
                          ) : (
                            <>
                              <span className="text-sm">🚀</span>
                              Zpracovat
                            </>
                          )}
                        </button>
                          )}
                          <button
                            onClick={() => handleVymazani(navrh.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                          </div>
                    </motion.div>
              ))}
            </div>
          </div>
        )}

            {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
              <button className="btn btn-secondary" onClick={onBack}>
            ← Zpět na Konfiguraci
          </button>
              <button
                className="btn btn-primary btn-lg"
                onClick={onNext}
                disabled={zpracovaneNavrhy.length === 0}
              >
            Pokračovat na Výběr kritérií
            <span className="text-lg">→</span>
          </button>
        </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StepUpload;