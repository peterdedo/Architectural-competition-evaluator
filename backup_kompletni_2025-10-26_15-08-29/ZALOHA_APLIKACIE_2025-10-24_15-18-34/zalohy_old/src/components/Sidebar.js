import React from 'react';

const Sidebar = ({ currentStep, steps, onStepClick }) => {
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
          <p className="text-sm text-slate-500">Postupujte podle kroků pro dokončení analýzy</p>
        </div>
        
        <nav className="space-y-2">
          {steps.map((step, index) => {
            const status = getStepStatus(step.key, index);
            
            return (
              <button
                key={step.key}
                onClick={() => onStepClick && onStepClick(step.key)}
                className={`sidebar-item w-full text-left ${
                  status === 'completed' ? 'completed' : 
                  status === 'active' ? 'active' : ''
                }`}
                disabled={!onStepClick}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                  status === 'active' ? 'bg-indigo-100 text-indigo-600' :
                  'bg-slate-100 text-slate-400'
                }`}>
                  {status === 'completed' ? '✓' : index + 1}
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
            Každý krok je navržen tak, aby vás provedl celým procesem analýzy projektů.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;