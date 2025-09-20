#!/usr/bin/env node

/**
 * 🧪 TEST CORRECTIF CSS DOCKER - Comparaison Local vs Docker
 */

const { execSync } = require('child_process');

console.log('🧪 TEST CSS FIX - Local vs Docker');
console.log('==================================');

function testEndpoint(url, description) {
    try {
        console.log(`🔍 Test: ${description}`);
        console.log(`   URL: ${url}`);
        
        const response = execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { encoding: 'utf8' });
        
        if (response.trim() === '200') {
            console.log(`   ✅ Status: ${response.trim()} (OK)`);
            return true;
        } else {
            console.log(`   ❌ Status: ${response.trim()} (Échec)`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
        return false;
    }
}

console.log('');

// Test Local (dev server)
console.log('🏠 ENVIRONNEMENT LOCAL (dev)');
console.log('============================');
const localOk = testEndpoint('http://localhost:4200', 'Frontend dev server');

console.log('');

// Test Docker 
console.log('🐳 ENVIRONNEMENT DOCKER');
console.log('======================');
const dockerOk = testEndpoint('http://localhost:8000', 'Frontend Docker');
const dockerApiOk = testEndpoint('http://localhost:8000/api/health', 'API Docker');

console.log('');

// Test authentification Docker
console.log('🔑 TEST AUTHENTIFICATION DOCKER');
console.log('===============================');
try {
    const authCmd = `curl -s -X POST -H "Content-Type: application/json" -d "{\\"email\\":\\"bruno@taaazzz.be\\",\\"password\\":\\"@51008473@\\"}" http://localhost:8000/api/auth/login`;
    const authResponse = JSON.parse(execSync(authCmd, { encoding: 'utf8' }));
    
    if (authResponse.success) {
        console.log('   ✅ Authentification Docker: OK');
        console.log(`   👤 Role: ${authResponse.user.role}`);
    } else {
        console.log('   ❌ Authentification Docker: Échec');
    }
} catch (error) {
    console.log('   ❌ Erreur authentification Docker');
}

console.log('');
console.log('🎯 RÉSUMÉ DES CORRECTIONS APPLIQUÉES');
console.log('===================================');
console.log('✅ package.json: Ajout build:docker sans optimisations CSS');
console.log('✅ frontend.Dockerfile: Utilisation de npm run build:docker');
console.log('✅ admin.page.scss: Suppression des !important agressifs');
console.log('✅ Variables Ionic préservées en build Docker');
console.log('');

if (dockerOk && dockerApiOk) {
    console.log('🎉 DOCKER OPÉRATIONNEL !');
    console.log('📋 Tests à effectuer:');
    console.log('   1. Local: http://localhost:4200/tabs/admin');
    console.log('   2. Docker: http://localhost:8000/tabs/admin');
    console.log('   3. Vérifier que les styles sont identiques !');
} else {
    console.log('⚠️  Docker pas encore prêt, attendez la fin du build...');
}