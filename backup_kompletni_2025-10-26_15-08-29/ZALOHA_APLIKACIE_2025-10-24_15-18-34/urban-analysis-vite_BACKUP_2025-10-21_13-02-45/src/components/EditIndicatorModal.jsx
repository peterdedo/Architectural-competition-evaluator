import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';

const EditIndicatorModal = ({ 
  isOpen, 
  onClose, 
  indicator, 
  currentValue, 
  onSave,
  proposalName 
}) => {
  const [editedValue, setEditedValue] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && indicator) {
      setEditedValue(currentValue?.toString() || '');
      setIsValid(true);
      setErrorMessage('');
    }
  }, [isOpen, indicator, currentValue]);

  const validateValue = (value) => {
    if (!value || value.trim() === '') {
      setIsValid(false);
      setErrorMessage('Hodnota nemôže byť prázdna');
      return false;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      setIsValid(false);
      setErrorMessage('Hodnota musí byť číslo');
      return false;
    }

    if (numValue < 0) {
      setIsValid(false);
      setErrorMessage('Hodnota nemôže byť záporná');
      return false;
    }

    setIsValid(true);
    setErrorMessage('');
    return true;
  };

  const handleValueChange = (e) => {
    const value = e.target.value;
    setEditedValue(value);
    validateValue(value);
  };

  const handleSave = () => {
    if (validateValue(editedValue)) {
      const numValue = parseFloat(editedValue);
      onSave(indicator.id, numValue);
      onClose();
    }
  };

  const handleReset = () => {
    setEditedValue(currentValue?.toString() || '');
    setIsValid(true);
    setErrorMessage('');
  };

  if (!isOpen || !indicator) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <span className="text-2xl">{indicator.ikona}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold">Editovať indikátor</h2>
                  <p className="text-white/80 text-sm">{proposalName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="space-y-6">
              {/* Indicator Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{indicator.ikona}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{indicator.nazev}</h3>
                    <p className="text-sm text-gray-600">{indicator.kategorie}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700">{indicator.popis}</p>
                <div className="mt-3 flex items-center gap-4 text-sm">
                  <span className="text-gray-600">Jednotka:</span>
                  <span className="font-medium text-gray-900">{indicator.jednotka}</span>
                  <span className="text-gray-600">Typ:</span>
                  <span className="font-medium text-gray-900">{indicator.data_type}</span>
                </div>
              </div>

              {/* Current Value */}
              <div className="bg-blue-50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle size={16} className="text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Aktuálna hodnota</span>
                </div>
                <div className="text-2xl font-bold text-blue-900">
                  {currentValue?.toLocaleString('cs-CZ') || 'N/A'} {indicator.jednotka}
                </div>
              </div>

              {/* Edit Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nová hodnota
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={editedValue}
                      onChange={handleValueChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl text-lg font-medium transition-colors focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${
                        isValid 
                          ? 'border-gray-300 focus:border-blue-500' 
                          : 'border-red-300 focus:border-red-500'
                      }`}
                      placeholder="Zadajte novú hodnotu"
                      step="any"
                      min="0"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      {indicator.jednotka}
                    </div>
                  </div>
                  
                  {!isValid && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-2 text-red-600 text-sm"
                    >
                      <AlertTriangle size={16} />
                      <span>{errorMessage}</span>
                    </motion.div>
                  )}
                </div>

                {/* Help Text */}
                <div className="bg-amber-50 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                    <div className="text-sm text-amber-800">
                      <p className="font-medium mb-1">Tip pre editáciu:</p>
                      <ul className="list-disc list-inside space-y-1 text-xs">
                        <li>Zadajte číselnú hodnotu bez jednotiek</li>
                        <li>Pre plochy použite m², pre počty ks</li>
                        <li>Hodnota musí byť kladné číslo</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RotateCcw size={16} />
              <span>Resetovať</span>
            </button>
            
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Zrušiť
              </button>
              <button
                onClick={handleSave}
                disabled={!isValid}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium transition-colors ${
                  isValid
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <Save size={16} />
                <span>Uložiť</span>
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EditIndicatorModal;
