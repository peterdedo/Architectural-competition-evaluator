import React from 'react';

const Sidebar = ({ aktualniKrok, kroky, onKrokChange }) => {
  const seznamKroku = [
    { key: kroky.KONFIGURACE, nazev: 'Konfigurace API', popis: 'Nastavení OpenAI klíče' },
    { key: kroky.NAHRANI, nazev: 'Nahrání návrhů', popis: 'PDF dokumenty a obrázky' },
    { key: kroky.KRITERIA, nazev: 'Výběr kritérií', popis: 'Výběr indikátorů' },
    { key: kroky.VYSLEDKY, nazev: 'Výsledky analýzy', popis: 'Přehled hodnot' },
    { key: kroky.POROVNANI, nazev: 'Porovnání návrhů', popis: 'Tabulka a grafy' }
  ];

  const getStatusKroku = (krokKey, index) => {
    const aktualniIndex = seznamKroku.findIndex(s => s.key === aktualniKrok);
    
    if (index < aktualniIndex) return 'dokoncen';
    if (index === aktualniIndex) return 'aktivni';
    return 'neaktivni';
  };

  return (
    <div className="w-64 bg-white/80 glass border-r border-slate-200 shadow-lg h-full">
      <div className="p-6">
        <div className="mb-8">
          <h2 className="text-lg font-bold text-slate-800 mb-2">Kroky analýzy</h2>
          <p className="text-sm text-slate-500">Postupujte podle kroků pro dokončení analýzy</p>
        </div>
        
        <nav className="space-y-2">
          {seznamKroku.map((krok, index) => {
            const status = getStatusKroku(krok.key, index);
            
            return (
              <button
                key={krok.key}
                onClick={() => onKrokChange(krok.key)}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  status === 'dokoncen' ? 'text-success border-r-2 border-success/70 bg-white/60 hover:shadow-md' : 
                  status === 'aktivni' ? 'text-[color:var(--primary)] border-r-2 border-[color:var(--primary)] bg-white/70 shadow-sm' :
                  'text-text-light hover:text-text-dark hover:bg-[rgba(0,102,164,0.06)]'
                } hover:translate-x-[1px]`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                  status === 'dokoncen' ? 'bg-[rgba(75,179,73,0.2)] text-success' :
                  status === 'aktivni' ? 'bg-[rgba(0,102,164,0.18)] text-[color:var(--primary)] animate-pulse' :
                  'bg-neutral/40 text-text-muted'
                }`}>
                  {status === 'dokoncen' ? '✓' : index + 1}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{krok.nazev}</div>
                  <div className="text-xs opacity-75">{krok.popis}</div>
                </div>
              </button>
            );
          })}
        </nav>
        
        <div className="mt-8 p-4 rounded-xl border border-slate-200 bg-white/70">
          <h3 className="text-sm font-semibold text-slate-700 mb-2">Tip</h3>
          <p className="text-xs text-slate-600">
            Každý krok je navržen tak, aby vás provedl celým procesem analýzy projektů.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;