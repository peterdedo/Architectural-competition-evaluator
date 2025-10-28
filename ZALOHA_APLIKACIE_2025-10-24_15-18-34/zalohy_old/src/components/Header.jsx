import React from 'react';
import { useWizard } from '../contexts/WizardContext';

const Header = () => {
  const { currentStep, STEPS } = useWizard();
  
  const steps = [
    { key: STEPS.CONFIG, title: 'Konfigurácia', description: 'API nastavenie' },
    { key: STEPS.UPLOAD, title: 'Nahrávanie', description: 'PDF dokumenty' },
    { key: STEPS.CRITERIA, title: 'Kritériá', description: 'Výber parametrov' },
    { key: STEPS.RESULTS, title: 'Výsledky', description: 'Analýza dát' },
    { key: STEPS.COMPARISON, title: 'Porovnanie', description: 'Vizuálne porovnanie' }
  ];
  
  const currentStepIndex = steps.findIndex(step => step.key === currentStep);
  
  return (
    <header className="bg-white/90 backdrop-blur-sm border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                4
              </div>
              <div className="flex items-center gap-1">
                <span className="text-indigo-600 font-bold text-xl">c</span>
                <span className="text-emerald-600 font-bold text-xl">t</span>
              </div>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl font-bold text-slate-800">
                Urban Analytics
              </h1>
              <p className="text-sm text-slate-500">
                AI-Powered Project Analysis
              </p>
            </div>
          </div>

          {/* Progress Indicator - Hidden on mobile */}
          <div className="hidden xl:flex items-center gap-2">
            {steps.map((step, index) => (
              <div key={step.key} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                  index < currentStepIndex ? 'bg-emerald-100 text-emerald-600' :
                  index === currentStepIndex ? 'bg-indigo-100 text-indigo-600' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {index < currentStepIndex ? '✓' : index + 1}
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-800">{step.title}</div>
                  <div className="text-xs text-slate-500">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-8 h-0.5 mx-2 ${
                    index < currentStepIndex ? 'bg-emerald-300' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold text-emerald-700">AI Aktivní</span>
            </div>
            
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
              <span className="text-lg">👥</span>
              <span className="text-sm font-semibold text-blue-700">Porota</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
              <span className="text-lg">⚙️</span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">TC</span>
              </div>
              <div className="text-left">
                <div className="text-sm font-semibold text-gray-700">Tomáš Ctibor</div>
                <div className="text-xs text-gray-500">Expert</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;







