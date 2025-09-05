const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function createTestUser() {
  let conn;
  try {
    conn = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'faildaily_user', 
      password: '@51008473@Alexia@',
      database: 'faildaily'
    });
    
    console.log('🔌 Connexion établie');
    
    const hashedPassword = await bcrypt.hash('test123', 10);
    const userId = uuidv4();
    const profileId = uuidv4();
    
    // Supprimer l'utilisateur s'il existe déjà
    await conn.execute('DELETE FROM profiles WHERE user_id IN (SELECT id FROM users WHERE email = ?)', ['debug@test.local']);
    await conn.execute('DELETE FROM users WHERE email = ?', ['debug@test.local']);
    
    // Créer l'utilisateur
    await conn.execute(
      `INSERT INTO users (id, email, password_hash, email_confirmed, role, account_status, registration_step, created_at, updated_at) 
       VALUES (?, ?, ?, 1, 'user', 'active', 'completed', NOW(), NOW())`, 
      [userId, 'debug@test.local', hashedPassword]
    );
    
    // Créer le profil
    await conn.execute(
      'INSERT INTO profiles (id, user_id, display_name, avatar_url, created_at, updated_at) VALUES (?, ?, ?, NULL, NOW(), NOW())', 
      [profileId, userId, 'Debug Test']
    );
    
    console.log('✅ Utilisateur créé: debug@test.local / test123');
    
  } catch (e) {
    console.error('❌', e.message);
  } finally {
    if (conn) await conn.end();
  }
}

createTestUser();
