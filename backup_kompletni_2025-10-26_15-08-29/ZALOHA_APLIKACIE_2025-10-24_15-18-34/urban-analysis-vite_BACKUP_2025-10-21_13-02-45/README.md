# Urban Analytics - AI-Powered Project Analysis

Moderná React aplikácia pre analýzu urbanistických projektov pomocí OpenAI Vision API.

## 🚀 Funkcie

- **Konfigurácia API** - Nastavenie OpenAI API kľúča s validáciou
- **Nahrávanie PDF** - Drag & drop nahrávanie PDF dokumentov s preview
- **Výber kritérií** - Interaktívny výber parametrov pre analýzu
- **AI analýza** - Automatická extrakcia dát pomocí GPT-4 Vision
- **Vizuálne porovnanie** - Tabuľky a karty pre porovnanie projektov
- **Export výsledkov** - JSON export s kompletnými dátami

## 🛠️ Tech Stack

- **React 18** + **Vite** - Moderný frontend framework
- **Tailwind CSS** - Utility-first CSS framework
- **PDF.js** - Spracovanie PDF dokumentov
- **OpenAI Vision API** - AI analýza dokumentov
- **LocalStorage** - Perzistentné ukladanie nastavení

## 📦 Inštalácia

1. **Klonovanie repozitára**
   ```bash
   git clone <repository-url>
   cd urban-analysis-vite
   ```

2. **Inštalácia závislostí**
   ```bash
   npm install
   ```

3. **Spustenie development servera**
   ```bash
   npm run dev
   ```

4. **Otvorenie v prehliadači**
   ```
   http://localhost:5173
   ```

## 🔧 Konfigurácia

### OpenAI API Kľúč

1. Prejdite na [OpenAI Dashboard](https://platform.openai.com/api-keys)
2. Vytvorte nový API kľúč
3. V aplikácii zadajte kľúč v kroku "Konfigurácia"
4. Kľúč sa uloží lokálne v LocalStorage

### Podporované modely

- **GPT-4o** (odporúčané) - Najlepšie výsledky pre Vision API
- **GPT-4 Turbo** - Alternatíva s dobrými výsledkami

## 📋 Použitie

### 1. Konfigurácia
- Zadajte OpenAI API kľúč
- Vyberte AI model
- Otestujte pripojenie

### 2. Nahrávanie
- Nahrajte PDF dokumenty projektov
- Spracujte dokumenty na obrázky
- Vyberte projekty pre analýzu

### 3. Kritériá
- Vyberte kategórie kritérií
- Nastavte jednotlivé parametre
- Pokračujte na analýzu

### 4. Výsledky
- Spustite AI analýzu
- Zobrazte výsledky v tabuľke alebo kartách
- Exportujte dáta

### 5. Porovnanie
- Porovnajte projekty vizuálne
- Identifikujte najlepšie hodnoty
- Exportujte kompletnú analýzu

## 🎨 Design

Aplikácia používa moderný design s:
- **Gradient pozadím** - Indigo → Violet → Fuchsia
- **Inter font** - Profesionálna typografia
- **Tailwind CSS** - Utility-first styling
- **Responsive layout** - Optimalizované pre všetky zariadenia
- **Smooth animácie** - Plynulé prechody a hover efekty

## 🔍 Kritériá analýzy

### Plochy
- Celková plocha pozemku
- Zastavěná plocha
- Zelená plocha
- Parkovací plocha

### Ekonomické
- Celkové náklady
- Doba návratnosti
- Cena za m²

### Udržitelnost
- Energetická efektivnost
- Vodní efektivnost
- Recyklace odpadu
- Podíl zelené energie

### Sociální
- Bytová dostupnost
- Sociální infrastruktura
- Bezpečnost
- Přístupnost

### Urbanistické
- Hustota zastavby
- Výška budov
- Vzdálenost od centra
- Dopravní dostupnost

## 🚨 Riešenie problémov

### PDF.js Worker chyby
```javascript
// V src/hooks/usePdfProcessor.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
```

### API kľúč validácia
- Kľúč musí začínať s "sk-"
- Minimálna dĺžka 20 znakov
- Aktívny kľúč v OpenAI dashboarde

### CORS chyby
- Použite HTTPS pre produkčné nasadenie
- Skontrolujte nastavenia prehliadača

## 📄 Licencia

MIT License - viď [LICENSE](LICENSE) súbor pre detaily.

## 🤝 Prispievanie

1. Fork repozitára
2. Vytvorte feature branch
3. Commit zmeny
4. Push do branch
5. Vytvorte Pull Request

## 📞 Podpora

Pre otázky a podporu kontaktujte:
- Email: support@urbananalytics.com
- GitHub Issues: [Issues](https://github.com/your-repo/issues)

---

**Urban Analytics** - Moderný B2B nástroj pre analýzu urbanistických projektov s AI technológiami.






