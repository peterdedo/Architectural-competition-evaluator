import React from 'react';
import { motion } from 'framer-motion';
import { Check, Circle, ArrowRight } from 'lucide-react';

const ProgressIndicator = ({ 
  steps, 
  currentStep, 
  onStepClick, 
  completedSteps = new Set(),
  disabled = false,
  variant = 'default' // 'default', 'minimal', 'detailed'
}) => {
  const getStepStatus = (stepIndex) => {
    if (completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    if (stepIndex < currentStep) return 'completed';
    return 'upcoming';
  };

  const getStepIcon = (stepIndex, status) => {
    switch (status) {
      case 'completed':
        return <Check size={16} className="text-white" />;
      case 'current':
        return <Circle size={16} className="text-blue-600" fill="currentColor" />;
      default:
        return <Circle size={16} className="text-gray-400" />;
    }
  };

  const getStepColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 border-green-500 text-white';
      case 'current':
        return 'bg-blue-600 border-blue-600 text-white';
      default:
        return 'bg-white border-gray-300 text-gray-500';
    }
  };

  const getConnectorColor = (stepIndex) => {
    if (stepIndex < currentStep || completedSteps.has(stepIndex)) {
      return 'bg-green-500';
    }
    return 'bg-gray-300';
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center space-x-2">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          return (
            <React.Fragment key={step.id}>
              <motion.button
                whileHover={!disabled ? { scale: 1.1 } : {}}
                whileTap={!disabled ? { scale: 0.95 } : {}}
                onClick={() => !disabled && onStepClick && onStepClick(index)}
                disabled={disabled}
                className={`
                  w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-200
                  ${getStepColor(status)}
                  ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:shadow-md'}
                `}
              >
                {getStepIcon(index, status)}
              </motion.button>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 ${getConnectorColor(index)}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-4">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isClickable = !disabled && (index <= currentStep || completedSteps.has(index));
          
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center space-x-4 p-4 rounded-xl border-2 transition-all duration-200
                ${status === 'current' ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}
                ${isClickable ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : 'cursor-not-allowed opacity-50'}
              `}
              onClick={() => isClickable && onStepClick && onStepClick(index)}
            >
              <div className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0
                ${getStepColor(status)}
              `}>
                {getStepIcon(index, status)}
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className={`
                  font-semibold text-sm
                  ${status === 'current' ? 'text-blue-900' : 'text-gray-900'}
                `}>
                  {step.title}
                </h3>
                <p className={`
                  text-xs mt-1
                  ${status === 'current' ? 'text-blue-700' : 'text-gray-600'}
                `}>
                  {step.description}
                </p>
              </div>
              
              {status === 'current' && (
                <ArrowRight size={16} className="text-blue-600 flex-shrink-0" />
              )}
            </motion.div>
          );
        })}
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative">
      {/* Progress bar background */}
      <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 rounded-full transform -translate-y-1/2" />
      
      {/* Progress bar fill */}
      <motion.div
        className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transform -translate-y-1/2"
        initial={{ width: '0%' }}
        animate={{ 
          width: `${((currentStep + 1) / steps.length) * 100}%` 
        }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      />
      
      {/* Steps */}
      <div className="relative flex justify-between">
        {steps.map((step, index) => {
          const status = getStepStatus(index);
          const isClickable = !disabled && (index <= currentStep || completedSteps.has(index));
          
          return (
            <motion.button
              key={step.id}
              whileHover={isClickable ? { scale: 1.1 } : {}}
              whileTap={isClickable ? { scale: 0.95 } : {}}
              onClick={() => isClickable && onStepClick && onStepClick(index)}
              disabled={!isClickable}
              className={`
                relative z-10 w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all duration-200
                ${getStepColor(status)}
                ${isClickable ? 'cursor-pointer hover:shadow-lg' : 'cursor-not-allowed opacity-50'}
              `}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              {getStepIcon(index, status)}
              
              {/* Step label */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap">
                <span className={`
                  text-xs font-medium
                  ${status === 'current' ? 'text-blue-600' : 'text-gray-600'}
                `}>
                  {step.title}
                </span>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressIndicator;

