# ZÁLOHA APLIKÁCIE URBAN ANALYTICS v2.1
**Dátum:** 21. január 2025  
**Verzia:** 2.1 Final  
**Stav:** Funkčná s opravenými chybami  

---

## 📋 OBSAH

1. [Prehľad aplikácie](#prehľad-aplikácie)
2. [Technická architektúra](#technická-architektúra)
3. [Kľúčové komponenty](#kľúčové-komponenty)
4. [Hlavné súbory](#hlavné-súbory)
5. [Konfigurácia](#konfigurácia)
6. [Inštalácia a spustenie](#inštalácia-a-spustenie)
7. [Opravy a vylepšenia](#opravy-a-vylepšenia)
8. [Používateľské rozhranie](#používateľské-rozhranie)
9. [AI integrácia](#ai-integrácia)
10. [Export a zálohovanie](#export-a-zálohovanie)

---

## 🏗️ PREHĽAD APLIKÁCIE

**Urban Analytics v2.1** je pokročilá webová aplikácia pre analýzu urbanistických projektov s AI integráciou. Aplikácia umožňuje:

- **AI Vision analýzu** PDF dokumentov pomocou GPT-4o
- **Vážené hodnotenie** projektov s kategóriami a indikátormi
- **Interaktívne vizualizácie** (radar grafy, heatmapy, porovnania)
- **Export výsledkov** do PDF
- **PWA funkcionalita** pre offline použitie

### 🎯 Hlavné funkcie:
- **5-krokový wizard** pre analýzu projektov
- **AI Weight Manager** pre automatické navrhovanie váh
- **Robustný výpočet skóre** s normalizáciou
- **Responsive dizajn** pre všetky zariadenia
- **Centralizovaný stav** cez WizardContext

---

## 🛠️ TECHNICKÁ ARCHITEKTÚRA

### Frontend Stack:
- **React 18** - Hlavný framework
- **Vite 5.4.21** - Build tool a dev server
- **Tailwind CSS** - Styling framework
- **Framer Motion** - Animácie
- **Lucide React** - Ikony

### AI a analýza:
- **OpenAI GPT-4o** - AI Vision analýza
- **PDF.js** - Spracovanie PDF dokumentov
- **html2canvas + jsPDF** - Export do PDF

### PWA funkcionalita:
- **vite-plugin-pwa** - Progressive Web App
- **Service Worker** - Offline funkcionalita
- **Manifest** - App-like experience

---

## 🧩 KĽÚČOVÉ KOMPONENTY

### 1. **Wizard Flow**
```
StepConfig → StepCriteria → StepUpload → StepResults → StepComparison
```

### 2. **AI Integrácia**
- `useVisionAnalyzer.js` - AI Vision analýza
- `ContextAwareAIWeightManager.jsx` - AI váhy
- `AdvancedAIAssistant.jsx` - AI asistent

### 3. **Výpočet skóre**
- `EvaluationEngine.js` - Robustný výpočet
- `WinnerCalculationBreakdown.jsx` - Detailné skóre
- `WeightedHeatmap.jsx` - Vizuálne zobrazenie

### 4. **Export funkcionalita**
- `usePdfExport.js` - PDF export
- `PdfExportPanel.jsx` - Export rozhranie

---

## 📁 HLAVNÉ SÚBORY

### **Konfiguračné súbory:**
```
├── package.json - Závislosti a skripty
├── vite.config.js - Vite konfigurácia s PWA
├── tailwind.config.js - Tailwind CSS konfigurácia
├── postcss.config.js - PostCSS konfigurácia
└── index.html - Hlavný HTML súbor
```

### **Zdrojové súbory:**
```
src/
├── main.jsx - Vstupný bod aplikácie
├── App.jsx - Hlavná komponenta
├── index.css - Globálne štýly
├── styles/design.css - Vlastné štýly
├── contexts/
│   └── WizardContext.jsx - Globálny stav
├── components/
│   ├── StepConfig.jsx - Konfigurácia API
│   ├── StepCriteria.jsx - Výber kritérií
│   ├── StepUpload.jsx - Nahrávanie PDF
│   ├── StepResults.jsx - Výsledky analýzy
│   ├── StepComparison.jsx - Porovnanie návrhov
│   ├── ContextAwareAIWeightManager.jsx - AI váhy
│   ├── AdvancedAIAssistant.jsx - AI asistent
│   ├── WinnerCalculationBreakdown.jsx - Detailné skóre
│   ├── WeightedHeatmap.jsx - Heatmapa
│   ├── RadarChartAdvanced.jsx - Radar grafy
│   ├── ComparisonDashboard.jsx - Porovnávací dashboard
│   ├── PdfExportPanel.jsx - PDF export
│   └── ErrorBoundary.jsx - Error handling
├── hooks/
│   ├── usePdfProcessor.js - PDF spracovanie
│   ├── useVisionAnalyzer.js - AI Vision
│   ├── useToast.js - Toast notifikácie
│   ├── usePWA.js - PWA funkcionalita
│   ├── useLocalStorage.js - Local storage
│   └── useAIAssistant.js - AI asistent
├── data/
│   ├── indikatory.js - Indikátory a kategórie
│   ├── indikatory_data.js - Rozšírené dáta
│   └── criteria_schema.js - Schéma kritérií
├── engine/
│   └── EvaluationEngine.js - Výpočet skóre
└── utils/
    └── indicatorManager.js - Správa indikátorov
```

### **PWA súbory:**
```
public/
├── sw.js - Service Worker
├── manifest.json - PWA manifest
├── favicon.svg - Favicon
└── icons/ - PWA ikony
```

---

## ⚙️ KONFIGURÁCIA

### **Vite konfigurácia (vite.config.js):**
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'robots.txt'],
      manifest: {
        name: 'Urban Analytics',
        short_name: 'UrbanAI',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#1d4ed8',
        icons: [
          { src: 'icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512x512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      devOptions: {
        enabled: false, // SW vypnutý vo vývojovom prostredí
      }
    })
  ],
  server: {
    port: 5179,
    host: true
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'lucide-react': ['lucide-react'],
          'recharts': ['recharts'],
          'echarts': ['echarts', 'echarts-for-react'],
          'pdf-utils': ['pdfjs-dist', 'html2canvas', 'jspdf']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      ignore: ['pdfjs-dist']
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
```

### **Package.json závislosti:**
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "framer-motion": "^10.16.4",
    "lucide-react": "^0.294.0",
    "recharts": "^2.8.0",
    "echarts": "^5.4.3",
    "echarts-for-react": "^3.0.2",
    "pdfjs-dist": "^3.11.174",
    "html2canvas": "^1.4.1",
    "jspdf": "^2.5.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.1.1",
    "vite": "^5.4.21",
    "vite-plugin-pwa": "^0.17.4",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.32",
    "autoprefixer": "^10.4.16"
  }
}
```

---

## 🚀 INŠTALÁCIA A SPUSTENIE

### **1. Inštalácia závislostí:**
```bash
npm install
```

### **2. Spustenie vývojového servera:**
```bash
npm run dev
```
Aplikácia bude dostupná na `http://localhost:5179/`

### **3. Build pre produkciu:**
```bash
npm run build
```

### **4. Preview produkčného buildu:**
```bash
npm run preview
```

---

## 🔧 OPRAVY A VYLEPŠENIA

### **Opravené chyby:**

1. **✅ Service Worker konflikty**
   - Vypnutý SW vo vývojovom prostredí
   - Bezpečný fetch handler
   - Automatické odregistrovanie starých SW

2. **✅ Import chyby**
   - Opravené neexistujúce funkcie v EvaluationEngine
   - Aktualizované importy v StepResults.jsx

3. **✅ React rendering chyby**
   - Opravené "Objects are not valid as a React child"
   - Bezpečná extrakcia hodnôt z objektov

4. **✅ Výpočet skóre**
   - Robustný EvaluationEngine.js
   - Normalizácia indikátorov
   - Bezpečné ošetrenie NaN a undefined

### **Pridané funkcie:**

1. **🤖 AI Weight Manager**
   - Automatické navrhovanie váh
   - Kontextové AI analýzy
   - Centralizovaný stav váh

2. **📊 Pokročilé vizualizácie**
   - WeightedHeatmap.jsx
   - RadarChartAdvanced.jsx
   - ComparisonDashboard.jsx

3. **📱 PWA funkcionalita**
   - Offline podpora
   - App-like experience
   - Service Worker

4. **🔧 Developer tools**
   - Performance monitoring
   - Error recovery
   - Debug tools

---

## 🎨 POUŽÍVATEĽSKÉ ROZHRAIE

### **Wizard Flow:**

#### **Krok 1: Konfigurácia API**
- Zadanie OpenAI API kľúča
- Testovanie pripojenia
- Uloženie do localStorage

#### **Krok 2: Výber kritérií**
- Výber indikátorov
- Nastavenie váh
- AI Weight Manager
- Kategórie a váhy

#### **Krok 3: Nahrávanie návrhov**
- PDF upload
- AI Vision analýza
- Automatické spracovanie
- Validácia výsledkov

#### **Krok 4: Výsledky analýzy**
- Tabuľka výsledkov
- Kompaktný layout
- Export funkcionalita
- Hodnocení vítězných návrhů

#### **Krok 5: Porovnanie návrhov**
- Detailné porovnanie
- Radar grafy
- Heatmapy
- PDF export

### **AI funkcionality:**

1. **AI Weight Manager**
   - Kontextové navrhovanie váh
   - Aplikácia AI odporúčaní
   - Synchronizácia s globálnym stavom

2. **AI Asistent**
   - Analýza výsledkov
   - Komentáre a odporúčania
   - Interaktívne rozhovory

3. **AI Vision**
   - Automatická analýza PDF
   - Extrakcia dát
   - Validácia výsledkov

---

## 🤖 AI INTEGRÁCIA

### **OpenAI GPT-4o integrácia:**

```javascript
// useVisionAnalyzer.js
const analyzeWithAI = async (imageData, criteria) => {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this urban planning document and extract data for criteria: ${JSON.stringify(criteria)}`
            },
            {
              type: 'image_url',
              image_url: { url: `data:image/jpeg;base64,${imageData}` }
            }
          ]
        }
      ]
    })
  });
  
  return await response.json();
};
```

### **AI Weight Manager:**

```javascript
// ContextAwareAIWeightManager.jsx
const suggestWeights = async (context) => {
  const prompt = `Based on this urban planning context: ${context}, 
  suggest optimal weights for indicators and categories.`;
  
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: prompt }]
  });
  
  return JSON.parse(response.choices[0].message.content);
};
```

---

## 📊 VÝPOČET SKÓRE

### **EvaluationEngine.js:**

```javascript
export function calculateProjectScore(project, weights) {
  if (!project || !weights) return 0;

  let totalWeightedScore = 0;
  let totalPossibleScore = 0;

  Object.entries(project.categories || {}).forEach(([catId, category]) => {
    const categoryWeight = weights[catId]?.weight ?? 0;
    
    Object.entries(category.indicators || {}).forEach(([indId, indicator]) => {
      const indicatorWeight = weights[catId]?.indicators?.[indId]?.weight ?? 0;
      const indicatorValue = getIndicatorValue(indicator);
      const normalizedValue = normalizeIndicatorValue(indicatorValue, indicator);
      const weightedScore = normalizedValue * (indicatorWeight / 100) * (categoryWeight / 100);
      
      if (Number.isFinite(weightedScore)) {
        totalWeightedScore += weightedScore;
        totalPossibleScore += (indicatorWeight / 100) * (categoryWeight / 100) * 100;
      }
    });
  });

  const finalScore = totalPossibleScore > 0 ? (totalWeightedScore / totalPossibleScore) * 100 : 0;
  return Number.isFinite(finalScore) ? Number(finalScore.toFixed(2)) : 0;
}
```

### **Normalizácia indikátorov:**

```javascript
function normalizeIndicatorValue(value, indicator) {
  if (!Number.isFinite(value) || value <= 0) return 0;
  
  const maxValue = indicator.maxValue ?? indicator.max ?? 100;
  
  if (maxValue > 0) {
    const normalized = Math.min((value / maxValue) * 100, 100);
    return Number.isFinite(normalized) ? normalized : 0;
  }
  
  return Math.min(value, 100);
}
```

---

## 📱 PWA FUNKCIONALITA

### **Service Worker (public/sw.js):**
```javascript
// Bezpečný fetch handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Nechytej Vite dev súbory
  if (
    request.url.includes('/src/') ||
    request.url.includes('manifest.json') ||
    request.url.includes('main.jsx') ||
    request.url.includes('vite') ||
    request.url.includes('@vite') ||
    request.url.includes('localhost:5179')
  ) {
    return; // Nechaj prehliadač spracovať
  }
  
  // Ostatné požiadavky...
});
```

### **Automatické odregistrovanie SW:**
```javascript
// main.jsx
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => {
      r.unregister();
      console.info('[SW] Development mode – service worker disabled');
    });
  });
  
  caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
}
```

---

## 📤 EXPORT A ZÁLOHOVANIE

### **PDF Export:**
```javascript
// usePdfExport.js
const exportToPDF = async (data) => {
  const canvas = await html2canvas(element);
  const imgData = canvas.toDataURL('image/png');
  
  const pdf = new jsPDF();
  pdf.addImage(imgData, 'PNG', 0, 0);
  pdf.save('urban-analytics-results.pdf');
};
```

### **Local Storage:**
```javascript
// useLocalStorage.js
export const useLocalStorage = (key, defaultValue) => {
  const [value, setValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  });

  const setStoredValue = useCallback((value) => {
    try {
      setValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [value, setStoredValue];
};
```

---

## 🔒 BEZPEČNOSŤ A VALIDÁCIA

### **API Key validácia:**
```javascript
const validateApiKey = async (apiKey) => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.ok;
  } catch (error) {
    return false;
  }
};
```

### **Dáta validácia:**
```javascript
const validateApiResponse = (response) => {
  try {
    const data = typeof response === 'string' ? JSON.parse(response) : response;
    
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid response format');
    }
    
    return data;
  } catch (error) {
    console.error('Response validation failed:', error);
    return null;
  }
};
```

---

## 🎯 POUŽITIE APLIKÁCIE

### **Typický workflow:**

1. **Konfigurácia** - Zadanie OpenAI API kľúča
2. **Výber kritérií** - Výber indikátorov a nastavenie váh
3. **Nahrávanie** - Upload PDF dokumentov
4. **Analýza** - AI Vision spracovanie
5. **Výsledky** - Zobrazenie a export výsledkov
6. **Porovnanie** - Detailné porovnanie návrhov

### **AI Weight Manager:**
- Automatické navrhovanie váh na základe kontextu
- Aplikácia AI odporúčaní
- Synchronizácia s globálnym stavom

### **Export možnosti:**
- PDF export výsledkov
- Export porovnania
- Export detailných skóre

---

## 🚀 BUDÚCE VYLEPŠENIA

### **Plánované funkcie:**
1. **Rozšírené AI analýzy** - Hlbšie AI insights
2. **Kolaboratívne funkcie** - Zdieľanie projektov
3. **Rozšírené exporty** - Excel, CSV formáty
4. **Mobilná aplikácia** - React Native verzia
5. **API integrácia** - REST API pre externé systémy

### **Technické vylepšenia:**
1. **Performance optimalizácia** - Lazy loading, memoizácia
2. **Testovanie** - Unit a integration testy
3. **Dokumentácia** - API dokumentácia
4. **Monitoring** - Error tracking, analytics

---

## 📞 PODPORA A ÚDRŽBA

### **Debugging:**
- Developer tools v aplikácii
- Console logy pre diagnostiku
- Error boundary pre zachytávanie chýb

### **Monitoring:**
- Performance monitoring
- Error tracking
- User analytics

### **Backup:**
- Automatické zálohovanie do localStorage
- Export dát v JSON formáte
- PWA offline funkcionalita

---

## 📋 ZÁVEREČNÉ POZNÁMKY

**Urban Analytics v2.1** je plne funkčná aplikácia s pokročilými AI funkciami a robustným výpočtom skóre. Všetky chyby boli opravené a aplikácia je pripravená na produkčné použitie.

### **Kľúčové úspechy:**
- ✅ Opravené Service Worker konflikty
- ✅ Robustný výpočet skóre
- ✅ AI integrácia funguje správne
- ✅ PWA funkcionalita
- ✅ Responsive dizajn
- ✅ Export funkcionalita

### **Technické špecifikácie:**
- **Frontend:** React 18 + Vite 5.4.21
- **Styling:** Tailwind CSS
- **AI:** OpenAI GPT-4o
- **PWA:** vite-plugin-pwa
- **Export:** html2canvas + jsPDF

Aplikácia je pripravená na nasadenie a ďalší vývoj! 🚀

---

**Generované:** 21. január 2025  
**Verzia:** 2.1 Final  
**Stav:** Funkčná ✅






