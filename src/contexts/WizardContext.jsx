import React, { createContext, useContext, useReducer, useMemo, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const WizardContext = createContext();

const STEPS = {
  CONFIG: 'konfigurace',
  UPLOAD: 'nahrani',
  RESULTS: 'vysledky',
};

const initialState = {
  currentStep: STEPS.CONFIG,
  projects: [],
  config: {
    model: 'gpt-5.6-luna',
  },
};

const wizardReducer = (state, action) => {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.payload };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] };
    case 'UPDATE_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.id ? { ...p, ...action.payload.updates } : p
        ),
      };
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
  const [storedModel, setStoredModel] = useLocalStorage('gpt_model', 'gpt-5.6-luna');
  const [storedProjects, setStoredProjects] = useLocalStorage('urban-analysis-navrhy', []);

  React.useEffect(() => {
    if (!Array.isArray(state.projects)) {
      dispatch({ type: 'SET_PROJECTS', payload: [] });
    }
  }, [state.projects]);

  React.useEffect(() => {
    if (storedModel) dispatch({ type: 'SET_CONFIG', payload: { model: storedModel } });
  }, [storedModel]);

  React.useEffect(() => {
    if (Array.isArray(storedProjects) && storedProjects.length > 0) {
      dispatch({ type: 'SET_PROJECTS', payload: storedProjects });
    }
  }, [storedProjects]);

  const setProjects = useCallback(
    (projects) => {
      let projectsArray;
      if (typeof projects === 'function') {
        const current = state.projects || [];
        const next = projects(current);
        projectsArray = Array.isArray(next) ? next : Object.values(next || {});
      } else {
        projectsArray = Array.isArray(projects) ? projects : Object.values(projects || {});
      }
      dispatch({ type: 'SET_PROJECTS', payload: projectsArray });
      setStoredProjects(projectsArray);
    },
    [setStoredProjects, state.projects]
  );

  const addProject = useCallback((project) => dispatch({ type: 'ADD_PROJECT', payload: project }), []);
  const updateProject = useCallback(
    (id, updates) => dispatch({ type: 'UPDATE_PROJECT', payload: { id, updates } }),
    []
  );

  const setStep = useCallback((step) => dispatch({ type: 'SET_STEP', payload: step }), []);

  const setConfig = useCallback(
    (config) => {
      dispatch({ type: 'SET_CONFIG', payload: config });
      if (config.model) setStoredModel(config.model);
    },
    [setStoredModel]
  );

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
    setStoredModel('gpt-5.6-luna');
    setStoredProjects([]);
  }, [setStoredModel, setStoredProjects]);

  const validProjects = useMemo(
    () => (Array.isArray(state.projects) ? state.projects : []),
    [state.projects]
  );

  const completedProjects = useMemo(
    () => validProjects.filter((p) => p.status === 'zpracován'),
    [validProjects]
  );

  const value = useMemo(
    () => ({
      ...state,
      STEPS,
      setStep,
      setProjects,
      addProject,
      updateProject,
      setConfig,
      reset,
      completedProjects,
      projects: validProjects,
    }),
    [state, setStep, setProjects, addProject, updateProject, setConfig, reset, completedProjects, validProjects]
  );

  return <WizardContext.Provider value={value}>{children}</WizardContext.Provider>;
};

export const useWizard = () => {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within a WizardProvider');
  }
  return context;
};
