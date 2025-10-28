// Kontrola chýbajúcich dát C05, C14
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

console.log('Hľadáme C05 (plochy ostatní):');
const c05Match = text_CHKAU.match(/plochy\s+ostatní/i);
console.log(`C05: ${c05Match ? 'FOUND' : 'NOT FOUND'}`);
if (c05Match) {
  console.log(`Match: "${c05Match[0]}"`);
}

console.log('\nHľadáme C14 (parkovací stání krytá):');
const c14Match = text_CHKAU.match(/parkovací\s+stání\s+krytá/i);
console.log(`C14: ${c14Match ? 'FOUND' : 'NOT FOUND'}`);
if (c14Match) {
  console.log(`Match: "${c14Match[0]}"`);
}

console.log('\nCelý text CHKAU:');
console.log(text_CHKAU);
