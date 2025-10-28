import React, { useState, useEffect } from 'react';
import './index.css';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StepConfig from './components/StepConfig';
import StepUpload from './components/StepUpload';
import StepCriteria from './components/StepCriteria';
import StepResults from './components/StepResults';
import StepComparison from './components/StepComparison';
import Toast from './components/Toast';
import { useToast } from './hooks/useToast';
import { CRITERIA } from './criteria';

const STEPS = [
  {
    key: 'config',
    title: 'Konfigurace',
    description: 'API nastavení'
  },
  {
    key: 'upload',
    title: 'Nahrávání',
    description: 'PDF dokumenty'
  },
  {
    key: 'criteria',
    title: 'Kritéria',
    description: 'Výběr parametrů'
  },
  {
    key: 'results',
    title: 'Výsledky',
    description: 'Analýza dat'
  },
  {
    key: 'comparison',
    title: 'Porovnání',
    description: 'Vizuální srovnání'
  }
];

function App() {
  const [currentStep, setCurrentStep] = useState('config');
  const [apiKey, setApiKey] = useState('');
  const [gptModel, setGptModel] = useState('gpt-4-turbo');
  const [projects, setProjects] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState(() => new Set(Object.keys(CRITERIA || {})));
  
  const { toasts, showToast, hideToast } = useToast();

  // Načtení uložené konfigurace při startu
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    const savedModel = localStorage.getItem('gpt_model');
    if (savedKey) setApiKey(savedKey);
    if (savedModel) setGptModel(savedModel);
  }, []);

  // Handler pro změnu kroku
  const handleStepChange = (stepKey) => {
    setCurrentStep(stepKey);
  };

  // Handler pro uložení konfigurace
  const handleConfigSave = (key, model) => {
    setApiKey(key);
    setGptModel(model);
    showToast('Konfigurace uložena', 'success');
  };

  // Handler pro nahrání souborů
  const handleFilesUpload = (files, projectNames = [], projectImages = []) => {
    const newProjects = Array.from(files).map((file, index) => ({
      id: Date.now() + Math.random(),
      name: projectNames[index] || file.name.replace('.pdf', ''),
      file: file,
      image: projectImages[index] || null,
      pageImages: [],
      status: 'pending',
      selected: false,
      extractedData: {
        indicators: {}
      }
    }));
    
    setProjects(prev => [...prev, ...newProjects]);
    showToast(`Nahráno ${newProjects.length} projektů`, 'success');
  };

  // Handler pro přepnutí výběru projektu
  const handleProjectToggle = (projectId) => {
    setProjects(prev =>
      prev.map(p =>
        p.id === projectId ? { ...p, selected: !p.selected } : p
      )
    );
  };

  // Handler pro změnu kritérií
  const handleCriteriaChange = (newCriteria) => {
    setSelectedCriteria(newCriteria);
  };

  // Render aktuálního kroku
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'config':
        return (
          <StepConfig
            onNext={handleStepChange}
            onConfigSave={handleConfigSave}
          />
        );
      case 'upload':
        return (
          <StepUpload
            onNext={handleStepChange}
            onBack={handleStepChange}
            onFilesUpload={handleFilesUpload}
            projects={projects}
          />
        );
      case 'criteria':
        return (
          <StepCriteria
            onNext={handleStepChange}
            onBack={handleStepChange}
            selectedCriteria={selectedCriteria}
            onCriteriaChange={handleCriteriaChange}
          />
        );
      case 'results':
        return (
          <StepResults
            onNext={handleStepChange}
            onBack={handleStepChange}
            projects={projects}
            selectedCriteria={selectedCriteria}
            onProjectToggle={handleProjectToggle}
          />
        );
      case 'comparison':
        return (
          <StepComparison
            onBack={handleStepChange}
            projects={projects}
            selectedCriteria={selectedCriteria}
          />
        );
      default:
        return (
          <StepConfig
            onNext={handleStepChange}
            onConfigSave={handleConfigSave}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500">
      <Header currentStep={currentStep} steps={STEPS} />
      
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="hidden lg:block">
          <Sidebar 
            currentStep={currentStep} 
            steps={STEPS} 
            onStepClick={handleStepChange}
          />
        </div>
        
        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl mx-auto">
              {renderCurrentStep()}
            </div>
          </div>
        </main>
      </div>

      <Toast toasts={toasts} onHide={hideToast} />
    </div>
  );
}

export default App;