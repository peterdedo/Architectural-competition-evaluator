// Urban Analytics v2.1 - Edit Indicator Modal
// Modal pro úpravu custom indikátorů a hodnot

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
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
  Eye,
  Trash2
} from 'lucide-react';
import { updateCustomIndicator, deleteIndicator, getIndicatorById } from '../utils/indicatorManager.js';
import { kategorie } from '../data/indikatory.js';

const EditIndicatorModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  indicator, 
  currentValue, 
  proposalName 
}) => {
  const [formData, setFormData] = useState({
    nazev: '',
    popis: '',
    jednotka: '',
    kategorie: '',
    vaha: 10,
    comparison_method: 'numeric',
    lower_better: false,
    ikona: '📊'
  });
  const [valueData, setValueData] = useState({
    value: '',
    source: ''
  });
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);

  const icons = ['📊', '📈', '📉', '🎯', '⚖️', '🔍', '📋', '📝', '🏗️', '🌱', '🚗', '🏠', '🌳', '💧', '⚡', '♻️'];

  // Load indicator data when modal opens
  useEffect(() => {
    if (isOpen && indicator) {
      setFormData({
        nazev: indicator.nazev || '',
        popis: indicator.popis || '',
        jednotka: indicator.jednotka || '',
        kategorie: indicator.kategorie || '',
        vaha: indicator.vaha || 10,
        comparison_method: indicator.comparison_method || 'numeric',
        lower_better: indicator.lower_better || false,
        ikona: indicator.ikona || '📊'
      });

      // If editing value, extract current value
      if (currentValue !== undefined && currentValue !== null) {
        const actualValue = currentValue && typeof currentValue === 'object' && 'value' in currentValue 
          ? currentValue.value 
          : currentValue;
        setValueData({
          value: actualValue || '',
          source: currentValue && typeof currentValue === 'object' && 'source' in currentValue 
            ? currentValue.source 
            : 'Manuálně upraveno'
        });
        setIsEditingValue(true);
      } else {
        // Pre nové indikátory alebo prázdne hodnoty, stále otvoríme v režime editácie hodnôt
        setValueData({
          value: '',
          source: 'Manuálně upraveno'
        });
        setIsEditingValue(true);
      }
    }
  }, [isOpen, indicator, currentValue]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleValueChange = (field, value) => {
    setValueData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const newErrors = {};

    console.log('🔍 Starting validation...');
    console.log('🔍 formData.nazev:', formData.nazev);
    console.log('🔍 formData.popis:', formData.popis);
    console.log('🔍 formData.jednotka:', formData.jednotka);
    console.log('🔍 formData.kategorie:', formData.kategorie);
    console.log('🔍 formData.vaha:', formData.vaha);

    if (!formData.nazev.trim()) {
      newErrors.nazev = 'Název indikátoru je povinný';
      console.log('❌ Nazev validation failed');
    }

    if (!formData.popis.trim()) {
      // Popis je povinný pouze při úpravě definice indikátoru, ne při úpravě hodnoty
      if (!isEditingValue) {
        newErrors.popis = 'Popis indikátoru je povinný';
        console.log('❌ Popis validation failed');
      }
    }

    if (!formData.jednotka.trim()) {
      newErrors.jednotka = 'Jednotka je povinná';
      console.log('❌ Jednotka validation failed');
    }

    if (!formData.kategorie) {
      newErrors.kategorie = 'Kategorie je povinná';
      console.log('❌ Kategorie validation failed');
    }

    if (formData.vaha < 1 || formData.vaha > 100) {
      newErrors.vaha = 'Váha musí být mezi 1 a 100';
      console.log('❌ Vaha validation failed:', formData.vaha);
    }

    if (isEditingValue) {
      console.log('🔍 Validating value data:', valueData);
      console.log('🔍 Value as string:', valueData.value.toString());
      console.log('🔍 Value trimmed:', valueData.value.toString().trim());
      console.log('🔍 Is empty:', !valueData.value.toString().trim());
      
      // Pre numerické hodnoty, 0 je platná hodnota
      if (formData.comparison_method === 'numeric') {
        if (valueData.value === '' || valueData.value === null || valueData.value === undefined) {
          newErrors.value = 'Hodnota je povinná';
          console.log('❌ Value validation failed: empty numeric value');
        } else if (isNaN(parseFloat(valueData.value))) {
          newErrors.value = 'Hodnota musí být číslo';
          console.log('❌ Value validation failed: not a number');
        } else {
          console.log('✅ Value validation passed for numeric');
        }
      } else {
        // Pre ne-numerické hodnoty, prázdny string nie je platný
        if (!valueData.value.toString().trim()) {
          newErrors.value = 'Hodnota je povinná';
          console.log('❌ Value validation failed: empty value');
        } else {
          console.log('✅ Value validation passed for non-numeric');
        }
      }
    }

    console.log('🔍 Final validation errors:', newErrors);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ✅ Povolení prázdného popisu při úpravě hodnoty indikátoru (hodnota ≠ definice)
  const handleSave = async () => {
    console.log('🔍 EditIndicatorModal - handleSave called');
    console.log('🔍 isEditingValue:', isEditingValue);
    console.log('🔍 valueData:', valueData);
    console.log('🔍 formData:', formData);
    
    if (!validateForm()) {
      console.log('❌ Validation failed');
      return;
    }

    console.log('✅ Validation passed, saving...');
    setIsSaving(true);
    try {
      if (isEditingValue) {
        // Save value only
        const valueToSave = formData.comparison_method === 'numeric' 
          ? parseFloat(valueData.value) 
          : valueData.value;
        
        console.log('💾 Saving value:', valueToSave, 'source:', valueData.source);
        
        // Voláme onSave s správnymi parametrami
        const updatedData = {
          value: valueToSave,
          source: isEditingValue && valueData.source === "nenalezeno v dokumentu"
            ? "uživatelský vstup"
            : valueData.source || "uživatelský vstup",
        };
        
        console.log("💾 Ukládám hodnotu indikátoru:", updatedData);
        
        onSave(indicator.id, updatedData);
      } else {
        // Save indicator data
        const updatedIndicator = updateCustomIndicator(indicator.id, formData);
        onSave(updatedIndicator);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving:', error);
      setErrors({ general: 'Chyba při ukládání' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Opravdu chcete smazat tento indikátor? Tato akce je nevratná.')) {
      try {
        deleteIndicator(indicator.id);
        onSave(null); // Signal deletion
        handleClose();
      } catch (error) {
        console.error('Error deleting indicator:', error);
        setErrors({ general: 'Chyba při mazání indikátoru' });
      }
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
    setValueData({ value: '', source: '' });
    setErrors({});
    setIsEditingValue(false);
    onClose();
  };

  const resetForm = () => {
    if (indicator) {
      setFormData({
        nazev: indicator.nazev || '',
        popis: indicator.popis || '',
        jednotka: indicator.jednotka || '',
        kategorie: indicator.kategorie || '',
        vaha: indicator.vaha || 10,
        comparison_method: indicator.comparison_method || 'numeric',
        lower_better: indicator.lower_better || false,
        ikona: indicator.ikona || '📊'
      });
    }
    setErrors({});
  };

  if (!isOpen || !indicator) return null;

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
                  <Edit3 size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">
                    {isEditingValue ? 'Upravit hodnotu' : 'Upravit indikátor'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {isEditingValue 
                      ? `Hodnota pro návrh: ${proposalName || 'Neznámý návrh'}`
                      : 'Upravte vlastnosti indikátoru'
                    }
                  </p>
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

            {/* Value Editing */}
            {isEditingValue ? (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <BarChart3 size={18} />
                  Hodnota indikátoru
                </h3>

                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-4">
                  <span className="text-2xl">{indicator.ikona}</span>
                  <div>
                      <h4 className="font-semibold text-slate-800">{indicator.nazev}</h4>
                      <p className="text-sm text-slate-600">{indicator.jednotka}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Hodnota *
                      </label>
                      <input
                        type={formData.comparison_method === 'numeric' ? 'number' : 'text'}
                        value={valueData.value}
                        onChange={(e) => handleValueChange('value', e.target.value)}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent ${
                          errors.value ? 'border-red-300' : 'border-slate-300'
                        }`}
                        placeholder={formData.comparison_method === 'numeric' ? 'Zadejte číslo' : 'Zadejte hodnotu'}
                      />
                      {errors.value && (
                        <p className="text-red-600 text-xs mt-1">{errors.value}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        Zdroj
                      </label>
                      <input
                        type="text"
                        value={valueData.source}
                        onChange={(e) => handleValueChange('source', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0066A4] focus:border-transparent"
                        placeholder="Např. stránka 5, tabulka 2"
                      />
                    </div>
                  </div>
                  </div>
                </div>
            ) : (
              <>
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
              </>
            )}

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                <Info size={16} className="text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-semibold mb-1">
                    {isEditingValue ? 'Tipy pro úpravu hodnoty:' : 'Tipy pro úpravu indikátoru:'}
                  </p>
                  <ul className="list-disc list-inside space-y-1">
                    {isEditingValue ? (
                      <>
                        <li>Zadejte přesnou hodnotu podle jednotky indikátoru</li>
                        <li>Zdroj pomáhá při ověřování dat</li>
                        <li>Hodnota se uloží pro tento návrh</li>
                      </>
                    ) : (
                      <>
                        <li>Název by měl být jasný a srozumitelný</li>
                        <li>Popis vysvětluje, co indikátor měří</li>
                        <li>Jednotka pomáhá při interpretaci hodnot</li>
                        <li>Váha určuje důležitost v rámci kategorie</li>
                      </>
                    )}
                      </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center p-6 pt-4 border-t border-slate-200">
            <div className="flex gap-3">
            <button
                onClick={resetForm}
                className="flex items-center gap-2 px-4 py-2 text-slate-700 bg-slate-100 rounded-lg font-semibold hover:bg-slate-200 transition-colors"
            >
              <RotateCcw size={16} />
                Resetovat
            </button>
            
              {!isEditingValue && indicator.type === 'custom' && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 text-red-700 bg-red-100 rounded-lg font-semibold hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={16} />
                  Smazat
            </button>
              )}
            </div>
            
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
                    {isEditingValue ? 'Uložit hodnotu' : 'Uložit změny'}
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

export default EditIndicatorModal;