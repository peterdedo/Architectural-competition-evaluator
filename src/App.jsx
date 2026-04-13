import React, { useState, useEffect, Suspense, useMemo } from 'react';
import ErrorRecoveryBoundary from './components/ErrorRecoveryBoundary';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import WizardTopNav from './components/WizardTopNav';
import Sidebar from './components/Sidebar';
import StepConfig from './components/StepConfig';
import StepCriteria from './components/StepCriteria';
import StepComparison from './components/StepComparison';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import LazyWrapper from './components/LazyWrapper';
import PerformanceMonitor from './components/PerformanceMonitor';
import DeveloperTools from './components/DeveloperTools';
import AIWeightManager from './components/AIWeightManager';
import { usePWA } from './hooks/usePWA';
import { useWizard } from './contexts/WizardContext';
import { WifiOff } from 'lucide-react';
import { 
  LazyStepUpload, 
  LazyStepResults, 
  LazyComparisonDashboard 
} from './components/LazyComponents';
import { indikatory } from './data/indikatory';
import {
  isLegacyExcludedIndicatorId,
  shouldExcludeCustomIndicator,
} from './config/legacyIndicatorFilters';

const KROKY = {
  KONFIGURACE: 'konfigurace',
  KRITERIA: 'kriteria',
  NAHRANI: 'nahrani',
  VYSLEDKY: 'vysledky',
  POROVNANI: 'porovnani'
};

const App = () => {
  // PWA functionality
  const { isOnline, isInstalled, updateAvailable } = usePWA();
  
  // Developer tools state
  const [showDevTools, setShowDevTools] = useState(false);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(false);

  // ✅ PERSISTENCE: Načítání z localStorage při startu
  const loadFromStorage = (key, defaultValue) => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Pro Set musíme rekonstruovat
        if (key.includes('vybrane')) {
          return new Set(parsed);
        }
        return parsed;
      }
    } catch (error) {
      console.error(`Chyba při načítání ${key}:`, error);
    }
    return defaultValue;
  };

  const [aktualniKrok, setAktualniKrok] = useState(() => 
    loadFromStorage('urban-analysis-krok', KROKY.KONFIGURACE)
  );
  // Používame WizardContext namiesto lokálneho stavu
  const { projects: navrhy, setProjects: setNavrhy } = useWizard();
  const processedProposalCount = useMemo(
    () => navrhy.filter((n) => n.status === 'zpracován').length,
    [navrhy]
  );
  const [vybraneNavrhy, setVybraneNavrhy] = useState(() => 
    loadFromStorage('urban-analysis-vybrane-navrhy', new Set())
  );

  // Automaticky nastav vybraneNavrhy na všetky spracované návrhy
  useEffect(() => {
    if (navrhy && navrhy.length > 0) {
      const zpracovaneNavrhy = navrhy.filter(navrh => navrh.status === 'zpracován');
      if (zpracovaneNavrhy.length > 0) {
        const zpracovaneIds = new Set(zpracovaneNavrhy.map(n => n.id));
        setVybraneNavrhy(zpracovaneIds);
        console.log('🔍 App.jsx - Automaticky nastavené vybraneNavrhy:', zpracovaneIds);
      }
    }
  }, [navrhy]);
  
  const [vybraneIndikatory, setVybraneIndikatory] = useState(() => {
    const loaded = loadFromStorage('urban-analysis-vybrane-indikatory', new Set());
    
    // Automaticky odstráň "Toalety" z vybraných indikátorov
    const filtered = new Set();
    loaded.forEach((id) => {
      if (!isLegacyExcludedIndicatorId(id)) {
        filtered.add(id);
      }
    });
    
    return filtered;
  });
  
  // Debug - skontrolujme počet vybraných indikátorov
  useEffect(() => {
    console.log('🔍 App.jsx - Počet vybraných indikátorov:', vybraneIndikatory.size);
    console.log('🔍 App.jsx - Vybrané indikátory:', Array.from(vybraneIndikatory));
  }, [vybraneIndikatory]);

  // Automaticky odstráň "Toalety" z localStorage pri každom načítaní
  useEffect(() => {
    const customIndicators = JSON.parse(localStorage.getItem('urban-analysis-custom-indicators') || '[]');
    const filteredCustom = customIndicators.filter((indicator) => !shouldExcludeCustomIndicator(indicator));

    if (filteredCustom.length !== customIndicators.length) {
      localStorage.setItem('urban-analysis-custom-indicators', JSON.stringify(filteredCustom));
      if (import.meta.env.DEV) {
        console.log('🧹 App.jsx - Automaticky odstránené legacy custom indikátory');
      }
    }
  }, []);
  const [vahy, setVahy] = useState(() => 
    loadFromStorage('urban-analysis-vahy', {})
  );
  const [categoryWeights, setCategoryWeights] = useState(() => 
    loadFromStorage('urban-analysis-category-weights', {
      "Bilance ploch řešeného území": 40,
      "Bilance HPP dle funkce": 40,
      "Bilance parkovacích ploch": 20
    })
  );
  const [analysisResults, setAnalysisResults] = useState(() => 
    loadFromStorage('urban-analysis-results', {})
  );
  const [aiWeights, setAiWeights] = useState(() => 
    loadFromStorage('urban-analysis-ai-weights', null)
  );
  const [aiCategoryWeights, setAiCategoryWeights] = useState(() => 
    loadFromStorage('urban-analysis-ai-category-weights', null)
  );
  const [darkMode, setDarkMode] = useState(() => 
    loadFromStorage('urban-analysis-darkmode', false)
  );

  // ✅ PERSISTENCE: Ukládání do localStorage při změnách
  useEffect(() => {
    localStorage.setItem('urban-analysis-krok', JSON.stringify(aktualniKrok));
  }, [aktualniKrok]);

  // localStorage pre navrhy sa rieši v WizardContext

  useEffect(() => {
    localStorage.setItem('urban-analysis-vybrane-navrhy', JSON.stringify(Array.from(vybraneNavrhy)));
  }, [vybraneNavrhy]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-vybrane-indikatory', JSON.stringify(Array.from(vybraneIndikatory)));
  }, [vybraneIndikatory]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-vahy', JSON.stringify(vahy));
  }, [vahy]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-category-weights', JSON.stringify(categoryWeights));
  }, [categoryWeights]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-results', JSON.stringify(analysisResults));
  }, [analysisResults]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-ai-weights', JSON.stringify(aiWeights));
  }, [aiWeights]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-ai-category-weights', JSON.stringify(aiCategoryWeights));
  }, [aiCategoryWeights]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  // Funkcia pre vyčistenie localStorage a reset aplikácie
  const resetApplication = () => {
    if (confirm('Opravdu chcete resetovat aplikaci? Všechna rozpracovaná data se smažou.')) {
      const keysToClear = Object.keys(localStorage).filter(
        (k) => k.startsWith('urban-analysis-') || k === 'apiTestPassed' || k === 'skipApiValidation' || k === 'gpt_model'
      );
      keysToClear.forEach((k) => localStorage.removeItem(k));
      window.location.reload();
    }
  };

  // Apply dark mode class to document
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const renderAktualniKrok = () => {
    switch (aktualniKrok) {
      case KROKY.KONFIGURACE:
        return <StepConfig onNext={() => setAktualniKrok(KROKY.KRITERIA)} />;
      case KROKY.KRITERIA:
        return (
          <StepCriteria 
            vybraneIndikatory={vybraneIndikatory}
            setVybraneIndikatory={setVybraneIndikatory}
            vahy={vahy}
            setVahy={setVahy}
            categoryWeights={categoryWeights}
            setCategoryWeights={setCategoryWeights}
            navrhy={navrhy}
            setNavrhy={setNavrhy}
            onNext={() => setAktualniKrok(KROKY.NAHRANI)} 
            onBack={() => setAktualniKrok(KROKY.KONFIGURACE)} 
          />
        );
      case KROKY.NAHRANI:
        return (
          <LazyWrapper loadingMessage="Načítá se nahrávání PDF...">
            <LazyStepUpload 
              navrhy={navrhy}
              setNavrhy={setNavrhy}
              onNext={() => setAktualniKrok(KROKY.VYSLEDKY)} 
              onBack={() => setAktualniKrok(KROKY.KRITERIA)} 
            />
          </LazyWrapper>
        );
      case KROKY.VYSLEDKY:
        return (
          <LazyWrapper loadingMessage="Načítají se výsledky analýzy...">
            <LazyStepResults 
              navrhy={navrhy}
              setNavrhy={setNavrhy}
              vybraneIndikatory={vybraneIndikatory}
              vahy={vahy}
              categoryWeights={categoryWeights}
              aiWeights={aiWeights}
              aiCategoryWeights={aiCategoryWeights}
              onNext={() => setAktualniKrok(KROKY.POROVNANI)} 
              onBack={() => setAktualniKrok(KROKY.NAHRANI)}
            />
          </LazyWrapper>
        );
      case KROKY.POROVNANI:
        return (
          <LazyWrapper loadingMessage="Načítá se porovnání návrhů...">
            <LazyComparisonDashboard 
              navrhy={navrhy}
              vybraneNavrhy={vybraneNavrhy}
              setVybraneNavrhy={setVybraneNavrhy}
              vybraneIndikatory={vybraneIndikatory}
              vahy={vahy}
              setVahy={setVahy}
              categoryWeights={categoryWeights}
              setCategoryWeights={setCategoryWeights}
              aiWeights={aiWeights}
              aiCategoryWeights={aiCategoryWeights}
              onBack={() => setAktualniKrok(KROKY.VYSLEDKY)}
              allIndicators={indikatory}
            />
          </LazyWrapper>
        );
      case 'test-heatmap':
        return (
          <StepComparison
            navrhy={navrhy}
            vybraneNavrhy={vybraneNavrhy}
            setVybraneNavrhy={setVybraneNavrhy}
            vybraneIndikatory={vybraneIndikatory}
            onBack={() => setAktualniKrok(KROKY.POROVNANI)}
          />
        );
      default:
        return <StepConfig onNext={() => setAktualniKrok(KROKY.KRITERIA)} />;
    }
  };

  // Keyboard shortcuts for developer tools
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D for dev tools
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setShowDevTools(!showDevTools);
      }
      // Ctrl+Shift+P for performance monitor
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setShowPerformanceMonitor(!showPerformanceMonitor);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showDevTools, showPerformanceMonitor]);

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
        
        {/* Moderný wizard top navigation */}
        <WizardTopNav 
          aktualniKrok={aktualniKrok} 
          kroky={KROKY} 
          onKrokChange={setAktualniKrok}
          darkMode={darkMode}
          processedProposalCount={processedProposalCount}
        />
        
        {/* Hlavný obsah */}
        <main className="min-h-[calc(100vh-140px)]">
          {renderAktualniKrok()}
        </main>
        
        {/* PWA Install Prompt */}
        <PWAInstallPrompt />
        
        {import.meta.env.DEV && (
          <>
            <PerformanceMonitor
              isVisible={showPerformanceMonitor}
              onToggle={() => setShowPerformanceMonitor(!showPerformanceMonitor)}
            />
            <DeveloperTools
              isVisible={showDevTools}
              onToggle={() => setShowDevTools(!showDevTools)}
            />
          </>
        )}
        
        {/* Offline Indicator */}
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