import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Header from './components/Header';
import WizardTopNav from './components/WizardTopNav';
import Sidebar from './components/Sidebar';
import StepConfig from './components/StepConfig';
import StepUpload from './components/StepUpload';
import StepCriteria from './components/StepCriteria';
import StepResults from './components/StepResults';
import ComparisonDashboard from './components/ComparisonDashboard';

const KROKY = {
  KONFIGURACE: 'konfigurace',
  NAHRANI: 'nahrani',
  KRITERIA: 'kriteria',
  VYSLEDKY: 'vysledky',
  POROVNANI: 'porovnani'
};

const App = () => {
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
  const [navrhy, setNavrhy] = useState(() => 
    loadFromStorage('urban-analysis-navrhy', [])
  );
  const [vybraneNavrhy, setVybraneNavrhy] = useState(() => 
    loadFromStorage('urban-analysis-vybrane-navrhy', new Set())
  );
  const [vybraneIndikatory, setVybraneIndikatory] = useState(() => 
    loadFromStorage('urban-analysis-vybrane-indikatory', new Set())
  );
  const [vahy, setVahy] = useState(() => 
    loadFromStorage('urban-analysis-vahy', {})
  );
  const [analysisResults, setAnalysisResults] = useState(() => 
    loadFromStorage('urban-analysis-results', {})
  );
  const [darkMode, setDarkMode] = useState(() => 
    loadFromStorage('urban-analysis-darkmode', false)
  );

  // ✅ PERSISTENCE: Ukládání do localStorage při změnách
  useEffect(() => {
    localStorage.setItem('urban-analysis-krok', JSON.stringify(aktualniKrok));
  }, [aktualniKrok]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-navrhy', JSON.stringify(navrhy));
  }, [navrhy]);

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
    localStorage.setItem('urban-analysis-results', JSON.stringify(analysisResults));
  }, [analysisResults]);

  useEffect(() => {
    localStorage.setItem('urban-analysis-darkmode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Dark mode toggle
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
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
        return <StepConfig onNext={() => setAktualniKrok(KROKY.NAHRANI)} />;
      case KROKY.NAHRANI:
        return (
          <StepUpload 
            navrhy={navrhy}
            setNavrhy={setNavrhy}
            onNext={() => setAktualniKrok(KROKY.KRITERIA)} 
            onBack={() => setAktualniKrok(KROKY.KONFIGURACE)} 
          />
        );
      case KROKY.KRITERIA:
        return (
          <StepCriteria 
            vybraneIndikatory={vybraneIndikatory}
            setVybraneIndikatory={setVybraneIndikatory}
            vahy={vahy}
            setVahy={setVahy}
            navrhy={navrhy}
            setNavrhy={setNavrhy}
            onNext={() => setAktualniKrok(KROKY.VYSLEDKY)} 
            onBack={() => setAktualniKrok(KROKY.NAHRANI)} 
          />
        );
      case KROKY.VYSLEDKY:
        return (
          <StepResults 
            navrhy={navrhy}
            setNavrhy={setNavrhy}
            vybraneIndikatory={vybraneIndikatory}
            onNext={() => setAktualniKrok(KROKY.POROVNANI)} 
            onBack={() => setAktualniKrok(KROKY.KRITERIA)} 
          />
        );
      case KROKY.POROVNANI:
        return (
          <ComparisonDashboard 
            navrhy={navrhy}
            vybraneNavrhy={vybraneNavrhy}
            setVybraneNavrhy={setVybraneNavrhy}
            vybraneIndikatory={vybraneIndikatory}
            vahy={vahy}
            onBack={() => setAktualniKrok(KROKY.VYSLEDKY)} 
          />
        );
      default:
        return <StepConfig onNext={() => setAktualniKrok(KROKY.NAHRANI)} />;
    }
  };

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50 transition-colors duration-200">
        <Header aktualniKrok={aktualniKrok} kroky={KROKY} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
        
        {/* Moderný wizard top navigation */}
        <WizardTopNav 
          aktualniKrok={aktualniKrok} 
          kroky={KROKY} 
          onKrokChange={setAktualniKrok}
          darkMode={darkMode}
        />
        
        {/* Hlavný obsah */}
        <main className="min-h-[calc(100vh-140px)]">
          {renderAktualniKrok()}
        </main>
      </div>
    </ErrorBoundary>
  );
};

export default App;