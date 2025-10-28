// Debug C17 (PHAP) - thousand separator problém
const text_PHAP = `
parkovací stání celkem 1 156
`;

// Preprocessing
let text = text_PHAP.toLowerCase()
  .replace(/\d\)/g, '') // Odstránime footnote markery
  .replace(/\s+/g, ' ') // Normalizujeme whitespace
  .replace(/m2|m²|ks/g, '') // Odstránime jednotky
  .trim();

console.log('Processed text:');
console.log(text);
console.log('\n');

// Test pattern
const pattern = /parkovací\s+stání\s+celkem/i;
console.log(`Pattern: ${pattern.source}`);

// Test current logic
const match = text.match(new RegExp(`${pattern.source}\\s+([\\d\\s]+)`, 'i'));
console.log(`Match: ${match ? 'FOUND' : 'NOT FOUND'}`);
if (match) {
  console.log(`Numbers: "${match[1]}"`);
  
  const fullMatch = match[1].trim();
  console.log(`Full match: "${fullMatch}"`);
  
  // Test current logic (parkovacie stania)
  if (pattern.source.includes('parkovací') || pattern.source.includes('stání')) {
    const simpleMatch = fullMatch.match(/^(\d+)/);
    if (simpleMatch) {
      console.log(`Current result: ${parseInt(simpleMatch[1], 10)}`);
    }
  }
  
  // Test thousand separator logic
  const firstNumberMatch = fullMatch.match(/^(\d+(?:\s+\d{3})*)/);
  if (firstNumberMatch) {
    const cleanNumber = firstNumberMatch[1].replace(/\s/g, '');
    console.log(`Thousand separator result: ${parseInt(cleanNumber, 10)}`);
  }
}
