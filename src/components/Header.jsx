import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Moon,
  Sun,
  User,
  Settings,
  LogOut,
  Award,
  Shield,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import VersionManagerPanel from './VersionManagerPanel';

const Header = ({ aktualniKrok, kroky, darkMode, toggleDarkMode, onReset, user, onLogout }) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  // Porotná identita – reálný přihlášený porotce (viz api/auth/me.js), ne pevně dané jméno.
  const initials = (user?.jmeno || '')
    .split(/\s+/)
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const porotniIdentita = {
    jmeno: user?.jmeno || user?.email || 'Porotce',
    role: user?.role === 'admin' ? 'Admin' : 'Porotce',
    instituce: user?.email || '',
    hodnoceni: 'Režim hodnocení',
    avatar: initials || 'P'
  };

  const nazvyKroku = {
    [kroky.NAHRANI]: 'Nahrání návrhů',
    [kroky.VYSLEDKY]: 'Bilanční údaje',
    [kroky.POROVNANI]: 'Návrhy v porovnání',
    [kroky.DATOVE_POHLEDY]: 'Datové pohledy',
    [kroky.SOUHRN_POROTY]: 'Souhrn poroty',
  };

  const popisyKroku = {
    [kroky.NAHRANI]: 'PDF / Excel / CSV',
    [kroky.VYSLEDKY]: 'P03 tabulka + P06 cena',
    [kroky.POROVNANI]: 'Výběr pro srovnání',
    [kroky.DATOVE_POHLEDY]: 'Skladba, cena, podlaží',
    [kroky.SOUHRN_POROTY]: 'Hodnocení všech porotců',
  };

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo 4ct */}
          <div className="flex items-center gap-4">
            <motion.a 
              href="https://4ct.eu/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
              title="Navštívit 4ct.eu"
            >
              <img 
                src="https://4ct.eu/themes/4ct/assets/img/logo%20web%20color.svg" 
                alt="4ct Logo" 
                className="h-12 w-auto"
              />
            </motion.a>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-bold text-gray-900">Archi Evaluator</h1>
              <p className="text-sm text-gray-600">Analýza návrhů</p>
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
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                <span className="text-sm font-medium">AI hodnocení zapnuto</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent">
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
                <div className="w-10 h-10 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center text-white font-semibold text-sm">
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
                        <div className="w-12 h-12 bg-gradient-to-r from-accent to-primary rounded-full flex items-center justify-center text-white font-semibold">
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
                      <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 rounded-lg mb-3">
                        <Shield size={16} className="text-accent" />
                        <span className="text-sm font-medium text-text-dark">{porotniIdentita.hodnoceni}</span>
                      </div>

                      <div className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                          <Settings size={16} />
                          Nastavení účtu
                        </button>
                        <button
                          onClick={() => setShowVersions((v) => !v)}
                          className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <span className="flex items-center gap-3">
                            <Clock size={16} />
                            Uložené verze
                          </span>
                          {showVersions ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {showVersions && <VersionManagerPanel />}
                        <button
                          onClick={onReset}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-warning hover:bg-warning/10 rounded-lg transition-colors"
                        >
                          <Settings size={16} />
                          Reset aplikace
                        </button>
                        <button
                          onClick={onLogout}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-error hover:bg-error/10 rounded-lg transition-colors"
                        >
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