import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Edit3, Save, Loader2, AlertTriangle, CheckCircle2, Clock, ChevronDown, Play, Pause } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import { usePdfProcessor } from '../hooks/usePdfProcessor';
import { useBalanceExtractor } from '../hooks/useBalanceExtractor';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { detectFileFormat, parseFile } from '../utils/fileParser';
import { validateFileUpload } from '../utils/validation';
import { generateNavrhId } from '../utils/generateId';

const fmtSize = (bytes) => {
  if (!bytes) return '';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
};

const fmtElapsed = (startedAt) => {
  const s = Math.max(0, Math.round((Date.now() - startedAt) / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
};

const StepUpload = ({ navrhy, setNavrhy, onNext }) => {
  const [dragActive, setDragActive] = useState(false);
  const [editingName, setEditingName] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [uploadError, setUploadError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showDone, setShowDone] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [concurrency, setConcurrency] = useLocalStorage('archieval-upload-concurrency', 3);
  // Ephemeral průběh (fáze/strana/čas) – NENÍ v navrh.status, ten zůstává perzistentní stav.
  const [progressById, setProgressById] = useState({});
  const [, forceTick] = useState(0); // pro živý odpočet uplynulého času u "extracting" fáze

  const navrhyRef = useRef(navrhy);
  useEffect(() => { navrhyRef.current = navrhy; }, [navrhy]);

  const isPausedRef = useRef(false);
  useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

  // Fronta s omezenou souběžností: queueRef drží čekající ID, activeCountRef běžící workery.
  const queueRef = useRef([]);
  const enqueuedRef = useRef(new Set());
  const activeCountRef = useRef(0);

  const { processPdf } = usePdfProcessor();
  const { extractFromImages } = useBalanceExtractor();
  const { showToast } = useToast();

  // Živý tikot pro zobrazení uplynulého času u položek, které se právě zpracovávají.
  useEffect(() => {
    const hasActive = Object.keys(progressById).length > 0;
    if (!hasActive) return undefined;
    const t = window.setInterval(() => forceTick((v) => v + 1), 1000);
    return () => window.clearInterval(t);
  }, [progressById]);

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
      const validation = validateFileUpload(file);
      if (!validation.isValid) {
        setUploadError(validation.message);
        showToast(validation.message, 'error', 0);
        continue;
      }

      const format = detectFileFormat(file);

      if (format === 'pdf') {
        noveNavrhy.push({
          id: generateNavrhId(),
          nazev: file.name.replace('.pdf', ''),
          pdfSoubor: file,
          obrazek: null,
          status: 'připraven',
          data: {},
          vybrany: false,
          fileFormat: 'pdf'
        });
      } else if (format === 'json' || format === 'csv' || format === 'xlsx') {
        try {
          const parsedData = await parseFile(file);
          const items = parsedData?.items ? parsedData.items : parsedData ? [parsedData] : [];
          const formatLabel = format === 'xlsx' ? 'Excel' : format.toUpperCase();
          items.forEach((item) => {
            const hasUnmapped =
              Array.isArray(item.mappingInfo?.unmappedColumns) && item.mappingInfo.unmappedColumns.length > 0;
            noveNavrhy.push({
              id: generateNavrhId(),
              nazev: item.nazev,
              pdfSoubor: file,
              obrazek: null,
              status: 'zpracován',
              data: item.data || {},
              vybrany: false,
              fileFormat: format,
              source: item.source,
              mappingInfo: item.mappingInfo || null,
              warningMessage: hasUnmapped
                ? `Některé sloupce v ${formatLabel} nebyly rozpoznány: ${item.mappingInfo.unmappedColumns.join(', ')}`
                : null,
            });
            if (hasUnmapped) {
              showToast(
                `${formatLabel} „${item.nazev}“ bylo načteno jen částečně. Nerozpoznané: ${item.mappingInfo.unmappedColumns.join(', ')}`,
                'error',
                0
              );
            }
          });
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
      const xlsxCount = noveNavrhy.filter(n => n.fileFormat === 'xlsx').length;
      let message = `Nahrané ${noveNavrhy.length} návrhů:`;
      if (pdfCount > 0) message += ` ${pdfCount} PDF`;
      if (jsonCount > 0) message += ` ${jsonCount} JSON`;
      if (csvCount > 0) message += ` ${csvCount} CSV`;
      if (xlsxCount > 0) message += ` ${xlsxCount} Excel`;
      showToast(message, 'success');
    }
  }, [setNavrhy, showToast]);

  // Zpracuje JEDEN návrh (konverze PDF → AI extrakce). Volané jen z worker smyčky.
  const processOne = useCallback(async (navrhId) => {
    const navrh = navrhyRef.current.find((n) => n.id === navrhId);
    if (!navrh || !navrh.pdfSoubor) return;

    setNavrhy((prev) => prev.map((n) => (n.id === navrhId ? { ...n, status: 'zpracovává se', errorMessage: null } : n)));
    setProgressById((prev) => ({ ...prev, [navrhId]: { phase: 'converting', page: 0, totalPages: 0, startedAt: Date.now() } }));

    try {
      const pdfResult = await processPdf(navrh.pdfSoubor, {
        onProgress: (page, totalPages) => {
          setProgressById((prev) => ({ ...prev, [navrhId]: { ...prev[navrhId], phase: 'converting', page, totalPages } }));
        }
      });
      if (!pdfResult.success) throw new Error(pdfResult.error || 'Chyba při konverzi PDF');

      setProgressById((prev) => ({ ...prev, [navrhId]: { ...prev[navrhId], phase: 'extracting' } }));

      const analysisResult = await extractFromImages({ name: navrh.nazev, images: pdfResult.images });
      if (!analysisResult.success) throw new Error(analysisResult.error || 'Chyba při AI extrakci');

      setNavrhy((prev) => prev.map((n) => (n.id === navrhId ? { ...n, status: 'zpracován', data: analysisResult.data, errorMessage: null } : n)));
      showToast(`Návrh „${navrh.nazev}“ byl úspěšně zpracován`, 'success');
    } catch (error) {
      console.error('❌ Chyba při zpracování:', error);
      setNavrhy((prev) => prev.map((n) => (n.id === navrhId ? { ...n, status: 'chyba', errorMessage: error.message } : n)));
      showToast(`Chyba při zpracování „${navrh.nazev}“: ${error.message}`, 'error', 0);
    } finally {
      setProgressById((prev) => {
        const next = { ...prev };
        delete next[navrhId];
        return next;
      });
    }
  }, [processPdf, extractFromImages, showToast, setNavrhy]);

  const runWorkerLoop = useCallback(async () => {
    activeCountRef.current += 1;
    try {
      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (isPausedRef.current) break; // měkká pauza – rozpracované položky doběhnou, nové se nezačnou
        const nextId = queueRef.current.shift();
        if (nextId === undefined) break;
        enqueuedRef.current.delete(nextId);
        await processOne(nextId);
      }
    } finally {
      activeCountRef.current -= 1;
    }
  }, [processOne]);

  const kickWorkers = useCallback(() => {
    if (isPausedRef.current) return;
    const limit = Number(concurrency) || 1;
    const slots = limit - activeCountRef.current;
    for (let i = 0; i < slots && queueRef.current.length > 0; i += 1) {
      runWorkerLoop();
    }
  }, [concurrency, runWorkerLoop]);

  const enqueue = useCallback((ids) => {
    ids.forEach((id) => {
      if (!enqueuedRef.current.has(id)) {
        enqueuedRef.current.add(id);
        queueRef.current.push(id);
      }
    });
    kickWorkers();
  }, [kickWorkers]);

  // Změna souběžnosti nebo obnovení z pauzy může uvolnit další sloty – zkus znovu nastartovat.
  useEffect(() => { kickWorkers(); }, [concurrency, kickWorkers]);
  useEffect(() => { if (!isPaused) kickWorkers(); }, [isPaused, kickWorkers]);

  const handleZpracovatFrontu = () => {
    const pendingIds = navrhy.filter((n) => n.status === 'připraven').map((n) => n.id);
    if (pendingIds.length === 0) return;
    enqueue(pendingIds);
  };

  const handleZkusitZnovuVse = () => {
    const errorIds = navrhy.filter((n) => n.status === 'chyba').map((n) => n.id);
    if (errorIds.length === 0) return;
    enqueue(errorIds);
  };

  const handleVymazani = (navrhId) => {
    if (!window.confirm('Opravdu chcete tento návrh odebrat ze seznamu?')) return;
    setNavrhy((prev) => prev.filter((n) => n.id !== navrhId));
    showToast('Návrh byl odebrán', 'success');
  };

  const handleVybrani = (navrhId) => {
    setNavrhy((prev) => prev.map((n) => (n.id === navrhId ? { ...n, vybrany: !n.vybrany } : n)));
  };

  const startEditingName = (id, currentName) => { setEditingName(id); setEditingValue(currentName); };
  const cancelEditingName = () => { setEditingName(null); setEditingValue(''); };
  const saveEditingName = (id) => {
    if (editingValue.trim()) {
      setNavrhy((prev) => prev.map((n) => (n.id === id ? { ...n, nazev: editingValue.trim() } : n)));
    }
    setEditingName(null);
    setEditingValue('');
  };
  const handleKeyPress = (e, id) => {
    if (e.key === 'Enter') saveEditingName(id);
    else if (e.key === 'Escape') cancelEditingName();
  };

  // ---- Odvozené skupiny pro zobrazení ----
  const errorItems = navrhy.filter((n) => n.status === 'chyba');
  const activeItems = navrhy.filter((n) => n.status === 'zpracovává se');
  const queuedIds = queueRef.current; // pořadí ve skutečné frontě
  const readyItems = navrhy.filter((n) => n.status === 'připraven');
  const queuedItems = queuedIds
    .map((id) => readyItems.find((n) => n.id === id))
    .filter(Boolean)
    .concat(readyItems.filter((n) => !queuedIds.includes(n.id))); // připravené, ale ještě nezařazené do fronty
  const doneItems = navrhy.filter((n) => n.status === 'zpracován');

  const totalCount = navrhy.length;
  const donePct = totalCount > 0 ? (doneItems.length / totalCount) * 100 : 0;
  const activePct = totalCount > 0 ? (activeItems.length / totalCount) * 100 : 0;
  const errorPct = totalCount > 0 ? (errorItems.length / totalCount) * 100 : 0;

  const filters = [
    { key: 'all', label: 'Vše', count: totalCount },
    { key: 'chyba', label: 'Chyba', count: errorItems.length },
    { key: 'zpracovává se', label: 'Zpracovává se', count: activeItems.length },
    { key: 'připraven', label: 'Ve frontě', count: queuedItems.length },
    { key: 'zpracován', label: 'Hotovo', count: doneItems.length },
  ];

  const NameCell = ({ navrh }) => (
    editingName === navrh.id ? (
      <div className="flex items-center gap-1.5">
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyDown={(e) => handleKeyPress(e, navrh.id)}
          className="flex-1 min-w-0 px-2 py-1 text-sm font-semibold text-text-dark border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
          autoFocus
        />
        <button type="button" onClick={() => saveEditingName(navrh.id)} className="p-1 text-primary hover:bg-primary/10 rounded" title="Uložit název" aria-label="Uložit název návrhu">
          <Save size={14} />
        </button>
        <button type="button" onClick={cancelEditingName} className="p-1 text-error hover:bg-error/10 rounded" title="Zrušit úpravu" aria-label="Zrušit úpravu názvu">
          <X size={14} />
        </button>
      </div>
    ) : (
      <div className="flex items-center gap-1.5 min-w-0">
        <span className="font-semibold text-text-dark text-sm truncate">{navrh.nazev}</span>
        <button type="button" onClick={() => startEditingName(navrh.id, navrh.nazev)} className="p-0.5 text-text-muted hover:text-text-dark shrink-0" title="Upravit název" aria-label={`Upravit název návrhu ${navrh.nazev}`}>
          <Edit3 size={12} />
        </button>
      </div>
    )
  );

  const Row = ({ navrh, variant, queuePosition }) => {
    const prog = progressById[navrh.id];
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className={`flex items-center gap-3 bg-surface border rounded-xl px-3 py-2.5 ${
          variant === 'error' ? 'border-error/30' : variant === 'active' ? 'border-accent/30' : 'border-border'
        }`}
      >
        <input
          type="checkbox"
          checked={navrh.vybrany || false}
          onChange={() => handleVybrani(navrh.id)}
          className="w-4 h-4 text-primary border-border rounded focus:ring-2 focus:ring-primary shrink-0"
          aria-label={`Vybrat návrh ${navrh.nazev}`}
        />

        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
          variant === 'error' ? 'bg-error/10 text-error'
          : variant === 'active' ? 'bg-accent/10 text-accent'
          : variant === 'done' ? 'bg-primary/10 text-primary'
          : 'bg-bg-light text-text-muted'
        }`}>
          {variant === 'error' && <AlertTriangle size={15} />}
          {variant === 'active' && <Loader2 size={15} className="animate-spin" />}
          {variant === 'done' && <CheckCircle2 size={15} />}
          {variant === 'queued' && <Clock size={15} />}
        </div>

        <div className="flex-1 min-w-0">
          <NameCell navrh={navrh} />
          <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
            {navrh.pdfSoubor && <span>{fmtSize(navrh.pdfSoubor.size)}</span>}
            {variant === 'error' && <span className="text-error font-medium truncate">{navrh.errorMessage}</span>}
            {variant === 'active' && prog?.phase === 'converting' && prog.totalPages > 0 && (
              <span className="font-mono">konverze PDF · strana {prog.page}/{prog.totalPages}</span>
            )}
            {variant === 'active' && prog?.phase === 'extracting' && (
              <span className="font-mono">AI analýza (GPT-5.6 Luna) · {fmtElapsed(prog.startedAt)}</span>
            )}
            {variant === 'queued' && <span className="font-mono">pozice {queuePosition}</span>}
            {variant === 'done' && navrh.warningMessage && <span className="text-warning font-medium truncate">{navrh.warningMessage}</span>}
          </div>
          {variant === 'active' && prog?.phase === 'converting' && prog.totalPages > 0 && (
            <div className="w-32 h-1 rounded-full bg-bg-light overflow-hidden mt-1.5">
              <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(prog.page / prog.totalPages) * 100}%` }} />
            </div>
          )}
        </div>

        {variant === 'error' && (
          <button type="button" onClick={() => enqueue([navrh.id])} className="text-xs font-semibold text-error hover:bg-error/10 rounded-lg px-2.5 py-1.5 shrink-0">
            Zkusit znovu
          </button>
        )}
        {variant === 'queued' && (
          <button type="button" onClick={() => handleZpracovani1(navrh.id)} className="text-xs font-semibold text-accent hover:bg-accent/10 rounded-lg px-2.5 py-1.5 shrink-0">
            Zpracovat teď
          </button>
        )}

        <button
          type="button"
          onClick={() => handleVymazani(navrh.id)}
          className="p-2 text-text-muted hover:text-error hover:bg-error/10 rounded-lg transition-colors shrink-0"
          title="Odebrat návrh"
          aria-label={`Odebrat návrh ${navrh.nazev}`}
        >
          <Trash2 size={15} />
        </button>
      </motion.div>
    );
  };

  // "Zpracovat teď" u fronty = pošli na začátek fronty (jednoduše enqueue, worker ho vyzvedne hned jak bude slot).
  const handleZpracovani1 = (id) => enqueue([id]);

  const showGroup = (key) => activeFilter === 'all' || activeFilter === key;

  return (
    <div className="min-h-screen bg-bg-light">
      <div className="max-w-7xl mx-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl shadow-xl border border-border overflow-hidden"
        >
          <div className="bg-primary text-white px-8 py-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <span className="text-xl">📄</span>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Nahrání návrhů</h2>
                <p className="text-white/80 text-sm">Nahrajte PDF dokumenty pro analýzu</p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6">
            {uploadError && (
              <div className="bg-error/10 border border-error/30 text-error rounded-xl p-4 flex gap-3 items-start" role="alert">
                <div className="flex-1 text-sm">{uploadError}</div>
                <button type="button" className="shrink-0 font-semibold px-2 py-1 rounded hover:bg-error/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-error" onClick={() => setUploadError(null)}>
                  Zavřít
                </button>
              </div>
            )}

            <div className="bg-accent/10 border border-accent/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <span className="text-accent text-lg">🔑</span>
                <div className="flex-1">
                  <h4 className="font-semibold text-text-dark mb-1">AI analýza dokumentů</h4>
                  <p className="text-text-light text-sm">
                    Volání jdou přes serverový proxy; OPENAI_API_KEY je na serveru nebo v lokálním .env při npm run dev.
                  </p>
                </div>
              </div>
            </div>

            {/* Upload zóna */}
            <div
              className={`border-2 border-dashed rounded-2xl p-8 transition-colors ${dragActive ? 'border-primary bg-primary/5' : 'border-border'}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                id="navrhyFiles"
                accept=".pdf,.json,.csv,.xlsx,.xls"
                multiple
                onChange={(e) => handleFileUpload(e.target.files)}
                className="sr-only"
                aria-label="Nahrát návrhy (PDF, JSON, CSV, Excel)"
              />
              <label htmlFor="navrhyFiles" className="cursor-pointer block">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                    <span className="text-3xl">📄</span>
                  </div>
                  <h3 className="text-lg font-semibold text-text-dark mb-2">Klikněte pro nahrání PDF, JSON, CSV nebo Excel souborů</h3>
                  <p className="text-text-light mb-4">nebo přetáhněte soubory sem</p>
                  <p className="text-xs text-text-muted">Podporované formáty: PDF (AI analýza), JSON, CSV, XLSX</p>
                  <div className="btn-secondary inline-flex mt-4">
                    <span className="text-lg">📁</span> Vybrat soubory
                  </div>
                </div>
              </label>
            </div>

            {navrhy.length > 0 && (
              <div className="space-y-5">
                {/* Souhrnný panel s frontou */}
                <div className="bg-surface border border-border rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div className="flex flex-wrap gap-6">
                      <div><div className="font-mono text-xl font-medium text-primary tabular-nums">{doneItems.length}</div><div className="text-[0.68rem] uppercase tracking-wide text-text-muted">Hotovo</div></div>
                      <div><div className="font-mono text-xl font-medium text-accent tabular-nums">{activeItems.length}</div><div className="text-[0.68rem] uppercase tracking-wide text-text-muted">Zpracovává se</div></div>
                      <div><div className="font-mono text-xl font-medium text-text-dark tabular-nums">{queuedItems.length}</div><div className="text-[0.68rem] uppercase tracking-wide text-text-muted">Ve frontě</div></div>
                      <div><div className="font-mono text-xl font-medium text-error tabular-nums">{errorItems.length}</div><div className="text-[0.68rem] uppercase tracking-wide text-text-muted">Chyba</div></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 bg-bg-light border border-border rounded-lg px-2.5 py-1.5 text-xs text-text-light">
                        Souběžně
                        <select
                          value={concurrency}
                          onChange={(e) => setConcurrency(Number(e.target.value))}
                          className="font-mono font-semibold text-text-dark bg-transparent outline-none cursor-pointer"
                          aria-label="Počet souběžných zpracování"
                        >
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                        </select>
                        najednou
                      </label>
                      {activeItems.length > 0 && (
                        <button type="button" onClick={() => setIsPaused((v) => !v)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold border border-border rounded-lg text-text-light hover:bg-bg-light">
                          {isPaused ? <Play size={13} /> : <Pause size={13} />}
                          {isPaused ? 'Pokračovat' : 'Pozastavit'}
                        </button>
                      )}
                      {errorItems.length > 0 && (
                        <button type="button" onClick={handleZkusitZnovuVse} className="text-xs font-semibold text-error hover:bg-error/10 rounded-lg px-3 py-1.5">
                          Zkusit znovu vše ({errorItems.length})
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleZpracovatFrontu}
                        disabled={queuedItems.length === 0}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-40 disabled:pointer-events-none"
                      >
                        🚀 Zpracovat frontu
                      </button>
                    </div>
                  </div>
                  <div className="flex h-2.5 rounded-full overflow-hidden bg-bg-light">
                    <div className="h-full bg-primary" style={{ width: `${donePct}%` }} />
                    <div className="h-full bg-accent" style={{ width: `${activePct}%` }} />
                    <div className="h-full bg-error" style={{ width: `${errorPct}%` }} />
                  </div>
                  <div className="text-xs text-text-muted mt-2">
                    <span className="font-mono font-semibold text-text-light">{doneItems.length + errorItems.length} / {totalCount}</span> zpracováno
                    {isPaused && <span className="text-warning font-semibold"> · pozastaveno</span>}
                  </div>
                </div>

                {/* Filtrovací chipy */}
                <div className="flex flex-wrap gap-2">
                  {filters.map((f) => (
                    <button
                      key={f.key}
                      type="button"
                      onClick={() => setActiveFilter(f.key)}
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3 py-1.5 border transition-colors ${
                        activeFilter === f.key ? 'bg-text-dark text-white border-text-dark' : 'bg-surface text-text-light border-border hover:border-text-muted'
                      }`}
                    >
                      {f.label} <span className={`font-mono ${activeFilter === f.key ? 'text-white/70' : 'text-text-muted'}`}>{f.count}</span>
                    </button>
                  ))}
                </div>

                {/* Skupiny – AnimatePresence je jen kolem jednotlivých řádků (motion.div s exit),
                    ne kolem těchto obalů: obyčejné <div> bez exit animace by se v AnimatePresence
                    nikdy neodstranily (framer-motion čeká na dokončení animace, která u nich
                    neexistuje) a filtr by tak vizuálně přestal fungovat. */}
                {showGroup('chyba') && errorItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-error mb-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-error" /> Vyžaduje pozornost
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {errorItems.map((n) => <Row key={n.id} navrh={n} variant="error" />)}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {showGroup('zpracovává se') && activeItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent mb-2 mt-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" /> Zpracovává se ({activeItems.length} souběžně)
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {activeItems.map((n) => <Row key={n.id} navrh={n} variant="active" />)}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {showGroup('připraven') && queuedItems.length > 0 && (
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-text-muted mb-2 mt-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-text-muted" /> Ve frontě
                    </div>
                    <div className="space-y-2">
                      <AnimatePresence initial={false}>
                        {queuedItems.map((n, i) => <Row key={n.id} navrh={n} variant="queued" queuePosition={i + 1} />)}
                      </AnimatePresence>
                    </div>
                  </div>
                )}

                {showGroup('zpracován') && doneItems.length > 0 && (
                  <div className="mt-4">
                    <button
                      type="button"
                      onClick={() => setShowDone((v) => !v)}
                      className="w-full flex items-center justify-between bg-surface border border-border rounded-xl px-3.5 py-2.5 hover:bg-bg-light transition-colors"
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold text-text-light">
                        <CheckCircle2 size={15} className="text-primary" /> Hotovo — {doneItems.length} návrhů zpracováno
                      </span>
                      <ChevronDown size={15} className={`text-text-muted transition-transform ${showDone ? 'rotate-180' : ''}`} />
                    </button>
                    {showDone && (
                      <div className="space-y-2 mt-2">
                        <AnimatePresence initial={false}>
                          {doneItems.map((n) => <Row key={n.id} navrh={n} variant="done" />)}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Navigace */}
            <div className="flex justify-end pt-6 border-t border-border">
              <button
                type="button"
                className="btn-primary btn-large focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => onNext()}
                title="Na bilanci lze návrh vytvořit i ručně"
              >
                Pokračovat na bilanční údaje
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
