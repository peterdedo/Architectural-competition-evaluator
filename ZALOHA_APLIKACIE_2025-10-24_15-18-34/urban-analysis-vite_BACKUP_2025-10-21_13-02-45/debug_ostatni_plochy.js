// Debug script pre "Plochy ostatní"
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

function checkOstatniPlochy(text, name) {
  console.log(`\n=== ${name} ===`);
  
  // Hľadáme "plochy ostatní" alebo podobné výrazy
  const patterns = [
    /plochy\s+ostatní/i,
    /ostatní\s+plochy/i,
    /vodní\s+plochy/i,
    /ostatní/i,
    /vodní/i
  ];
  
  patterns.forEach((pattern, i) => {
    const match = text.match(pattern);
    console.log(`Pattern ${i+1} (${pattern.source}): ${match ? 'FOUND' : 'NOT FOUND'}`);
    if (match) {
      console.log(`  Match: "${match[0]}"`);
    }
  });
  
  // Vypočítame "ostatní plochy" ako rozdiel
  const totalMatch = text.match(/plocha\s+řešeného\s+území\s+(\d+)/i);
  const zastavenaMatch = text.match(/z\s+toho\s+zastavěná\s+plocha\s+objekty\s+(\d+)/i);
  const zeleneMatch = text.match(/z\s+toho\s+plochy\s+zelené[^0-9]*(\d+)/i);
  const zpevneneMatch = text.match(/z\s+toho\s+plochy\s+zpevněné[^0-9]*(\d+)/i);
  
  if (totalMatch && zastavenaMatch && zeleneMatch && zpevneneMatch) {
    const total = parseInt(totalMatch[1]);
    const zastavena = parseInt(zastavenaMatch[1]);
    const zelene = parseInt(zeleneMatch[1]);
    const zpevnene = parseInt(zpevneneMatch[1]);
    
    const ostatni = total - zastavena - zelene - zpevnene;
    console.log(`\nVýpočet ostatních ploch:`);
    console.log(`  Celková plocha: ${total}`);
    console.log(`  Zastavěná: ${zastavena}`);
    console.log(`  Zelené: ${zelene}`);
    console.log(`  Zpevněné: ${zpevnene}`);
    console.log(`  OSTATNÍ: ${ostatni} (${total} - ${zastavena} - ${zelene} - ${zpevnene})`);
  }
}

checkOstatniPlochy(text_CHKAU, 'CHKAU');
checkOstatniPlochy(text_PHAP, 'PHAP');
