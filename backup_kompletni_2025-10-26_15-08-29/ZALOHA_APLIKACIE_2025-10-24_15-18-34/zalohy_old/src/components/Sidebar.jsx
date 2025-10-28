import React from 'react';
import { useWizard } from '../contexts/WizardContext';

const Sidebar = () => {
  const { currentStep, setStep, STEPS } = useWizard();
  
  const steps = [
    { key: STEPS.CONFIG, title: 'Konfigurace', description: 'Nastavení projektu', icon: '⚙️' },
    { key: STEPS.UPLOAD, title: 'Nahrání návrhů', description: 'PDF dokumenty', icon: '📄' },
    { key: STEPS.CRITERIA, title: 'Výběr kritérií', description: 'Indikátory a váhy', icon: '📋' },
    { key: STEPS.RESULTS, title: 'Výsledky analýzy', description: 'Přehled dat', icon: '📊' },
    { key: STEPS.COMPARISON, title: 'Porovnání návrhů', description: 'Komparativní analýza', icon: '📈' }
  ];

  const getStepStatus = (stepKey, index) => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'inactive';
  };

  return (
    <div className="sidebar h-full">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Kroky analýzy</h2>
          <p className="text-sm text-slate-500">Postupujte podľa krokov pre dokončenie analýzy</p>
        </div>
        
        <nav className="space-y-2">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key, index);
            
            return (
              <button
                key={step.key}
                onClick={() => setStep(step.key)}
                className={`sidebar-item w-full text-left ${
                  status === 'completed' ? 'completed' : 
                  status === 'active' ? 'active' : ''
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                  status === 'active' ? 'bg-indigo-100 text-indigo-600' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {status === 'completed' ? '✓' : step.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              </button>
            );
          })}
        </nav>
        
        <div className="mt-8 p-4 bg-slate-50 rounded-xl">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Tip</h3>
          <p className="text-xs text-slate-600">
            Každý krok je navrhnutý tak, aby vás prevedol celým procesom analýzy projektov.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;







