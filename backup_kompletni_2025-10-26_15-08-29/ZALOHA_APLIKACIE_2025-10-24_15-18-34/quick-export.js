import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rychlý export pouze hlavních souborů
function quickExport() {
  const mainFiles = [
    'package.json',
    'vite.config.js',
    'tailwind.config.js',
    'postcss.config.js',
    'index.html',
    'src/main.jsx',
    'src/App.jsx',
    'src/index.css',
    'src/data/indikatory.js',
    'src/components/Header.jsx',
    'src/components/Sidebar.jsx',
    'src/components/StepConfig.jsx',
    'src/components/StepUpload.jsx',
    'src/components/StepCriteria.jsx',
    'src/components/StepResults.jsx',
    'src/components/StepComparison.jsx',
    'src/components/ApiTest.jsx',
    'src/components/ExportApp.jsx',
    'src/hooks/useVisionAnalyzer.js',
    'src/hooks/usePdfProcessor.js',
    'src/hooks/useToast.js',
    'src/hooks/useLocalStorage.js'
  ];

  let content = '';
  
  // Header
  content += '='.repeat(80) + '\n';
  content += 'URBAN ANALYTICS - RYCHLÝ EXPORT KÓDU\n';
  content += '='.repeat(80) + '\n';
  content += `Datum: ${new Date().toLocaleString('cs-CZ')}\n`;
  content += `Soubory: ${mainFiles.length}\n`;
  content += '='.repeat(80) + '\n\n';

  mainFiles.forEach((file, index) => {
    const filePath = path.join(__dirname, file);
    
    if (fs.existsSync(filePath)) {
      try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        content += `\n${'='.repeat(60)}\n`;
        content += `SOUBOR ${index + 1}: ${file}\n`;
        content += `${'='.repeat(60)}\n\n`;
        content += fileContent;
        content += '\n\n';
        
      } catch (error) {
        content += `\n${'='.repeat(60)}\n`;
        content += `SOUBOR ${index + 1}: ${file}\n`;
        content += `CHYBA: ${error.message}\n`;
        content += `${'='.repeat(60)}\n\n`;
      }
    }
  });

  // Uložíme
  const outputPath = path.join(__dirname, `urban-analytics-quick-export-${new Date().toISOString().split('T')[0]}.txt`);
  fs.writeFileSync(outputPath, content, 'utf8');
  
  console.log(`✅ Rychlý export dokončen: ${outputPath}`);
  console.log(`📊 Souborů: ${mainFiles.length}`);
  console.log(`📝 Velikost: ${(content.length / 1024).toFixed(2)} KB`);
}

quickExport();






