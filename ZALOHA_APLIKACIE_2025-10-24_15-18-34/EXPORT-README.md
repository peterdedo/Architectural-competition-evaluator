# Urban Analytics - Export Kódu

## 📁 Exportované soubory

Vytvořeny byly dva export soubory:

### 1. Kompletní export
- **Soubor**: `urban-analytics-code-export-2025-10-20.txt`
- **Velikost**: 370.78 KB
- **Soubory**: 28
- **Obsah**: Všechny soubory projektu včetně konfigurace

### 2. Rychlý export
- **Soubor**: `urban-analytics-quick-export-2025-10-20.txt`
- **Velikost**: 120.67 KB
- **Soubory**: 22
- **Obsah**: Pouze hlavní soubory aplikace

## 🚀 Jak spustit export

### Kompletní export
```bash
node export-code.js
```

### Rychlý export
```bash
node quick-export.js
```

## 📋 Obsah exportu

### Hlavní soubory
- `package.json` - Závislosti a skripty
- `vite.config.js` - Vite konfigurace
- `tailwind.config.js` - Tailwind CSS konfigurace
- `index.html` - HTML template
- `src/main.jsx` - Entry point
- `src/App.jsx` - Hlavní komponenta

### Komponenty
- `Header.jsx` - Horní navigace
- `Sidebar.jsx` - Boční navigace
- `StepConfig.jsx` - Konfigurace API
- `StepUpload.jsx` - Nahrávání PDF
- `StepCriteria.jsx` - Výběr kritérií
- `StepResults.jsx` - Výsledky analýzy
- `StepComparison.jsx` - Porovnání projektů
- `ApiTest.jsx` - Test OpenAI API
- `ExportApp.jsx` - Export dat

### Hooks
- `useVisionAnalyzer.js` - Vision AI analýza
- `usePdfProcessor.js` - PDF zpracování
- `useToast.js` - Toast notifikace
- `useLocalStorage.js` - Lokální úložiště

### Data
- `indikatory.js` - Definice indikátorů

## 🔧 Instalace a spuštění

1. **Instalace závislostí**
   ```bash
   npm install
   ```

2. **Spuštění vývojového serveru**
   ```bash
   npm run dev
   ```

3. **Build pro produkci**
   ```bash
   npm run build
   ```

## 📝 Poznámky

- Aplikace používá Vite jako build tool
- Tailwind CSS pro styling
- OpenAI Vision API pro analýzu PDF
- Recharts pro grafy
- PDF.js pro zpracování PDF

## 🎯 Funkce

- ✅ Konfigurace OpenAI API s testem
- ✅ Nahrávání PDF dokumentů
- ✅ Vision AI analýza dokumentů
- ✅ Výběr indikátorů pro porovnání
- ✅ Dynamické vyhledávání vybraných indikátorů
- ✅ Tabulky a grafy pro porovnání
- ✅ Export dat do TXT
- ✅ Responzivní design
- ✅ Moderní UI/UX

## 📞 Podpora

Pro otázky nebo problémy kontaktujte vývojáře.






