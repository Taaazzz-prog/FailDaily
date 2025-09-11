#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function unlockModules() {
console.log('🔓 Déverrouillage complet des modules natifs en cours...');

// 1. Arrêter tous les processus qui pourraient verrouiller les modules
try {
  if (process.platform === 'win32') {
    console.log('⏹️  Arrêt des processus...');
    execSync('taskkill /IM esbuild.exe /F 2>nul', { stdio: 'ignore' });
    execSync('taskkill /IM node.exe /FI "WINDOWTITLE eq *esbuild*" /F 2>nul', { stdio: 'ignore' });
    execSync('taskkill /IM node.exe /FI "WINDOWTITLE eq *lmdb*" /F 2>nul', { stdio: 'ignore' });
    
    // Attendre un peu que les processus se ferment
    console.log('⏸️  Attente de fermeture des processus...');
    await new Promise(resolve => setTimeout(resolve, 2000));
  } else {
    execSync('pkill -f "esbuild|lmdb"', { stdio: 'ignore' });
  }
} catch (error) {
  // Ignore si aucun processus trouvé
}

// 2. Supprimer tous les modules natifs problématiques
const problematicPatterns = [
  'esbuild',
  '@lmdb',
  '@msgpackr-extract',
  'node-pty',
  'canvas',
  'sqlite3',
  'bcrypt',
  'sharp'
];

const basePaths = [
  process.cwd(),
  path.join(process.cwd(), 'frontend'),
  path.join(process.cwd(), 'backend-api')
];

const problematicPaths = [];
for (const basePath of basePaths) {
  for (const pattern of problematicPatterns) {
    problematicPaths.push(path.join(basePath, 'node_modules', pattern));
    problematicPaths.push(path.join(basePath, 'node_modules', '.bin', pattern));
    problematicPaths.push(path.join(basePath, 'node_modules', '.bin', pattern + '.exe'));
  }
}

// Ajout des chemins spécifiques détectés
problematicPaths.push(path.join(process.cwd(), 'node_modules'));
problematicPaths.push(path.join(process.cwd(), 'frontend', 'node_modules'));
problematicPaths.push(path.join(process.cwd(), 'backend-api', 'node_modules'));

for (const problematicPath of problematicPaths) {
  try {
    if (fs.existsSync(problematicPath)) {
      console.log(`🗑️  Suppression de ${problematicPath}`);
      if (process.platform === 'win32') {
        // Forcer la suppression sous Windows
        execSync(`rmdir /s /q "${problematicPath}" 2>nul || del /f /q "${problematicPath}" 2>nul`, { stdio: 'ignore' });
      } else {
        fs.rmSync(problematicPath, { recursive: true, force: true });
      }
    }
  } catch (error) {
    console.warn(`⚠️  Impossible de supprimer ${problematicPath}: ${error.message}`);
  }
}

// 3. Nettoyer le cache npm
try {
  console.log('🧹 Nettoyage du cache npm...');
  execSync('npm cache clean --force', { stdio: 'ignore' });
} catch (error) {
  console.warn('⚠️  Nettoyage cache échoué:', error.message);
}

console.log('✅ Déverrouillage complet des modules natifs terminé !');
}

unlockModules().catch(console.error);
