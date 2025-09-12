/**
 * 🔧 CONFIGURATION GLOBALE DES TESTS
 * ==================================
 * 
 * Configuration centralisée pour tous les tests du backend FailDaily
 * Contient les URLs, utilisateurs de test, et utilitaires communs
 */

const path = require('path');
const fetch = require('node-fetch').default || require('node-fetch');
// Charger le .env du dossier backend-api (et non celui du dossier parent)
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

// Configuration de l'API
const API_CONFIG = {
  baseUrl: 'http://localhost:3000',
  endpoints: {
    auth: {
      register: '/api/auth/register',
      login: '/api/auth/login',
      verify: '/api/auth/verify',
      logout: '/api/auth/logout',
      checkEmail: '/api/auth/check-email'
    },
    registration: {
      register: '/api/registration/register',
      checkEmail: '/api/registration/check-email',
      checkDisplayName: '/api/registration/check-display-name',
      validateReferral: '/api/registration/validate-referral'
    },
    ageVerification: {
      verify: '/api/age-verification/verify',
      updateBirthDate: '/api/age-verification/update-birth-date',
      getUserAge: '/api/age-verification/user-age',
      statistics: '/api/age-verification/statistics',
      coppaCompliance: '/api/age-verification/coppa-compliance'
    },
    fails: {
      create: '/api/fails',
      getAll: '/api/fails',
      getById: '/api/fails',
      update: '/api/fails',
      delete: '/api/fails'
    },
    admin: {
      dashboard: '/api/admin/dashboard',
      users: '/api/admin/users',
      logs: '/api/admin/logs'
    }
  }
};

// Utilisateurs de test
const TEST_USERS = {
  validAdult: {
    email: 'adult.test@faildaily.com',
    password: 'password123',
    displayName: 'Adult Test User',
    birthDate: '1995-01-01' // 30 ans environ
  },
  validMinor: {
    email: 'minor.test@faildaily.com',
    password: 'password123',
    displayName: 'Minor Test User',
    birthDate: '2009-01-01', // 15 ans environ
    parentEmail: 'parent@faildaily.com'
  },
  underAge: {
    email: 'child.test@faildaily.com',
    password: 'password123',
    displayName: 'Child Test User',
    birthDate: '2015-01-01' // 9 ans environ
  },
  admin: {
    email: 'admin.test@faildaily.com', 
    password: 'adminpass123',
    displayName: 'Admin Test',
    birthDate: '1985-01-01'
  },
  invalid: {
    email: 'invalid-email',
    password: '123', // Trop court
    displayName: '',
    birthDate: '2030-01-01' // Future
  }
};

// Données de test pour les fails
const TEST_FAILS = {
  valid: {
    title: 'Mon premier échec de test',
    description: 'Ceci est une description de test pour un échec',
    category: 'personnel',
    is_anonyme: false
  },
  withoutTitle: {
    description: 'Échec sans titre',
    category: 'professionnel'
  },
  private: {
    title: 'Échec privé',
    description: 'Ceci est un échec privé',
    is_anonyme: true
  }
};

// Utilitaires de test
const TEST_UTILS = {
  // Générer un email unique pour les tests
  generateTestEmail: () => `test.${Date.now()}@faildaily.com`,
  
  // Générer une date de naissance selon l'âge souhaité
  generateBirthDate: (ageYears) => {
    const birthDate = new Date();
    birthDate.setFullYear(birthDate.getFullYear() - ageYears);
    return birthDate.toISOString().split('T')[0];
  },
  
  // Attendre X millisecondes
  sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Logger avec emoji pour les tests
  log: (emoji, message) => console.log(`${emoji} [TEST] ${message}`),
  
  // Vérifier si le serveur répond
  checkServerHealth: async () => {
    try {
      const response = await fetch(`${API_CONFIG.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  },
  
  // Calculer l'âge à partir d'une date de naissance
  calculateAge: (birthDate) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }
};

// Headers par défaut pour les requêtes
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json'
};

// Configuration de la base de données de test
const TEST_DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'faildaily'
};

module.exports = {
  API_CONFIG,
  TEST_USERS,
  TEST_FAILS,
  TEST_UTILS,
  DEFAULT_HEADERS,
  TEST_DB_CONFIG,
  fetch
};
