/**
 * Utilitaires de diagnostic pour les logs de FailDaily
 * À utiliser dans la console du navigateur pour diagnostiquer les problèmes de logs
 */

declare global {
    interface Window {
        FailDailyDebug: {
            enableReactionLogs: () => void;
            disableReactionLogs: () => void;
            enableAllLogs: () => void;
            disableAllLogs: () => void;
            checkLogConfig: () => void;
            testReactionLog: () => void;
        };
    }
}

/**
 * Active temporairement les logs de réactions pour diagnostiquer
 */
function enableReactionLogs() {
    // Cette fonction doit être copiée dans la console du navigateur
    console.log('🔧 Activation des logs de réactions...');

    // Modifier la configuration des logs
    if ((window as any).logConfig) {
        (window as any).logConfig.fails = true;
        (window as any).logConfig.badges = true;
        console.log('✅ Logs de réactions activés');
    } else {
        console.warn('❌ Configuration des logs non trouvée');
    }
}

/**
 * Désactive les logs de réactions
 */
function disableReactionLogs() {
    console.log('🔧 Désactivation des logs de réactions...');

    if ((window as any).logConfig) {
        (window as any).logConfig.fails = false;
        (window as any).logConfig.badges = false;
        console.log('✅ Logs de réactions désactivés');
    } else {
        console.warn('❌ Configuration des logs non trouvée');
    }
}

/**
 * Affiche la configuration actuelle des logs
 */
function checkLogConfig() {
    console.log('🔍 Configuration actuelle des logs:');

    if ((window as any).logConfig) {
        console.table((window as any).logConfig);
    } else {
        console.warn('❌ Configuration des logs non trouvée');
        console.log('💡 Essayez de recharger la page et réessayez');
    }
}

/**
 * Test des logs de réaction
 */
function testReactionLog() {
    console.log('🧪 Test des logs de réaction...');
    console.log('💣 Test failLog - ce message devrait s\'afficher si les logs fails sont activés');
    console.log('🏆 Test badgeLog - ce message devrait s\'afficher si les logs badges sont activés');
}

// Exposer les fonctions globalement pour la console
if (typeof window !== 'undefined') {
    window.FailDailyDebug = {
        enableReactionLogs,
        disableReactionLogs,
        enableAllLogs: () => console.log('🔧 Utilisez enableReactionLogs() ou modifiez logger.ts'),
        disableAllLogs: () => console.log('🔧 Utilisez disableReactionLogs() ou modifiez logger.ts'),
        checkLogConfig,
        testReactionLog
    };

    console.log(`
🎯 FailDaily Debug Tools disponibles !

Utilisation dans la console:
• FailDailyDebug.enableReactionLogs()  - Active les logs de réactions
• FailDailyDebug.disableReactionLogs() - Désactive les logs de réactions  
• FailDailyDebug.checkLogConfig()      - Affiche la config actuelle
• FailDailyDebug.testReactionLog()     - Test des logs de réaction

Pour un diagnostic complet:
1. FailDailyDebug.checkLogConfig()
2. FailDailyDebug.enableReactionLogs()
3. Tester une réaction
4. FailDailyDebug.disableReactionLogs()
    `);
}
