# 🚀 Spustenie Aplikácie - Urban Analysis App

## 📋 Požiadavky

### Systémové Požiadavky
- **Node.js**: 18.0.0 alebo vyššie
- **npm**: 8.0.0 alebo vyššie
- **Prehliadač**: Chrome 90+, Firefox 88+, Safari 14+
- **RAM**: Minimálne 4GB (odporúčané 8GB)
- **Disk**: 500MB voľného miesta

### API Kľúče
- **OpenAI API Key**: Pre AI funkcionalitu (voliteľné)
- **Environment Variables**: VITE_OPENAI_KEY (voliteľné)

## 🔧 Inštalácia

### 1. Klonovanie Repozitára
```bash
git clone <repository-url>
cd urban-analysis-app
```

### 2. Inštalácia Závislostí
```bash
npm install
```

### 3. Konfigurácia (Voliteľné)
```bash
# Vytvorenie .env súboru
echo "VITE_OPENAI_KEY=your_openai_api_key_here" > .env
```

## 🚀 Spustenie

### Development Server
```bash
npm run dev
```
- **URL**: http://localhost:5179
- **Hot Reload**: Automatické obnovovanie pri zmene kódu
- **Debug**: Console logy v prehliadači

### Production Build
```bash
npm run build
```
- **Output**: `dist/` priečinok
- **Optimizácia**: Minifikácia a tree-shaking
- **Size**: ~2MB bundle

### Preview Production Build
```bash
npm run preview
```
- **URL**: http://localhost:4173
- **Testovanie**: Production build lokálne

## 🔑 Konfigurácia API

### OpenAI API Key
1. **Registrácia**: https://platform.openai.com/
2. **API Key**: Vytvorenie v OpenAI dashboard
3. **Nastavenie**: 
   - V aplikácii: StepConfig → API Key
   - Environment: VITE_OPENAI_KEY v .env
   - LocalStorage: Automatické uloženie

### Bez API Key
- **Mock Data**: Aplikácia funguje s mock dátami
- **Funkcie**: Všetky funkcie okrem AI analýzy
- **AI Asistent**: Zobrazuje ukážkové výsledky

## 📁 Štruktúra Projektu

```
urban-analysis-app/
├── public/                 # Statické súbory
├── src/
│   ├── components/        # React komponenty
│   ├── hooks/            # Custom hooks
│   ├── contexts/         # State management
│   ├── data/            # Dáta a indikátory
│   ├── styles/          # CSS súbory
│   └── utils/           # Utility funkcie
├── package.json         # Závislosti
├── vite.config.js       # Vite konfigurácia
├── tailwind.config.js   # Tailwind konfigurácia
└── README.md           # Dokumentácia
```

## 🎯 Použitie Aplikácie

### 1. Upload Návrhov
- **PDF Upload**: Drag & drop alebo kliknutie
- **Automatické spracovanie**: OCR a extrakcia textu
- **Názvy**: Editovateľné názvy návrhov

### 2. Výber Indikátorov
- **Kategórie**: Bilance ploch, HPP, parkovanie
- **Vlastné**: Pridávanie vlastných indikátorov
- **Váhy**: Nastavenie váh pre indikátory

### 3. AI Analýza
- **Kontext**: Zadanie kontextu súťaže
- **Spustenie**: Jedno tlačidlo pre analýzu
- **Výsledky**: Detailné komentáre a odporúčania

### 4. Porovnávanie
- **Heatmap**: Vizuálne porovnanie návrhov
- **Skóre**: Automatické výpočty
- **Export**: PDF export výsledkov

## 🔧 Troubleshooting

### Časté Problémy

#### 1. Port už používaný
```bash
# Zmena portu
npm run dev -- --port 3000
```

#### 2. Node.js verzia
```bash
# Kontrola verzie
node --version

# Aktualizácia (nvm)
nvm install 18
nvm use 18
```

#### 3. npm cache problémy
```bash
# Vyčistenie cache
npm cache clean --force
rm -rf node_modules
npm install
```

#### 4. PowerShell problémy (Windows)
```bash
# Použitie Command Prompt namiesto PowerShell
cmd
cd "C:\Users\User\Documents\Cursor\Vzkřísení"
npm run dev
```

### Debug Mode
```bash
# Verbose logging
DEBUG=* npm run dev

# Chrome DevTools
# F12 → Console → Zobrazenie chýb
```

## 📊 Performance

### Optimalizácia
- **Bundle Size**: < 2MB
- **Load Time**: < 3s
- **Memory Usage**: < 100MB
- **CPU Usage**: < 10%

### Monitoring
```bash
# Bundle analyzer
npm run build -- --analyze

# Performance profiling
# Chrome DevTools → Performance tab
```

## 🔒 Bezpečnosť

### API Keys
- **LocalStorage**: Bezpečné uloženie
- **Environment**: .env súbory
- **HTTPS**: Povinné pre produkciu

### Data Privacy
- **Local Processing**: Všetky dáta spracované lokálne
- **No Tracking**: Žiadne analytics
- **GDPR Compliant**: Žiadne osobné údaje

## 🌐 Deployment

### Static Hosting
```bash
# Build
npm run build

# Upload dist/ do hosting služby
# Netlify, Vercel, GitHub Pages, atď.
```

### Environment Variables
```bash
# Production
VITE_OPENAI_KEY=your_production_key
VITE_API_URL=https://your-api.com
```

## 📞 Podpora

### Dokumentácia
- **README.md**: Hlavná dokumentácia
- **ARCHITEKTURA.md**: Technická architektúra
- **CHANGELOG.md**: História zmien

### Kontakt
- **Issues**: GitHub Issues
- **Email**: support@example.com
- **Discord**: Community server

---

**Posledná aktualizácia**: 25. január 2025  
**Verzia**: 1.0.0 (Konsolidovaná)  
**Status**: Funkčná a stabilná


