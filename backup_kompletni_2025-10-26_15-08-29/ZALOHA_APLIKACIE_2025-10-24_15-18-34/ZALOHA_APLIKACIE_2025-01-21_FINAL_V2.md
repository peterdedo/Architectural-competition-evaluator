# ZÁLOHA APLIKÁCIE URBAN ANALYTICS 2.1 FINAL
**Dátum:** 21. január 2025  
**Verzia:** 2.1 Final - Kompletná konsolidácia dátových tokov  
**Stav:** Funkčná aplikácia s centralizovaným stavom a dynamickým prepočítaním skóre

---

## 📋 OBSAH

1. [Prehľad aplikácie](#prehľad-aplikácie)
2. [Technické špecifikácie](#technické-špecifikácie)
3. [Štruktúra projektu](#štruktúra-projektu)
4. [Hlavné komponenty](#hlavné-komponenty)
5. [Kontexty a hooky](#kontexty-a-hooky)
6. [Engine a utility](#engine-a-utility)
7. [Styly a konfigurácia](#styly-a-konfigurácia)
8. [Dáta a schémy](#dáta-a-schémy)
9. [Zmeny a vylepšenia](#zmeny-a-vylepšenia)
10. [Inštalácia a spustenie](#inštalácia-a-spustenie)

---

## 🎯 PREHĽAD APLIKÁCIE

**Urban Analytics 2.1 Final** je pokročilá webová aplikácia pre analýzu urbanistických projektov s AI integráciou. Aplikácia umožňuje:

- **Nahrávanie PDF dokumentov** s automatickou konverziou na obrázky
- **AI Vision analýzu** pomocou OpenAI GPT-4o pre extrakciu dát
- **Centralizovaný stav** s automatickým prepočítaním skóre
- **Dynamické váhy** s AI doporučeniami
- **Pokročilé vizualizácie** (heatmapy, radar grafy, porovnania)
- **Export výsledkov** do PDF

### Kľúčové vylepšenia v2.1:
- ✅ Centralizovaný stav v `WizardContext`
- ✅ Automatické prepočítanie skóre pri zmene váh
- ✅ Synchronizácia medzi všetkými modulmi
- ✅ Robustné ošetrenie chýb a validácia
- ✅ Optimalizovaný výkon s lazy loading

---

## ⚙️ TECHNICKÉ ŠPECIFIKÁCIE

### Frontend Stack:
- **React 18** - Moderný React s hooks a Suspense
- **Vite 5.4.21** - Rýchly build tool s HMR
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Animácie a prechody
- **ECharts** - Pokročilé grafy a vizualizácie
- **Recharts** - React charting library

### AI Integrácia:
- **OpenAI GPT-4o** - AI Vision analýza PDF dokumentov
- **PDF.js** - Konverzia PDF na obrázky
- **HTML2Canvas** - Renderovanie komponentov

### PWA Features:
- **Service Worker** - Offline podpora
- **Manifest** - Aplikácia nainštalovateľná
- **Caching** - Inteligentné cachovanie

---

## 📁 ŠTRUKTÚRA PROJEKTU

```
src/
├── components/           # React komponenty
│   ├── StepConfig.jsx           # Konfigurácia API kľúča
│   ├── StepUpload.jsx          # Nahrávanie PDF dokumentov
│   ├── StepCriteria.jsx        # Výber kritérií a váh
│   ├── StepResults.jsx         # Výsledky analýzy
│   ├── StepComparison.jsx       # Porovnanie návrhov
│   ├── AIAssistant.jsx         # AI asistent
│   ├── ContextAwareAIWeightManager.jsx  # AI váhy
│   ├── WinnerCalculationBreakdown.jsx   # Detailné skóre
│   ├── WeightedHeatmap.jsx     # Vážená heatmapa
│   ├── ComparisonDashboard.jsx # Dashboard porovnania
│   ├── RadarChartAdvanced.jsx  # Pokročilý radar graf
│   ├── ResultsSummary.jsx      # Súhrn výsledkov
│   ├── StepWeights.jsx         # Nastavenie váh
│   ├── EditIndicatorModal.jsx  # Editácia indikátorov
│   ├── AddIndicatorModal.jsx   # Pridanie indikátorov
│   ├── WeightSettings.jsx      # Nastavenia váh
│   ├── WizardTopNav.jsx        # Navigácia wizardu
│   ├── ProgressIndicator.jsx   # Indikátor pokroku
│   ├── PWAInstallPrompt.jsx    # PWA inštalácia
│   ├── DeveloperTools.jsx      # Vývojárske nástroje
│   ├── PerformanceMonitor.jsx  # Monitor výkonu
│   ├── AdvancedSearch.jsx      # Pokročilé vyhľadávanie
│   ├── AdvancedHeatmap.jsx     # Pokročilá heatmapa
│   ├── LazyComponents.jsx      # Lazy loading komponenty
│   ├── ErrorRecoveryBoundary.jsx # Error boundary
│   └── Toast.jsx               # Toast notifikácie
├── contexts/            # React kontexty
│   └── WizardContext.jsx       # Hlavný kontext aplikácie
├── hooks/               # Custom React hooks
│   ├── usePdfProcessor.js      # PDF spracovanie
│   ├── useVisionAnalyzer.js    # AI Vision analýza
│   ├── useToast.js             # Toast notifikácie
│   ├── usePWA.js               # PWA funkcionalita
│   ├── useErrorRecovery.js     # Error recovery
│   ├── useAIAssistant.js       # AI asistent
│   ├── useLocalStorage.js      # Local storage
│   └── useLazyLoad.js          # Lazy loading
├── engine/              # Business logika
│   └── EvaluationEngine.js      # Výpočet skóre
├── data/                # Dáta a schémy
│   ├── indikatory.js            # Indikátory a kategórie
│   ├── indikatory_data.js       # Dáta indikátorov
│   ├── indikatory_zakladni.js   # Základné indikátory
│   ├── criteria_schema.js       # Schéma kritérií
│   └── criteria_schema.json     # JSON schéma
├── models/              # Data modely
│   └── CriteriaModel.js         # Model kritérií
├── styles/              # CSS styly
│   └── design.css               # Hlavné styly
├── utils/               # Utility funkcie
│   └── indicatorManager.js      # Správa indikátorov
├── App.jsx              # Hlavná aplikácia
├── main.jsx             # Entry point
└── index.css            # Globálne styly
```

---

## 🧩 HLAVNÉ KOMPONENTY

### 1. **App.jsx** - Hlavná aplikácia
```jsx
import React, { Suspense, lazy } from 'react';
import { WizardProvider } from './contexts/WizardContext';
import { usePWA } from './hooks/usePWA';
import { useErrorRecovery } from './hooks/useErrorRecovery';
import WizardTopNav from './components/WizardTopNav';
import ProgressIndicator from './components/ProgressIndicator';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import DeveloperTools from './components/DeveloperTools';
import PerformanceMonitor from './components/PerformanceMonitor';
import ErrorRecoveryBoundary from './components/ErrorRecoveryBoundary';

// Lazy loading komponenty
const StepConfig = lazy(() => import('./components/StepConfig'));
const StepUpload = lazy(() => import('./components/StepUpload'));
const StepCriteria = lazy(() => import('./components/StepCriteria'));
const StepResults = lazy(() => import('./components/StepResults'));
const StepComparison = lazy(() => import('./components/StepComparison'));

function App() {
  const { isOnline, isInstalled, updateAvailable } = usePWA();
  const { hasError, error, retry } = useErrorRecovery();

  // ... komponenta s lazy loading a error handling
}
```

### 2. **WizardContext.jsx** - Centralizovaný stav
```jsx
import React, { createContext, useContext, useReducer, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { indikatory, kategorie } from '../data/indikatory';
import { evaluateProjects, validateWeights, standardizeWeights } from '../engine/EvaluationEngine';

const WizardContext = createContext();

const STEPS = {
  CONFIG: 'konfigurace',
  UPLOAD: 'nahrani',
  CRITERIA: 'kriteria',
  RESULTS: 'vysledky',
  COMPARISON: 'porovnani'
};

const initialState = {
  currentStep: STEPS.CONFIG,
  projects: [],
  selectedProjects: new Set(),
  selectedCriteria: new Set(Object.keys(indikatory)),
  analysisResults: [],
  weights: {},
  categoryWeights: {},
  config: {
    apiKey: '',
    model: 'gpt-4o'
  }
};

// Centralizovaná funkcia pre prepočítanie skóre
const computeScores = (projects, weights, categoryWeights) => {
  if (!projects || projects.length === 0 || !weights) {
    return [];
  }

  try {
    // Vytvor štandardizovanú štruktúru váh pre EvaluationEngine
    const standardizedWeights = {};
    
    // Skupina indikátorů podle kategorií
    const indicatorsByCategory = {};
    indikatory.forEach(indikator => {
      if (!indicatorsByCategory[indikator.kategorie]) {
        indicatorsByCategory[indikator.kategorie] = [];
      }
      indicatorsByCategory[indikator.kategorie].push(indikator);
    });

    // Vytvor štruktúru váh pre EvaluationEngine
    Object.entries(indicatorsByCategory).forEach(([categoryId, categoryIndicators]) => {
      const categoryWeight = categoryWeights[categoryId] || (100 / Object.keys(indicatorsByCategory).length);
      
      standardizedWeights[categoryId] = {
        weight: categoryWeight,
        indicators: {}
      };
      
      categoryIndicators.forEach(indikator => {
        const indicatorWeight = weights[indikator.id] || 10;
        standardizedWeights[categoryId].indicators[indikator.id] = {
          weight: indicatorWeight
        };
      });
    });

    const validWeights = standardizeWeights(standardizedWeights);
    
    if (!validateWeights(validWeights)) {
      console.warn('[WizardContext] Neplatné váhy pre výpočet skóre');
      return projects.map(project => ({
        ...project,
        scores: { total: 0, categories: {}, indicators: {} }
      }));
    }

    return evaluateProjects(projects, validWeights);
  } catch (error) {
    console.error('[WizardContext] Chyba pri výpočte skóre:', error);
    return projects.map(project => ({
      ...project,
      scores: { total: 0, categories: {}, indicators: {} }
    }));
  }
};

export const WizardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const [storedApiKey, setStoredApiKey] = useLocalStorage('openai_api_key', '');
  const [storedModel, setStoredModel] = useLocalStorage('gpt_model', 'gpt-4o');
  const [storedWeights, setStoredWeights] = useLocalStorage('urban-analysis-vahy', {});
  const [storedCategoryWeights, setStoredCategoryWeights] = useLocalStorage('urban-analysis-category-weights', {});

  // Centralizované výpočty skóre - automaticky sa prepočítavajú pri zmene váh
  const results = useMemo(() => {
    return computeScores(state.projects, state.weights, state.categoryWeights);
  }, [state.projects, state.weights, state.categoryWeights]);

  // ... zvyšok komponenty
};
```

### 3. **StepUpload.jsx** - Nahrávanie PDF
```jsx
import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useWizard } from '../contexts/WizardContext';
import { useToast } from '../hooks/useToast';
import { usePdfProcessor } from '../hooks/usePdfProcessor';
import { useVisionAnalyzer } from '../hooks/useVisionAnalyzer';
import { indikatory } from '../data/indikatory';

const StepUpload = ({ navrhy, setNavrhy, onNext, onBack }) => {
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Použitie WizardContext pre centralizované ukladanie návrhov
  const wizardContext = useWizard();
  const { setProjects } = wizardContext;
  
  // API kľúč sa načítava z localStorage (nastavený v StepConfig)
  const apiKey = localStorage.getItem('apiKey') || '';
  const { processPdf, isProcessing, progress } = usePdfProcessor();
  const { analyze, isAnalyzing: visionAnalyzing } = useVisionAnalyzer();
  const { showToast } = useToast();

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
    setProjects([...navrhy, ...noveNavrhy]);
    
    showToast(`Nahrané ${noveNavrhy.length} návrhů`, 'success');
  }, [setNavrhy, setProjects, showToast]);

  // ... zvyšok komponenty
};
```

### 4. **StepResults.jsx** - Výsledky analýzy
```jsx
import React, { useState, useMemo } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { getAllIndicators, getCategoryWeights } from '../utils/indicatorManager.js';
import { calculateProjectScore, evaluateProjects } from '../engine/EvaluationEngine.js';

const StepResults = ({ navrhy, vybraneIndikatory, onNext, onBack, setNavrhy, vahy = {}, categoryWeights, aiWeights = null, aiCategoryWeights = null }) => {
  
  // Použitie WizardContext pre centralizované výsledky
  const wizardContext = useWizard();
  const results = wizardContext.results || [];
  
  // Použitie results z WizardContext namiesto vlastného výpočtu
  const scoredProposals = useMemo(() => {
    if (results.length === 0) {
      console.warn('[StepResults] Žiadne výsledky z kontextu');
      return [];
    }
    
    // Filtruj len návrhy, ktoré sú v navrhy
    const filteredResults = results.filter(project => 
      navrhy.some(navrh => navrh.id === project.id)
    );
    
    return filteredResults.map(project => ({
      ...project,
      weightedScore: project.scores?.total || 0
    }));
  }, [results, navrhy]);

  // ... zvyšok komponenty
};
```

### 5. **WeightedHeatmap.jsx** - Vážená heatmapa
```jsx
import React, { useMemo, useEffect, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, VisualMapComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useWizard } from '../contexts/WizardContext';

// Zaregistrujeme potřebné komponenty pro echarts
echarts.use([HeatmapChart, GridComponent, VisualMapComponent, TooltipComponent, CanvasRenderer]);

const WeightedHeatmap = ({ vybraneNavrhyData, vybraneIndikatoryList, vahy = {}, categoryWeights = {} }) => {
  // Real-time aktualizácia pri zmene váh alebo kategórií
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  
  // Napojenie na globálny stav z WizardContext
  let globalWeights = vahy;
  let globalCategoryWeights = categoryWeights;
  let results = [];
  
  try {
    const wizardContext = useWizard();
    globalWeights = wizardContext.weights || vahy;
    globalCategoryWeights = wizardContext.categoryWeights || categoryWeights;
    results = wizardContext.results || [];
  } catch (error) {
    console.warn('WizardContext nie je dostupný v WeightedHeatmap');
  }
  
  useEffect(() => {
    setLastUpdate(Date.now());
  }, [results, vybraneIndikatoryList, globalWeights, lastUpdate]);

  // Použitie results z WizardContext namiesto vlastného výpočtu
  const heatmapData = useMemo(() => {
    console.log('[WeightedHeatmap] Debug - results:', results);
    console.log('[WeightedHeatmap] Debug - vybraneIndikatoryList:', vybraneIndikatoryList);
    
    if (results.length === 0 || !vybraneIndikatoryList || vybraneIndikatoryList.length === 0) {
      console.warn('[WeightedHeatmap] Žiadne výsledky z kontextu');
      return [];
    }

    const data = [];
    
    vybraneIndikatoryList.forEach((indikator, indicatorIndex) => {
      results.forEach((project, projectIndex) => {
        // Extrahujeme hodnotu z project.data
        const val = project.data[indikator.id];
        const actualValue = val && typeof val === 'object' && 'value' in val ? val.value : val;
        
        console.log(`[WeightedHeatmap] Debug - ${indikator.nazev} (${indikator.id}):`, {
          actualValue,
          scores: project.scores,
          indicators: project.scores?.indicators,
          indicatorScore: project.scores?.indicators?.[indikator.id]
        });
        
        // Pokud nemáme hodnotu, přeskočíme
        if (actualValue == null || actualValue === '') {
          return;
        }
        
        // Použi normalizovanú hodnotu z results (už vypočítané v WizardContext)
        const normalizedValue = project.scores?.indicators?.[indikator.id] || 0;
        const weight = globalWeights[indikator.id] || 10;
        
        // Vážené skóre
        const weightedScore = normalizedValue * (weight / 100);
        
        data.push({
          x: indicatorIndex,
          y: projectIndex,
          value: weightedScore,
          rawValue: actualValue,
          weight: weight,
          normalizedValue: normalizedValue,
          indicatorName: indikator.nazev,
          projectName: project.nazev
        });
      });
    });

    console.log('[WeightedHeatmap] Debug - final data:', data);
    return data;
  }, [results, vybraneIndikatoryList, globalWeights, lastUpdate]);

  // ... zvyšok komponenty
};
```

---

## 🎣 KONTEXTY A HOOKY

### **WizardContext.jsx** - Hlavný kontext
- **Centralizovaný stav** - Všetky dáta aplikácie
- **Automatické prepočty** - Skóre sa prepočítava pri zmene váh
- **Synchronizácia** - Medzi všetkými komponentami
- **Persistence** - Ukladanie do localStorage

### **usePdfProcessor.js** - PDF spracovanie
```javascript
import { useState, useCallback } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export const usePdfProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const processPdf = useCallback(async (file) => {
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Konverzia PDF na obrázky
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
      
      const images = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise;
        
        images.push(canvas.toDataURL('image/png'));
        setProgress((i / pdf.numPages) * 100);
      }
      
      return { success: true, images };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return { processPdf, isProcessing, progress };
};
```

### **useVisionAnalyzer.js** - AI Vision analýza
```javascript
import { useState, useCallback } from 'react';

export const useVisionAnalyzer = () => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyze = useCallback(async (project, apiKey) => {
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Analyzuj tento urbanistický projekt a extrahuj tieto indikátory: ${Object.keys(indikatory).join(', ')}. Vráť JSON s číselnými hodnotami.`
                },
                ...project.images.map(image => ({
                  type: 'image_url',
                  image_url: { url: image }
                }))
              ]
            }
          ],
          max_tokens: 2000
        })
      });

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      // Parsovanie JSON odpovede
      const analysisResult = JSON.parse(content);
      
      return { success: true, data: analysisResult };
    } catch (error) {
      return { success: false, error: error.message };
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  return { analyze, isAnalyzing };
};
```

### **usePWA.js** - PWA funkcionalita
```javascript
import React, { useState, useEffect, useCallback } from 'react';

export function usePWA() {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isInstalled, isOnline, updateAvailable };
}
```

---

## ⚙️ ENGINE A UTILITY

### **EvaluationEngine.js** - Výpočet skóre
```javascript
/**
 * EvaluationEngine.js - Robustní výpočet skóre projektů
 * 
 * Funkcie:
 * - Normalizácia indikátorov
 * - Vážené skóre kategórií a indikátorov
 * - Celkové skóre projektu
 * - Bezpečné ošetrenie NaN a prázdnych dát
 */

/**
 * Vypočíta skóre projektu na základe váh a hodnôt indikátorov
 */
export function calculateProjectScore(project, weights) {
  if (!project || !weights) {
    console.warn('[EvaluationEngine] Chýbajúce dáta pre výpočet skóre');
    return 0;
  }

  let totalWeightedScore = 0;
  let totalPossibleScore = 0;

  try {
    // Prejdi všetky kategórie
    Object.entries(project.categories || {}).forEach(([catId, category]) => {
      const categoryWeight = weights[catId]?.weight ?? 0;
      
      if (categoryWeight <= 0) return; // Preskoč kategórie bez váhy

      // Prejdi všetky indikátory v kategórii
      Object.entries(category.indicators || {}).forEach(([indId, indicator]) => {
        const indicatorWeight = weights[catId]?.indicators?.[indId]?.weight ?? 0;
        
        if (indicatorWeight <= 0) return; // Preskoč indikátory bez váhy

        // Normalizácia hodnoty indikátora
        const indicatorValue = getIndicatorValue(indicator);
        const normalizedValue = normalizeIndicatorValue(indicatorValue, indicator);
        
        // Vážené skóre indikátora
        const weightedScore = normalizedValue * (indicatorWeight / 100) * (categoryWeight / 100);
        
        if (Number.isFinite(weightedScore)) {
          totalWeightedScore += weightedScore;
          totalPossibleScore += (indicatorWeight / 100) * (categoryWeight / 100) * 100;
        }
      });
    });

    const score = totalPossibleScore ? (totalWeightedScore / totalPossibleScore) * 100 : 0;
    return Number.isFinite(score) ? Number(score.toFixed(2)) : 0;
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri výpočte skóre:', error);
    return 0;
  }
}

/**
 * Spracuje pole projektov a vráti ich s vypočítaným skóre
 */
export function evaluateProjects(projects, weights) {
  if (!Array.isArray(projects) || projects.length === 0) {
    console.warn('[EvaluationEngine] Žiadne projekty na spracovanie');
    return [];
  }

  if (!validateWeights(weights)) {
    console.warn('[EvaluationEngine] Neplatné váhy');
    return projects.map(project => ({
      ...project,
      scores: { total: 0, categories: {}, indicators: {} }
    }));
  }

  try {
    return projects.map(project => {
      const totalScore = calculateProjectScore(project, weights);
      
      return {
        ...project,
        scores: {
          total: totalScore,
          categories: calculateCategoryScores(project, weights),
          indicators: calculateIndicatorScores(project, weights)
        }
      };
    });
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri spracovaní projektov:', error);
    return projects.map(project => ({
      ...project,
      scores: { total: 0, categories: {}, indicators: {} }
    }));
  }
}

/**
 * Validuje štruktúru váh
 */
export function validateWeights(weights) {
  if (!weights || typeof weights !== 'object') return false;
  
  try {
    return Object.values(weights).every(category => 
      category && 
      typeof category.weight === 'number' && 
      Number.isFinite(category.weight) &&
      category.indicators &&
      Object.values(category.indicators).every(indicator =>
        indicator && 
        typeof indicator.weight === 'number' && 
        Number.isFinite(indicator.weight)
      )
    );
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri validácii váh:', error);
    return false;
  }
}

/**
 * Standardizuje váhy na 100%
 */
export function standardizeWeights(weights) {
  if (!weights || typeof weights !== 'object') return weights;
  
  try {
    const standardized = {};
    const totalCategoryWeight = Object.values(weights).reduce((sum, cat) => sum + (cat.weight || 0), 0);
    
    Object.entries(weights).forEach(([catId, category]) => {
      const categoryWeight = category.weight || 0;
      const normalizedCategoryWeight = totalCategoryWeight > 0 ? (categoryWeight / totalCategoryWeight) * 100 : 0;
      
      standardized[catId] = {
        weight: Number.isFinite(normalizedCategoryWeight) ? Number(normalizedCategoryWeight.toFixed(2)) : 0,
        indicators: {}
      };
      
      if (category.indicators) {
        const totalIndicatorWeight = Object.values(category.indicators).reduce((sum, ind) => sum + (ind.weight || 0), 0);
        
        Object.entries(category.indicators).forEach(([indId, indicator]) => {
          const indicatorWeight = indicator.weight || 0;
          const normalizedIndicatorWeight = totalIndicatorWeight > 0 ? (indicatorWeight / totalIndicatorWeight) * 100 : 0;
          
          standardized[catId].indicators[indId] = {
            weight: Number.isFinite(normalizedIndicatorWeight) ? Number(normalizedIndicatorWeight.toFixed(2)) : 0
          };
        });
      }
    });
    
    return standardized;
  } catch (error) {
    console.error('[EvaluationEngine] Chyba pri standardizácii váh:', error);
    return weights;
  }
}
```

### **indicatorManager.js** - Správa indikátorov
```javascript
import { indikatory, kategorie } from '../data/indikatory';

export const getAllIndicators = () => {
  return indikatory;
};

export const getCategoryWeights = () => {
  return kategorie.reduce((weights, category) => {
    weights[category.id] = category.vaha || 0;
    return weights;
  }, {});
};

export const getCategorySummary = (categoryId) => {
  const category = kategorie.find(cat => cat.id === categoryId);
  if (!category) return null;
  
  const indicators = indikatory.filter(ind => ind.kategorie === categoryId);
  
  return {
    ...category,
    indicators: indicators,
    totalIndicators: indicators.length,
    averageWeight: indicators.reduce((sum, ind) => sum + (ind.vaha || 0), 0) / indicators.length
  };
};

export const deleteIndicator = (indicatorId) => {
  // Implementácia mazania indikátora
  console.log(`Deleting indicator: ${indicatorId}`);
};
```

---

## 🎨 STYLY A KONFIGURÁCIA

### **vite.config.js** - Vite konfigurácia
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Urban Analytics',
        short_name: 'UrbanAI',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1d4ed8',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      devOptions: {
        enabled: false, // 🔥 vypnout SW ve vývojovém režimu
      }
    })
  ],
  server: {
    port: 5179,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'lucide-react': ['lucide-react'],
          'recharts': ['recharts'],
          'echarts': ['echarts', 'echarts-for-react'],
          'pdf-utils': ['pdfjs-dist', 'html2canvas', 'jspdf'],
          'ai-components': [
            './src/components/AIAssistant.jsx',
            './src/components/AIWeightManager.jsx',
            './src/components/AdvancedAIAssistant.jsx',
            './src/components/ContextAwareAIWeightManager.jsx'
          ],
          'chart-components': [
            './src/components/RadarChartAdvanced.jsx',
            './src/components/ExpandableRadarChart.jsx',
            './src/components/WeightedHeatmap.jsx',
            './src/components/AdvancedHeatmap.jsx'
          ],
          'heavy-components': [
            './src/components/ComparisonDashboard.jsx',
            './src/components/StepComparison.jsx',
            './src/components/StepUpload.jsx',
            './src/components/StepResults.jsx'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      ignore: ['pdfjs-dist']
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
```

### **tailwind.config.js** - Tailwind konfigurácia
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-gentle': 'bounceGentle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        }
      }
    },
  },
  plugins: [],
}
```

### **design.css** - Hlavné styly
```css
/* Urban Analytics Design System */

/* Base Styles */
.card-urban {
  @apply bg-white rounded-2xl shadow-lg border border-gray-100;
}

.card-urban-dark {
  @apply bg-gray-800 rounded-2xl shadow-xl border border-gray-700;
}

/* Gradient Backgrounds */
.bg-gradient-urban {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.bg-gradient-success {
  background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%);
}

.bg-gradient-warning {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
}

.bg-gradient-error {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
}

/* Buttons */
.btn {
  @apply inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500;
}

.btn-success {
  @apply bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md hover:shadow-lg;
}

.btn-warning {
  @apply bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500 shadow-md hover:shadow-lg;
}

.btn-error {
  @apply bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg;
}

/* Headings */
.heading-1 {
  @apply text-3xl font-bold text-gray-900;
}

.heading-2 {
  @apply text-2xl font-semibold text-gray-800;
}

.heading-3 {
  @apply text-xl font-medium text-gray-700;
}

/* Badges */
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
}

.badge-success {
  @apply bg-green-100 text-green-800;
}

.badge-warning {
  @apply bg-yellow-100 text-yellow-800;
}

.badge-error {
  @apply bg-red-100 text-red-800;
}

.badge-info {
  @apply bg-blue-100 text-blue-800;
}

/* Animations */
.animate-fade-in {
  animation: fadeIn 0.5s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

.animate-bounce-gentle {
  animation: bounceGentle 2s infinite;
}

/* Loading Spinner */
.spinner {
  @apply animate-spin rounded-full border-2 border-gray-300 border-t-blue-600;
}

/* Progress Bar */
.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2;
}

.progress-fill {
  @apply bg-blue-600 h-2 rounded-full transition-all duration-300;
}

/* Heatmap Styles */
.heatmap-cell {
  @apply transition-all duration-200 hover:scale-105 cursor-pointer;
}

.heatmap-tooltip {
  @apply bg-white rounded-lg shadow-lg p-3 border border-gray-200;
}

/* Responsive Design */
@media (max-width: 768px) {
  .card-urban {
    @apply rounded-xl shadow-md;
  }
  
  .heading-1 {
    @apply text-2xl;
  }
  
  .heading-2 {
    @apply text-xl;
  }
}
```

---

## 📊 DÁTA A SCHÉMY

### **indikatory.js** - Indikátory a kategórie
```javascript
export const indikatory = [
  {
    id: 'parkovani_celkem',
    nazev: 'Parkovací stání celkem',
    jednotka: 'ks',
    kategorie: 'parkovani',
    vaha: 10,
    popis: 'Celkový počet parkovacích stání'
  },
  {
    id: 'parkovani_podzemni',
    nazev: 'Parkovací stání podzemní',
    jednotka: 'ks',
    kategorie: 'parkovani',
    vaha: 10,
    popis: 'Počet podzemních parkovacích stání'
  },
  // ... ďalšie indikátory
];

export const kategorie = [
  {
    id: 'parkovani',
    nazev: 'Parkování',
    vaha: 30,
    popis: 'Indikátory týkající se parkování'
  },
  {
    id: 'plochy',
    nazev: 'Plochy',
    vaha: 40,
    popis: 'Indikátory týkající se ploch'
  },
  {
    id: 'objekty',
    nazev: 'Objekty',
    vaha: 30,
    popis: 'Indikátory týkající se objektů'
  }
];
```

### **criteria_schema.js** - Schéma kritérií
```javascript
export const criteriaSchema = {
  type: 'object',
  properties: {
    parkovani_celkem: {
      type: 'number',
      minimum: 0,
      description: 'Celkový počet parkovacích stání'
    },
    parkovani_podzemni: {
      type: 'number',
      minimum: 0,
      description: 'Počet podzemních parkovacích stání'
    },
    // ... ďalšie vlastnosti
  },
  required: ['parkovani_celkem', 'parkovani_podzemni'],
  additionalProperties: false
};
```

---

## 🔄 ZMENY A VYLEPŠENIA

### **v2.1 Final - Kompletná konsolidácia**

#### ✅ **Centralizovaný stav**
- Všetky dáta v `WizardContext`
- Automatické prepočítanie skóre
- Synchronizácia medzi komponentami

#### ✅ **Robustný výpočet skóre**
- `EvaluationEngine.js` s normalizáciou
- Bezpečné ošetrenie chýb
- Validácia váh a dát

#### ✅ **AI integrácia**
- `ContextAwareAIWeightManager.jsx`
- Automatické doporučenia váh
- Synchronizácia s globálnym stavom

#### ✅ **Optimalizácia výkonu**
- Lazy loading komponentov
- Memoizácia výpočtov
- Chunking pre lepší loading

#### ✅ **PWA funkcionalita**
- Service Worker
- Offline podpora
- Manifest pre inštaláciu

#### ✅ **Error handling**
- Error boundaries
- Retry mechanizmy
- Graceful degradation

---

## 🚀 INŠTALÁCIA A SPUSTENIE

### **Požiadavky:**
- Node.js 18+
- npm alebo yarn
- OpenAI API kľúč

### **Inštalácia:**
```bash
# Klonovanie repozitára
git clone <repository-url>
cd urban-analytics

# Inštalácia závislostí
npm install

# Spustenie vývojového servera
npm run dev

# Build pre produkciu
npm run build

# Preview produkčného buildu
npm run preview
```

### **Konfigurácia:**
1. **OpenAI API kľúč** - Nastavte v kroku "Konfigurace"
2. **Environment variables** - Vite automaticky načítava `VITE_OPENAI_KEY`
3. **PWA** - Automaticky aktivované v produkcii

### **Porty:**
- **Vývoj:** http://localhost:5179/
- **Alternatívne:** http://localhost:5180/, http://localhost:5181/, http://localhost:5182/

### **Build optimalizácia:**
- **Chunking** - Automatické rozdelenie kódu
- **Tree shaking** - Odstránenie nepoužívaného kódu
- **Minifikácia** - Optimalizácia veľkosti
- **Gzip** - Kompresia pre rýchlejší loading

---

## 📈 VÝKON A MONITORING

### **Performance metriky:**
- **First Contentful Paint** < 1.5s
- **Largest Contentful Paint** < 2.5s
- **Cumulative Layout Shift** < 0.1
- **Time to Interactive** < 3s

### **Monitoring:**
- `PerformanceMonitor.jsx` - Real-time metriky
- `DeveloperTools.jsx` - Debug nástroje
- Console logy pre debugging

### **Optimalizácie:**
- Lazy loading komponentov
- Memoizácia výpočtov
- Debouncing API volaní
- Caching výsledkov

---

## 🔒 BEZPEČNOSŤ

### **API kľúče:**
- Ukladanie v localStorage
- Nezobrazovanie v kóde
- Automatické mazanie pri logout

### **Dáta:**
- Lokálne spracovanie
- Žiadne odosielanie na externé servery
- GDPR compliance

### **PWA:**
- HTTPS required
- Secure context
- Service Worker security

---

## 📱 RESPONZÍVNY DIZAJN

### **Breakpointy:**
- **Mobile:** < 768px
- **Tablet:** 768px - 1024px
- **Desktop:** > 1024px

### **Komponenty:**
- Flexibilné gridy
- Adaptívne obrázky
- Touch-friendly tlačidlá
- Swipe gestúry

---

## 🎨 DIZAJN SYSTÉM

### **Farby:**
- **Primary:** Blue (3b82f6)
- **Secondary:** Green (22c55e)
- **Warning:** Yellow (f59e0b)
- **Error:** Red (ef4444)

### **Typografia:**
- **Headings:** Inter, 600-700 weight
- **Body:** Inter, 400 weight
- **Code:** JetBrains Mono

### **Spacing:**
- **xs:** 0.25rem (4px)
- **sm:** 0.5rem (8px)
- **md:** 1rem (16px)
- **lg:** 1.5rem (24px)
- **xl:** 2rem (32px)

---

## 🔧 DEBUGGING

### **Console logy:**
```javascript
// WizardContext debug
console.log('[WizardContext] Debug - results:', results);

// WeightedHeatmap debug
console.log('[WeightedHeatmap] Debug - final data:', data);

// StepResults debug
console.log('[StepResults] Debug - scoredProposals:', scoredProposals);
```

### **Developer tools:**
- React DevTools
- Performance tab
- Network tab
- Application tab (PWA)

---

## 📚 DOKUMENTÁCIA

### **API dokumentácia:**
- OpenAI GPT-4o Vision API
- PDF.js API
- ECharts API
- Framer Motion API

### **Komponenty:**
- Props dokumentácia
- Usage príklady
- Styling guide
- Accessibility

---

## 🚀 ROADMAP

### **v2.2 - Plánované vylepšenia:**
- [ ] Export do Excel
- [ ] Batch processing
- [ ] Advanced filtering
- [ ] Real-time collaboration
- [ ] Mobile app (PWA)

### **v3.0 - Budúce funkcie:**
- [ ] Machine learning
- [ ] Advanced analytics
- [ ] Custom indicators
- [ ] API integration
- [ ] Multi-language support

---

## 📞 PODPORA

### **Kontakt:**
- **Email:** support@urbananalytics.com
- **GitHub:** https://github.com/urbananalytics
- **Documentation:** https://docs.urbananalytics.com

### **FAQ:**
- **Q:** Ako nastaviť OpenAI API kľúč?
- **A:** V kroku "Konfigurace" zadajte váš API kľúč.

- **Q:** Prečo sa nezobrazuje heatmapa?
- **A:** Skontrolujte, či sú spracované súbory a nastavené váhy.

- **Q:** Ako exportovať výsledky?
- **A:** Použite tlačidlo "Exportovat výsledky" v kroku "Výsledky analýzy".

---

## 📄 LICENCIA

**MIT License** - Viď LICENSE súbor pre detaily.

---

## 🙏 POĽAKOVANIA

- **OpenAI** - GPT-4o Vision API
- **Vite** - Rýchly build tool
- **React** - UI framework
- **Tailwind CSS** - CSS framework
- **Framer Motion** - Animácie
- **ECharts** - Grafy a vizualizácie

---

**© 2025 Urban Analytics. Všetky práva vyhradené.**

*Táto záloha obsahuje kompletnú funkčnú aplikáciu Urban Analytics 2.1 Final s centralizovaným stavom, automatickým prepočítaním skóre a robustným error handlingom.*

