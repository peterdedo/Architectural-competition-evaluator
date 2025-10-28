# 📝 Changelog - Urban Analysis App

## [1.0.0] - 2025-01-25 (Konsolidovaná Verzia)

### 🎯 AI Asistent - Konsolidácia
- **KONSOLIDOVANÉ**: Spojenie "AI Analýza návrhů" a "AI Komentáře" do jedného rozhrania
- **MODEL**: Vrátené na GPT-4o-mini (stabilný a funkčný)
- **API**: Opravené parametre (max_tokens namiesto max_completion_tokens)
- **UI**: Zjednodušené rozhranie bez sidebaru a tabov
- **FUNKCIE**: Jednotné tlačidlo pre analýzu aj komentáre

### 🔧 Opravy
- **Skóre**: Opravené zobrazovanie 0% v "Hodnocení návrhů"
- **Icons**: Opravené chyby s CheckCircle a AlertCircle
- **Editácia**: Opravené editovanie názvov návrhov
- **Modal**: Opravené otváranie EditIndicatorModal pre nové hodnoty

### 🎨 UI/UX Vylepšenia
- **Heatmap**: Odstránené percentá a číselné hodnoty (len farebné polia)
- **Toolbar**: Odstránené "AI Weight Manager" tlačidlo
- **Texty**: Odstránené zbytočné popisné texty v toolbar
- **Results**: Vylepšené "Hodnocení vítězných návrhů" s moderným dizajnom

### 📊 Nové Funkcie
- **Inline Edit**: Editovanie názvov návrhov priamo v zozname
- **Circular Score**: Kruhové indikátory skóre
- **Category Weights**: Vizuálne progress bary pre kategórie
- **Expandable Cards**: Rozbaľovacie karty pre indikátory
- **Summary**: Zhrnutie najsilnejších/najslabších oblastí

## [0.9.0] - 2025-01-24 (AI Enhancement)

### 🤖 AI Asistent - Vylepšenia
- **Persona**: Implementovaná "Global Architectural Evaluator" persona
- **Prompts**: Rozšírené a detailnejšie prompty
- **Tokens**: Zvýšené max_tokens na 2000-3000
- **Context**: Pridaný kontext súťaže
- **Error Handling**: Vylepšené chybové hlásenia s HTML formátovaním

### 🔄 API Integrácia
- **OpenAI**: Kompletná integrácia s OpenAI Chat Completions API
- **Models**: Testovanie GPT-5 a GPT-nano (vrátené na GPT-4o-mini)
- **Parameters**: Optimalizované API parametre
- **Fallback**: Mock dáta pri chýbajúcom API kľúči

## [0.8.0] - 2025-01-23 (UI Refinements)

### 🎨 UI Vylepšenia
- **Heatmap**: Odstránené percentá z buniek
- **Toolbar**: Vyčistené rozhranie
- **Results**: Modernizované zobrazovanie výsledkov
- **Icons**: Aktualizované ikony a farby

### 🔧 Technické Opravy
- **Score Calculation**: Opravené výpočty skóre v StepResults
- **Context**: Opravené načítavanie dát z WizardContext
- **State**: Synchronizácia stavu medzi komponentmi

## [0.7.0] - 2025-01-22 (Core Features)

### 📊 Základné Funkcie
- **PDF Upload**: Nahrávanie a spracovanie PDF súborov
- **Indicators**: Správa indikátorov a kritérií
- **Scoring**: Automatické výpočty skóre
- **Comparison**: Porovnávanie návrhov
- **Export**: PDF export výsledkov

### 🏗️ Architektúra
- **React 18**: Moderný React s hooks
- **Vite**: Rýchly build systém
- **Tailwind**: Utility-first CSS
- **Context API**: State management
- **Custom Hooks**: Znovupoužiteľná logika

## [0.6.0] - 2025-01-21 (Initial Release)

### 🚀 Prvé vydanie
- **Základná funkcionalita**: Upload, hodnotenie, porovnávanie
- **UI Framework**: React + Tailwind CSS
- **Data Management**: Local storage
- **Basic AI**: Základná AI integrácia

---

## 🔮 Plánované Funkcie

### V2.0.0 - Advanced Features
- [ ] **Multi-language Support**: Angličtina, slovenčina
- [ ] **Advanced Analytics**: Detailnejšie štatistiky
- [ ] **Collaboration**: Sdílenie projektov
- [ ] **Templates**: Prednastavené šablóny
- [ ] **API Integration**: REST API pre externé systémy

### V2.1.0 - AI Enhancements
- [ ] **Custom Models**: Vlastné AI modely
- [ ] **Training Data**: Špecifické trénovacie dáta
- [ ] **Batch Processing**: Hromadné spracovanie
- [ ] **AI Insights**: Prediktívna analýza

### V2.2.0 - Enterprise Features
- [ ] **User Management**: Správa používateľov
- [ ] **Role-based Access**: Rôzne úrovne prístupu
- [ ] **Audit Logs**: Záznam aktivít
- [ ] **Backup/Restore**: Zálohovanie dát

---

## 🐛 Známe Problémy

### Menšie
- [ ] PowerShell problémy s špeciálnymi znakmi v ceste
- [ ] Niekedy pomalé načítavanie veľkých PDF súborov
- [ ] AI odpovede môžu byť občas generické

### Riešené
- ✅ CheckCircle icon error
- ✅ 0% skóre v výsledkoch
- ✅ EditIndicatorModal pre nové hodnoty
- ✅ GPT-nano model error

---

## 📊 Štatistiky Verzie

### Kód
- **Súbory**: 25+ komponentov
- **Riadky kódu**: 5000+ riadkov
- **Hooks**: 6 custom hooks
- **Context**: 1 hlavný context

### Funkcie
- **Upload**: PDF nahrávanie
- **AI**: 4 AI funkcie
- **Export**: PDF generovanie
- **UI**: 15+ komponentov

### Výkon
- **Build čas**: < 30s
- **Dev server**: < 5s
- **Bundle size**: < 2MB
- **Lighthouse**: 90+ skóre

---

**Posledná aktualizácia**: 25. január 2025  
**Verzia**: 1.0.0 (Konsolidovaná)  
**Status**: Stabilná a funkčná


