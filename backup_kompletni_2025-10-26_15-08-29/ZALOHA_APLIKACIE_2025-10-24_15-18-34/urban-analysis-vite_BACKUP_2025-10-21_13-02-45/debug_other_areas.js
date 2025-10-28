// Debug script pre "Plochy ostatní" problém
console.log('🔍 Testovanie Vision API promptu pre "Plochy ostatní"');

// Simulujeme Vision API odpoveď s "plochy ostatní"
const mockVisionResponse = `
{
  "area_total": 40979,
  "built_up_area": 17580,
  "green_areas": 8914,
  "blue_areas": 14178,
  "other_areas": 307,
  "gfa_total": 98440,
  "basement_area": 24447,
  "residential_gfa": 45554,
  "commercial_gfa": 5673,
  "office_gfa": 34788,
  "public_gfa": 2384,
  "technical_gfa": 140,
  "parking_gfa": 34348,
  "covered_parking": 334,
  "outdoor_parking": 95,
  "underground_parking": 727,
  "total_parking": 1156
}
`;

console.log('📥 Mock Vision API odpoveď:', mockVisionResponse);

// Test parsovania
try {
  const parsed = JSON.parse(mockVisionResponse);
  console.log('✅ Parsovaný JSON:', parsed);
  
  // Test mapovania
  const mapping = {
    'area_total': 'C01',
    'built_up_area': 'C02', 
    'green_areas': 'C03',
    'blue_areas': 'C04',
    'other_areas': 'C05',
    'gfa_total': 'C06',
    'basement_area': 'C07',
    'residential_gfa': 'C08',
    'commercial_gfa': 'C09',
    'office_gfa': 'C10',
    'public_gfa': 'C11',
    'technical_gfa': 'C12',
    'parking_gfa': 'C13',
    'covered_parking': 'C14',
    'outdoor_parking': 'C15',
    'underground_parking': 'C16',
    'total_parking': 'C17'
  };
  
  const mappedData = {};
  Object.entries(mapping).forEach(([apiKey, indicatorId]) => {
    if (parsed[apiKey] !== null && parsed[apiKey] !== undefined) {
      mappedData[indicatorId] = {
        value: parsed[apiKey],
        source: 'PDF dokument'
      };
      console.log(`✅ Mapované ${apiKey} → ${indicatorId}: ${parsed[apiKey]}`);
    } else {
      console.log(`❌ Chýba ${apiKey} v extrahovaných dátach`);
    }
  });
  
  console.log('📊 Finálne mapované dáta:', mappedData);
  console.log('🎯 C05 (Plochy ostatní):', mappedData.C05);
  
} catch (error) {
  console.error('❌ Chyba pri parsovaní:', error);
}
