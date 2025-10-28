import React, { createContext, useContext, useState } from 'react';

const WizardContext = createContext();

const STEPS = {
  CONFIG: 'config',
  UPLOAD: 'upload',
  CRITERIA: 'criteria',
  RESULTS: 'results',
  COMPARISON: 'comparison'
};

export const WizardProvider = ({ children }) => {
  const [currentStep, setCurrentStep] = useState(STEPS.CONFIG);
  const [projects, setProjects] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState(new Set());
  const [analysisResults, setAnalysisResults] = useState([]);
  const [config, setConfig] = useState({
    apiKey: '',
    model: 'gpt-4o'
  });

  const value = {
    currentStep,
    setCurrentStep: setCurrentStep,
    projects,
    setProjects,
    selectedCriteria,
    setSelectedCriteria,
    analysisResults,
    setAnalysisResults,
    config,
    setConfig,
    STEPS
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