import React, { useState, useMemo } from 'react';
import { indikatory, kategorie } from '../data/indikatory';
import { Settings, Lightbulb, Check, X, Sliders } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import WeightSettings from './WeightSettings';

const StepCriteria = ({ vybraneIndikatory, setVybraneIndikatory, onNext, onBack, vahy, setVahy }) => {
  const [aktivniKategorie, setAktivniKategorie] = useState('all');
  const [query, setQuery] = useState('');
  const [typFiltra, setTypFiltra] = useState('all'); // all | numeric | categorical | qualitative
  const [showWeightSettings, setShowWeightSettings] = useState(false);

  const handleKategorieToggle = (kategorie) => {
    const kategorieIndikatory = indikatory
      .filter(indicator => indicator.kategorie === kategorie)
      .map(indicator => indicator.id);

    const vseVybrano = kategorieIndikatory.every(id => vybraneIndikatory.has(id));

    if (vseVybrano) {
      const noveVybrane = new Set(vybraneIndikatory);
      kategorieIndikatory.forEach(id => noveVybrane.delete(id));
      setVybraneIndikatory(noveVybrane);
    } else {
      const noveVybrane = new Set(vybraneIndikatory);
      kategorieIndikatory.forEach(id => noveVybrane.add(id));
      setVybraneIndikatory(noveVybrane);
    }
  };

  const handleVybratVse = () => {
    setVybraneIndikatory(new Set(indikatory.map(i => i.id)));
  };

  const handleZrusitVse = () => {
    setVybraneIndikatory(new Set());
  };

  const getPocetVybranychVKategorii = (kategorie) => {
    const kategorieIndikatory = indikatory
      .filter(indicator => indicator.kategorie === kategorie)
      .map(indicator => indicator.id);
    return kategorieIndikatory.filter(id => vybraneIndikatory.has(id)).length;
  };

  const handleIndikatorToggle = (indikatorId) => {
    const noveVybrane = new Set(vybraneIndikatory);
    if (noveVybrane.has(indikatorId)) {
      noveVybrane.delete(indikatorId);
    } else {
      noveVybrane.add(indikatorId);
    }
    setVybraneIndikatory(noveVybrane);
  };

  const filteredIndicators = useMemo(() => {
    const q = query.trim().toLowerCase();
    return indikatory.filter(ind => {
      if (aktivniKategorie !== 'all' && ind.kategorie !== aktivniKategorie) return false;
      if (typFiltra !== 'all' && ind.comparison_method !== typFiltra) return false;
      if (!q) return true;
      return (
        ind.nazev.toLowerCase().includes(q) ||
        (ind.popis || '').toLowerCase().includes(q) ||
        (ind.jednotka || '').toLowerCase().includes(q)
      );
    });
  }, [indikatory, aktivniKategorie, typFiltra, query]);

  // ❌ ODSTRANĚNO: Dynamické vyhledávání způsobovalo přepisování dat
  // Data jsou již načtena v StepUpload, zde jen vybíráme, které chceme zobrazit

  const getBarvaKategorie = (barva) => {
    const barvy = {
      blue: 'bg-blue-50 border-blue-200 text-blue-800',
      emerald: 'bg-emerald-50 border-emerald-200 text-emerald-800',
      yellow: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      purple: 'bg-purple-50 border-purple-200 text-purple-800',
      pink: 'bg-pink-50 border-pink-200 text-pink-800',
      orange: 'bg-orange-50 border-orange-200 text-orange-800'
    };
    return barvy[barva] || 'bg-slate-50 border-slate-200 text-slate-800';
  };

  return (
    <div className="card-active overflow-hidden animate-fade-in">
      <div className="bg-primary text-white px-8 py-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Výběr kritérií</h2>
            <p className="text-white/80 text-sm">Vyberte indikátory pro porovnání návrhů</p>
          </div>
        </div>
      </div>
      
      <div className="p-8 space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Lightbulb size={20} className="text-blue-600" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Tip pro výběr</h4>
              <p className="text-blue-700 text-sm">
                Vyberte indikátory, které chcete porovnávat mezi návrhy. Můžete vybrat celé kategorie nebo jednotlivé metriky.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-3">
            <button 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500 hover:shadow-lg" 
              onClick={handleVybratVse}
            >
              <Check size={16} /> Vybrat vše
            </button>
            <button 
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500 hover:shadow-lg" 
              onClick={handleZrusitVse}
            >
              <X size={16} /> Zrušit výběr
            </button>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 px-3 py-1.5 rounded-lg">
              <span className="text-sm font-semibold text-slate-700">
                Vybráno: {vybraneIndikatory.size} z {indikatory.length} indikátorů
              </span>
            </div>
            <input
              type="text"
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Hledat název, popis, jednotku..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={typFiltra}
              onChange={(e) => setTypFiltra(e.target.value)}
            >
              <option value="all">Všechny typy</option>
              <option value="numeric">Numerické</option>
              <option value="categorical">Kategorické</option>
              <option value="qualitative">Kvalitativní</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              aktivniKategorie === 'all' 
                ? 'bg-indigo-600 text-white shadow-md' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
            onClick={() => setAktivniKategorie('all')}
          >
            Vše ({indikatory.length})
          </button>
          {kategorie.map(kat => {
            const pocet = indikatory.filter(i => i.kategorie === kat.key).length;
            const vybrano = getPocetVybranychVKategorii(kat.key);
            return (
              <button
                key={kat.key}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                  aktivniKategorie === kat.key 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                onClick={() => setAktivniKategorie(kat.key)}
              >
                <span className="mr-2">{kat.ikona}</span>
                {kat.nazev} ({vybrano}/{pocet})
              </button>
            );
          })}
        </div>

        <div className="max-h-96 overflow-y-auto space-y-6">
          {(aktivniKategorie === 'all' ? kategorie : kategorie.filter(k => k.key === aktivniKategorie)).map(kat => {
            const kategorieIndikatory = filteredIndicators.filter(indicator => 
              indicator.kategorie === kat.key
            );
            
            if (kategorieIndikatory.length === 0) return null;
            
            return (
              <div key={kat.key} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <span>{kat.ikona}</span>
                    {kat.nazev}
                  </h3>
                  <button
                    className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-none text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500"
                    onClick={() => handleKategorieToggle(kat.key)}
                  >
                    {getPocetVybranychVKategorii(kat.key) === kategorieIndikatory.length ? 'Zrušit vše' : 'Vybrat vše'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {kategorieIndikatory.map((indikator) => (
                    <label key={indikator.id} className={`flex items-start gap-3 p-4 rounded-xl hover:shadow-md cursor-pointer transition-all group border ${getBarvaKategorie(kat.barva)}`}>
                      <input
                        type="checkbox"
                        checked={vybraneIndikatory.has(indikator.id)}
                        onChange={() => handleIndikatorToggle(indikator.id)}
                        className="mt-1 w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-2">
                          <span className="text-lg">{indikator.ikona}</span>
                          {indikator.nazev}
                        </div>
                        <div className="mt-1 space-y-1">
                          <div className="text-xs text-indigo-600 uppercase tracking-wide flex gap-2 items-center">
                            <span className="font-semibold">{indikator.jednotka}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">{indikator.comparison_method}</span>
                          </div>
                          <div className="text-xs text-slate-500 leading-relaxed">
                            {indikator.popis}
                          </div>
                          {indikator.lower_better && (
                            <div className="text-xs text-emerald-600 font-medium">
                              ✓ Nižší hodnota je lepší
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

        <div className="flex justify-between items-center pt-6 border-t border-slate-200">
          <button className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500 hover:shadow-lg" onClick={onBack}>
            ← Zpět na Nahrání návrhů
          </button>
          
          <div className="flex gap-3">
            {/* Tlačítko pro nastavení vah */}
            {vybraneIndikatory.size > 0 && (
              <button
                onClick={() => setShowWeightSettings(true)}
                className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md bg-white text-slate-700 border-2 border-blue-300 hover:bg-blue-50 hover:border-blue-500 focus:ring-blue-500 hover:shadow-lg"
              >
                <Sliders size={18} />
                Nastavit váhy ({vybraneIndikatory.size})
              </button>
            )}
            
            <button
              className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none shadow-md bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 hover:shadow-lg"
              onClick={onNext}
              disabled={vybraneIndikatory.size === 0}
            >
              Pokračovat na Výsledky analýzy
              <span className="text-lg">→</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* Modal pro nastavení vah */}
      <AnimatePresence>
        {showWeightSettings && (
          <WeightSettings
            indikatory={indikatory}
            vybraneIndikatory={vybraneIndikatory}
            vahy={vahy || {}}
            setVahy={setVahy}
            onClose={() => setShowWeightSettings(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default StepCriteria;