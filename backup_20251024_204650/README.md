# 🏙️ Urban Analytics

**AI-Powered Urban Design Analysis Platform**

Moderní aplikace pro analýzu a porovnání urbanistických návrhů s podporou umělé inteligence.

![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen?style=flat-square)
![Node.js](https://img.shields.io/badge/Node.js-18+-green?style=flat-square)
![React](https://img.shields.io/badge/React-18.2-blue?style=flat-square)
![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)

---

## ✨ Hlavní Features

### 📊 Analýza a Vizualizace
- ✅ **Dynamické grafy** - Radarové grafy, tabulky, heatmapy
- ✅ **PDF Export** - Generuj zprávy s analýzami
- ✅ **Interaktivní dashboard** - Real-time porovnání návrhů
- ✅ **Pokročilé filtrování** - Vybírání a třídění dat

### 🤖 AI Features
- ✅ **AI Asistent** - Automatické analýzy návrhů pomocí GPT-4
- ✅ **Smart Weight Suggestions** - AI doporučuje optimální váhy indikátorů
- ✅ **Generování Shrnutí** - Automatické textové hodnocení
- ✅ **Contextual Insights** - Chytrá doporučení na základě dat

### 🎨 Design & UX
- ✅ **Moderní UI** - Tailwind CSS + Framer Motion
- ✅ **Responsivní Design** - Mobile, tablet, desktop
- ✅ **Dark Mode** - Pohodlné používání v noci
- ✅ **Smooth Animations** - Profesionální pohyby

### 🔒 Security & Performance
- ✅ **Bezpečné API klíče** - .env konfiguraci
- ✅ **SSL/TLS** - HTTPS na produkci
- ✅ **Komprese** - GZIP, minified assets
- ✅ **Caching** - Long-term caching static files

---

## 🚀 Quick Start

### Prerekvizity
- Node.js 18.19.1 (doporučeno)
- npm 8+
- OpenAI API klíč (https://platform.openai.com/api-keys)

### Nastavení prostředí

**Doporučené nastavení Node.js verze:**

```bash
# Instalace nvm (Node Version Manager)
# Windows: https://github.com/coreybutler/nvm-windows
# macOS/Linux: https://github.com/nvm-sh/nvm

# Instalace správné verze Node.js
nvm install 18.19.1
nvm use 18.19.1

# Ověření verze
node --version  # mělo by být v18.19.1
npm --version
```

**Alternativní instalace:**
- Stáhni Node.js 18.19.1 přímo z https://nodejs.org/
- Nebo použij `.nvmrc` soubor v projektu

### Instalace

   ```bash
# 1. Klonuj repo
git clone https://github.com/your-username/urban-analytics.git
cd urban-analytics

# 2. Instaluj dependencies
npm install

# 3. Vytvoř .env
cp .env.example .env

# 4. Vlož API klíč
# Edit .env a nastavit VITE_OPENAI_KEY=sk-proj-xxxxx

# 5. Spusť dev server
npm run dev

# ➜ Otevři: http://localhost:5181
```

### Production

   ```bash
# 1. Build aplikace
npm run build

# 2. Spusť server
npm run start

# 3. Otevři: http://localhost:3000
```

### s PM2 (recommended)

   ```bash
# Global instalace PM2
sudo npm install -g pm2

# Start aplikace
pm2 start ecosystem.config.js --env production

# Ověř status
pm2 status
pm2 logs urban-analytics
```

---

## 🔧 Configuration

### Environment Variables

Vytvoř `.env` soubor (kopie z `.env.example`):

```env
# OpenAI API
VITE_OPENAI_KEY=sk-proj-your-actual-key

# URLs
VITE_API_BASE_URL=http://localhost:5181
VITE_APP_NAME=Urban Analytics

# Features
VITE_ENABLE_AI_FEATURES=true
VITE_ENABLE_PDF_EXPORT=true
VITE_ENABLE_HEATMAP=true

# Server (production)
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
```

### OpenAI API Setup

1. Jdi na https://platform.openai.com/api-keys
2. Vytvoř nový secret key
3. Zkopíruj klíč (ukazuje se jen jednou!)
4. Vlož do `.env`: `VITE_OPENAI_KEY=sk-proj-...`
5. Nastav usage limits v OpenAI Dashboard

---

## 📁 Projekt Struktura

```
urban-analytics/
├── src/
│   ├── components/          # React komponenty
│   │   ├── ComparisonDashboard.jsx
│   │   ├── WeightedHeatmap.jsx
│   │   ├── ExpandableRadarChart.jsx
│   │   └── ...
│   ├── hooks/               # Custom React hooks
│   │   ├── useAIAssistant.js
│   │   ├── usePdfExport.js
│   │   └── ...
│   ├── data/                # Data files
│   ├── styles/              # CSS styling
│   ├── App.jsx              # Main component
│   └── main.jsx             # Entry point
├── public/                  # Static files
├── dist/                    # Build output (production)
├── server.js                # Express server
├── ecosystem.config.js      # PM2 configuration
├── package.json
├── vite.config.js
├── DEPLOYMENT.md            # Deployment guide
└── README.md               # This file
```

---

## 🏗️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite 7** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **ECharts** - Advanced charting
- **Recharts** - React charting library
- **Lucide React** - Icons

### Backend
- **Node.js 18+** - Runtime
- **Express.js** - Server framework
- **Helmet** - Security headers
- **Compression** - GZIP middleware

### AI & APIs
- **OpenAI GPT-4** - AI analysis
- **OpenAI API** - REST API integration

### DevOps
- **Vite** - Development server
- **PM2** - Process manager
- **Nginx** - Reverse proxy
- **Let's Encrypt** - SSL certificates

---

## 🤖 AI Features Explained

### AI Asistent
Klikni na "AI Shrnutí" v Porovnání návrhů a AI vygeneruje:
- Analýzu silných a slabých stránek každého návrhu
- Celkový přehled konkurence
- Doporučení pro zlepšení

**Prompt Example:**
```
"You are an expert urban planner evaluating design competition entries.
Based on the following indicators and proposals, provide a comprehensive summary..."
```

### AI Weight Suggestions
Klikni na "AI Návrh váh" a AI doporučí:
- Optimální váhy pro jednotlivé indikátory
- Zdůvodnění pro každou váhu
- Kontextová doporučení (type: "urbanistická soutěž")

**Výstup:**
```json
[
  {
    "id": "indicator_id",
    "suggestedWeight": 35,
    "reason": "Zvyšuje kvalitu ovzduší a estetiku"
  }
]
```

---

## 📊 Visualizations

### 1. Comparison Table
- Side-by-side porovnání návrhů
- Zvýraznění nejlepších hodnot
- Váhy indikátorů

### 2. Radar Chart
- Vícerozměrné porovnání
- Interaktivní expandování
- PNG export

### 3. Weighted Heatmap
- Barevné vizualizace hodnot
- Normalizace na 0-100%
- Interaktivní tooltip s detaily

### 4. Dashboard
- Results Summary
- Key metrics
- Trend analysis

---

## 🧪 Testing

### Development
```bash
npm run dev
# Dev server s hot reload na http://localhost:5181
```

### Unit Testing
```bash
# Spuštění všech testů
npm run test

# Testování s watch mode
npm run test:watch

# Testování s UI
npx vitest --ui
```

### Linting & Formatting
```bash
# Kontrola kódu ESLint
npm run lint

# Formátování kódu
npm run format

# Type checking
npm run type-check
```

### Production Preview
```bash
npm run build
npm run preview
# Test production build lokálně
```

## 💾 Záloha

### Automatická záloha
```bash
# Vytvoření zálohy celé aplikace
npm run backup

# Obnovení ze zálohy
npm run restore --backup=YYYY-MM-DD_HH-MM-SS
```

### Manuální záloha
```bash
# Záloha dat
cp -r src/data/ backup/data-$(date +%Y%m%d_%H%M%S)/

# Záloha konfigurace
cp .env backup/env-$(date +%Y%m%d_%H%M%S).env
```

### Node verze
```bash
# Ověření aktuální verze
node --version

# Přepnutí na doporučenou verzi
nvm use 18.19.1

# Instalace všech závislostí
npm ci
```

---

## 📚 Deployment

### Lokální Production Testing
```bash
npm run build
npm run start
# http://localhost:3000
```

### VPS Deployment
```bash
# Viz DEPLOYMENT.md pro kompletní instrukce
# Zahrnuje: Node.js setup, PM2, Nginx, SSL
```

### Docker (optional)
```bash
# TODO: Přidat Dockerfile
```

---

## 🔐 Security

- ✅ `.env` je v `.gitignore` - nikdy se commituje
- ✅ API klíče nejsou v kódu - jen v `.env`
- ✅ HTTPS na produkci (Let's Encrypt)
- ✅ Security headers (Helmet)
- ✅ Input validation
- ✅ CORS protection

**Best Practices:**
- Rotuj API klíče každé 3 měsíce
- Monitoruj usage na OpenAI Dashboard
- Nastav usage limits ($50/měsíc)
- Loguj všechny AI requesty

---

## 📞 Support & Resources

### Documentation
- **Deployment Guide:** `DEPLOYMENT.md`
- **Quick Start:** Viz výše
- **API Docs:** OpenAI - https://platform.openai.com/docs

### External Resources
- **Vite Documentation:** https://vitejs.dev/
- **React Documentation:** https://react.dev/
- **Tailwind CSS:** https://tailwindcss.com/
- **PM2 Documentation:** https://pm2.keymetrics.io/
- **OpenAI API:** https://platform.openai.com/

### Contributing
1. Fork repository
2. Vytvoř feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push branch (`git push origin feature/amazing-feature`)
5. Otevři Pull Request

---

## 📜 License

MIT License - viz `LICENSE` soubor

---

## 👨‍💻 Authors

- **Vývojář:** [Vaše jméno]
- **Project:** Urban Analytics
- **Created:** 2025

---

## 🗺️ Roadmap

### V1.1 (Q4 2025)
- [ ] Database integration (PostgreSQL)
- [ ] User authentication
- [ ] Project saving & sharing
- [ ] Advanced filtering

### V2.0 (Q1 2026)
- [ ] Mobile app (React Native)
- [ ] Real-time collaboration
- [ ] Custom indicators
- [ ] API webhooks

### V2.5 (Q2 2026)
- [ ] Machine learning predictions
- [ ] Batch processing
- [ ] Advanced reporting
- [ ] Integration s GIS systémy

---

## 🐛 Known Issues

- [ ] Zatím žádné hlášené problémy
- Pokud narazíš na chybu, otevři GitHub issue

---

**Poslední update:** 2025-10-22  
**Status:** ✅ Production Ready






