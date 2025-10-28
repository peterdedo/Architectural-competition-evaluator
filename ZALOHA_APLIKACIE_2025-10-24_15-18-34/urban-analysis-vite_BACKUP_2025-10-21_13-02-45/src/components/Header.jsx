import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  BarChart3, 
  Zap, 
  Moon, 
  Sun, 
  User, 
  Settings, 
  LogOut,
  Award,
  Shield,
  Clock
} from 'lucide-react';

const Header = ({ aktualniKrok, kroky, darkMode, toggleDarkMode }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Porotná identita
  const porotniIdentita = {
    jmeno: 'Tomáš Ctibor',
    role: 'Expert',
    instituce: '4ct',
    hodnoceni: 'Režim hodnocení',
    avatar: 'TC'
  };

  const nazvyKroku = {
    [kroky.KONFIGURACE]: 'Konfigurace',
    [kroky.NAHRANI]: 'Nahrání návrhů',
    [kroky.KRITERIA]: 'Výběr kritérií',
    [kroky.VYSLEDKY]: 'Výsledky analýzy',
    [kroky.POROVNANI]: 'Porovnání návrhů'
  };

  const popisyKroku = {
    [kroky.KONFIGURACE]: 'Nastavení projektu',
    [kroky.NAHRANI]: 'PDF dokumenty',
    [kroky.KRITERIA]: 'Indikátory a váhy',
    [kroky.VYSLEDKY]: 'Přehled dat',
    [kroky.POROVNANI]: 'Komparativní analýza'
  };

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo 4ct */}
          <div className="flex items-center gap-4">
            <motion.div 
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <img 
                src="https://4ct.eu/themes/4ct/assets/img/logo%20web%20color.svg" 
                alt="4ct Logo" 
                className="h-12 w-auto"
              />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-gray-900">Urban Analytics</h1>
              <p className="text-sm text-gray-600">AI-Powered Project Analysis</p>
            </div>
          </div>

          {/* Stredný panel - aktuálny krok */}
          <div className="hidden lg:flex items-center">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {nazvyKroku[aktualniKrok]}
              </div>
              <div className="text-sm text-gray-600">
                {popisyKroku[aktualniKrok]}
              </div>
            </div>
          </div>

          {/* Pravá strana - porotná identita a ovládanie */}
          <div className="flex items-center gap-4">
            {/* Status indikátory */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-sm font-medium">AI Aktivní</span>
              </div>
              
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700">
                <Award size={16} />
                <span className="text-sm font-medium">Porota</span>
              </div>
            </div>

            {/* Dark Mode Toggle */}
            <motion.button
              onClick={toggleDarkMode}
              className="p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
              aria-label={darkMode ? 'Přepnout na světlý režim' : 'Přepnout na tmavý režim'}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {darkMode ? <Sun size={20} className="text-gray-600" /> : <Moon size={20} className="text-gray-600" />}
            </motion.button>

            {/* Porotná identita */}
            <div className="relative">
              <motion.button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-green-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                  {porotniIdentita.avatar}
                </div>
                <div className="hidden sm:block text-left">
                  <div className="text-sm font-semibold text-gray-900">{porotniIdentita.jmeno}</div>
                  <div className="text-xs text-gray-600">{porotniIdentita.role}</div>
                </div>
                <User size={16} className="text-gray-500" />
              </motion.button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 py-4 z-50"
                  >
                    <div className="px-4 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                          {porotniIdentita.avatar}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{porotniIdentita.jmeno}</div>
                          <div className="text-sm text-gray-600">{porotniIdentita.role}</div>
                          <div className="text-xs text-gray-500">{porotniIdentita.instituce}</div>
                        </div>
                      </div>
                    </div>

                    <div className="px-4 py-2">
                      <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg mb-3">
                        <Shield size={16} className="text-blue-600" />
                        <span className="text-sm font-medium text-blue-900">{porotniIdentita.hodnoceni}</span>
                      </div>

                      <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <Settings size={16} />
                          Nastavení účtu
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <Clock size={16} />
                          Historie hodnocení
                        </button>
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <LogOut size={16} />
                          Odhlásit se
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;