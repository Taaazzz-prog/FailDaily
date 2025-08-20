const axios = require('axios');

// Configuration des tests
const API_BASE_URL = 'http://localhost:3000';
const FRONTEND_BASE_URL = 'http://localhost:8100';

// Couleurs pour les logs
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Tests de validation d'âge
const ageValidationTests = [
    {
        name: "Enfant de 8 ans - Inscription bloquée",
        age: 8,
        expectedBlocked: true,
        expectedParentalConsent: false
    },
    {
        name: "Enfant de 12 ans - Inscription bloquée",
        age: 12,
        expectedBlocked: true,
        expectedParentalConsent: false
    },
    {
        name: "Adolescent de 13 ans - Consentement parental",
        age: 13,
        expectedBlocked: false,
        expectedParentalConsent: true
    },
    {
        name: "Adolescent de 15 ans - Consentement parental",
        age: 15,
        expectedBlocked: false,
        expectedParentalConsent: true
    },
    {
        name: "Adolescent de 16 ans - Consentement parental",
        age: 16,
        expectedBlocked: false,
        expectedParentalConsent: true
    },
    {
        name: "Adulte de 17 ans - Accès direct",
        age: 17,
        expectedBlocked: false,
        expectedParentalConsent: false
    },
    {
        name: "Adulte de 25 ans - Accès direct",
        age: 25,
        expectedBlocked: false,
        expectedParentalConsent: false
    }
];

// Fonction utilitaire pour calculer la date de naissance
function calculateBirthDate(age) {
    const today = new Date();
    const birthDate = new Date(today.getFullYear() - age, today.getMonth(), today.getDate());
    return birthDate.toISOString().split('T')[0];
}

// Fonction pour tester l'inscription
async function testRegistration(testCase) {
    const birthDate = calculateBirthDate(testCase.age);
    
    const userData = {
        email: `test${testCase.age}@example.com`,
        password: 'TestPassword123!',
        displayName: `TestUser${testCase.age}`,
        birthDate: birthDate
    };

    try {
        const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData);
        
        if (testCase.expectedBlocked) {
            // Si l'inscription devrait être bloquée mais ne l'est pas
            log(`❌ ${testCase.name} - ÉCHEC: Inscription autorisée alors qu'elle devrait être bloquée`, 'red');
            return false;
        }
        
        if (testCase.expectedParentalConsent) {
            // Vérifier si la réponse indique un consentement parental nécessaire
            if (response.data.parentalConsentRequired) {
                log(`✅ ${testCase.name} - SUCCÈS: Consentement parental requis`, 'green');
                return true;
            } else {
                log(`❌ ${testCase.name} - ÉCHEC: Consentement parental non requis`, 'red');
                return false;
            }
        } else {
            // Accès direct attendu
            if (response.data.token && !response.data.parentalConsentRequired) {
                log(`✅ ${testCase.name} - SUCCÈS: Accès direct accordé`, 'green');
                return true;
            } else {
                log(`❌ ${testCase.name} - ÉCHEC: Accès direct non accordé`, 'red');
                return false;
            }
        }
        
    } catch (error) {
        if (testCase.expectedBlocked && error.response && error.response.status === 403) {
            log(`✅ ${testCase.name} - SUCCÈS: Inscription correctement bloquée`, 'green');
            return true;
        } else {
            log(`❌ ${testCase.name} - ERREUR: ${error.message}`, 'red');
            return false;
        }
    }
}

// Fonction pour vérifier que les services sont disponibles
async function checkServices() {
    log('🔍 Vérification des services...', 'blue');
    
    try {
        // Vérifier le backend
        await axios.get(`${API_BASE_URL}/health`);
        log('✅ Backend disponible', 'green');
        
        // Vérifier le frontend (optionnel)
        try {
            await axios.get(FRONTEND_BASE_URL);
            log('✅ Frontend disponible', 'green');
        } catch (e) {
            log('⚠️ Frontend non disponible (non critique)', 'yellow');
        }
        
        return true;
    } catch (error) {
        log('❌ Backend non disponible - Veuillez démarrer les services', 'red');
        log('Commandes: npm run dev:backend et npm run dev:frontend', 'yellow');
        return false;
    }
}

// Fonction principale
async function runAgeValidationTests() {
    log('🧪 FailDaily - Tests de validation d\'âge', 'cyan');
    log('==========================================', 'cyan');
    
    // Vérifier les services
    const servicesAvailable = await checkServices();
    if (!servicesAvailable) {
        process.exit(1);
    }
    
    log('\n🎯 Début des tests de validation d\'âge...', 'blue');
    
    let passedTests = 0;
    const totalTests = ageValidationTests.length;
    
    for (const testCase of ageValidationTests) {
        log(`\n🧪 Test: ${testCase.name}`, 'yellow');
        const result = await testRegistration(testCase);
        if (result) {
            passedTests++;
        }
        
        // Attendre un peu entre les tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Résumé
    log('\n📊 Résumé des tests:', 'blue');
    log(`Tests passés: ${passedTests}/${totalTests}`, passedTests === totalTests ? 'green' : 'red');
    
    if (passedTests === totalTests) {
        log('🎉 Tous les tests de validation d\'âge sont passés!', 'green');
        process.exit(0);
    } else {
        log(`💥 ${totalTests - passedTests} test(s) ont échoué`, 'red');
        process.exit(1);
    }
}

// Gestion des erreurs non capturées
process.on('unhandledRejection', (reason, promise) => {
    log(`❌ Erreur non gérée: ${reason}`, 'red');
    process.exit(1);
});

// Lancer les tests
if (require.main === module) {
    runAgeValidationTests();
}

module.exports = {
    runAgeValidationTests,
    ageValidationTests,
    testRegistration
};
