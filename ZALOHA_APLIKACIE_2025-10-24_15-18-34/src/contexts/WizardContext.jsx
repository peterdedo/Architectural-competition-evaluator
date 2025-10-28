import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
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

const wizardReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    
    case 'ADD_PROJECT':
      return { 
        ...state, 
        projects: [...state.projects, action.payload]
      };
    
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map(p => 
          p.id === action.payload.id 
            ? { ...p, ...action.payload.updates }
            : p
        )
      };
    
    case 'SET_SELECTED_PROJECTS':
      return { ...state, selectedProjects: action.payload };
    
    case 'TOGGLE_PROJECT_SELECTION':
      const newSelected = new Set(state.selectedProjects);
      if (newSelected.has(action.payload)) {
        newSelected.delete(action.payload);
      } else {
        newSelected.add(action.payload);
      }
      return { ...state, selectedProjects: newSelected };
    
    case 'SET_SELECTED_CRITERIA':
      return { ...state, selectedCriteria: action.payload };
    
    case 'TOGGLE_CRITERIA_SELECTION':
      const newCriteria = new Set(state.selectedCriteria);
      if (newCriteria.has(action.payload)) {
        newCriteria.delete(action.payload);
      } else {
        newCriteria.add(action.payload);
      }
      return { ...state, selectedCriteria: newCriteria };
    
    case 'SET_ANALYSIS_RESULTS':
      return { ...state, analysisResults: action.payload };
    
    case 'SET_WEIGHTS':
      return { ...state, weights: action.payload };
    
    case 'SET_CATEGORY_WEIGHTS':
      return { ...state, categoryWeights: action.payload };
    
    case 'SET_CONFIG':
      return { ...state, config: { ...state.config, ...action.payload } };
    
    case 'RESET':
      return initialState;
    
    default:
      return state;
  }
};

export const WizardProvider = ({ children }) => {
  const [state, dispatch] = useReducer(wizardReducer, initialState);
  const [storedApiKey, setStoredApiKey] = useLocalStorage('openai_api_key', '');
  const [storedModel, setStoredModel] = useLocalStorage('gpt_model', 'gpt-4o');
  const [storedWeights, setStoredWeights] = useLocalStorage('urban-analysis-vahy', {});
  const [storedCategoryWeights, setStoredCategoryWeights] = useLocalStorage('urban-analysis-category-weights', {});
  const [storedProjects, setStoredProjects] = useLocalStorage('urban-analysis-navrhy', []);

  // Bezpečná kontrola pre state.projects
  if (!Array.isArray(state.projects)) {
    console.warn("⚠️ state.projects nie je pole, resetujem...");
    dispatch({ type: 'SET_PROJECTS', payload: [] });
  }

  // Načítanie uložených nastavení
  React.useEffect(() => {
    if (storedApiKey || storedModel) {
      dispatch({
        type: 'SET_CONFIG',
        payload: {
          apiKey: storedApiKey,
          model: storedModel
        }
      });
    }
  }, [storedApiKey, storedModel]);

  React.useEffect(() => {
    if (Object.keys(storedWeights).length > 0) {
      dispatch({
        type: 'SET_WEIGHTS',
        payload: storedWeights
      });
    }
  }, [storedWeights]);

  React.useEffect(() => {
    if (Object.keys(storedCategoryWeights).length > 0) {
      dispatch({
        type: 'SET_CATEGORY_WEIGHTS',
        payload: storedCategoryWeights
      });
    }
  }, [storedCategoryWeights]);

  // Načítanie uložených projektů
  React.useEffect(() => {
    if (Array.isArray(storedProjects) && storedProjects.length > 0) {
      dispatch({
        type: 'SET_PROJECTS',
        payload: storedProjects
      });
    }
  }, [storedProjects]);

  const setStep = useCallback((step) => {
    dispatch({ type: 'SET_STEP', payload: step });
  }, []);

  const setProjects = useCallback((projects) => {
    // Bezpečná kontrola - zabezpeč, že projects je pole
    const projectsArray = Array.isArray(projects) ? projects : Object.values(projects || {});
    dispatch({ type: 'SET_PROJECTS', payload: projectsArray });
    setStoredProjects(projectsArray);
  }, [setStoredProjects]);

  const addProject = useCallback((project) => {
    dispatch({ type: 'ADD_PROJECT', payload: project });
  }, []);

  const updateProject = useCallback((id, updates) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
  }, []);

  const setSelectedProjects = useCallback((projects) => {
    dispatch({ type: 'SET_SELECTED_PROJECTS', payload: projects });
  }, []);

  const toggleProjectSelection = useCallback((projectId) => {
    dispatch({ type: 'TOGGLE_PROJECT_SELECTION', payload: projectId });
  }, []);

  const setSelectedCriteria = useCallback((criteria) => {
    dispatch({ type: 'SET_SELECTED_CRITERIA', payload: criteria });
  }, []);

  const toggleCriteriaSelection = useCallback((criteriaId) => {
    dispatch({ type: 'TOGGLE_CRITERIA_SELECTION', payload: criteriaId });
  }, []);

  const setAnalysisResults = useCallback((results) => {
    dispatch({ type: 'SET_ANALYSIS_RESULTS', payload: results });
  }, []);

  const setWeights = useCallback((weights) => {
    dispatch({ type: 'SET_WEIGHTS', payload: weights });
    setStoredWeights(weights);
  }, [setStoredWeights]);

  const setCategoryWeights = useCallback((categoryWeights) => {
    dispatch({ type: 'SET_CATEGORY_WEIGHTS', payload: categoryWeights });
    setStoredCategoryWeights(categoryWeights);
  }, [setStoredCategoryWeights]);

  // Centralizovaná funkcia pre aktualizáciu váh s automatickým prepočítaním skóre
  const updateWeights = useCallback((indikatory, kategorie) => {
    console.log('🔍 WizardContext - updateWeights volané s:', { indikatory, kategorie });
    
    // Aktualizuj váhy
    if (indikatory) {
      console.log('🔍 WizardContext - nastavujem váhy indikátorů:', indikatory);
      setWeights(indikatory);
    }
    
    if (kategorie) {
      console.log('🔍 WizardContext - nastavujem váhy kategórií:', kategorie);
      setCategoryWeights(kategorie);
    }
    
    // Automaticky přepočítej výsledky po změně váh
    setTimeout(() => {
      const currentProjects = state.projects || [];
      const currentWeights = indikatory || state.weights || {};
      const currentCategoryWeights = kategorie || state.categoryWeights || {};
      
      if (currentProjects.length > 0 && Object.keys(currentWeights).length > 0) {
        console.log('🔄 WizardContext - automaticky přepočítávám výsledky po změně váh');
        const newResults = computeScores(currentProjects, currentWeights, currentCategoryWeights);
        setAnalysisResults(newResults);
        console.log('✅ WizardContext - výsledky přepočítány:', newResults);
      }
    }, 100); // Malé zpoždění pro zajištění aktualizace stavu
  }, [setWeights, setCategoryWeights, setAnalysisResults, state.projects, state.weights, state.categoryWeights]);

  // Centralizovaná funkcia pre prepočítanie skóre
  const computeScores = useCallback((projects, weights, categoryWeights) => {
    if (!projects || projects.length === 0 || !weights) {
      return [];
    }

    try {
      // Guard clauses pro numerické hodnoty
      if (typeof weights !== 'object' || weights === null) {
        console.warn('[WizardContext] Neplatné váhy - není objekt');
        return [];
      }

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
        const categoryWeight = categoryWeights?.[categoryId] || (100 / Object.keys(indicatorsByCategory).length);
        
        // Guard clause pro numerické hodnoty
        if (typeof categoryWeight !== 'number' || isNaN(categoryWeight)) {
          console.warn(`[WizardContext] Neplatná váha kategórie ${categoryId}:`, categoryWeight);
          return;
        }
        
        standardizedWeights[categoryId] = {
          weight: categoryWeight,
          indicators: {}
        };
        
        categoryIndicators.forEach(indikator => {
          const indicatorWeight = weights[indikator.id] || 10;
          
          // Guard clause pro numerické hodnoty
          if (typeof indicatorWeight !== 'number' || isNaN(indicatorWeight)) {
            console.warn(`[WizardContext] Neplatná váha indikátora ${indikator.id}:`, indicatorWeight);
            return;
          }
          
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
  }, []);

  const setConfig = useCallback((config) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
    if (config.apiKey) setStoredApiKey(config.apiKey);
    if (config.model) setStoredModel(config.model);
  }, [setStoredApiKey, setStoredModel]);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setStoredApiKey('');
    setStoredModel('gpt-4o');
    setStoredWeights({});
    setStoredCategoryWeights({});
  }, [setStoredApiKey, setStoredModel, setStoredWeights, setStoredCategoryWeights]);

  // Computed values - bezpečná kontrola pre state.projects
  const validProjects = useMemo(() => {
    return Array.isArray(state.projects) ? state.projects : [];
  }, [state.projects]);

  const selectedProjectsList = useMemo(() => {
    return validProjects.filter(p => state.selectedProjects.has(p.id));
  }, [validProjects, state.selectedProjects]);

  const selectedCriteriaList = useMemo(() => {
    return indikatory.filter(ind => state.selectedCriteria.has(ind.id));
  }, [state.selectedCriteria]);

  const completedProjects = useMemo(() => {
    return validProjects.filter(p => p.status === 'completed');
  }, [validProjects]);
  
  // Centralizované výpočty skóre - automaticky sa prepočítavajú pri zmene váh
  const results = useMemo(() => {
    return computeScores(validProjects, state.weights, state.categoryWeights);
  }, [validProjects, state.weights, state.categoryWeights, computeScores]);

  const value = useMemo(() => ({
    ...state,
    STEPS,
    setStep,
    setProjects,
    addProject,
    updateProject,
    setSelectedProjects,
    toggleProjectSelection,
    setSelectedCriteria,
    toggleCriteriaSelection,
    setAnalysisResults,
    setWeights,
    setCategoryWeights,
    updateWeights,
    computeScores,
    setConfig,
    reset,
    // Computed values
    selectedProjectsList,
    selectedCriteriaList,
    completedProjects,
    results,
    projects: validProjects
  }), [
    state,
    setStep,
    setProjects,
    addProject,
    updateProject,
    setSelectedProjects,
    toggleProjectSelection,
    setSelectedCriteria,
    toggleCriteriaSelection,
    setAnalysisResults,
    setWeights,
    setCategoryWeights,
    updateWeights,
    computeScores,
    setConfig,
    reset,
    selectedProjectsList,
    selectedCriteriaList,
    completedProjects,
    results,
    validProjects
  ]);

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};