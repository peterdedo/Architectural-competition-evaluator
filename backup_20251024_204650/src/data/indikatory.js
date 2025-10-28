// Import základních indikátorů (20 nejdůležitějších)
import { indikatory as importedIndikatory, kategorie as importedKategorie } from './indikatory_zakladni.js';

// Debug log
console.log('✅ Načteno indikátorů:', importedIndikatory.length);
console.log('✅ Načteno kategorií:', importedKategorie.length);
console.log('📊 Kategorie:', importedKategorie.map(k => k.nazev));

export const indikatory = importedIndikatory;
export const kategorie = importedKategorie;

