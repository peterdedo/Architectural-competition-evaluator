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
- ✅ **OpenAI klíč jen na serveru** – `OPENAI_API_KEY` v `.env` pro lokální proxy / na Vercel v env proměnných; prohlížeč volá jen `/api/openai/...`
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

# 3. Vytvoř .env (nebo .env.local) z příkladu
cp .env.example .env

# 4. Doplň OpenAI klíč (používá lokální proxy, ne prohlížeč)
# V .env nastav: OPENAI_API_KEY=sk-...

# 5. Spusť vývoj – Vite + lokální OpenAI proxy (doporučeno)
npm run dev

# ➜ Aplikace: http://localhost:5179/ (výchozí port ve vite.config.js; při obsazeném portu může Vite zvolit jiný – sleduj výstup terminálu)
```

### Lokální OpenAI proxy (vývoj)

Pro AI funkce musí běžet **backendový proxy** a musí být nastavený **`OPENAI_API_KEY`**. Klient v prohlížeči volá jen relativní cesty **`/api/openai/chat`** a **`/api/openai/models`**; samotný klíč se do bundle neukládá.

| Příkaz | Co spouští |
|--------|------------|
| **`npm run dev`** | Doporučeno: současně **`server/openai-proxy.mjs`** (výchozí **`127.0.0.1:8792`**) a **Vite**. Vite přesměruje `/api/openai` na stejný port (čte `OPENAI_PROXY_PORT` z `.env`, jinak 8792). Starší projekty na **8788** tím nekolídují. |
| **`npm run dev:vite`** | Jen frontend – **bez** lokálního proxy. AI volání přes `/api/openai` **nepůjdou**, dokud proxy neběží zvlášť (`npm run dev:proxy`). |
| **`npm run dev:proxy`** | Pouze OpenAI proxy (typicky používáš spolu s `dev:vite` ve dvou terminálech). |

`npm run dev` spouští **concurrently** s příznakem **`-k` (kill-others)**: když spadne **Vite** nebo **proxy**, druhý proces se také ukončí. Pokud na zvoleném portu proxy (výchozí **8792**) zůstane viset **starý** Node proces, nový proxy se při dalším `npm run dev` nespustí — v terminálu uvidíš **EADDRINUSE** a návod (viz `server/openai-proxy.mjs`). Po úspěšném startu proxy vytiskne **banner** s `openai-diag-v2`, portem, cestou ke kořeni pro `.env` a informací, zda je klíč načtený.

**Minimální setup**

1. Zkopíruj `.env.example` → `.env` nebo `.env.local` v **kořeni repozitáře** (jsou v `.gitignore`).
2. Nastav `OPENAI_API_KEY=sk-...` (klíč z [OpenAI platformy](https://platform.openai.com/api-keys)).
3. Spusť `npm run dev`.
4. Po **každé změně** `.env` / `.env.local` proxy **restartuj** (zastav `npm run dev` a spusť znovu), aby Node proces znovu načetl proměnné.

**Časté chyby**

- **Port proxy je obsazený (`EADDRINUSE`)** při startu: na zvoleném portu (výchozí **8792**) už něco poslouchá. Postupuj podle výpisu v terminálu (Windows: `netstat` / `Get-NetTCPConnection` + `taskkill` / `Stop-Process`). Po uvolnění portu znovu `npm run dev`. Pokud máš v `.env` **`OPENAI_PROXY_PORT`**, musí být **stejná hodnota** jako čte Vite (`vite.config.js` ji načítá přes `loadEnv`).
- Kód / stav **`OPENAI_KEY_MISSING`** (HTTP 503 z proxy): v procesu proxy není nastavený `OPENAI_API_KEY` → zkontroluj soubor v kořeni, překlepy a restart `npm run dev`.
- **„Failed to fetch“ / nelze spojit s proxy**: neběží `npm run dev` (nebo neběží `dev:proxy` + Vite), případně firewall blokuje port proxy (výchozí **8792**).
- **401 / 403** z OpenAI: neplatný klíč, billing nebo oprávnění účtu – ověř v OpenAI dashboardu.

**Ověření v prohlížeči**

V DevTools → **Network** při AI testu / použití aplikace by měly jít požadavky na stejný origin jako aplikace (**`/api/openai/...`**). Nemělo by se objevit přímé volání na **`https://api.openai.com`** s tvým Bearer tokenem z frontendového kódu (token drží proxy nebo Vercel serverless).

Krok *Konfigurace* ve wizardu obsahuje tlačítko **Test OpenAI proxy** – chybové hlášky tam odpovídají výše uvedeným scénářům.

### Production (statický build)

   ```bash
# 1. Build aplikace
npm run build

# 2. Lokální náhled výstupu z dist/
npm run preview

# Pro nasazení s API routes (Vercel) viz DEPLOYMENT.md
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

**Lokální vývoj (OpenAI proxy)**

| Proměnná | Kde platí | Popis |
|----------|-----------|--------|
| `OPENAI_API_KEY` | `server/openai-proxy.mjs` (načte `.env` a `.env.local` z kořene) | Povinné pro lokální AI. |
| `OPENAI_PROXY_PORT` | stejné + **Vite** (`vite.config.js` přes `loadEnv`) | Volitelné, výchozí **8792**. Musí sedět u obou procesů. |

**Volitelně – frontend**

| Proměnná | Popis |
|----------|--------|
| `VITE_API_BASE_URL` | Bez koncového `/`. Když je prázdné, klient používá relativní `/api/openai/...` (typické pro dev i Vercel). Nastav např. při vlastní doméně API. |

**Produkce (Vercel / serverless)**

Na platformě nastav **`OPENAI_API_KEY`** v nastavení projektu (Environment Variables). Funkce v `api/openai/*` ho čtou na serveru – ne v `VITE_*`.

Příklad kořenového `.env` pro vývoj:

```env
OPENAI_API_KEY=sk-váš-klíč
# OPENAI_PROXY_PORT=8792
```

Viz také `.env.example`.

### OpenAI API Setup

1. Otevři https://platform.openai.com/api-keys
2. Vytvoř nový secret key a zkopíruj ho
3. Vlož do `.env` nebo `.env.local` v kořeni: **`OPENAI_API_KEY=sk-...`**
4. Restartuj `npm run dev`
5. Volitelně nastav limity spotřeby v OpenAI Dashboard

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
- **Vite 5** - Build tool
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




