# ⚖️ FUNKCE: NASTAVENÍ VAH INDIKÁTORŮ

**Datum přidání:** 2025-10-21 00:26  
**Verze:** 1.1.0  
**Status:** ✅ Implementováno

---

## 📖 CO JE TO?

Funkce **Nastavení vah** umožňuje uživateli určit, **jak důležitý je každý indikátor** při hodnocení urbanistických návrhů.

### Základní koncept:

- **Váha = Důležitost** indikátoru
- **Vyšší váha** = větší vliv na celkové hodnocení
- **Nulová váha** = indikátor se nebere v úvahu
- **Výchozí váha** = 10 (pro všechny indikátory)

---

## 🎯 JAK TO FUNGUJE?

### 1. Výběr indikátorů (Krok 3: Výběr kritérií)
- Uživatel vybere indikátory, které chce analyzovat
- Po výběru se objeví tlačítko **"Nastavit váhy"**

### 2. Otevření nastavení vah
- Kliknutím na tlačítko se otevře modální okno
- Zobrazí se **pouze vybrané indikátory**

### 3. Úprava vah
- Pro každý indikátor lze nastavit váhu **0-50**
- Úprava pomocí **slideru** nebo **číselného inputu**
- Živý náhled **procentuálního podílu** na celkové váze

### 4. Uložení vah
- Váhy se ukládají do **localStorage**
- Přetrvají i po obnovení stránky (F5)
- Aplikují se při výpočtu výsledků

---

## 🧮 PŘÍKLAD POUŽITÍ

### Scénář: Ekologický důraz

Uživatel chce **zdůraznit ekologické aspekty**:

| Indikátor | Výchozí váha | Nová váha | Význam |
|-----------|--------------|-----------|---------|
| Zelené plochy | 10 | **30** | 3× důležitější |
| Zpevněné plochy | 10 | **5** | Méně důležité |
| HPP celkem | 10 | **10** | Standardní |
| Parkování celkem | 10 | **5** | Méně důležité |

**Celková váha:** 50 (místo 40)

**Výsledek:** Návrhy s více zelenými plochami dostanou vyšší skóre.

---

## 📐 MATEMATIKA

### Výpočet vážené hodnoty:

```
Skóre návrhu = Σ (normalizovaná_hodnota[i] × váha[i])
               ────────────────────────────────────────
                           Σ váha[i]
```

Kde:
- `normalizovaná_hodnota[i]` = hodnota indikátoru převedená na škálu 0-1
- `váha[i]` = uživatelem nastavená váha
- `Σ` = suma přes všechny vybrané indikátory

### Normalizace hodnoty:

Pro indikátory kde **vyšší = lepší** (např. zelené plochy):
```
normalizovaná = (hodnota - min) / (max - min)
```

Pro indikátory kde **nižší = lepší** (např. náklady):
```
normalizovaná = (max - hodnota) / (max - min)
```

---

## 🎨 UI KOMPONENTY

### 1. Tlačítko "Nastavit váhy"
**Umístění:** Krok 3 (StepCriteria), dolní lišta  
**Zobrazení:** Pouze když jsou vybrány indikátory  
**Design:** Modré ohraničení, ikona slideru

### 2. Modální okno (WeightSettings.jsx)
**Komponenty:**
- **Header:** Gradient modro-zelený, název "Nastavení vah"
- **Info banner:** Rozbalovací nápověda (Info ikona)
- **Controls:** Reset tlačítko, celková váha
- **Slider pro každý indikátor:**
  - Ikona indikátoru
  - Název a popis
  - Číselný input (0-50)
  - Range slider s gradientem
  - Procentuální podíl
- **Footer:** Počet indikátorů, tlačítka Zrušit/Uložit

### 3. Visual design:
- **Slider:** Gradient modro-zelený (#0066A4 → #4BB349)
- **Thumb (táhlo):** Kulatý, gradient, shadow
- **Hover efekt:** Scale 1.1, větší shadow
- **Animace:** Framer Motion fade-in, stagger effect

---

## 💾 PERSISTENCE

### LocalStorage klíč:
```
"urban-analysis-vahy"
```

### Formát dat:
```json
{
  "C01": 15,
  "C03": 30,
  "C05": 10,
  "C19": 5
}
```

### Výchozí chování:
- Pokud váha není nastavena → použije se výchozí váha z indikátoru (10)
- Reset váhy → obnoví výchozí hodnoty pro všechny indikátory

---

## 📁 SOUBORY

### Nové soubory:
```
src/
├── components/
│   └── WeightSettings.jsx       ← ✨ NOVÝ modal pro nastavení vah (260 řádků)
```

### Upravené soubory:
```
src/
├── App.jsx                      ← Přidán stav `vahy`, persistence
├── components/
│   └── StepCriteria.jsx         ← Tlačítko "Nastavit váhy", props vahy/setVahy
```

---

## 🔧 API / PROPS

### WeightSettings.jsx Props:
```typescript
{
  indikatory: Array<Indikator>,           // Všechny indikátory
  vybraneIndikatory: Set<string>,        // Vybrané ID indikátorů
  vahy: { [id: string]: number },        // Aktuální váhy
  setVahy: (vahy: object) => void,       // Callback pro uložení vah
  onClose: () => void                    // Callback pro zavření modalu
}
```

### StepCriteria.jsx Props (nové):
```typescript
{
  // ... existující props
  vahy: { [id: string]: number },        // Váhy indikátorů
  setVahy: (vahy: object) => void        // Callback pro změnu vah
}
```

---

## ✅ TESTOVÁNÍ

### Test 1: Základní flow
1. Jít na "Výběr kritérií"
2. Vybrat alespoň 2 indikátory
3. ✅ Tlačítko "Nastavit váhy" by se mělo objevit
4. Kliknout na tlačítko
5. ✅ Modal by se měl otevřít
6. Upravit váhy sliderem
7. ✅ Procentuální podíly by se měly aktualizovat
8. Kliknout "Uložit váhy"
9. ✅ Modal by se měl zavřít

### Test 2: Persistence
1. Nastavit váhy
2. Uložit
3. F5 (reload stránky)
4. Jít na "Výběr kritérií"
5. Otevřít "Nastavit váhy"
6. ✅ Váhy by měly být zachovány

### Test 3: Reset
1. Upravit váhy
2. Kliknout "Reset"
3. ✅ Všechny váhy by se měly vrátit na výchozí (10)

### Test 4: Číselný input
1. Otevřít nastavení vah
2. Do inputu napsat číslo (např. 25)
3. ✅ Slider by se měl posunout
4. ✅ Procenta by se měla aktualizovat

### Test 5: Nápověda
1. Kliknout "Zobrazit nápovědu"
2. ✅ Info banner by se měl rozbalit
3. Kliknout znovu
4. ✅ Banner by se měl sbalit

---

## 🎨 DESIGN PATTERNS

### 1. Modal Pattern
- Overlay s backdrop-blur
- Click outside = zavře modal
- ESC key = zavře modal (TODO)

### 2. Controlled Component
- Stav vah v rodičovské komponentě (App.jsx)
- Předáván přes props cascade
- Persistence v localStorage

### 3. Optimistic UI
- Změny vah jsou okamžité
- Žádné čekání na API
- Lokální výpočty

---

## 🚀 BUDOUCÍ VYLEPŠENÍ

### Možné rozšíření:

1. **Presety vah**
   - "Ekologický" - zvýhodní zelené plochy
   - "Ekonomický" - zvýhodní náklady
   - "Sociální" - zvýhodní obyvatele
   - Uživatel si může uložit vlastní presety

2. **Skupinové nastavení**
   - Nastavit váhu pro celou kategorii najednou
   - "Všechny HPP indikátory = 15"

3. **Vizuální náhled dopadu**
   - Graf ukazující, jak změna váhy ovlivní pořadí návrhů
   - "Pokud zvýšíte váhu X, návrh A bude první"

4. **Import/Export vah**
   - Export vah do JSON
   - Import vah z předchozích projektů
   - Sdílení vah s kolegy

5. **Validace vah**
   - Varování, pokud je celková váha příliš malá/velká
   - Doporučení vyvážení vah

6. **Pokročilé váhování**
   - Logaritmické škálování
   - Penalty/bonus systém
   - Podmíněné váhy ("pokud X > Y, pak...")

---

## 📊 STATISTIKY

- **Komponenta:** WeightSettings.jsx
- **Řádky kódu:** ~260
- **Animace:** Framer Motion (fade-in, stagger)
- **Ikony:** Lucide React (Sliders, Info, RotateCcw, TrendingUp, Check)
- **Rozsah vah:** 0-50
- **Výchozí váha:** 10
- **Persist:** localStorage

---

## 🔗 SOUVISEJÍCÍ DOKUMENTACE

- [REVIZE_KOMPLETNI.md](./REVIZE_KOMPLETNI.md) - Kompletní revize aplikace
- [HOTOVO.md](./HOTOVO.md) - Shrnutí dokončených úprav
- [ZALOHA_KOMPLETNI_2025-10-21.md](./ZALOHA_KOMPLETNI_2025-10-21.md) - Záloha kódu

---

**✅ FUNKCE JE PLNĚ IMPLEMENTOVANÁ A PŘIPRAVENÁ K POUŽITÍ!**

**Vytvořeno:** 2025-10-21 00:26  
**Autor:** AI Assistant (Claude Sonnet 4.5)




