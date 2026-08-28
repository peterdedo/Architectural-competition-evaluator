import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  BarChart3,
  Layers,
  LayoutGrid,
  Users,
  CheckCircle2,
  Circle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import ProgressIndicator from './ProgressIndicator';

const WizardTopNav = ({ aktualniKrok, kroky, onKrokChange, darkMode, processedProposalCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const [isScrolled, setIsScrolled] = useState(false);

  const krokyConfig = [
    {
      id: kroky.NAHRANI,
      nazev: 'Nahrání návrhů',
      popis: 'PDF / Excel / CSV',
      ikona: Upload,
      color: '#4BB349'
    },
    {
      id: kroky.VYSLEDKY,
      nazev: 'Bilanční údaje',
      popis: 'P03 tabulka + P06 cena',
      ikona: BarChart3,
      color: '#0066A4'
    },
    {
      id: kroky.POROVNANI,
      nazev: 'Návrhy v porovnání',
      popis: 'Výběr pro srovnání',
      ikona: Layers,
      color: '#4BB349'
    },
    {
      id: kroky.DATOVE_POHLEDY,
      nazev: 'Datové pohledy',
      popis: 'Skladba, cena, podlaží',
      ikona: LayoutGrid,
      color: '#0066A4'
    },
    {
      id: kroky.SOUHRN_POROTY,
      nazev: 'Souhrn poroty',
      popis: 'Hodnocení všech porotců',
      ikona: Users,
      color: '#4BB349'
    }
  ];

  const aktualniIndex = krokyConfig.findIndex(krok => krok.id === aktualniKrok);
  const progress = ((aktualniIndex + 1) / krokyConfig.length) * 100;

  /** Indexy: 0 nahrání, 1 bilanční údaje, 2 návrhy v porovnání, 3 datové pohledy.
   *  Na kterýkoliv krok se dá přejít i bez nahraného návrhu – lze ho vytvořit ručně. */
  const canNavigateToStepIndex = (index) => {
    if (index < 0 || index >= krokyConfig.length) return false;
    return true;
  };

  // Track scroll for sticky behavior
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update completed steps based on current step
  useEffect(() => {
    const newCompletedSteps = new Set();
    for (let i = 0; i < aktualniIndex; i++) {
      newCompletedSteps.add(i);
    }
    setCompletedSteps(newCompletedSteps);
  }, [aktualniIndex]);

  const getKrokStatus = (index) => {
    if (completedSteps.has(index)) return 'completed';
    if (index === aktualniIndex) return 'current';
    return 'upcoming';
  };

  const getKrokIcon = (krok, status) => {
    const IconComponent = krok.ikona;
    
    if (status === 'completed') {
      return <CheckCircle2 size={20} className="text-white" />;
    }
    
    return <IconComponent size={20} className="text-white" />;
  };

  const handleStepClick = (index) => {
    if (canNavigateToStepIndex(index)) {
      onKrokChange(krokyConfig[index].id);
      setIsMobileMenuOpen(false);
    }
  };

  const handlePreviousStep = () => {
    if (aktualniIndex > 0) {
      onKrokChange(krokyConfig[aktualniIndex - 1].id);
    }
  };

  const handleNextStep = () => {
    if (aktualniIndex < krokyConfig.length - 1) {
      const next = aktualniIndex + 1;
      if (canNavigateToStepIndex(next)) {
        onKrokChange(krokyConfig[next].id);
      }
    }
  };

  return (
    <div className={`w-full ${darkMode ? 'bg-slate-900' : 'bg-white'} border-b border-gray-200 shadow-sm ${isScrolled ? 'sticky top-0 z-50' : ''}`}>
      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <motion.div
          className="h-full bg-gradient-to-r from-accent to-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Desktop Navigation */}
      <div className="hidden lg:block px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Steps */}
            <div className="flex items-center space-x-4">
              {krokyConfig.map((krok, index) => {
                const status = getKrokStatus(index);
                const isClickable = canNavigateToStepIndex(index);
                
                return (
                  <motion.button
                    type="button"
                    key={krok.id}
                    onClick={() => handleStepClick(index)}
                    disabled={!isClickable}
                    aria-current={index === aktualniIndex ? 'step' : undefined}
                    aria-label={`${krok.nazev}${!isClickable ? ' (zatím nedostupné)' : ''}`}
                    className={`
                      group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent
                      ${isClickable 
                        ? 'cursor-pointer hover:scale-105' 
                        : 'cursor-not-allowed opacity-50'
                      }
                      ${status === 'current' 
                        ? 'bg-gradient-to-r from-accent to-primary text-white shadow-lg' 
                        : status === 'completed'
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : 'bg-gray-100 text-gray-500'
                      }
                    `}
                    whileHover={isClickable ? { scale: 1.05 } : {}}
                    whileTap={isClickable ? { scale: 0.95 } : {}}
                  >
                    {/* Icon */}
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                      ${status === 'current' 
                        ? 'bg-white/20' 
                        : status === 'completed'
                        ? 'bg-primary text-white'
                        : 'bg-gray-300'
                      }
                    `}>
                      {getKrokIcon(krok, status)}
                    </div>

                    {/* Text */}
                    <div className="text-left">
                      <div className={`
                        font-semibold text-sm
                        ${status === 'current' ? 'text-white' : ''}
                      `}>
                        {krok.nazev}
                      </div>
                      <div className={`
                        text-xs
                        ${status === 'current' 
                          ? 'text-white/80' 
                          : status === 'completed'
                          ? 'text-primary'
                          : 'text-gray-400'
                        }
                      `}>
                        {krok.popis}
                      </div>
                    </div>

                    {/* Step number */}
                    <div className={`
                      absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                      ${status === 'current' 
                        ? 'bg-white text-accent'
                        : status === 'completed'
                        ? 'bg-primary text-white'
                        : 'bg-gray-300 text-gray-600'
                      }
                    `}>
                      {index + 1}
                    </div>

                    {/* Arrow connector */}
                    {index < krokyConfig.length - 1 && (
                      <div className="ml-4">
                        <ArrowRight 
                          size={16} 
                          className={`
                            ${status === 'completed'
                              ? 'text-primary'
                              : 'text-gray-300'
                            }
                          `} 
                        />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Current step info */}
            <div className="text-right">
              <div className="text-sm font-medium text-gray-600">
                Krok {aktualniIndex + 1} z {krokyConfig.length}
              </div>
              <div className="text-xs text-gray-500">
                {Math.round(progress)}% dokončeno
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet Navigation */}
      <div className="hidden md:block lg:hidden px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <ProgressIndicator
            steps={krokyConfig.map((krok, index) => ({
              id: krok.id,
              title: krok.nazev,
              description: krok.popis
            }))}
            currentStep={aktualniIndex}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            canStepClick={canNavigateToStepIndex}
            variant="default"
          />
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden">
        {/* Mobile Header */}
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={aktualniIndex === 0}
              aria-label="Předchozí krok"
              className="p-2 rounded-lg bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronLeft size={20} />
            </button>
            
            <div className="text-center">
              <div className="text-sm font-semibold text-gray-900">
                {krokyConfig[aktualniIndex]?.nazev}
              </div>
              <div className="text-xs text-gray-500">
                {aktualniIndex + 1} z {krokyConfig.length}
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleNextStep}
              disabled={
                aktualniIndex === krokyConfig.length - 1 ||
                !canNavigateToStepIndex(aktualniIndex + 1)
              }
              aria-label="Další krok"
              className="p-2 rounded-lg bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-lg bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            aria-label={isMobileMenuOpen ? 'Zavřít menu kroků' : 'Otevřít menu kroků'}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Progress */}
        <div className="px-4 pb-4">
          <ProgressIndicator
            steps={krokyConfig.map((krok, index) => ({
              id: krok.id,
              title: krok.nazev,
              description: krok.popis
            }))}
            currentStep={aktualniIndex}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
            canStepClick={canNavigateToStepIndex}
            variant="minimal"
          />
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-gray-200 bg-gray-50"
            >
              <div className="px-4 py-4 space-y-2">
                {krokyConfig.map((krok, index) => {
                  const status = getKrokStatus(index);
                  const isClickable = canNavigateToStepIndex(index);
                  
                  return (
                    <motion.button
                      type="button"
                      key={krok.id}
                      onClick={() => handleStepClick(index)}
                      disabled={!isClickable}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                        ${isClickable 
                          ? 'cursor-pointer hover:bg-white' 
                          : 'cursor-not-allowed opacity-50'
                        }
                        ${status === 'current'
                          ? 'bg-accent/10 text-text-dark'
                          : status === 'completed'
                          ? 'bg-primary/10 text-text-dark'
                          : 'bg-white text-gray-700'
                        }
                      `}
                      whileHover={isClickable ? { scale: 1.02 } : {}}
                    >
                      <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center
                        ${status === 'current'
                          ? 'bg-accent text-white'
                          : status === 'completed'
                          ? 'bg-primary text-white'
                          : 'bg-gray-300 text-gray-600'
                        }
                      `}>
                        {getKrokIcon(krok, status)}
                      </div>
                      
                      <div className="text-left flex-1">
                        <div className="font-medium text-sm">{krok.nazev}</div>
                        <div className="text-xs text-gray-500">{krok.popis}</div>
                      </div>
                      
                      <div className="text-xs font-bold text-gray-400">
                        {index + 1}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default WizardTopNav;
