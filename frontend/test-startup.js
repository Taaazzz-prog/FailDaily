/**
 * TEST DE DÉMARRAGE FRONTEND
 * ==========================
 * Vérification rapide de la possibilité de démarrer le frontend Angular
 */

import { spawn } from 'child_process';
import fetch from 'node-fetch';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class FrontendStartupTest {
  constructor() {
    this.frontendPath = __dirname;
    this.timeout = 60000; // 1 minute
  }

  log(message, color = '') {
    const colors = {
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      reset: '\x1b[0m'
    };
    console.log(`${colors[color] || ''}${message}${colors.reset}`);
  }

  async checkDependencies() {
    this.log('\n🔍 Vérification des dépendances...', 'blue');
    
    // Vérifier package.json
    const packageJsonPath = join(this.frontendPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      throw new Error('package.json manquant dans le dossier frontend');
    }

    // Vérifier node_modules
    const nodeModulesPath = join(this.frontendPath, 'node_modules');
    if (!existsSync(nodeModulesPath)) {
      this.log('⚠️  node_modules manquant. Installation nécessaire.', 'yellow');
      return false;
    }

    // Vérifier Angular CLI
    const angularCliPath = join(this.frontendPath, 'node_modules', '@angular', 'cli');
    if (!existsSync(angularCliPath)) {
      this.log('⚠️  Angular CLI manquant dans node_modules.', 'yellow');
      return false;
    }

    this.log('✅ Dépendances présentes', 'green');
    return true;
  }

  async installDependencies() {
    this.log('\n📦 Installation des dépendances...', 'blue');
    
    return new Promise((resolve, reject) => {
      const npm = spawn('npm', ['install'], {
        cwd: this.frontendPath,
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      npm.stdout.on('data', (data) => {
        output += data.toString();
        if (data.toString().includes('added') || data.toString().includes('packages')) {
          process.stdout.write('.');
        }
      });

      npm.stderr.on('data', (data) => {
        const errorStr = data.toString();
        if (!errorStr.includes('WARN') && !errorStr.includes('deprecated')) {
          console.error(errorStr);
        }
      });

      npm.on('close', (code) => {
        if (code === 0) {
          this.log('\n✅ Dépendances installées', 'green');
          resolve(true);
        } else {
          this.log(`\n❌ Erreur installation (code: ${code})`, 'red');
          reject(new Error(`Installation failed with code ${code}`));
        }
      });

      // Timeout
      setTimeout(() => {
        npm.kill();
        reject(new Error('Installation timeout'));
      }, 300000); // 5 minutes
    });
  }

  async checkPort4200() {
    try {
      const response = await fetch('http://localhost:4200', { timeout: 2000 });
      return true;
    } catch {
      return false;
    }
  }

  async startFrontend() {
    this.log('\n🚀 Démarrage du serveur frontend...', 'blue');
    
    // Vérifier si le port 4200 est déjà utilisé
    const portInUse = await this.checkPort4200();
    if (portInUse) {
      this.log('⚠️  Port 4200 déjà utilisé. Serveur peut-être déjà démarré.', 'yellow');
      return true;
    }

    return new Promise((resolve, reject) => {
      const ngServe = spawn('npm', ['start'], {
        cwd: this.frontendPath,
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      let serverReady = false;

      ngServe.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Afficher les logs importants
        if (text.includes('webpack') || text.includes('compiled') || text.includes('served')) {
          process.stdout.write('⚙️ ');
        }
        
        // Détecter que le serveur est prêt
        if (text.includes('localhost:4200') || text.includes('Application bundle generation complete')) {
          serverReady = true;
          this.log('\n✅ Serveur frontend démarré sur http://localhost:4200', 'green');
          resolve(ngServe);
        }
      });

      ngServe.stderr.on('data', (data) => {
        const errorText = data.toString();
        
        // Ignorer les warnings non critiques
        if (!errorText.includes('WARNING') && 
            !errorText.includes('deprecated') &&
            !errorText.includes('devkit')) {
          console.error(errorText);
        }
      });

      ngServe.on('close', (code) => {
        if (!serverReady) {
          this.log(`\n❌ Serveur fermé avant d'être prêt (code: ${code})`, 'red');
          reject(new Error(`Server closed with code ${code}`));
        }
      });

      // Timeout
      setTimeout(() => {
        if (!serverReady) {
          ngServe.kill();
          reject(new Error('Timeout: Serveur non démarré dans les temps'));
        }
      }, this.timeout);
    });
  }

  async testFrontendAccess() {
    this.log('\n🌐 Test d\'accès au frontend...', 'blue');
    
    for (let i = 0; i < 10; i++) {
      try {
        const response = await fetch('http://localhost:4200', { timeout: 5000 });
        if (response.ok) {
          const html = await response.text();
          if (html.includes('faildaily') || html.includes('angular') || html.includes('app-root')) {
            this.log('✅ Frontend accessible et répond correctement', 'green');
            return true;
          }
        }
      } catch (error) {
        // Retry
      }
      
      this.log(`⏳ Tentative ${i + 1}/10...`, 'yellow');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Frontend inaccessible après 10 tentatives');
  }

  async runStartupTest() {
    try {
      this.log('🎯 TEST DE DÉMARRAGE FRONTEND FAILDAILY', 'blue');
      this.log('=========================================');
      
      // 1. Vérifier les dépendances
      const depsOk = await this.checkDependencies();
      
      // 2. Installer si nécessaire
      if (!depsOk) {
        await this.installDependencies();
      }
      
      // 3. Démarrer le serveur
      const serverProcess = await this.startFrontend();
      
      // 4. Tester l'accès
      await this.testFrontendAccess();
      
      this.log('\n🎉 TEST RÉUSSI ! Frontend démarré avec succès.', 'green');
      this.log('📱 Vous pouvez maintenant accéder à: http://localhost:4200', 'green');
      
      // Garder le serveur en vie
      if (serverProcess) {
        this.log('\n⏸️  Serveur maintenu en vie. Appuyez sur Ctrl+C pour arrêter.', 'yellow');
        
        process.on('SIGINT', () => {
          this.log('\n🛑 Arrêt du serveur...', 'yellow');
          serverProcess.kill();
          process.exit(0);
        });
        
        // Garder le processus vivant
        return new Promise(() => {});
      }
      
      return true;
      
    } catch (error) {
      this.log(`\n❌ ÉCHEC DU TEST: ${error.message}`, 'red');
      
      this.log('\n💡 Suggestions:', 'yellow');
      this.log('1. Vérifiez que Node.js est installé (node --version)', 'yellow');
      this.log('2. Vérifiez que npm fonctionne (npm --version)', 'yellow');
      this.log('3. Essayez de supprimer node_modules et package-lock.json', 'yellow');
      this.log('4. Puis: npm install', 'yellow');
      
      return false;
    }
  }
}

// Exécution
if (import.meta.url === `file://${process.argv[1]}`) {
  const test = new FrontendStartupTest();
  test.runStartupTest().then(result => {
    if (!result) process.exit(1);
  });
}

export default FrontendStartupTest;
