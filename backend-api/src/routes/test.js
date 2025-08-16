const express = require('express');
const { executeQuery } = require('../config/database');

const router = express.Router();

/**
 * Routes de test pour l'API
 */

/**
 * Test basique de l'API
 */
router.get('/ping', (req, res) => {
  res.json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString(),
    server: 'FailDaily API MySQL'
  });
});

/**
 * Test de connexion à la base de données
 */
router.get('/db', async (req, res) => {
  try {
    const result = await executeQuery(
      req.dbConnection,
      'SELECT 1 as test, NOW() as current_time, VERSION() as mysql_version',
      []
    );

    res.json({
      success: true,
      message: 'Connexion base de données OK',
      database_info: result[0]
    });

  } catch (error) {
    console.error('❌ Test DB échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur de connexion à la base de données',
      error: error.message
    });
  }
});

/**
 * Test de comptage des utilisateurs
 */
router.get('/users-count', async (req, res) => {
  try {
    const result = await executeQuery(
      req.dbConnection,
      'SELECT COUNT(*) as user_count FROM users',
      []
    );

    res.json({
      success: true,
      message: 'Comptage utilisateurs OK',
      user_count: result[0].user_count
    });

  } catch (error) {
    console.error('❌ Test comptage utilisateurs échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des utilisateurs',
      error: error.message
    });
  }
});

/**
 * Test de comptage des fails
 */
router.get('/fails-count', async (req, res) => {
  try {
    const result = await executeQuery(
      req.dbConnection,
      'SELECT COUNT(*) as fail_count FROM fails',
      []
    );

    res.json({
      success: true,
      message: 'Comptage fails OK',
      fail_count: result[0].fail_count
    });

  } catch (error) {
    console.error('❌ Test comptage fails échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du comptage des fails',
      error: error.message
    });
  }
});

/**
 * Test de création d'un utilisateur temporaire
 */
router.post('/create-temp-user', async (req, res) => {
  try {
    const timestamp = Date.now();
    const testEmail = `test-${timestamp}@example.com`;
    const testDisplayName = `TestUser${timestamp}`;

    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('test123', 10);

    const result = await executeQuery(
      req.dbConnection,
      `INSERT INTO users (email, password_hash, display_name, is_verified, created_at, updated_at) 
       VALUES (?, ?, ?, 0, NOW(), NOW())`,
      [testEmail, hashedPassword, testDisplayName]
    );

    res.json({
      success: true,
      message: 'Utilisateur temporaire créé',
      user_id: result.insertId,
      email: testEmail,
      display_name: testDisplayName
    });

  } catch (error) {
    console.error('❌ Test création utilisateur échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de l\'utilisateur temporaire',
      error: error.message
    });
  }
});

/**
 * Test de suppression des utilisateurs temporaires
 */
router.delete('/cleanup-temp-users', async (req, res) => {
  try {
    const result = await executeQuery(
      req.dbConnection,
      'DELETE FROM users WHERE email LIKE "test-%@example.com" AND display_name LIKE "TestUser%"',
      []
    );

    res.json({
      success: true,
      message: 'Utilisateurs temporaires supprimés',
      deleted_count: result.affectedRows
    });

  } catch (error) {
    console.error('❌ Nettoyage utilisateurs temporaires échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du nettoyage des utilisateurs temporaires',
      error: error.message
    });
  }
});

/**
 * Test de performance - requêtes multiples
 */
router.get('/performance/:count', async (req, res) => {
  try {
    const count = Math.min(parseInt(req.params.count) || 10, 100); // Max 100 requêtes
    const startTime = Date.now();
    const results = [];

    for (let i = 0; i < count; i++) {
      const queryStart = Date.now();
      await executeQuery(req.dbConnection, 'SELECT ? as query_number, NOW() as query_time', [i + 1]);
      const queryTime = Date.now() - queryStart;
      results.push(queryTime);
    }

    const totalTime = Date.now() - startTime;
    const avgTime = results.reduce((sum, time) => sum + time, 0) / results.length;

    res.json({
      success: true,
      message: `Test de performance avec ${count} requêtes`,
      performance: {
        queries_executed: count,
        total_time_ms: totalTime,
        average_query_time_ms: Math.round(avgTime * 100) / 100,
        queries_per_second: Math.round((count / totalTime) * 1000 * 100) / 100
      }
    });

  } catch (error) {
    console.error('❌ Test performance échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test de performance',
      error: error.message
    });
  }
});

/**
 * Test de structure des tables principales
 */
router.get('/table-structure', async (req, res) => {
  try {
    const tables = ['users', 'user_profiles', 'fails', 'badges', 'user_badges'];
    const tableInfo = {};

    for (const table of tables) {
      try {
        const structure = await executeQuery(
          req.dbConnection,
          `DESCRIBE ${table}`,
          []
        );
        
        const count = await executeQuery(
          req.dbConnection,
          `SELECT COUNT(*) as count FROM ${table}`,
          []
        );

        tableInfo[table] = {
          structure: structure,
          row_count: count[0].count,
          status: 'ok'
        };
      } catch (error) {
        tableInfo[table] = {
          status: 'error',
          error: error.message
        };
      }
    }

    res.json({
      success: true,
      message: 'Structure des tables analysée',
      tables: tableInfo
    });

  } catch (error) {
    console.error('❌ Test structure tables échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'analyse de la structure des tables',
      error: error.message
    });
  }
});

/**
 * Test JWT
 */
router.get('/jwt', (req, res) => {
  try {
    const jwt = require('jsonwebtoken');
    const testPayload = {
      test: true,
      timestamp: Date.now()
    };

    const token = jwt.sign(testPayload, process.env.JWT_SECRET || 'fallback-secret', { expiresIn: '1h' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');

    res.json({
      success: true,
      message: 'Test JWT OK',
      token_generated: !!token,
      token_verified: !!decoded,
      payload: decoded
    });

  } catch (error) {
    console.error('❌ Test JWT échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test JWT',
      error: error.message
    });
  }
});

/**
 * Test de hashage bcrypt
 */
router.post('/bcrypt', async (req, res) => {
  try {
    const { password = 'test123' } = req.body;
    const bcrypt = require('bcrypt');

    const startTime = Date.now();
    const hashed = await bcrypt.hash(password, 12);
    const hashTime = Date.now() - startTime;

    const compareStart = Date.now();
    const isValid = await bcrypt.compare(password, hashed);
    const compareTime = Date.now() - compareStart;

    res.json({
      success: true,
      message: 'Test bcrypt OK',
      hash_time_ms: hashTime,
      compare_time_ms: compareTime,
      hash_valid: isValid,
      hash_length: hashed.length
    });

  } catch (error) {
    console.error('❌ Test bcrypt échoué:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du test bcrypt',
      error: error.message
    });
  }
});

/**
 * Test complet de l'API
 */
router.get('/full', async (req, res) => {
  try {
    const tests = {
      ping: false,
      database_connection: false,
      users_table: false,
      fails_table: false,
      jwt_system: false,
      bcrypt_system: false
    };

    const issues = [];

    // Test ping
    tests.ping = true;

    // Test DB
    try {
      await executeQuery(req.dbConnection, 'SELECT 1', []);
      tests.database_connection = true;
    } catch (error) {
      issues.push('Connexion base de données échouée');
    }

    // Test table users
    try {
      await executeQuery(req.dbConnection, 'SELECT COUNT(*) FROM users LIMIT 1', []);
      tests.users_table = true;
    } catch (error) {
      issues.push('Table users inaccessible');
    }

    // Test table fails
    try {
      await executeQuery(req.dbConnection, 'SELECT COUNT(*) FROM fails LIMIT 1', []);
      tests.fails_table = true;
    } catch (error) {
      issues.push('Table fails inaccessible');
    }

    // Test JWT
    try {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign({ test: true }, process.env.JWT_SECRET || 'fallback-secret');
      jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
      tests.jwt_system = true;
    } catch (error) {
      issues.push('Système JWT non fonctionnel');
    }

    // Test bcrypt
    try {
      const bcrypt = require('bcrypt');
      const hash = await bcrypt.hash('test', 10);
      await bcrypt.compare('test', hash);
      tests.bcrypt_system = true;
    } catch (error) {
      issues.push('Système bcrypt non fonctionnel');
    }

    const allTestsPassed = Object.values(tests).every(test => test === true);

    res.json({
      success: true,
      message: 'Tests complets terminés',
      overall_status: allTestsPassed ? 'all_passed' : 'some_failed',
      tests: tests,
      issues: issues,
      tested_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Tests complets échoués:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors des tests complets',
      error: error.message
    });
  }
});

module.exports = router;