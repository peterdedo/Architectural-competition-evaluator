# REVIZE MECHANIZMŮ APLIKACE

## 🔴 KRITICKÉ PROBLÉMY

### 1. **StepCriteria.jsx - Automatické přepisování dat (ŘÁDKY 101-109)**
```javascript
useEffect(() => {
  if (vybraneIndikatory.size > 0) {
    const timeoutId = setTimeout(() => {
      searchSelectedIndicators(); // ❌ PŘEPISUJE navrhy.data!
    }, 500);
    return () => clearTimeout(timeoutId);
  }
}, [vybraneIndikatory]);
```

**Problém:** 
- Pokaždé, když uživatel změní výběr indikátorů, funkce `searchSelectedIndicators()` PŘEPÍŠE všechna data návrhů
- To může smazat již zpracovaná data
- Způsobuje to nestabilitu a ztrátu dat

**Řešení:** ODSTRANIT tento useEffect

---

### 2. **useVisionAnalyzer - Nepoužívaná funkce**
V `StepCriteria.jsx` se importuje `searchIndicatorsInDocument`, ale ta funkce:
- Není implementována v `useVisionAnalyzer.js`
- Nebo je prázdná/nefunkční
- Způsobuje chyby v konzoli

**Řešení:** Odstranit import a volání této funkce

---

### 3. **Mock data - Nedostatečná variace**
V `StepUpload.jsx` generování mock dat má malou variaci (90-110%):
```javascript
const random = Math.random() * 0.2 + 0.9; // Jen 20% rozsah
```

**Problém:** Data vypadají příliš podobně

**Řešení:** Zvýšit variaci na 50-150%

---

### 4. **StepResults - Chybí validace vybraných indikátorů**
Komponenta zobrazí data, i když uživatel nevybral žádné indikátory.

**Řešení:** Přidat kontrolu `if (vybraneIndikatory.size === 0)`

---

### 5. **Regex patterns - Nedostatečné pro české PDF**
Regex v `StepUpload.jsx` hledá jen specifické fráze, ale:
- Nečeká mezery a zalomení řádků
- Nečeká různé formáty čísel (1 000, 1.000, 1000)
- Má problémy s diakritikou

**Řešení:** Vylepšit regex patterns

---

## 🟡 STŘEDNĚ ZÁVAŽNÉ PROBLÉMY

### 6. **App.jsx - Chybí persistence stavu**
Když uživatel obnoví stránku, ztratí všechna data.

**Řešení:** Uložit stav do localStorage

---

### 7. **StepComparison - Nepoužívá vybraneIndikatory správně**
Komponenta má prop `vybraneIndikatory`, ale nefiltruje podle něj.

**Řešení:** Filtrovat zobrazené indikátory

---

### 8. **Chybí error boundaries**
Když dojde k chybě v komponentě, celá aplikace spadne.

**Řešení:** Přidat ErrorBoundary komponenty

---

## 🟢 DROBNÉ PROBLÉMY

### 9. **Console.log všude**
Mnoho debug logů v produkčním kódu.

**Řešení:** Přesunout do development módu

---

### 10. **Nekonzistentní pojmenování**
- Někde `navrhy`, někde `proposals`
- Někde `indikatory`, někde `indicators`

**Řešení:** Sjednotit na česká jména

---

## 📋 PLÁN OPRAV

### Fáze 1: KRITICKÉ (nyní)
1. ✅ Odstranit automatické přepisování v StepCriteria
2. ✅ Opravit useVisionAnalyzer import
3. ✅ Vylepšit mock data variaci
4. ✅ Přidat validaci v StepResults

### Fáze 2: STŘEDNĚ ZÁVAŽNÉ
5. ⏳ Přidat localStorage persistence
6. ⏳ Opravit filtrování v StepComparison
7. ⏳ Přidat ErrorBoundary

### Fáze 3: OPTIMALIZACE
8. ⏳ Vylepšit regex patterns
9. ⏳ Vyčistit console.log
10. ⏳ Sjednotit pojmenování

---

## ZAČÍNÁM OPRAVY...




