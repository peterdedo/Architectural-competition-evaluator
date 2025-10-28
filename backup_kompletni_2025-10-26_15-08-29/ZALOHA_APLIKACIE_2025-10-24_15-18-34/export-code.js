import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Funkce pro rekurzivní procházení adresářů
function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      // Přeskočíme node_modules a .git
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
        arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
      }
    } else {
      // Přidáme pouze relevantní soubory
      const ext = path.extname(file);
      if (['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json', '.md', '.txt'].includes(ext)) {
        arrayOfFiles.push(fullPath);
      }
    }
  });

  return arrayOfFiles;
}

// Funkce pro export kódu
function exportCodeToTxt() {
  const projectRoot = __dirname;
  const files = getAllFiles(projectRoot);
  
  let exportContent = '';
  
  // Header
  exportContent += '='.repeat(80) + '\n';
  exportContent += 'URBAN ANALYTICS - EXPORT KÓDU APLIKACE\n';
  exportContent += '='.repeat(80) + '\n';
  exportContent += `Datum exportu: ${new Date().toLocaleString('cs-CZ')}\n`;
  exportContent += `Počet souborů: ${files.length}\n`;
  exportContent += '='.repeat(80) + '\n\n';
  
  // Projdeme všechny soubory
  files.forEach((filePath, index) => {
    const relativePath = path.relative(projectRoot, filePath);
    const ext = path.extname(filePath);
    
    // Přeskočíme některé soubory
    if (relativePath.includes('node_modules') || 
        relativePath.includes('.git') || 
        relativePath.includes('dist') ||
        relativePath.includes('export-code.js')) {
      return;
    }
    
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      
      exportContent += `\n${'='.repeat(60)}\n`;
      exportContent += `SOUBOR ${index + 1}: ${relativePath}\n`;
      exportContent += `Typ: ${ext || 'bez přípony'}\n`;
      exportContent += `Velikost: ${content.length} znaků\n`;
      exportContent += `${'='.repeat(60)}\n\n`;
      
      // Přidáme obsah souboru
      exportContent += content;
      exportContent += '\n\n';
      
    } catch (error) {
      exportContent += `\n${'='.repeat(60)}\n`;
      exportContent += `SOUBOR ${index + 1}: ${relativePath}\n`;
      exportContent += `CHYBA: ${error.message}\n`;
      exportContent += `${'='.repeat(60)}\n\n`;
    }
  });
  
  // Footer
  exportContent += '\n' + '='.repeat(80) + '\n';
  exportContent += 'KONEC EXPORTU KÓDU - Urban Analytics\n';
  exportContent += '='.repeat(80) + '\n';
  
  // Uložíme do souboru
  const outputPath = path.join(projectRoot, `urban-analytics-code-export-${new Date().toISOString().split('T')[0]}.txt`);
  fs.writeFileSync(outputPath, exportContent, 'utf8');
  
  console.log(`✅ Kód aplikace byl exportován do: ${outputPath}`);
  console.log(`📊 Celkem souborů: ${files.length}`);
  console.log(`📝 Velikost exportu: ${(exportContent.length / 1024).toFixed(2)} KB`);
}

// Spustíme export
exportCodeToTxt();
