// Test opravy C03, C04
const text_CHKAU = `
z toho plochy zelené (zatravněné nezpev. plochy vč. zelených pásů apod.) 13 650 1 500
z toho plochy zpevněné (komunikace, chodníky, náměstí) 14 390 2 500
`;

// Preprocessing
let text = text_CHKAU.toLowerCase()
  .replace(/\d\)/g, '') // Odstránime footnote markery
  .replace(/\s+/g, ' ') // Normalizujeme whitespace
  .replace(/m2|m²|ks/g, '') // Odstránime jednotky
  .trim();

console.log('Processed text:');
console.log(text);
console.log('\n');

// Test patterns
const patterns = {
  C03: /z\s+toho\s+plochy\s+zelené/i,
  C04: /z\s+toho\s+plochy\s+zpevněné/i,
};

Object.entries(patterns).forEach(([key, pattern]) => {
  console.log(`Testing ${key}:`);
  
  // Test new logic
  let regexPattern;
  if (pattern.source.includes('zelené') || pattern.source.includes('zpevněné')) {
    // Pre C03, C04 - hľadáme pattern, potom zátvorky, potom čísla
    regexPattern = new RegExp(`${pattern.source}[\\s\\S]*?\\)\\s+([\\d\\s]+)`, 'i');
  } else {
    // Pre ostatné - štandardný prístup
    regexPattern = new RegExp(`${pattern.source}\\s+([\\d\\s]+)`, 'i');
  }
  
  const match = text.match(regexPattern);
  console.log(`  Match: ${match ? 'FOUND' : 'NOT FOUND'}`);
  if (match) {
    console.log(`  Full match: "${match[0]}"`);
    console.log(`  Numbers: "${match[1]}"`);
    
    // Test extraction
    const fullMatch = match[1].trim();
    const firstNumberMatch = fullMatch.match(/^(\d+(?:\s+\d{3})*)/);
    if (firstNumberMatch) {
      const cleanNumber = firstNumberMatch[1].replace(/\s/g, '');
      console.log(`  Extracted: ${parseInt(cleanNumber, 10)}`);
    }
  }
  console.log('');
});
