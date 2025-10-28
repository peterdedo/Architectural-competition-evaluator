# Changelog

Všetky významné zmeny v tomto projekte budú zdokumentované v tomto súbore.

Formát je založený na [Keep a Changelog](https://keepachangelog.com/sk/1.0.0/),
a tento projekt dodržiava [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Pridané
- Implementácia ErrorBoundary do hlavného React stromu
- Optimalizácia výpočtových modulov s useMemo a useCallback
- Fallback a auditní log pre AI Weight Manager
- Vylepšená responzivita a prístupnosť
- Podpora pre prefers-reduced-motion
- Touch-friendly interaktívne elementy
- Enhanced accessibility features
- Skip links pre klávesnicovú navigáciu
- Screen reader podpora
- Vysoký kontrast mode
- Form validation states
- Loading states
- Enhanced button states

### Zmenené
- Aktualizované package.json s novými skriptmi
- Vytvorený .nvmrc s Node.js 18.19.1
- Aktualizovaný README.md s novými sekciami
- Optimalizované WizardContext s useCallback a useMemo
- Vylepšené AI Weight Manager s preview a potvrdením
- Opravené Tailwind @apply chyby
- Minifikovaný CSS

### Opravené
- Guard clauses pre numerické hodnoty v computeScores
- Optimalizácia re-renderov v WizardContext
- Fallback handling v AI Weight Manager
- Error handling s lepším logovaním
- Accessibility improvements

## [2025-01-21] - Optimalizácie po zálohe

### Pridané
- CHANGELOG.md pre sledovanie zmien
- .nvmrc pre správnu verziu Node.js
- Testovacie skripty v package.json
- Formátovacie skripty
- Type checking skripty

### Zmenené
- Aktualizované README.md s novými sekciami
- Vylepšené package.json s novými závislosťami
- Optimalizované CSS s prístupnostnými vylepšeniami

### Technické detaily
- Node.js verzia: 18.19.1
- Tailwind CSS minifikácia
- Enhanced accessibility features
- Reduced motion support
- Touch-friendly design
- High contrast mode
- Screen reader support

## [2025-10-24] - Záložná verzia

### Pridané
- Záložná verzia aplikácie
- Dokumentácia zmien
- Stabilizácia funkcionalít

### Zmenené
- Centralizácia stavu v WizardContext
- AI Weight Manager integrácia
- Normalizácia skóre
- Heatmap rendering fixes

### Opravené
- NaN hodnoty v normalizácii
- Heatmap rendering issues
- AI Weight Manager synchronizácia
- Výpočtové moduly zjednotenie

---

## Typy zmien

- **Pridané** pre nové funkcie
- **Zmenené** pre zmeny v existujúcich funkciách
- **Zastarané** pre funkcie, ktoré budú odstránené v budúcich verziách
- **Odstránené** pre funkcie, ktoré boli odstránené v tejto verzii
- **Opravené** pre opravy chýb
- **Bezpečnosť** pre opravy bezpečnostných problémov
