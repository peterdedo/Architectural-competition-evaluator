// Detailná analýza C03, C04
const text_CHKAU = `
z toho plochy zelené (zatravněné nezpev. plochy vč. zelených pásů apod.) 13 650 1 500
z toho plochy zpevněné (komunikace, chodníky, náměstí) 14 390 2 500
`;

const text_PHAP = `
z toho plochy zelené (zatravněné nezpev. plochy vč. zelených pásů apod.) 8 914 2 400
z toho plochy zpevněné (komunikace, chodníky, náměstí) 14 178 5 800
`;

function debugText(text, name) {
  console.log(`\n=== ${name} ===`);
  
  // Preprocessing
  let processed = text.toLowerCase()
    .replace(/\d\)/g, '') // Odstránime footnote markery
    .replace(/\s+/g, ' ') // Normalizujeme whitespace
    .replace(/m2|m²|ks/g, '') // Odstránime jednotky
    .trim();
  
  console.log('Original text:');
  console.log(text);
  console.log('\nProcessed text:');
  console.log(processed);
  
  // Test patterns
  const patterns = {
    C03: /z\s+toho\s+plochy\s+zelené/i,
    C04: /z\s+toho\s+plochy\s+zpevněné/i,
  };
  
  Object.entries(patterns).forEach(([key, pattern]) => {
    console.log(`\n${key}:`);
    console.log(`  Pattern: ${pattern.source}`);
    
    // Test exact match
    const exactMatch = processed.match(pattern);
    console.log(`  Exact match: ${exactMatch ? 'FOUND' : 'NOT FOUND'}`);
    
    // Test with numbers
    const matchWithNumbers = processed.match(new RegExp(`${pattern.source}\\s+([\\d\\s]+)`, 'i'));
    console.log(`  With numbers: ${matchWithNumbers ? 'FOUND' : 'NOT FOUND'}`);
    if (matchWithNumbers) {
      console.log(`  Numbers: "${matchWithNumbers[1]}"`);
    }
    
    // Test alternative patterns
    const altPatterns = [
      /z\s+toho\s+plochy\s+zelené/i,
      /plochy\s+zelené/i,
      /zelené/i
    ];
    
    altPatterns.forEach((altPattern, i) => {
      const altMatch = processed.match(altPattern);
      console.log(`  Alt pattern ${i+1}: ${altMatch ? 'FOUND' : 'NOT FOUND'}`);
      if (altMatch) {
        console.log(`    Match: "${altMatch[0]}"`);
      }
    });
  });
}

debugText(text_CHKAU, 'CHKAU');
debugText(text_PHAP, 'PHAP');
