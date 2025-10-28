# ZÁLOHA APLIKÁCIE - Urban Analytics v2.1
**Dátum vytvorenia:** 21. január 2025  
**Verzia:** 2.1  
**Stav:** Funkčná s AI Vision integráciou

## 📋 PREHĽAD APLIKÁCIE

Urban Analytics je moderná webová aplikácia pre analýzu urbanistických návrhov s AI podporou. Aplikácia umožňuje:

- **Nahrávanie PDF dokumentov** s AI Vision analýzou
- **Výber indikátorov** z 17 kľúčových urbanistických kritérií
- **Nastavenie váh** pre kategórie a indikátory
- **AI Weight Manager** pre automatické návrhy váh
- **Transparentný výpočet skóre** s detailným rozpisom
- **Interaktívne vizualizácie** (radarový graf, heatmapa, tabuľky)
- **Export výsledkov** do PDF

## 🏗️ ARCHITEKTÚRA APLIKÁCIE

### Frontend Stack
- **React 18.2.0** - Hlavný framework
- **Vite 5.0.8** - Build tool a dev server
- **Tailwind CSS 3.4.0** - Styling framework
- **Framer Motion 12.23.24** - Animácie
- **Recharts 2.8.0** - Grafy a vizualizácie
- **ECharts 5.6.0** - Pokročilé grafy

### AI Integrácia
- **OpenAI GPT-4o** - AI Vision pre PDF analýzu
- **OpenAI GPT-4o-mini** - Textová analýza a návrhy váh
- **PDF.js 3.11.174** - PDF spracovanie

### State Management
- **React Context API** - Centrálny state management
- **localStorage** - Persistencia dát
- **Custom hooks** - Logika komponentov

## 📁 ŠTRUKTÚRA PROJEKTU

```
src/
├── components/           # React komponenty
│   ├── StepConfig.jsx   # Konfigurácia API
│   ├── StepUpload.jsx   # Nahrávanie PDF
│   ├── StepCriteria.jsx # Výber indikátorov
│   ├── StepResults.jsx  # Výsledky analýzy
│   ├── StepComparison.jsx # Porovnanie návrhov
│   ├── ComparisonDashboard.jsx # Hlavný dashboard
│   ├── Header.jsx       # Hlavička aplikácie
│   ├── Sidebar.jsx      # Bočný panel
│   ├── WizardTopNav.jsx # Navigácia wizardu
│   ├── ErrorBoundary.jsx # Error handling
│   └── Toast.jsx        # Notifikácie
├── hooks/               # Custom React hooks
│   ├── usePdfProcessor.js # PDF spracovanie
│   ├── useVisionAnalyzer.js # AI Vision analýza
│   ├── useAIAssistant.js # AI asistent
│   ├── useToast.js      # Toast notifikácie
│   └── useLocalStorage.js # localStorage hook
├── data/                # Dáta a schémy
│   ├── indikatory.js    # Hlavné indikátory
│   ├── indikatory_zakladni.js # Základné indikátory
│   ├── indikatory_data.js # Rozšírené indikátory
│   ├── criteria_schema.js # Schéma kritérií
│   └── criteria_schema.json # JSON schéma
├── styles/              # Styling
│   └── design.css       # Hlavné štýly
├── contexts/            # React Context
│   └── WizardContext.jsx # Hlavný context
├── models/              # Data modely
│   └── CriteriaModel.js # Model kritérií
├── utils/               # Utility funkcie
│   └── indicatorManager.js # Správa indikátorov
├── engine/              # Business logika
│   └── EvaluationEngine.js # Výpočet skóre
├── App.jsx              # Hlavná komponenta
├── main.jsx             # Entry point
└── index.css            # Základné štýly
```

## 🔧 KONFIGURÁCIA

### package.json
```json
{
  "name": "urban-analysis-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint . --ext js,jsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "echarts": "^5.6.0",
    "echarts-for-react": "^3.0.2",
    "es-toolkit": "^1.3.0",
    "framer-motion": "^12.23.24",
    "html2canvas": "^1.4.1",
    "jspdf": "^3.0.3",
    "lucide-react": "^0.546.0",
    "pdfjs-dist": "^3.11.174",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "recharts": "^2.8.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.16",
    "eslint": "^8.55.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "eslint-plugin-react-refresh": "^0.4.5",
    "postcss": "^8.4.32",
    "tailwindcss": "^3.4.0",
    "vite": "^5.0.8"
  }
}
```

### vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5179,
    host: true
  }
})
```

### tailwind.config.js
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        heading: ['Poppins', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      },
      colors: {
        primary: '#22C55E',
        secondary: '#86EFAC',
        accent: '#3B82F6',
        'text-dark': '#1E293B',
        'text-light': '#64748B',
        'text-muted': '#94A3B8',
        'bg-light': '#F9FAFB',
        surface: '#FFFFFF',
        'surface-hover': '#F0FDF4',
        border: '#E2E8F0',
        'border-hover': '#CBD5E1',
        neutral: '#E2E8F0',
        error: '#EF4444',
        success: '#22C55E',
        warning: '#F59E0B',
      },
      screens: { 
        xl: '1440px', 
        lg: '1024px', 
        md: '768px', 
        sm: '375px' 
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        skeleton: {
          '0%': { opacity: '1' },
          '50%': { opacity: '0.4' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'soft': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
        'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
        'card': '0 2px 8px rgba(0,0,0,.10)'
      }
    },
  },
  plugins: [],
}
```

## 🚀 SPUSTENIE APLIKÁCIE

### Vývojové prostredie
```bash
# Inštalácia závislostí
npm install

# Spustenie dev servera
npm run dev

# Aplikácia bude dostupná na http://localhost:5179
```

### Produkčné zostavenie
```bash
# Zostavenie pre produkciu
npm run build

# Preview produkčného buildu
npm run preview
```

## 📊 HLAVNÉ KOMPONENTY

### 1. StepConfig.jsx - Konfigurácia API
- Nastavenie OpenAI API kľúča
- Testovanie API pripojenia
- Validácia kľúča

### 2. StepUpload.jsx - Nahrávanie PDF
- Drag & drop nahrávanie PDF súborov
- Konverzia PDF na obrázky pomocou PDF.js
- AI Vision analýza pomocou OpenAI GPT-4o
- Fallback na mock dáta ak nie je API kľúč

### 3. StepCriteria.jsx - Výber indikátorov
- Zobrazenie 17 kľúčových urbanistických indikátorov
- Filtrovanie a vyhľadávanie
- Pridávanie vlastných indikátorov
- AI Weight Manager pre návrhy váh

### 4. StepResults.jsx - Výsledky analýzy
- Zobrazenie spracovaných návrhov
- Transparentný výpočet skóre
- Detailný rozpis výpočtov
- Editovanie hodnôt indikátorov

### 5. ComparisonDashboard.jsx - Porovnanie návrhov
- Interaktívne tabuľky
- Radarový graf
- Vážená heatmapa
- AI asistent pre analýzu
- Export do PDF

## 🤖 AI FUNKCIONALITY

### AI Vision (PDF analýza)
- Automatická extrakcia dát z PDF dokumentov
- Rozpoznávanie tabuliek a číselných hodnôt
- Validácia a normalizácia dát
- Fallback na mock dáta

### AI Weight Manager
- Automatické návrhy váh pre indikátory
- Kontextové odporúčania pre urbanistické súťaže
- Integrácia s existujúcimi váhami

### AI Asistent
- Analýza porovnania návrhov
- Generovanie súhrnného hodnotenia
- Odporúčania pre zlepšenie

## 📈 VÝPOČET SKÓRE

### Normalizácia hodnôt
- Každá hodnota sa normalizuje na škálu 0-100%
- Berie sa do úvahy `lower_better` flag
- Výpočet: `(hodnota - min) / (max - min) * 100`

### Vážené skóre
- Kombinácia váh indikátorov a kategórií
- Finálna váha: `(indikátor_váha * kategória_váha) / 100`
- Celkové skóre: `Σ(normalizovaná_hodnota * finálna_váha)`

### Transparentný výpočet
- Detailný rozpis každého kroku
- Zobrazenie všetkých medzivýsledkov
- Možnosť editovania hodnôt

## 🎨 DESIGN SYSTÉM

### Farbová paleta
- **Primary:** #0066A4 (4ct Blue)
- **Success:** #4BB349 (4ct Green)
- **Accent:** #3B82F6 (Blue)
- **Error:** #EF4444 (Red)
- **Warning:** #F59E0B (Orange)

### Typography
- **Heading:** Poppins, Inter
- **Body:** Inter, system-ui
- **Mono:** JetBrains Mono

### Komponenty
- Moderné karty s hover efektmi
- Gradient tlačidlá
- Glass morphism efekty
- Responsive design
- Accessibility podpora

## 📱 RESPONSIVE DESIGN

- **Mobile:** 375px+
- **Tablet:** 768px+
- **Desktop:** 1024px+
- **Large:** 1440px+

## 🔒 BEZPEČNOSŤ

- API kľúče sa ukladajú len lokálne
- Žiadne dáta sa neodosielajú na externé servery (okrem OpenAI)
- Validácia všetkých vstupov
- Error boundaries pre stabilitu

## 🧪 TESTOVANIE

### Linting
```bash
npm run lint
```

### Manuálne testovanie
1. Nahrávanie PDF dokumentov
2. AI Vision analýza
3. Výber indikátorov
4. Nastavenie váh
5. Výpočet skóre
6. Export výsledkov

## 🚀 DEPLOYMENT

### Lokálny server
```bash
npm run build
npm run preview
```

### Produkčný server
- Vite build vytvorí `dist/` priečinok
- Statické súbory môžu byť servované z akéhokoľvek web servera
- Odporúča sa Nginx alebo Apache

## 📝 ZÁVEREČNÉ POZNÁMKY

Aplikácia je plne funkčná a pripravená na produkčné nasadenie. Všetky hlavné funkcie sú implementované a otestované:

✅ **Funkčné:**
- PDF nahrávanie a AI Vision analýza
- Výber indikátorov a nastavenie váh
- Transparentný výpočet skóre
- Interaktívne vizualizácie
- AI asistent a Weight Manager
- Export výsledkov

✅ **Stabilné:**
- Error handling a validácia
- Responsive design
- Accessibility podpora
- Performance optimalizácie

✅ **Rozšíriteľné:**
- Modulárna architektúra
- Ľahko pridať nové indikátory
- Konfigurovateľné váhy
- Rozšíriteľné AI funkcie

---

**Vytvorené:** 21. január 2025  
**Autor:** AI Assistant  
**Verzia:** 2.1  
**Stav:** Produkčne pripravené

