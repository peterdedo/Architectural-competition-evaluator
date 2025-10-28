import React, { useState } from 'react';
import { useWizard } from '../contexts/WizardContext';
import { CRITERIA, CATEGORIES } from '../models/CriteriaModel';

const StepCriteria = () => {
  const { selectedCriteria, setSelectedCriteria, setStep } = useWizard();
  const [activeCategory, setActiveCategory] = useState('all');

  const handleCategoryToggle = (category) => {
    const categoryCriteria = Object.entries(CRITERIA)
      .filter(([key, criterion]) => criterion.category === category)
      .map(([key]) => key);

    const allSelected = categoryCriteria.every(key => selectedCriteria.has(key));

    if (allSelected) {
      const newSelected = new Set(selectedCriteria);
      categoryCriteria.forEach(key => newSelected.delete(key));
      setSelectedCriteria(newSelected);
    } else {
      const newSelected = new Set(selectedCriteria);
      categoryCriteria.forEach(key => newSelected.add(key));
      setSelectedCriteria(newSelected);
    }
  };

  const selectAll = () => {
    setSelectedCriteria(new Set(Object.keys(CRITERIA)));
  };

  const deselectAll = () => {
    setSelectedCriteria(new Set());
  };

  const getCategorySelectionCount = (category) => {
    const categoryCriteria = Object.entries(CRITERIA)
      .filter(([key, criterion]) => criterion.category === category)
      .map(([key]) => key);
    return categoryCriteria.filter(key => selectedCriteria.has(key)).length;
  };

  const handleCriterionToggle = (criterionKey) => {
    const newSelected = new Set(selectedCriteria);
    if (newSelected.has(criterionKey)) {
      newSelected.delete(criterionKey);
    } else {
      newSelected.add(criterionKey);
    }
    setSelectedCriteria(newSelected);
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-xl">⚙️</span>
          </div>
          <div>
            <h2 className="text-xl font-bold">Výber Kritérií</h2>
            <p className="text-indigo-100 text-sm">Vyberte parametre pre porovnanie projektov</p>
          </div>
        </div>
      </div>
      
      <div className="card-content space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-blue-600 text-lg">💡</span>
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Tip pre výber</h4>
              <p className="text-blue-700 text-sm">
                Vyberte kritériá, ktoré chcete porovnávať medzi projektmi. Môžete vybrať celé kategórie alebo jednotlivé kritériá.
              </p>
            </div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3">
            <button className="btn btn-secondary" onClick={selectAll}>
              ✅ Vybrať všetko
            </button>
            <button className="btn btn-secondary" onClick={deselectAll}>
              ❌ Zrušiť výber
            </button>
          </div>
          <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
            <span className="text-sm font-semibold text-slate-700">
              Vybraté: {selectedCriteria.size} z {Object.keys(CRITERIA).length} kritérií
            </span>
          </div>
        </div>

        {/* Categories Navigation */}
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeCategory === 'all' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setActiveCategory('all')}
          >
            Všetko ({Object.keys(CRITERIA).length})
          </button>
          {CATEGORIES.map(category => {
            const count = Object.values(CRITERIA).filter(c => c.category === category.key).length;
            const selectedCount = getCategorySelectionCount(category.key);
            return (
              <button
                key={category.key}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  activeCategory === category.key 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setActiveCategory(category.key)}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name} ({selectedCount}/{count})
              </button>
            );
          })}
        </div>

        {/* Criteria List */}
        <div className="max-h-96 overflow-y-auto space-y-6">
          {(activeCategory === 'all' ? CATEGORIES : CATEGORIES.filter(c => c.key === activeCategory)).map(category => {
            const categoryCriteria = Object.entries(CRITERIA).filter(([key, criterion]) => 
              criterion.category === category.key
            );
            
            if (categoryCriteria.length === 0) return null;
            
            return (
              <div key={category.key} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <span>{category.icon}</span>
                    {category.name}
                  </h3>
                  <button
                    className="btn btn-sm btn-ghost"
                    onClick={() => handleCategoryToggle(category.key)}
                  >
                    {getCategorySelectionCount(category.key) === categoryCriteria.length ? 'Zrušiť všetko' : 'Vybrať všetko'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {categoryCriteria.map(([key, criterion]) => (
                    <label key={key} className="flex items-start gap-3 p-4 bg-slate-50 rounded-xl hover:bg-slate-100 cursor-pointer transition-all group">
                      <input
                        type="checkbox"
                        checked={selectedCriteria.has(key)}
                        onChange={() => handleCriterionToggle(key)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {criterion.name}
                        </div>
                        <div className="mt-1 space-y-1">
                          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">
                            {criterion.unit}
                          </div>
                          <div className="text-xs text-slate-500 leading-relaxed">
                            {criterion.description}
                          </div>
                          {criterion.lower_better && (
                            <div className="text-xs text-emerald-600 font-medium">
                              ✓ Nižšia hodnota je lepšia
                            </div>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <button className="btn btn-secondary" onClick={() => setStep('upload')}>
            ← Späť na Nahrávanie
          </button>
          <button
            className="btn btn-primary"
            onClick={() => setStep('results')}
            disabled={selectedCriteria.size === 0}
          >
            Pokračovať na Výsledky
            <span className="text-lg">→</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default StepCriteria;







