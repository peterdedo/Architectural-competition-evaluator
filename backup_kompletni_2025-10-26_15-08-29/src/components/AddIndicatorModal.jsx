// Urban Analytics v2.1 - Add Indicator Modal
// Modal pro přidávání custom indikátorů

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  X, 
  Save, 
  RotateCcw, 
  Info, 
  AlertCircle,
  CheckCircle,
  Target,
  BarChart3,
  Hash,
  Type,
  Eye
} from 'lucide-react';
import { addCustomIndicator } from '../utils/indicatorManager.js';
import { kategorie } from '../data/indikatory.js';

const AddIndicatorModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    nazev: '',
    popis: '',
    jednotka: '',
    kategorie: '',
    vaha: 10,
    comparison_method: 'numeric',
    lower_better: false,
    ikona: '📊',
    hodnota: 0
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const comparisonMethods = [
    { value: 'numeric', label: 'Numerické', icon: '🔢', description: 'Číselné hodnoty (m², %, počet)' },
    { value: 'categorical', label: 'Kategorické', icon: '📋', description: 'Kategorie (A, B, C nebo 1, 2, 3)' },
    { value: 'qualitative', label: 'Kvalitativní', icon: '⭐', description: 'Hodnocení kvality (výborné, dobré, špatné)' }
  ];

  const icons = ['📊', '📈', '📉', '🎯', '⚖️', '🔍', '📋', '📝', '🏗️', '🌱', '🚗', '🏠', '🌳', '💧', '⚡', '♻️'];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nazev.trim()) {
      newErrors.nazev = 'Název indikátoru je povinný';
    }

    if (!formData.popis.trim()) {
      newErrors.popis = 'Popis indikátoru je povinný';
    }

    if (!formData.jednotka.trim()) {
      newErrors.jednotka = 'Jednotka je povinná';
    }

    if (!formData.kategorie) {
      newErrors.kategorie = 'Kategorie je povinná';
    }

    if (formData.vaha < 1 || formData.vaha > 100) {
      newErrors.vaha = 'Váha musí být mezi 1 a 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      const newIndicator = addCustomIndicator(formData);
      onSave(newIndicator);
      handleClose();
    } catch (error) {
      console.error('Error adding indicator:', error);
      setErrors({ general: 'Chyba při ukládání indikátoru' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    setFormData({
      nazev: '',
      popis: '',
      jednotka: '',
      kategorie: '',
      vaha: 10,
      comparison_method: 'numeric',
      lower_better: false,
      ikona: '📊'
    });
    setErrors({});
    onClose();
  };

  const resetForm = () => {
    setFormData({
      nazev: '',
      popis: '',
      jednotka: '',
      kategorie: '',
      vaha: 10,
      comparison_method: 'numeric',
      lower_better: false,
      ikona: '📊'
    });
    setErrors({});
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          initial={{ y: -50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: -50, opacity: 0, scale: 0.95 }}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white p-6 rounded-t-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                  <Plus size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Přidat nový indikátor</h2>
                  <p className="text-white/80 text-sm">Vytvořte vlastní indikátor pro analýzu</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* General Error */}
            {errors.general && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="text-red-600" />
                  <span className="text-red-800 text-sm">{errors.general}</span>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Info size={18} />
                Základní informace
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Název indikátoru *
                  </label>
                  <input
                    type="text"
                    value={formData.nazev}
                    onChange={(e) => handleInputChange('nazev', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent ${
                      errors.nazev ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Např. Celková zastavěná plocha"
                  />
                  {errors.nazev && (
                    <p className="text-red-600 text-xs mt-1">{errors.nazev}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Jednotka *
                  </label>
                  <input
                    type="text"
                    value={formData.jednotka}
                    onChange={(e) => handleInputChange('jednotka', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent ${
                      errors.jednotka ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Např. m², %, počet"
                  />
                  {errors.jednotka && (
                    <p className="text-red-600 text-xs mt-1">{errors.jednotka}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Popis indikátoru *
                </label>
                <textarea
                  value={formData.popis}
                  onChange={(e) => handleInputChange('popis', e.target.value)}
                  rows={3}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent ${
                    errors.popis ? 'border-red-300' : 'border-slate-300'
                  }`}
                  placeholder="Popište, co indikátor měří a jak se používá..."
                />
                {errors.popis && (
                  <p className="text-red-600 text-xs mt-1">{errors.popis}</p>
                )}
              </div>
            </div>

            {/* Category and Weight */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Target size={18} />
                Kategorie a váha
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Kategorie *
                  </label>
                  <select
                    value={formData.kategorie}
                    onChange={(e) => handleInputChange('kategorie', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent ${
                      errors.kategorie ? 'border-red-300' : 'border-slate-300'
                    }`}
                  >
                    <option value="">Vyberte kategorii</option>
                    {kategorie.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.ikona} {category.nazev}
                      </option>
                    ))}
                  </select>
                  {errors.kategorie && (
                    <p className="text-red-600 text-xs mt-1">{errors.kategorie}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Váha (1-100) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.vaha}
                    onChange={(e) => handleInputChange('vaha', parseInt(e.target.value) || 0)}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent ${
                      errors.vaha ? 'border-red-300' : 'border-slate-300'
                    }`}
                  />
                  {errors.vaha && (
                    <p className="text-red-600 text-xs mt-1">{errors.vaha}</p>
                  )}
                </div>
              </div>

              {/* Numerická hodnota */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Počiatočná hodnota
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.hodnota}
                    onChange={(e) => handleInputChange('hodnota', parseFloat(e.target.value) || 0)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent ${
                      errors.hodnota ? 'border-red-300' : 'border-slate-300'
                    }`}
                    placeholder="Zadajte počiatočnú hodnotu"
                  />
                  <span className="px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 text-sm">
                    {formData.jednotka || 'jednotka'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Táto hodnota sa použije ako východisková pre nový indikátor
                </p>
                {errors.hodnota && (
                  <p className="text-red-600 text-xs mt-1">{errors.hodnota}</p>
                )}
              </div>
            </div>

            {/* Comparison Method */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <BarChart3 size={18} />
                Typ porovnání
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {comparisonMethods.map(method => (
                  <div
                    key={method.value}
                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      formData.comparison_method === method.value
                        ? 'border-[#0066A4] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                    onClick={() => handleInputChange('comparison_method', method.value)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{method.icon}</span>
                      <span className="font-semibold text-slate-800">{method.label}</span>
                    </div>
                    <p className="text-sm text-slate-600">{method.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Icon Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Eye size={18} />
                Ikona
              </h3>

              <div className="grid grid-cols-8 gap-2">
                {icons.map(icon => (
                  <button
                    key={icon}
                    onClick={() => handleInputChange('ikona', icon)}
                    className={`w-12 h-12 text-2xl rounded-lg border-2 transition-all hover:scale-110 ${
                      formData.ikona === icon
                        ? 'border-[#0066A4] bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Hash size={18} />
                Pokročilé možnosti
              </h3>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="lower_better"
                  checked={formData.lower_better}
                  onChange={(e) => handleInputChange('lower_better', e.target.checked)}
                  className="w-4 h-4 text-[#0066A4] border-slate-300 rounded focus:ring-[#0066A4]"
                />
                <label htmlFor="lower_better" className="text-sm text-slate-700">
                  Nižší hodnota je lepší (např. náklady, spotřeba energie)
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">Tipy pro vytvoření dobrého indikátoru:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Název by měl být jasný a srozumitelný</li>
                    <li>Popis vysvětluje, co indikátor měří</li>
                    <li>Jednotka pomáhá při interpretaci hodnot</li>
                    <li>Váha určuje důležitost v rámci kategorie</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center p-6 pt-4 border-t border-slate-200">
            <button
              onClick={resetForm}
              className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={16} />
              Resetovat
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-6 py-2 text-slate-700 bg-slate-100 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
              >
                Zrušit
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-[#0066A4] to-[#4BB349] text-white rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Ukládám...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Uložit indikátor
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AddIndicatorModal;
