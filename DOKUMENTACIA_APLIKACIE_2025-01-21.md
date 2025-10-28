# 📘 Kompletní dokumentácia aplikace - Urban Analytics v2.0

**Dátum vytvorenia:** 21. január 2025  
**Verzia:** 2.0  
**Účel:** Dokumentácia služiace ako záloha a referenčný manuál pre aplikáciu Urban Analytics

---

## 📋 Obsah

1. [IVERZAL](#overview)
2. [Architektúra aplikácie](#architecture)
3. [Komponenty](#components)
4. [Data Flow](#data-flow)
5. [Kľúčové funkcie](#key-features)
6. [Nastavenia a konfigurácia](#configuration)
7. [Riešenie problémov](#troubleshooting)
8. [Zoznam súborov](#file-structure)

---

## 🎯 Prehľad {#overview}

Urban Analytics v.o je React + Vite aplikácia pre hodnotenie urbanistických návrhov v architektonických súťažiach. Aplikácia umožňuje:

- **Načítanie a spracovanie PDF** návrhov pomocou AI (OpenAI GPT-4o Vision)
- **Výber a nastavenie kritérií** hodnotenia (34 základných indikátorov v 8 kategóriách)
- **Nastavenie váh** indikátorov a kategórií
- **Automatické výpočty** skóre a porovnanie návrhov
- **Vizualizácia výsledkov** (heatmapy, radarové grafy, tabuľky)
- **AI asistent** pre generovanie komentárov a odporúčaní

---

## 🏗️ Architektúra aplikácie {#architecture}

### Technológie

- **React 18** - UI framework
- **Vite 5** - Build tool a dev server
- **Tailwind CSS** - Styling
- **Framer Motion** - Animácie
- **ECharts** - Grafy a vizualizácie
- **OpenAI API** - AI analýza PDF a komentáre
- **localStorage** - Persistencia dát

### Štruktúra

```
src/
├── components/        # React komponenty
├── contexts/          # Context API (WizardContext)
├── hooks/             # Custom React hooks
├── data/              # Statické dáta (indikátory, kategórie)
├── engine/            # Výpočtová logika (EvaluationEngine)
├── utils/             # Utility funkcie
└── styles/            # CSS súbory
```

---

## 🧩 Komponenty {#components}

### Core Components

#### WizardContext (`src/contexts/WizardContext.jsx`)
Centrálny stav aplikácie:
- `navrhy` - zoznam návrhov
- `vybraneNavrhy` - vybrané návrhy
- `vybraneIndikatory` - vybrané indikátory
- `vahy` / `weights` - váhy indikátorov
- `categoryWeights` - váhy kategórií
- `results` - vypočítané výsledky

#### Step Config (`src/components/StepConfig.jsx`)
- Nastavenie OpenAI API kľúča
- Zobrazenie konfiguračných informácií
- **Správa verzí projektu** (uložiť/obnoviť)
- Validačné hlásenia

#### Step Criteria (`src/components/StepCriteria.jsx`)
- Výber indikátorov podľa kategórií
- Zobrazenie ikôň kategórií
- Počítadlo vybraných indikátorov
- Tlačidlá "Vybrat všetko" v kategórii

#### Step Upload (`src/components/StepUpload.jsx`)
- Upload PDF súborov
- **Import JSON/CSV** súborov
- Zobrazenie stavu spracovania
- Indikácia priebehu AI analýzy

#### Step Results (`src/components/StepResults.jsx`)
- Zobrazenie výsledkov porovnania
- Tabuľka s indikátormi a hodnotami
- **Zvýraznenie najlepších návrhov** (zelená)
- **Známka ručne doplnených hodnôt** (✏️ ikona)
- Tlačidlo "Hodnocení vítězných návrhů"

#### Winner Calculation Breakdown (`src/components/WinnerCalculationBreakdown.jsx`)
- **Executive Summary** - automatické vysvetlenie výsledkov
- Zobrazenie víťazného návrhu
- Poradie všetkých návrhov
- **Detailné skóre všetkých návrhov** (nezávisle rozbaliteľné)
- Kategórie sú vždy viditeľné v rozbalených návrhoch

#### Advanced AI Assistant (`src/components/AdvancedAIAssistant.jsx`)
- Generovanie AI analýzy návrhov
- Generovanie AI komentárov s kontextom
- Konfigurácia kontextu súťaže
- Zobrazenie výsledkov v HTML formáte

#### Radar Chart Advanced (`src/components/RadarChartAdvanced.jsx`)
- Radarový graf pre porovnanie návrhov
- **Normalizácia hodnôt** (0-100%) podľa najlepšieho návrhu
- **Invertovaná škála** pre "nižší je lepší" indikátory
- Zobrazenie len vybraných indikátorov

#### Comparison Dashboard (`src/components/ComparisonDashboard.jsx`)
- Dashboard s viacerými vizualizáciami
- Tlačidlá pre rôzne módy zobrazenia
- Integrácia všetkých grafov a tabuliek

---

## 🔄 Data Flow {#data-flow}

### 1. Nahrávanie návrhov
```
User upload PDF → StepUpload → useVisionAnalyzer → OpenAI GPT-4o Vision
→ Extrahované dáta → WizardContext.navrhy
```

### 2. Výber kritérií
```
StepCriteria → WizardContext.vybraneIndikatory
```

### 3. Nastavenie váh
```
StepWeights → WizardContext.weights & categoryWeights
```

### 4. Výpočet výsledkov
```
WizardContext → EvaluationEngine.calculateProjectScore
→ WizardContext.results
```

### 5. Zobrazenie výsledkov
```
WizardContext.results → StepResults → Výpočty a vizualizácie
```

---

## 🔑 Kľúčové funkcie {#key-features}

### 1. AI Analýza PDF
- **Modul:** `src/hooks/useVisionAnalyzer.js`
- **Model:** GPT-4o Vision
- **Proces:**
  1. PDF sa rozdelí na stránky (canvas)
  2. Každá stránka sa konvertuje na base64 obrázok
  3. AI extrahuje hodnoty indikátorov z obrázkov
  4. Dáta sa uložia do `WizardContext`

### 2. Výpočet skóre
- **Modul:** `src/engine/EvaluationEngine.js`
- **Vzorec:** `Normalizované skóre × Váha indikátoru × Váha kategórie`
- **Normalizácia:** 0-100% podľa max hodnoty v indikátore
- **Pre "nižší je lepší":** Invertovaná škála

### 3. Vizualizácie
- **Heatmapy:** ECharts heatmap, škála 0-3000
- **Radarové grafy:** Normalizované hodnoty (0-100%)
- **Tabuľky:** Zvýraznenie najlepších návrhov

### 4. AI Komentáre
- **Modul:** `src/hooks/useAIAssistant.js`
- **Model:** GPT-4o-mini
- **Výstup:** HTML formátované komentáre
- **Obsahuje:** Silné stránky, nedostatky, odporúčania, celkové skóre

### 5. Správa verzí
- **Modul:** `src/utils/versionManager.js`
- **Uloženie:** localStorage
- **Funkcie:** Uloženie, obnovenie, mazanie verzií projektu

---

## ⚙️ Nastavenia a konfigurácia {#configuration}

### API Kľúče
- **OpenAI API:** Nastavenie v `StepConfig.jsx` alebo `localStorage.apiKey`
- **Environment variable:** `VITE_OPENAI_KEY`

### Indikátory
- **Súbor:** `src/data/indikatory_zakladni.js`
- **Kategórie:** 8 kategórií (Využití území, Intenzita využití, atď.)
- **Vlastnosti každého indikátora:**
  - `id`, `nazev`, `jednotka`, `kategorie`
  - `lower_better` (true/false)
  - `trend` ('up'/'down')

### Škálovanie heatmapy
- **Súbor:** `src/components/WeightedHeatmap.jsx`
- **Riadok:** 319-320
- **Aktuálne:** 0-3000

### Optimalizácia AI
- **Súbor:** `src/hooks/useAIAssistant.js`
- **Nastavenia:**
  - `temperature: 0.6-0.7`
  - `max_tokens: 2000-3000`
  - `top_p: 0.9`
  - `frequency_penalty: 0.1-0.15`

---

## 🔧 Riešenie problémov {#troubleshooting}

### Problém: AI asistent nefunguje
**Riešenie:**
1. Skontroluj API kľúč v `StepConfig.jsx`
2. Skontroluj console pre chybové hlásenia
3. Over, či má API kľúč prístup k GPT-4o Vision

### Problém: Zobrazujú sa "Toalety" indikátor
**Riešenie:**
- Tento indikátor má ID `custom_1761333530207`
- Má byť filtrovaný vo všetkých komponentoch
- Ak sa zobrazuje, skontroluj filtre v komponentoch

### Problém: Skóre je 0%
**Riešenie:**
1. Skontroluj, či sú všetky váhy nastavené
2. Over, či sú indikátory vybrané
3. Skontroluj `WizardContext.results`

### Problém: Radarový graf zobrazuje nesprávne hodnoty
**Riešenie:**
1. Skontroluj `RadarChartAdvanced.jsx`, riadok 150-170 (normalizácia)
2. Over `lower_better` vlastnosti indikátorov
3. Skontroluj, či používa správne indikátory (len vybrané)

### Problém: Heatmapa je príliš tmavá/jasná
**Riešenie:**
- Uprav `visualMap.max` v `WeightedHeatmap.jsx`
- Aktuálne: 0-3000

---

## 📁 Zoznam súborov {#file-structure}

### Kritické súbory

```
src/
├── main.jsx                     # Entry point
├── App.jsx                      # Main component
├── contexts/
│   └── WizardContext.jsx        # ⚠️ CRITICAL - Global state
├── components/
│   ├── StepConfig.jsx           # API setup
│   ├── StepCriteria.jsx         # Criteria selection
│   ├── StepUpload.jsx           # PDF upload
│   ├── StepResults.jsx          # Results display
│   ├── WinnerCalculationBreakdown.jsx  # Detailed breakdown
│   └── AdvancedAIAssistant.jsx  # AI comments
├── hooks/
│   ├── useVisionAnalyzer.js     # PDF analysis
│   └── useAIAssistant.js        # AI assistant
├── engine/
│   └── EvaluationEngine.js      # ⚠️ CRITICAL - Score calculation
├── data/
│   ├── indikatory_zakladni.js   # Base indicators
│   └── indikatory.js            # Indicator exports
└── utils/
    ├── versionManager.js        # Version management
    ├── validation.js            # Input validation
    └── indicatorManager.js      # Indicator utilities
```

---

## 📝 Dôležité poznámky

### Ručne doplnené hodnoty
- Označené `source: "uživatelský vstup"`
- Zobrazené s ✏️ ikonou
- Zahrnuté do všetkých výpočtov

### "Toalety" indikátor
- **ID:** `custom_1761333530207`
- Automaticky filtrovaný
- Nemal by sa zobrazovať

### Executive Summary
- Generované automaticky v `WinnerCalculationBreakdown`
- Zobrazuje top 2 kategórie víťaza
- Zobrazuje rozdiel od druhého návrhu

### Nezá dispersalé rozbalovanie návrhov
- Každý návrh má vlastnú rozbalovaciu sekciu
- Kategórie sú vždy viditeľné
- Tlačidlá "Zbaliť všetko" / "Rozbaliť všetko" pre ovládanie všetkých

---

## 🎨 Farbový systém

### Zvýraznenia
- **Zelená (`bg-green-100`)**: Najlepší návrh v indikátore
- **Modrá (`bg-blue-50`)**: Ručne doplnené hodnoty
- **Žltá/Orange**: Víťazný návrh
- **Fialová**: Detailné sekcie návrhov

### Grafy
- **Heatmapa:** Modrá (0) → Biela (stred) → Červená (max)
- **Radar:** Normalizované 0-100%
- **Progress bary:** Zelená (dobré), Oranžová (stred), Červená (nízke)

---

## 🚀 Deployment

### Build
```bash
npm run build
```

### Dev server
```bash
npm run dev
```

### Port
- Default: 5179
- Možno zmeniť v `vite.config.js`

---

## 📞 Podpora

V prípade problémov:
1. Skontrolujte console pre chybové hlásenia
2. Overte, či sú všetky dependency nainštalované
3. Skontrolujte API kľúče
4. Obnovte localStorage ak je potrebné

---

**Autor:** AI Assistant  
**Dátum:** 21. január 2025  
**Verzia aplikácie:** 2.0

