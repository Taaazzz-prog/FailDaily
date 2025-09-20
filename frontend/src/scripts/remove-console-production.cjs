// ✅ Script de suppression PHYSIQUE des console.log pour production
// Ce script doit être exécuté APRÈS le build Angular pour supprimer définitivement
// tous les console.log, console.warn, console.error du code minifié

const fs = require('fs');
const path = require('path');

function removeConsoleFromFiles(dir) {
  console.log(`🔍 Analyse du répertoire: ${dir}`);
  
  if (!fs.existsSync(dir)) {
    console.error(`❌ Répertoire introuvable: ${dir}`);
    return;
  }

  const files = fs.readdirSync(dir);
  let totalModified = 0;
  let totalConsoleRemoved = 0;

  for (const file of files) {
    const filePath = path.join(dir, file);
    
    // Traiter seulement les fichiers .js
    if (path.extname(file) === '.js') {
      console.log(`📁 Traitement: ${file}`);
      
      try {
        let content = fs.readFileSync(filePath, 'utf8');
        const originalLength = content.length;
        
        // Compter les console.log avant suppression
        const consoleMatches = content.match(/console\.(log|warn|error|info|debug|trace|group|groupEnd|table|time|timeEnd|count|clear)\s*\([^)]*\)/g);
        const consoleCount = consoleMatches ? consoleMatches.length : 0;
        
        if (consoleCount > 0) {
          console.log(`  🎯 Trouvé ${consoleCount} console.* dans ${file}`);
          
          // Supprimer tous les console.* avec leurs arguments
          content = content.replace(/console\.(log|warn|error|info|debug|trace|group|groupEnd|table|time|timeEnd|count|clear)\s*\([^)]*\)/g, '');
          
          // Nettoyer les virgules orphelines
          content = content.replace(/,\s*,/g, ',');
          content = content.replace(/\(\s*,/g, '(');
          content = content.replace(/,\s*\)/g, ')');
          
          // Sauvegarder le fichier modifié
          fs.writeFileSync(filePath, content, 'utf8');
          
          const newLength = content.length;
          const saved = originalLength - newLength;
          
          console.log(`  ✅ ${consoleCount} console.* supprimés, ${saved} caractères économisés`);
          totalModified++;
          totalConsoleRemoved += consoleCount;
        } else {
          console.log(`  ✨ Aucun console.* trouvé dans ${file}`);
        }
      } catch (error) {
        console.error(`  ❌ Erreur lors du traitement de ${file}:`, error.message);
      }
    }
  }

  console.log(`\n🎉 RÉSULTAT:`);
  console.log(`📊 ${totalModified} fichiers modifiés`);
  console.log(`🗑️ ${totalConsoleRemoved} console.* supprimés au total`);
  console.log(`🔒 Production build sécurisé !`);
}

// Script principal
const wwwDir = path.join(__dirname, '../../www');
console.log('🚀 FailDaily - Suppression console.log production');
console.log('='.repeat(50));

removeConsoleFromFiles(wwwDir);

console.log('\n✅ Script terminé. Vérifiez que l\'application fonctionne correctement.');