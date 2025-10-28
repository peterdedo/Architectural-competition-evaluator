import React from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, 
  Upload, 
  Target, 
  BarChart3, 
  GitCompare,
  CheckCircle2,
  Circle,
  ArrowRight
} from 'lucide-react';

const WizardTopNav = ({ aktualniKrok, kroky, onKrokChange, darkMode }) => {
  const krokyConfig = [
    {
      id: kroky.KONFIGURACE,
      nazev: 'Konfigurace',
      popis: 'Nastavení projektu',
      ikona: Settings,
      color: '#0066A4'
    },
    {
      id: kroky.NAHRANI,
      nazev: 'Nahrání návrhů',
      popis: 'PDF dokumenty',
      ikona: Upload,
      color: '#4BB349'
    },
    {
      id: kroky.KRITERIA,
      nazev: 'Výběr kritérií',
      popis: 'Indikátory a váhy',
      ikona: Target,
      color: '#F59E0B'
    },
    {
      id: kroky.VYSLEDKY,
      nazev: 'Výsledky analýzy',
      popis: 'Přehled dat',
      ikona: BarChart3,
      color: '#8B5CF6'
    },
    {
      id: kroky.POROVNANI,
      nazev: 'Porovnání návrhů',
      popis: 'Komparativní analýza',
      ikona: GitCompare,
      color: '#EF4444'
    }
  ];

  const aktualniIndex = krokyConfig.findIndex(krok => krok.id === aktualniKrok);
  const progress = ((aktualniIndex + 1) / krokyConfig.length) * 100;

  const getKrokStatus = (index) => {
    if (index < aktualniIndex) return 'completed';
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

  return (
    <div className={`w-full ${darkMode ? 'bg-slate-900' : 'bg-white'} border-b border-gray-200 shadow-sm`}>
      {/* Progress bar */}
      <div className="h-1 bg-gray-200">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 to-green-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>

      {/* Navigation */}
      <div className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {/* Steps */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {krokyConfig.map((krok, index) => {
                const status = getKrokStatus(index);
                const isClickable = index <= aktualniIndex;
                
                return (
                  <motion.button
                    key={krok.id}
                    onClick={() => isClickable && onKrokChange(krok.id)}
                    disabled={!isClickable}
                    className={`
                      group relative flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200
                      ${isClickable 
                        ? 'cursor-pointer hover:scale-105' 
                        : 'cursor-not-allowed opacity-50'
                      }
                      ${status === 'current' 
                        ? 'bg-gradient-to-r from-blue-600 to-green-500 text-white shadow-lg' 
                        : status === 'completed'
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
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
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300'
                      }
                    `}>
                      {getKrokIcon(krok, status)}
                    </div>

                    {/* Text */}
                    <div className="hidden sm:block text-left">
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
                          ? 'text-green-600'
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
                        ? 'bg-white text-blue-600' 
                        : status === 'completed'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-300 text-gray-600'
                      }
                    `}>
                      {index + 1}
                    </div>

                    {/* Arrow connector */}
                    {index < krokyConfig.length - 1 && (
                      <div className="hidden md:block ml-4">
                        <ArrowRight 
                          size={16} 
                          className={`
                            ${status === 'completed' 
                              ? 'text-green-500' 
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
            <div className="hidden lg:block text-right">
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

      {/* Mobile progress indicator */}
      <div className="md:hidden px-4 pb-4">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{krokyConfig[aktualniIndex]?.nazev}</span>
          <span>{aktualniIndex + 1}/{krokyConfig.length}</span>
        </div>
      </div>
    </div>
  );
};

export default WizardTopNav;
