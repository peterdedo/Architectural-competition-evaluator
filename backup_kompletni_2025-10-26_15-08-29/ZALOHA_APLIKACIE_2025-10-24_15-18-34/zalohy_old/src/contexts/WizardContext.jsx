import React, { createContext, useContext, useReducer } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { CRITERIA } from '../models/CriteriaModel';

const WizardContext = createContext();

const STEPS = {
  CONFIG: 'config',
  UPLOAD: 'upload',
  CRITERIA: 'criteria',
  RESULTS: 'results',
  COMPARISON: 'comparison'
};

const initialState = {
  currentStep: STEPS.CONFIG,
  projects: [],
  selectedCriteria: new Set(Object.keys(CRITERIA)),
  analysisResults: [],
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
    
    case 'SET_SELECTED_CRITERIA':
      return { ...state, selectedCriteria: action.payload };
    
    case 'SET_ANALYSIS_RESULTS':
      return { ...state, analysisResults: action.payload };
    
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

  const setStep = (step) => {
    dispatch({ type: 'SET_STEP', payload: step });
  };

  const setProjects = (projects) => {
    dispatch({ type: 'SET_PROJECTS', payload: projects });
  };

  const addProject = (project) => {
    dispatch({ type: 'ADD_PROJECT', payload: project });
  };

  const updateProject = (id, updates) => {
    dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } });
  };

  const setSelectedCriteria = (criteria) => {
    dispatch({ type: 'SET_SELECTED_CRITERIA', payload: criteria });
  };

  const setAnalysisResults = (results) => {
    dispatch({ type: 'SET_ANALYSIS_RESULTS', payload: results });
  };

  const setConfig = (config) => {
    dispatch({ type: 'SET_CONFIG', payload: config });
    if (config.apiKey) setStoredApiKey(config.apiKey);
    if (config.model) setStoredModel(config.model);
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const value = {
    ...state,
    STEPS,
    setStep,
    setProjects,
    addProject,
    updateProject,
    setSelectedCriteria,
    setAnalysisResults,
    setConfig,
    reset
  };

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







