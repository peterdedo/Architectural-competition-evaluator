# 🧪 Test Prompty pre AI Weight Manager v2.3

## 📋 Cieľ testovania
Overiť, že AI Weight Manager správne reaguje na rôzne kontexty soutěže a navrhuje realistické váhy.

---

## ✅ Test 1: Rezidenční projekt s důrazem na zeleň

### Kontext:
```
Městská soutěž zaměřená na rekreační parky a veřejný prostor s důrazem na udržitelnost a zeleň
```

### Očekávaný výsledek:
- **Plochy zelené**: vysoká váha (20-30%)
- **Plochy zpevněné**: nižší váha (5-10%)
- **Parkování**: nižší váha (10-15%)
- **Veřejná vybavenost**: vyšší váha (15-20%)

---

## ✅ Test 2: Komerční centrum / Business park

### Kontext:
```
Komerční projekt pro administrativní budovy a kanceláře s důrazem na parkování a dostupnost
```

### Očekávaný výsledek:
- **Parkování**: vysoká váha (25-35%)
- **Plochy zpevněné**: vyšší váha (15-20%)
- **HPP komerční**: vysoká váha (20-25%)
- **Plochy zelené**: nižší váha (10-15%)

---

## ✅ Test 3: Brownfield revitalizace

### Kontext:
```
Revitalizace brownfieldu s důrazem na smíšené využití a veřejný prostor
```

### Očekávaný výsledek:
- **Smíšené využití** (HPP bydlení + komerční + služby): vyvážené váhy
- **Plochy veřejná vybavenost**: vyšší váha (15-20%)
- **Plocha řešeného území**: vyšší váha (15-20%)
- **Vyvážené rozložení** všech kategorií

---

## ✅ Test 4: Rezidenční čtvrť

### Kontext:
```
Nová rezidenční čtvrť pro rodiny s dětmi s důrazem na bydlení a bezpečnost
```

### Očekávaný výsledek:
- **HPP bydlení**: vysoká váha (30-40%)
- **Plochy zelené**: vyšší váha (20-25%)
- **Parkování**: střední váha (15-20%)
- **HPP komerční**: nižší váha (5-10%)

---

## ✅ Test 5: Univerzitní kampus

### Kontext:
```
Univerzitní kampus s důrazem na studium, sociální prostor a kulturní aktivity
```

### Očekávaný výsledek:
- **Veřejná vybavenost**: vysoká váha (25-30%)
- **Plochy zelené**: vyšší váha (20-25%)
- **HPP služby**: vyšší váha (15-20%)
- **Parkování**: nižší váha (10-15%)

---

## 🔧 Postup testování

1. **Otevřete aplikaci** na http://localhost:5182/
2. **Přejděte na krok "Výběr kritérií"**
3. **V sekci AI Weight Manager zadejte testovací kontext**
4. **Klikněte na "Získat AI doporučení"**
5. **Zkontrolujte, zda AI vrátil realistické váhy**
6. **Ověřte, že se váhy okamžitě projevily v:**
   - Nastavení vah (StepWeights)
   - Hodnocení vítězných návrhů
   - Porovnání návrhů
   - Heatmapě

---

## 📊 Kritéria úspěšnosti

✅ **AI reaguje na kontext** - váhy se mění podle typu projektu
✅ **Váhy jsou realistické** - součet vah kategorií = 100%
✅ **Váhy se okamžitě aplikují** - viditelné v celé aplikaci
✅ **UI se aktualizuje** - grafy a tabulky se přepočítají
✅ **Žádné chyby** - konzole je čistá, žádné NaN nebo undefined

---

## 🎯 Označení verze

Po úspěšném testu označte aplikaci jako:

**🧠 Urban Analytics 2.3 – Context-Aware AI Weight Manager (Stable)**

---

## 💡 Tip pro ladění

Pokud AI nevrací správné výsledky:
1. Zkontrolujte API klíč v localStorage
2. Zkontrolujte console.log v DevTools
3. Ověřte formát JSON odpovědi od AI
4. Zkontrolujte, zda se váhy ukládají do WizardContext





