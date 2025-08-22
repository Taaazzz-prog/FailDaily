/**
 * Configuration et gestion de la base de données MySQL pour FailDaily
 * ================================================================
 * 
 * Ce module gère la connexion MySQL avec WampServer et fournit
 * des utilitaires pour les requêtes et transactions.
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuration de la base de données
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'faildaily',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // éviter les hangs en CI
  connectTimeout: 10000,
  // Configuration MySQL2 spécifique
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Pool MySQL (désactivable pour la CI)
const POOL_DISABLED = String(process.env.DB_DISABLED || '').toLowerCase() === 'true';
const pool = POOL_DISABLED ? null : mysql.createPool(dbConfig);

/**
 * Teste la connexion à la base de données
 * @returns {Promise<boolean>} True si la connexion réussit
 */
async function testConnection() {
  try {
    if (!pool) return false;
    const connection = await pool.getConnection();
    console.log('✅ Connexion MySQL réussie à la base FailDaily');
    
// Test simple qui ne dépend d'aucune table
    await connection.query('SELECT 1');
    console.log('📊 Base de données joignable (SELECT 1)');

    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
    return false;
  }
}

/**
 * Exécute une requête SQL avec paramètres
 * @param {string} query - Requête SQL
 * @param {Array} params - Paramètres de la requête
 * @returns {Promise<Array>} Résultats de la requête
 */
async function executeQuery(query, params = []) {
  try {
    if (!pool) throw new Error('DB_DISABLED: pool indisponible dans cet environnement');
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Erreur SQL:', error.message);
    console.error('📝 Requête:', query);
    console.error('📋 Paramètres:', params);
    throw error;
  }
}

/**
 * Exécute plusieurs requêtes dans une transaction
 * @param {Array} queries - Array d'objets {query, params}
 * @returns {Promise<Array>} Résultats des requêtes
 */
async function executeTransaction(queries) {
  if (!pool) throw new Error('DB_DISABLED: pool indisponible dans cet environnement');
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    console.log('🔄 Transaction démarrée');
    
    const results = [];
    for (let i = 0; i < queries.length; i++) {
      const { query, params } = queries[i];
      const [result] = await connection.execute(query, params);
      results.push(result);
      console.log(`✅ Requête ${i + 1}/${queries.length} exécutée`);
    }
    
    await connection.commit();
    console.log('✅ Transaction validée');
    return results;
    
  } catch (error) {
    await connection.rollback();
    console.error('❌ Transaction annulée:', error.message);
    throw error;
    
  } finally {
    connection.release();
  }
}

/**
 * Ferme proprement le pool de connexions
 */
async function closePool() {
  try {
    if (pool) await pool.end();
    console.log('✅ Pool de connexions MySQL fermé');
  } catch (error) {
    console.error('❌ Erreur lors de la fermeture du pool:', error.message);
  }
}

// (Optionnel) Déplace les handlers SIG* dans server.js pour éviter d'ajouter des listeners en tests

module.exports = {
  pool,
  testConnection,
  executeQuery,
  executeTransaction,
  closePool
};
