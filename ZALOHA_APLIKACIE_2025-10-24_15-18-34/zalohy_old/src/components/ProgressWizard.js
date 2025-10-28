import React from 'react';

const ProgressWizard = ({ currentStep, steps, onStepClick }) => {
  const getStepStatus = (stepKey, index) => {
    const currentIndex = steps.findIndex(s => s.key === currentStep);
    
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'active';
    return 'inactive';
  };

  return (
    <div className="bg-white rounded-2xl shadow-soft border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(step.key, index);
          const isLast = index === steps.length - 1;
          
          return (
            <React.Fragment key={step.key}>
              <button
                onClick={() => onStepClick && onStepClick(step.key)}
                className={`progress-step ${status} ${onStepClick ? 'cursor-pointer' : 'cursor-default'}`}
                disabled={!onStepClick}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                  status === 'completed' ? 'bg-success-100 text-success-600' :
                  status === 'active' ? 'bg-primary-100 text-primary-600' :
                  'bg-gray-100 text-gray-400'
                }`}>
                  {status === 'completed' ? '✓' : index + 1}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              </button>
              
              {!isLast && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  index < steps.findIndex(s => s.key === currentStep) ? 'bg-success-300' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressWizard;







