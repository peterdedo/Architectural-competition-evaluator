import React, { useState, useEffect } from 'react';
import { Download, X, Wifi, WifiOff, RefreshCw, Smartphone, Monitor } from 'lucide-react';
import { usePWA } from '../hooks/usePWA';
import { motion, AnimatePresence } from 'framer-motion';

const PWAInstallPrompt = () => {
  const { 
    isOnline, 
    isInstalled, 
    updateAvailable 
  } = usePWA();
  
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Show install prompt after delay - dočasne zakomentované
  // useEffect(() => {
  //   if (canInstall && !isInstalled) {
  //     const timer = setTimeout(() => {
  //       setShowPrompt(true);
  //     }, 3000); // Show after 3 seconds

  //     return () => clearTimeout(timer);
  //   }
  // }, [canInstall, isInstalled]);

  // Auto-hide prompt after 30 seconds
  useEffect(() => {
    if (showPrompt) {
      const timer = setTimeout(() => {
        setShowPrompt(false);
      }, 30000);

      return () => clearTimeout(timer);
    }
  }, [showPrompt]);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      // const success = await installApp();
      // if (success) {
      //   setShowPrompt(false);
      // }
      console.log('[PWA] Install function called (disabled)');
    } catch (error) {
      console.error('Installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUpdate = async () => {
    setIsUpdating(true);
    try {
      // const success = await updateApp();
      // if (success) {
      //   setShowPrompt(false);
      //   // Reload page to apply update
      //   window.location.reload();
      // }
      console.log('[PWA] Update function called (disabled)');
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt && !updateAvailable) return null;

  return (
    <AnimatePresence>
      {(showPrompt || updateAvailable) && (
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.9 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed bottom-4 left-4 right-4 z-50 max-w-md mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Smartphone size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-lg">
                      {updateAvailable ? 'Aktualizácia dostupná' : 'Nainštalujte aplikáciu'}
                    </h3>
                    <p className="text-blue-100 text-sm">
                      {updateAvailable ? 'Nová verzia je pripravená' : 'Rýchly prístup z domovskej obrazovky'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleDismiss}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              {updateAvailable ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-gray-600">
                    <RefreshCw size={20} className="text-blue-600" />
                    <span className="text-sm">
                      Dostupná je nová verzia Archi Evaluator s vylepšeniami
                    </span>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleUpdate}
                      disabled={isUpdating}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      {isUpdating ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Aktualizuje sa...
                        </>
                      ) : (
                        <>
                          <RefreshCw size={16} />
                          Aktualizovať
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Neskôr
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-gray-600">
                      <Monitor size={20} className="text-green-600" />
                      <span className="text-sm">Rýchly prístup z desktopu</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Wifi size={20} className="text-blue-600" />
                      <span className="text-sm">Offline funkcionalita</span>
                    </div>
                    <div className="flex items-center gap-3 text-gray-600">
                      <Smartphone size={20} className="text-purple-600" />
                      <span className="text-sm">App-like experience</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleInstall}
                      disabled={isInstalling}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isInstalling ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Inštaluje sa...
                        </>
                      ) : (
                        <>
                          <Download size={16} />
                          Nainštalovať
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleDismiss}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Neskôr
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Offline indicator */}
            {!isOnline && (
              <div className="px-6 py-3 bg-yellow-50 border-t border-yellow-200">
                <div className="flex items-center gap-2 text-yellow-800 text-sm">
                  <WifiOff size={16} />
                  <span>Ste offline - niektoré funkcie môžu byť obmedzené</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PWAInstallPrompt;
