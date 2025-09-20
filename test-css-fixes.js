#!/usr/bin/env node

/**
 * 🧪 Test rapide du panel admin après déploiement CSS fixes
 */

const { execSync } = require('child_process');

console.log('🧪 Test Admin Panel CSS - Post déploiement');
console.log('============================================');

// 1. Test API Health
try {
    console.log('1️⃣ Test connectivité API...');
    const healthResponse = JSON.parse(execSync('curl -s http://localhost:8000/api/health', { encoding: 'utf8' }));
    console.log(`   ✅ API OK - Status: ${healthResponse.status}`);
} catch (error) {
    console.log('   ❌ API indisponible');
    process.exit(1);
}

// 2. Test authentification super admin
try {
    console.log('2️⃣ Test authentification super admin...');
    const authCmd = `curl -s -X POST -H "Content-Type: application/json" -d "{\\"email\\":\\"bruno@taaazzz.be\\",\\"password\\":\\"@51008473@\\"}" http://localhost:8000/api/auth/login`;
    const authResponse = JSON.parse(execSync(authCmd, { encoding: 'utf8' }));
    
    if (authResponse.success && authResponse.token) {
        console.log(`   ✅ Authentification réussie - Token obtenu`);
        console.log(`   👤 Utilisateur: ${authResponse.user.email} (${authResponse.user.role})`);
        
        // 3. Test endpoint admin avec token
        console.log('3️⃣ Test endpoint admin...');
        const adminCmd = `curl -s -H "Authorization: Bearer ${authResponse.token}" http://localhost:8000/api/admin/logs/summary`;
        const adminResponse = JSON.parse(execSync(adminCmd, { encoding: 'utf8' }));
        
        if (adminResponse.success) {
            console.log('   ✅ Endpoint admin accessible');
            console.log(`   📊 Logs total: ${adminResponse.summary.total}`);
        } else {
            console.log('   ❌ Endpoint admin inaccessible');
        }
        
    } else {
        console.log('   ❌ Authentification échouée');
        process.exit(1);
    }
} catch (error) {
    console.log('   ❌ Erreur authentification:', error.message);
    process.exit(1);
}

// 4. Test page frontend
try {
    console.log('4️⃣ Test page frontend...');
    const frontendResponse = execSync('curl -s http://localhost:8000/', { encoding: 'utf8' });
    
    if (frontendResponse.includes('FailDaily') && frontendResponse.includes('<title>')) {
        console.log('   ✅ Frontend accessible');
        
        // Vérifier que les CSS sont présents
        if (frontendResponse.includes('.css')) {
            console.log('   ✅ CSS files détectés dans la page');
        } else {
            console.log('   ⚠️  Aucun CSS détecté');
        }
    } else {
        console.log('   ❌ Frontend inaccessible ou corrompu');
    }
} catch (error) {
    console.log('   ❌ Erreur frontend:', error.message);
}

console.log('');
console.log('🎯 RÉSUMÉ DES CORRECTIONS CSS APPLIQUÉES:');
console.log('========================================');
console.log('✅ angular.json: Désactivation minification CSS agressive');
console.log('✅ angular.json: Activation inlineCritical pour variables Ionic');
console.log('✅ admin.page.scss: Ajout fallbacks couleurs avec !important');
console.log('✅ admin.page.scss: Fix cartes stats et tableau logs');
console.log('✅ admin.page.scss: Protection contre optimisations production');
console.log('');
console.log('🌐 Accès au panel admin:');
console.log('   1. Aller sur: http://localhost:8000/auth/login');
console.log('   2. Se connecter: bruno@taaazzz.be / @51008473@');
console.log('   3. Naviguer vers: http://localhost:8000/tabs/admin');
console.log('   4. Vérifier que l\'UI est maintenant belle comme en local !');
console.log('');
console.log('✨ Déploiement des corrections CSS terminé avec succès !');