import React from 'react';
import { WizardProvider, useWizard } from './contexts/WizardContext';
import { useToast } from './hooks/useToast';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import StepConfig from './components/StepConfig';
import StepUpload from './components/StepUpload';
import StepCriteria from './components/StepCriteria';
import StepResults from './components/StepResults';
import StepComparison from './components/StepComparison';
import Toast from './components/Toast';

const AppContent = () => {
  const { currentStep, STEPS } = useWizard();
  const { toasts, hideToast } = useToast();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case STEPS.CONFIG:
        return <StepConfig />;
      case STEPS.UPLOAD:
        return <StepUpload />;
      case STEPS.CRITERIA:
        return <StepCriteria />;
      case STEPS.RESULTS:
        return <StepResults />;
      case STEPS.COMPARISON:
        return <StepComparison />;
      default:
        return <StepConfig />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-violet-500 to-fuchsia-500">
      <Header />
      
      <div className="flex h-[calc(100vh-4rem)]">
        <Sidebar />
        
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {renderCurrentStep()}
          </div>
        </main>
      </div>

      <Toast toasts={toasts} onHide={hideToast} />
    </div>
  );
};

const App = () => {
  return (
    <WizardProvider>
      <AppContent />
    </WizardProvider>
  );
};

export default App;







