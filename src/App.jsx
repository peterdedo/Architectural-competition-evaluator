import React, { useState, useEffect, useMemo } from 'react';
import ErrorRecoveryBoundary from './components/ErrorRecoveryBoundary';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import WizardTopNav from './components/WizardTopNav';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import LazyWrapper from './components/LazyWrapper';
import PerformanceMonitor from './components/PerformanceMonitor';
import DeveloperTools from './components/DeveloperTools';
import { usePWA } from './hooks/usePWA';
import { useWizard } from './contexts/WizardContext';
import { WifiOff } from 'lucide-react';
import { LazyStepUpload, LazyStepResults, LazyStepProposalComparison, LazyStepDataViews } from './components/LazyComponents';

const KROKY = {
  NAHRANI: 'nahrani',
  VYSLEDKY: 'vysledky',
  POROVNANI: 'porovnani',
  DATOVE_POHLEDY: 'datove-pohledy',
};

const App = () => {
  const { isOnline, isInstalled, updateAvailable } = usePWA();

  const [showDevTools, setShowDevTools] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (error) {
      console.error(`Chyba při načítání ${key}:`, error);
    }
    return defaultValue;
  };

  const [aktualniKrok, setAktualniKrok] = useState(() => {
    const saved = loadFromStorage('urban-analysis-krok', KROKY.NAHRANI);
    // Migrace: starší verze appky měla i krok "konfigurace", který už neexistuje.
    return Object.values(KROKY).includes(saved) ? saved : KROKY.NAHRANI;
  });

  // Projekty (návrhy) jsou vlastnictvím WizardContext (persistované do localStorage).
  const { projects: navrhy, setProjects: setNavrhy } = useWizard();
  const processedProposalCount = useMemo(
    () => navrhy.filter((n) => n.status === 'zpracován').length,
    [navrhy]
  );

  const [darkMode, setDarkMode] = useState(() =>
    loadFromStorage('urban-analysis-darkmode', false)
  );

  useEffect(() => {
    localStorage.setItem('urban-analysis-krok', JSON.stringify(aktualniKrok));
  }, [aktualniKrok]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((d) => !d);

  const resetApplication = () => {
    if (confirm('Opravdu chcete resetovat aplikaci? Všechna rozpracovaná data se smažou.')) {
      const keysToClear = Object.keys(localStorage).filter(
        (k) => k.startsWith('urban-analysis-') || k === 'apiTestPassed' || k === 'skipApiValidation' || k === 'gpt_model'
      );
      keysToClear.forEach((k) => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const renderAktualniKrok = () => {
    switch (aktualniKrok) {
      case KROKY.NAHRANI:
        return (
          <LazyWrapper loadingMessage="Načítá se nahrávání souborů...">
            <LazyStepUpload
              navrhy={navrhy}
              setNavrhy={setNavrhy}
              onNext={() => setAktualniKrok(KROKY.VYSLEDKY)}
            />
          </LazyWrapper>
        );
      case KROKY.VYSLEDKY:
        return (
          <LazyWrapper loadingMessage="Načítají se bilanční údaje...">
            <LazyStepResults
              navrhy={navrhy}
              setNavrhy={setNavrhy}
              onBack={() => setAktualniKrok(KROKY.NAHRANI)}
              onNext={() => setAktualniKrok(KROKY.POROVNANI)}
            />
          </LazyWrapper>
        );
      case KROKY.POROVNANI:
        return (
          <LazyWrapper loadingMessage="Načítá se výběr návrhů...">
            <LazyStepProposalComparison
              navrhy={navrhy}
              onBack={() => setAktualniKrok(KROKY.VYSLEDKY)}
              onNext={() => setAktualniKrok(KROKY.DATOVE_POHLEDY)}
            />
          </LazyWrapper>
        );
      case KROKY.DATOVE_POHLEDY:
        return (
          <LazyWrapper loadingMessage="Načítají se datové pohledy...">
            <LazyStepDataViews
              navrhy={navrhy}
              onBack={() => setAktualniKrok(KROKY.POROVNANI)}
            />
          </LazyWrapper>
        );
      default:
        return (
          <LazyWrapper loadingMessage="Načítá se nahrávání souborů...">
            <LazyStepUpload
              navrhy={navrhy}
              setNavrhy={setNavrhy}
              onNext={() => setAktualniKrok(KROKY.VYSLEDKY)}
            />
          </LazyWrapper>
        );
    }
  };

  // Keyboard shortcuts for developer tools
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevTools((v) => !v);
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPerformanceMonitor((v) => !v);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <ErrorRecoveryBoundary>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50 transition-colors duration-200">
          <Header
            aktualniKrok={aktualniKrok}
            kroky={KROKY}
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            onReset={resetApplication}
            isOnline={isOnline}
            isInstalled={isInstalled}
            updateAvailable={updateAvailable}
          />

          <WizardTopNav
            aktualniKrok={aktualniKrok}
            kroky={KROKY}
            onKrokChange={setAktualniKrok}
            darkMode={darkMode}
            processedProposalCount={processedProposalCount}
          />

          <main className="min-h-[calc(100vh-140px)]">{renderAktualniKrok()}</main>

          <PWAInstallPrompt />

          {import.meta.env.DEV && (
            <>
              <PerformanceMonitor
                isVisible={showPerformanceMonitor}
                onToggle={() => setShowPerformanceMonitor((v) => !v)}
              />
              <DeveloperTools
                isVisible={showDevTools}
                onToggle={() => setShowDevTools((v) => !v)}
              />
            </>
          )}

          {!isOnline && (
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
              <div className="bg-yellow-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <WifiOff size={16} />
                <span>Offline režim - některé funkce mohou být omezené</span>
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>
    </ErrorRecoveryBoundary>
  );
};

export default App;
