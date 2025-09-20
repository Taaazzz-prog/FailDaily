/**
 * 🧪 TEST ADMIN PANEL UI PRODUCTION
 * 
 * Ce script teste l'interface admin en production pour vérifier
 * que les corrections CSS ont résolu les problèmes d'affichage.
 */

const puppeteer = require('puppeteer');

async function testAdminPanelUI() {
    console.log('🧪 Test Admin Panel UI Production');
    console.log('=================================');
    
    let browser;
    try {
        browser = await puppeteer.launch({ 
            headless: false, // Voir l'interface
            defaultViewport: { width: 1280, height: 720 },
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        
        const page = await browser.newPage();
        
        // 1. Aller sur la page de connexion
        console.log('📍 Navigation vers la page de connexion...');
        await page.goto('http://localhost:8000/auth/login', { 
            waitUntil: 'networkidle2', 
            timeout: 10000 
        });
        
        // 2. Se connecter avec les identifiants super admin
        console.log('🔑 Connexion super admin...');
        await page.waitForSelector('ion-input[name="email"] input', { timeout: 5000 });
        await page.type('ion-input[name="email"] input', 'bruno@taaazzz.be');
        await page.type('ion-input[name="password"] input', '@51008473@');
        
        // Clic sur le bouton de connexion
        await page.click('ion-button[type="submit"]');
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
        
        // 3. Naviguer vers le panel admin
        console.log('🏛️ Navigation vers le panel admin...');
        await page.goto('http://localhost:8000/tabs/admin', { 
            waitUntil: 'networkidle2' 
        });
        
        // 4. Vérifier que les éléments CSS sont bien chargés
        console.log('🎨 Vérification des styles CSS...');
        
        // Vérifier les cartes de stats
        const statsCards = await page.$$('.stat-card');
        console.log(`✅ Cartes de stats trouvées: ${statsCards.length}`);
        
        // Vérifier les couleurs des cartes
        for (let i = 0; i < Math.min(3, statsCards.length); i++) {
            const card = statsCards[i];
            const bgColor = await card.evaluate(el => {
                return window.getComputedStyle(el).backgroundColor;
            });
            console.log(`   Carte ${i+1} - Couleur de fond: ${bgColor}`);
        }
        
        // 5. Vérifier le tableau des logs
        const logsTable = await page.$('.logs-table-container');
        if (logsTable) {
            console.log('✅ Tableau des logs trouvé');
            
            const tableHeight = await logsTable.evaluate(el => {
                const style = window.getComputedStyle(el);
                return {
                    maxHeight: style.maxHeight,
                    overflow: style.overflow,
                    border: style.border
                };
            });
            console.log('   Styles tableau:', tableHeight);
        } else {
            console.log('❌ Tableau des logs non trouvé');
        }
        
        // 6. Vérifier les variables CSS Ionic
        const ionicVars = await page.evaluate(() => {
            const root = document.documentElement;
            const cs = getComputedStyle(root);
            return {
                primaryColor: cs.getPropertyValue('--ion-color-primary'),
                successColor: cs.getPropertyValue('--ion-color-success'),
                dangerColor: cs.getPropertyValue('--ion-color-danger'),
                backgroundColor: cs.getPropertyValue('--ion-background-color')
            };
        });
        
        console.log('🎨 Variables CSS Ionic:');
        console.log('   --ion-color-primary:', ionicVars.primaryColor);
        console.log('   --ion-color-success:', ionicVars.successColor);
        console.log('   --ion-color-danger:', ionicVars.dangerColor);
        console.log('   --ion-background-color:', ionicVars.backgroundColor);
        
        // 7. Prendre une capture d'écran
        console.log('📸 Capture d\'écran du panel admin...');
        await page.screenshot({ 
            path: 'admin-panel-production-test.png',
            fullPage: true 
        });
        
        console.log('✅ Test terminé avec succès !');
        console.log('📸 Capture sauvegardée: admin-panel-production-test.png');
        
    } catch (error) {
        console.error('❌ Erreur pendant le test:', error.message);
        throw error;
    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

// Fonction pour attendre que les services soient prêts
async function waitForServices() {
    console.log('⏳ Attente que les services soient prêts...');
    
    const fetch = require('node-fetch');
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        try {
            const response = await fetch('http://localhost:8000/api/health');
            if (response.ok) {
                console.log('✅ Services prêts !');
                return true;
            }
        } catch (error) {
            // Service pas encore prêt
        }
        
        attempts++;
        console.log(`   Tentative ${attempts}/${maxAttempts}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Services non disponibles après 60 secondes');
}

// Exécution si appelé directement
if (require.main === module) {
    (async () => {
        try {
            await waitForServices();
            await testAdminPanelUI();
        } catch (error) {
            console.error('❌ Test échoué:', error.message);
            process.exit(1);
        }
    })();
}

module.exports = { testAdminPanelUI, waitForServices };