// Finálny test všetkých oprav
const extractDataWithRegexFromText = (pdfText) => {
  // Preprocessing textu
  let text = pdfText.toLowerCase()
    .replace(/\d\)/g, '') // Odstránime footnote markery ako 1), 2), 3)
    .replace(/\s+/g, ' ') // Normalizujeme whitespace
    .replace(/m2|m²|ks/g, '') // Odstránime jednotky
    .trim();

  // Funkcia na extrakciu hodnoty - berie len PRVÉ číslo na riadku
  const extractValue = (pattern) => {
    // Hľadáme pattern nasledovaný číslom (môže mať medzery ako thousand separators)
    // Pre C03, C04 - ignorujeme text v zátvorkách
    let regexPattern;
    if (pattern.source.includes('zelené') || pattern.source.includes('zpevněné')) {
      // Pre C03, C04 - hľadáme pattern, potom zátvorky, potom čísla
      regexPattern = new RegExp(`${pattern.source}[\\s\\S]*?\\)\\s+([\\d\\s]+)`, 'i');
    } else {
      // Pre ostatné - štandardný prístup
      regexPattern = new RegExp(`${pattern.source}\\s+([\\d\\s]+)`, 'i');
    }
    
    const match = text.match(regexPattern);
    if (!match) return null;
    
    // Berieme len prvé číslo, ignorujeme zvyšok
    const fullMatch = match[1].trim();
    
    // Pre parkovacie stania a podobné prípady - berieme len prvé číslo
    // ALE pre "celkem" - berieme thousand separators
    if ((pattern.source.includes('parkovací') || pattern.source.includes('stání')) && 
        !pattern.source.includes('celkem')) {
      const simpleMatch = fullMatch.match(/^(\d+)/);
      if (simpleMatch) {
        return parseInt(simpleMatch[1], 10);
      }
    }
    
    // Pre ostatné prípady - hľadáme thousand separators (napr. "40 690")
    const firstNumberMatch = fullMatch.match(/^(\d+(?:\s+\d{3})*)/);
    if (firstNumberMatch) {
      // Vyčistíme číslo od medzier (thousand separators)
      const cleanNumber = firstNumberMatch[1].replace(/\s/g, '');
      return parseInt(cleanNumber, 10);
    }
    
    // Fallback - len prvé číslo
    const simpleMatch = fullMatch.match(/^(\d+)/);
    if (simpleMatch) {
      return parseInt(simpleMatch[1], 10);
    }
    
    return null;
  };

  // Vylepšené patterns pre nové indikátory - špecifické pre PDF formát
  const patterns = {
    // Bilance ploch řešeného území
    C01: /plocha\s+řešeného\s+území/i,
    C02: /z\s+toho\s+zastavěná\s+plocha\s+objekty/i,
    C03: /z\s+toho\s+plochy\s+zelené/i,
    C04: /z\s+toho\s+plochy\s+zpevněné/i,
    C05: /plochy\s+ostatní/i,
    
    // Bilance HPP dle funkce
    C06: /celková\s+plocha\s+nadzemních\s+podlaží/i,
    C07: /celková\s+plocha\s+podzemních\s+podlaží/i,
    C08: /hpp\s+bydlení/i,
    C09: /hpp\s+komerce\s+\/\s+obchod/i,
    C10: /hpp\s+kanceláře\s+\/\s+služby/i,
    C11: /hpp\s+veřejná\s+vybavenost/i,
    C12: /hpp\s+technologie\s+\/\s+chodby\s+\/\s+zázemí\s+v\s+objektech/i,
    C13: /hpp\s+parkování\s+\/\s+komunikace\s+v\s+objektech/i,
    
    // Bilance parkovacích ploch
    C14: /parkovací\s+stání\s+krytá\s+\(nadzemní\)/i,
    C15: /parkovací\s+stání\s+venkovní/i,
    C16: /parkovací\s+stání\s+podzemní/i,
    C17: /parkovací\s+stání\s+celkem/i
  };

  const data = {};
  
  // Extrahujeme hodnoty pre každý indikátor
  for (const [key, regex] of Object.entries(patterns)) {
    const val = extractValue(regex);
    if (val) {
      data[key] = val;
      console.log(`✅ Nalezeno ${key}: ${val}`);
    } else {
      console.warn("Missing:", key);
    }
  }
  
  console.log('Regex extrahované data:', data);
  return { success: true, data };
};

// Testovací dáta
const text_CHKAU = `
BILANCE PLOCH ŘEŠENÉHO ÚZEMÍ m2 odhad nákladů za m2
Plocha řešeného území 40 690
z toho zastavěná plocha objekty 12 650
z toho plochy zelené (zatravněné nezpev. plochy vč. zelených pásů apod.) 13 650 1 500
z toho plochy zpevněné (komunikace, chodníky, náměstí) 14 390 2 500
Celková plocha nadzemních podlaží 86 300 50 000
Celková plocha podzemních podlaží 26 500 35 000
HPP bydlení 51 000 45 000
HPP komerce / obchod 2 200 50 000
HPP kanceláře / služby 24 300 50 000
HPP veřejná vybavenost 1 300 45 000
HPP technologie / chodby / zázemí v objektech 7 500 25 000
HPP parkování / komunikace v objektech 23 000 20 000
parkovací stání krytá (nadzemní) 0 0
parkovací stání venkovní 40 100 000
parkovací stání podzemní 795 700 000
parkovací stání celkem 835
TABULKA BILANCÍ
`;

const text_PHAP = `
BILANCE PLOCH ŘEŠENÉHO ÚZEMÍ m2 odhad nákladů za m2
Plocha řešeného území 40 979
z toho zastavěná plocha objekty 17 580
z toho plochy zelené (zatravněné nezpev. plochy vč. zelených pásů apod.) 8 914 2 400
z toho plochy zpevněné (komunikace, chodníky, náměstí) 14 178 5 800
Celková plocha nadzemních podlaží 98 440 41 998 1)
Celková plocha podzemních podlaží 24 447 25 000
HPP bydlení 45 554 36 000
HPP komerce / obchod 5 673 50 000
HPP kanceláře / služby 34 788 48 000
HPP veřejná vybavenost 2 384 50 000
HPP technologie / chodby / zázemí v objektech 140 42 000
HPP parkování / komunikace v objektech 34 348 25 000
parkovací stání krytá (nadzemní) 334 210 000
parkovací stání venkovní 95 70 000
parkovací stání podzemní 727 850 000
parkovací stání celkem 1 156
TABULKA BILANCÍ
`;

// Očakávané výsledky pre porovnanie
const expected_CHKAU = {
  C01: 40690,  // Plocha řešeného území
  C02: 12650,  // zastavěná plocha objekty
  C03: 13650,  // plochy zelené
  C04: 14390,  // plochy zpevněné
  C06: 86300,  // Celková plocha nadzemních podlaží
  C07: 26500,  // Celková plocha podzemních podlaží
  C08: 51000,  // HPP bydlení
  C09: 2200,   // HPP komerce / obchod
  C10: 24300,  // HPP kanceláře / služby
  C11: 1300,   // HPP veřejná vybavenost
  C12: 7500,   // HPP technologie / chodby / zázemí v objektech
  C13: 23000,  // HPP parkování / komunikace v objektech
  C14: 0,      // parkovací stání krytá (nadzemní)
  C15: 40,     // parkovací stání venkovní
  C16: 795,    // parkovací stání podzemní
  C17: 835     // parkovací stání celkem
};

const expected_PHAP = {
  C01: 40979,  // Plocha řešeného území
  C02: 17580,  // zastavěná plocha objekty
  C03: 8914,   // plochy zelené
  C04: 14178,  // plochy zpevněné
  C06: 98440,  // Celková plocha nadzemních podlaží
  C07: 24447,  // Celková plocha podzemních podlaží
  C08: 45554,  // HPP bydlení
  C09: 5673,   // HPP komerce / obchod
  C10: 34788,  // HPP kanceláře / služby
  C11: 2384,   // HPP veřejná vybavenost
  C12: 140,    // HPP technologie / chodby / zázemí v objektech
  C13: 34348,  // HPP parkování / komunikace v objektech
  C14: 334,    // parkovací stání krytá (nadzemní)
  C15: 95,     // parkovací stání venkovní
  C16: 727,    // parkovací stání podzemní
  C17: 1156    // parkovací stání celkem
};

// Testovanie
console.log('🧪 FINAL TESTING CHKAU (České Budějovice)');
console.log('==========================================');
const result_CHKAU = extractDataWithRegexFromText(text_CHKAU);

console.log('\n🧪 FINAL TESTING PHAP (E.ON)');
console.log('==============================');
const result_PHAP = extractDataWithRegexFromText(text_PHAP);

// Porovnanie výsledkov
console.log('\n📊 COMPARISON RESULTS');
console.log('=====================');

const compareResults = (actual, expected, name) => {
  console.log(`\n${name}:`);
  let correct = 0;
  let total = 0;
  
  for (const [key, expectedValue] of Object.entries(expected)) {
    total++;
    const actualValue = actual.data[key];
    if (actualValue === expectedValue) {
      console.log(`✅ ${key}: ${actualValue} (expected: ${expectedValue})`);
      correct++;
    } else {
      console.log(`❌ ${key}: ${actualValue} (expected: ${expectedValue})`);
    }
  }
  
  console.log(`\nAccuracy: ${correct}/${total} (${Math.round(correct/total*100)}%)`);
  return { correct, total };
};

const chkauStats = compareResults(result_CHKAU, expected_CHKAU, 'CHKAU');
const phapStats = compareResults(result_PHAP, expected_PHAP, 'PHAP');

console.log('\n🎯 OVERALL SUMMARY');
console.log('==================');
console.log(`CHKAU: ${chkauStats.correct}/${chkauStats.total} (${Math.round(chkauStats.correct/chkauStats.total*100)}%)`);
console.log(`PHAP: ${phapStats.correct}/${phapStats.total} (${Math.round(phapStats.correct/phapStats.total*100)}%)`);
console.log(`Total: ${chkauStats.correct + phapStats.correct}/${chkauStats.total + phapStats.total} (${Math.round((chkauStats.correct + phapStats.correct)/(chkauStats.total + phapStats.total)*100)}%)`);
