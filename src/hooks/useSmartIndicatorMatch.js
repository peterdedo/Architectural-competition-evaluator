import { useState, useCallback } from 'react';

// Mapa synonym pro všechny indikátory včetně nových F01-F06
const indicatorSynonyms = {
  // Využití území
  U01: ["plocha řešeného území", "celková plocha", "plocha území", "rozloha území"],
  U02: ["zastavěná plocha", "plocha zastavěná", "zastavěná plocha objektů", "plocha budov"],
  U03: ["plochy zelené", "zelené plochy", "plocha zeleně", "modrozelená infrastruktura", "vegetační plochy"],
  U04: ["plochy zpevněné", "zpevněné plochy", "komunikace", "chodníky", "dopravní plochy"],
  U05: ["vodní prvky", "retenční plochy", "vodní plochy", "nádrže", "vodní toky"],
  U06: ["veřejný prostor", "veřejné prostory", "kvalita veřejného prostoru", "veřejně přístupné plochy"],

  // Intenzita využití
  I01: ["HPP", "hrubá podlažní plocha", "podlažní plocha", "celková HPP", "HPP celkem"],
  I02: ["koeficient intenzity", "intenzita využití", "koeficient HPP", "hustota zástavby"],
  I03: ["koeficient zastavění", "zastavění", "míra zastavění", "podíl zastavěné plochy"],

  // Funkční rozvržení - NOVÉ HPP indikátory
  F01: [
    "HPP bydlení",
    "podlažní plocha pro bydlení",
    "plocha bydlení",
    "plocha bytová",
    "bydlení HPP",
    "hrubá podlažní plocha bydlení",
    "HPP bytová",
    "podlažní plocha bydlení",
    "bydlení podlažní plocha"
  ],
  F02: [
    "HPP kanceláře",
    "HPP služby",
    "podlažní plocha pro práci",
    "plocha kanceláří",
    "plocha služeb",
    "HPP práce",
    "plocha administrativní",
    "kanceláře HPP",
    "služby HPP",
    "administrativa HPP"
  ],
  F03: [
    "HPP komerce",
    "HPP obchod",
    "plocha komerce",
    "plocha obchodní",
    "podlažní plocha komerční",
    "HPP retail",
    "komerce HPP",
    "obchod HPP",
    "retail HPP"
  ],
  F04: [
    "HPP veřejná vybavenost",
    "plocha veřejné vybavenosti",
    "plocha školství",
    "plocha kultury",
    "HPP vybavenost",
    "podlažní plocha veřejné vybavenosti",
    "veřejná vybavenost HPP",
    "vybavenost HPP",
    "školy HPP",
    "kultura HPP"
  ],
  F05: [
    "HPP sport",
    "HPP rekreace",
    "plocha pro sport",
    "plocha pro rekreaci",
    "podlažní plocha sport",
    "plocha volný čas",
    "sport HPP",
    "rekreace HPP",
    "volný čas HPP"
  ],
  F06: [
    "HPP technické",
    "HPP zázemí",
    "plocha technická",
    "plocha obslužná",
    "technické prostory",
    "podlažní plocha technického zázemí",
    "technické HPP",
    "zázemí HPP",
    "obslužné prostory HPP"
  ],

  // Doprava a parkování
  D01: ["krytá parkovací stání", "krytá stání", "garážová stání", "podzemní stání"],
  D02: ["venkovní parkovací stání", "venkovní stání", "povrchová stání", "otevřená stání"],
  D03: ["podzemní parkovací stání", "podzemní stání", "garáž", "podzemní garáž"],
  D04: ["poměr parkovacích míst", "parkovací místa k HPP", "parkovací kapacita"],

  // Hustota osídlení
  H01: ["počet obyvatel", "obyvatelé", "počet lidí", "demografická kapacita"],
  H02: ["počet pracovních míst", "pracovní místa", "zaměstnanost", "pracovní kapacita"],
  H03: ["hustota obyvatel", "obytná hustota", "obyvatelé na hektar"],
  H04: ["hustota pracovních míst", "hustota zaměstnanosti", "pracovní místa na hektar"],

  // Nákladová efektivita
  N01: ["investiční náklady", "celkové náklady", "investice", "rozpočet"],
  N02: ["náklad na jednotku", "náklad na m²", "jednotková cena", "cena za m²"],
  N03: ["hodnota území", "tržní hodnota", "odhadovaná hodnota", "budoucí hodnota"],

  // Kvalita veřejného prostoru
  K01: ["podíl zeleně", "zelené plochy", "vegetační pokryv", "zelená infrastruktura"],
  K02: ["modrá infrastruktura", "vodní prvky", "retenční systémy", "vodní hospodaření"],
  K03: ["permeabilita", "prostupnost", "průchodnost", "přístupnost prostoru"],

  // Urbanistická kvalita
  Q01: ["urbanistická čitelnost", "orientace", "přehlednost", "struktura návrhu"],
  Q02: ["funkční diverzita", "sociální diverzita", "rozmanitost funkcí", "smíšené využití"],
  Q03: ["propojení na okolí", "dopravní návaznost", "integrace", "dostupnost MHD"],
  Q04: ["architektonická kvalita", "prostorové řešení", "estetika", "kompozice"],
  Q05: ["udržitelnost", "environmentální integrace", "ekologické řešení", "zelené technologie"]
};

// Normalizace textu pro lepší porovnání
function normalizeText(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // odstranění diakritiky
    .replace(/[^\w\s]/g, '') // odstranění interpunkce
    .replace(/\s+/g, '') // odstranění mezer
    .trim();
}

// Jednoduchá funkce pro výpočet podobnosti (Levenshtein distance)
function calculateSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);
  
  if (s1 === s2) return 1.0;
  if (s1.length === 0 || s2.length === 0) return 0.0;
  
  const matrix = [];
  for (let i = 0; i <= s2.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= s2.length; i++) {
    for (let j = 1; j <= s1.length; j++) {
      if (s2.charAt(i - 1) === s1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  const maxLength = Math.max(s1.length, s2.length);
  return maxLength === 0 ? 1.0 : (maxLength - matrix[s2.length][s1.length]) / maxLength;
}

// Hlavní funkce pro párování názvu indikátoru
function matchIndicatorName(text) {
  if (!text) return null;
  
  const cleanText = normalizeText(text);
  
  // Ignoruj "HPP celkem" - nepatří k funkčním plochám
  if (cleanText.includes('hppcelkem') || cleanText.includes('hppcelk')) {
    return null;
  }
  
  let bestMatch = null;
  let highestScore = 0;
  const threshold = 0.7;

  for (const [id, synonyms] of Object.entries(indicatorSynonyms)) {
    for (const variant of synonyms) {
      const score = calculateSimilarity(text, variant);
      if (score > highestScore && score > threshold) {
        highestScore = score;
        bestMatch = id;
      }
    }
  }

  // Logování pro ladění
  if (process.env.NODE_ENV === 'development' && bestMatch) {
    console.log(`[SmartMatch] Text: "${text}" → ${bestMatch} (${highestScore.toFixed(3)})`);
  }

  return bestMatch;
}

// Funkce pro párování více indikátorů s odstraněním duplicit
function matchMultiple(texts) {
  const matches = new Map();
  
  for (const text of texts) {
    const match = matchIndicatorName(text);
    if (match) {
      // Pokud už máme tento indikátor, ponecháme ten s vyšší podobností
      if (!matches.has(match)) {
        matches.set(match, { text, score: calculateSimilarity(text, text) });
      } else {
        const currentScore = calculateSimilarity(text, text);
        const existingScore = matches.get(match).score;
        if (currentScore > existingScore) {
          matches.set(match, { text, score: currentScore });
        }
      }
    }
  }
  
  return Array.from(matches.entries()).map(([id, { text }]) => ({ id, text }));
}

// Hook pro smart matching
export default function useSmartIndicatorMatch() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const matchIndicators = useCallback(async (extractedTexts) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const matches = matchMultiple(extractedTexts);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[SmartMatch] Nalezené párování:', matches);
      }
      
      return matches;
    } catch (err) {
      setError(err.message);
      console.error('[SmartMatch] Chyba při párování:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Debug logování pro development
  if (process.env.NODE_ENV === 'development') {
    console.table(
      Object.entries(indicatorSynonyms).map(([id, variants]) => ({
        ID: id,
        Synonyma: variants.join(", ")
      }))
    );
  }

  return {
    matchIndicators,
    matchIndicatorName,
    isLoading,
    error
  };
}


