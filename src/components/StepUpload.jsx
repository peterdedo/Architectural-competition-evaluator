import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Trash2, Edit3, Save } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { usePdfProcessor } from '../hooks/usePdfProcessor';
import { useVisionAnalyzer } from '../hooks/useVisionAnalyzer';
import { indikatory } from '../data/indikatory';
import { detectFileFormat, parseFile } from '../utils/fileParser';
import { validateFileUpload } from '../utils/validation';
const StepUpload = ({ navrhy, setNavrhy, onNext, onBack }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [batchBusy, setBatchBusy] = useState(false);

  const navrhyRef = useRef(navrhy);
  const processingLockRef = useRef(false);
  useEffect(() => {
    navrhyRef.current = navrhy;
  }, [navrhy]);
  
  const { processPdf, isProcessing, progress } = usePdfProcessor();
  const { analyze } = useVisionAnalyzer();
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

  const handleFileUpload = useCallback(async (files) => {
    const noveNavrhy = [];
    
    for (const file of Array.from(files)) {
      // Validate file
      const validation = validateFileUpload(file);
      
      if (!validation.isValid) {
        setUploadError(validation.message);
        showToast(validation.message, 'error', 0);
        continue;
      }
      
      const format = detectFileFormat(file);
      
      // Handle different file formats
      if (format === 'pdf') {
        // PDF files are handled as before
        noveNavrhy.push({
          id: Date.now() + Math.random(),
          nazev: file.name.replace('.pdf', ''),
          pdfSoubor: file,
          obrazek: null,
          status: 'připraven',
          data: {},
          vybrany: false,
          fileFormat: 'pdf'
        });
      } else if (format === 'json' || format === 'csv') {
        // Parse JSON/CSV files directly
        try {
          const parsedData = await parseFile(file);
          
          if (parsedData) {
            noveNavrhy.push({
              id: Date.now() + Math.random(),
              nazev: parsedData.nazev,
              pdfSoubor: file,
              obrazek: null,
              status: 'zpracován', // Already processed
              data: parsedData.data || {},
              vybrany: false,
              fileFormat: format,
              source: parsedData.source
            });
          }
        } catch (error) {
          console.error('Error parsing file:', error);
          const em = `Chyba při zpracování ${file.name}: ${error.message}`;
          setUploadError(em);
          showToast(em, 'error', 0);
        }
      } else {
        const em = `Nepodporovaný formát: ${file.name}`;
        setUploadError(em);
        showToast(em, 'error', 0);
      }
    }
    
    if (noveNavrhy.length > 0) {
      setNavrhy((prev) => [...prev, ...noveNavrhy]);

      const pdfCount = noveNavrhy.filter(n => n.fileFormat === 'pdf').length;
      const jsonCount = noveNavrhy.filter(n => n.fileFormat === 'json').length;
      const csvCount = noveNavrhy.filter(n => n.fileFormat === 'csv').length;
      
      let message = `Nahrané ${noveNavrhy.length} návrhů:`;
      if (pdfCount > 0) message += ` ${pdfCount} PDF`;
      if (jsonCount > 0) message += ` ${jsonCount} JSON`;
      if (csvCount > 0) message += ` ${csvCount} CSV`;
      
      showToast(message, 'success');
    }
  }, [setNavrhy, showToast]);

  const handleZpracovani = async (navrhId) => {
    if (processingLockRef.current) return;
    const navrh = navrhyRef.current.find((n) => n.id === navrhId);
    if (!navrh || !navrh.pdfSoubor) return;

    processingLockRef.current = true;
    setUploadError(null);

    setNavrhy((prev) =>
      prev.map((n) => (n.id === navrhId ? { ...n, status: 'zpracovává se' } : n))
    );

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
      const analysisResult = await analyze(project, criteria, 'gpt-4o', false);
      
      if (!analysisResult.success) {
        throw new Error(analysisResult.error || 'Chyba při AI analýze');
      }
      
      console.log('✅ AI analýza dokončena:', Object.keys(analysisResult.data).length, 'indikátorů');
      console.log('📊 analysisResult.data:', analysisResult.data);
      
      setNavrhy((prev) =>
        prev.map((n) =>
          n.id === navrhId
            ? {
                ...n,
                status: 'zpracován',
                data: analysisResult.data,
                errorMessage: null,
              }
            : n
        )
      );

      showToast(`Návrh „${navrh.nazev}“ byl úspěšně zpracován`, 'success');
      
    } catch (error) {
      console.error('❌ Chyba při zpracování:', error);
      
      const em = `Chyba při zpracování „${navrh.nazev}“: ${error.message}`;
      setUploadError(em);
      showToast(em, 'error', 0);

      setNavrhy((prev) =>
        prev.map((n) =>
          n.id === navrhId
            ? {
                ...n,
                status: 'chyba',
                errorMessage: error.message,
              }
            : n
        )
      );
    } finally {
      setIsAnalyzing(false);
      processingLockRef.current = false;
    }
  };

  const handleVymazani = (navrhId) => {
    if (!window.confirm('Opravdu chcete tento návrh odebrat ze seznamu?')) return;
    setNavrhy((prev) => prev.filter((n) => n.id !== navrhId));
    showToast('Návrh byl odebrán', 'success');
  };

  const handleVybrani = (navrhId) => {
    setNavrhy((prev) =>
      prev.map((n) => (n.id === navrhId ? { ...n, vybrany: !n.vybrany } : n))
    );
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
      setNavrhy((prev) =>
        prev.map((navrh) =>
          navrh.id === id ? { ...navrh, nazev: editingValue.trim() } : navrh
        )
      );
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
        {uploadError && (
          <div
            className="bg-red-50 border border-red-200 text-red-900 rounded-xl p-4 flex gap-3 items-start"
            role="alert"
          >
            <div className="flex-1 text-sm">{uploadError}</div>
            <button
              type="button"
              className="shrink-0 text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              onClick={() => setUploadError(null)}
            >
              Zavřít
            </button>
          </div>
        )}
        {/* API Key Status */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">🔑</span>
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900 mb-2">AI analýza dokumentů</h4>
              <p className="text-blue-700 text-sm">
                ✅ Volání jdou přes serverový proxy; OPENAI_API_KEY je na serveru nebo v lokálním .env při npm run dev.
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
            accept=".pdf,.json,.csv"
            multiple
            onChange={(e) => handleFileUpload(e.target.files)}
            className="sr-only"
            aria-label="Nahrát návrhy (PDF, JSON, CSV)"
          />
              <label htmlFor="navrhyFiles" className="cursor-pointer block">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-indigo-100 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">📄</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Klikněte pro nahrání PDF, JSON nebo CSV souborů
              </h3>
              <p className="text-slate-500 mb-4">
                nebo přetáhněte soubory sem
              </p>
              <p className="text-xs text-slate-400">
                Podporované formáty: PDF (analýza), JSON, CSV
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
                      type="button"
                      className="btn btn-primary"
                      onClick={async () => {
                        const pendingNavrhy = navrhy.filter(n => n.status === 'připraven');
                        if (pendingNavrhy.length === 0) return;
                        setBatchBusy(true);
                        try {
                          for (const navrh of pendingNavrhy) {
                            await handleZpracovani(navrh.id);
                          }
                        } finally {
                          setBatchBusy(false);
                        }
                      }}
                      disabled={isAnalyzing || batchBusy || navrhy.every(n => n.status === 'zpracován')}
                    >
                      {isAnalyzing ? (
                        <>
                          <div className="spinner w-4 h-4" aria-hidden />
                          <span>
                            Zpracovává se…
                            {isProcessing && progress > 0 && progress < 100
                              ? ` (PDF ${Math.round(progress)} %)`
                              : ''}
                          </span>
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
                      <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={navrh.vybrany || false}
                          onChange={() => handleVybrani(navrh.id)}
                      className="mt-1 w-5 h-5 text-indigo-600 border-slate-300 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                      aria-label={`Vybrat návrh ${navrh.nazev}`}
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
                                type="button"
                                onClick={() => saveEditingName(navrh.id)}
                                className="p-1 text-green-600 hover:text-green-800 hover:bg-green-100 rounded transition-colors"
                                title="Uložit název"
                                aria-label="Uložit název návrhu"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={cancelEditingName}
                                className="p-1 text-red-600 hover:text-red-800 hover:bg-red-100 rounded transition-colors"
                                title="Zrušit úpravu názvu"
                                aria-label="Zrušit úpravu názvu"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-slate-800 truncate flex-1">{navrh.nazev}</h4>
                              <button
                                type="button"
                                onClick={() => startEditingName(navrh.id, navrh.nazev)}
                                className="p-1 text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded transition-colors"
                                title="Upravit název"
                                aria-label={`Upravit název návrhu ${navrh.nazev}`}
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
                        <div className="flex gap-3 items-center shrink-0">
                          {navrh.status === 'připraven' && (
                        <button
                          type="button"
                          className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-lg"
                          onClick={() => handleZpracovani(navrh.id)}
                          disabled={isAnalyzing || batchBusy || navrh.status === 'zpracovává se' || navrh.status === 'zpracován'}
                        >
                          {navrh.status === 'zpracovává se' ? (
                            <>
                              <div className="animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 w-3 h-3" aria-hidden />
                                  Zpracovává se…
                            </>
                          ) : (
                            <>
                              <span className="text-sm" aria-hidden>🚀</span>
                              Zpracovat
                            </>
                          )}
                        </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleVymazani(navrh.id)}
                            className="p-2.5 text-red-700 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                            title="Odebrat návrh"
                            aria-label={`Odebrat návrh ${navrh.nazev}`}
                          >
                            <Trash2 size={16} aria-hidden />
                          </button>
                        </div>
                          </div>
                    </motion.div>
              ))}
            </div>
          </div>
        )}

            {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 pt-6 border-t border-slate-200">
              <button type="button" className="btn btn-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400" onClick={onBack}>
            ← Zpět na výběr kritérií
          </button>
              <button
                type="button"
                className="btn btn-primary btn-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={() => onNext()}
                disabled={zpracovaneNavrhy.length === 0}
                title={zpracovaneNavrhy.length === 0 ? 'Nejprve úspěšně zpracujte alespoň jeden návrh' : ''}
              >
            Pokračovat na výsledky analýzy
            <span className="text-lg" aria-hidden>→</span>
          </button>
        </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default StepUpload;