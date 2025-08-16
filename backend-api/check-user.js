const mysql = require('mysql2/promise');

/**
 * Script pour vérifier les utilisateurs dans la base MySQL
 */

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Mot de passe WampServer si configuré
  database: 'faildaily'
};

async function checkUsers() {
  let connection;

  try {
    console.log('🔍 Connexion à la base de données MySQL...');
    connection = await mysql.createConnection(dbConfig);

    console.log('✅ Connexion établie');

    // Vérifier les utilisateurs
    console.log('\n📊 === VÉRIFICATION DES UTILISATEURS ===');
    
    const users = await connection.execute('SELECT id, email, display_name, created_at FROM users ORDER BY created_at DESC');
    
    console.log(`\n👥 Nombre total d'utilisateurs: ${users[0].length}`);
    
    if (users[0].length > 0) {
      console.log('\n📋 Liste des utilisateurs:');
      users[0].forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id} | Email: ${user.email} | Nom: ${user.display_name} | Créé: ${user.created_at}`);
      });
    } else {
      console.log('❌ Aucun utilisateur trouvé');
    }

    // Vérifier les profils
    console.log('\n📊 === VÉRIFICATION DES PROFILS ===');
    
    const profiles = await connection.execute(`
      SELECT up.user_id, u.email, up.bio, up.location 
      FROM user_profiles up 
      JOIN users u ON up.user_id = u.id
    `);
    
    console.log(`\n👤 Nombre de profils: ${profiles[0].length}`);
    
    if (profiles[0].length > 0) {
      profiles[0].forEach((profile, index) => {
        console.log(`${index + 1}. User ID: ${profile.user_id} | Email: ${profile.email} | Bio: ${profile.bio || 'Vide'} | Lieu: ${profile.location || 'Non spécifié'}`);
      });
    }

    // Vérifier les fails
    console.log('\n📊 === VÉRIFICATION DES FAILS ===');
    
    const fails = await connection.execute(`
      SELECT f.id, f.title, u.email, f.created_at 
      FROM fails f 
      JOIN users u ON f.user_id = u.id 
      ORDER BY f.created_at DESC 
      LIMIT 10
    `);
    
    console.log(`\n📝 Nombre de fails: ${fails[0].length}`);
    
    if (fails[0].length > 0) {
      console.log('\n📋 Derniers fails:');
      fails[0].forEach((fail, index) => {
        console.log(`${index + 1}. ID: ${fail.id} | Titre: ${fail.title} | Auteur: ${fail.email} | Créé: ${fail.created_at}`);
      });
    } else {
      console.log('❌ Aucun fail trouvé');
    }

    // Vérifier les badges
    console.log('\n📊 === VÉRIFICATION DES BADGES ===');
    
    const badges = await connection.execute('SELECT id, name, description FROM badge_definitions');
    
    console.log(`\n🏆 Nombre de badges actifs: ${badges[0].length}`);
    
    if (badges[0].length > 0) {
      console.log('\n📋 Liste des badges:');
      badges[0].forEach((badge, index) => {
        console.log(`${index + 1}. ID: ${badge.id} | Nom: ${badge.name} | XP: ${badge.xp_reward} | Description: ${badge.description}`);
      });
    } else {
      console.log('❌ Aucun badge trouvé');
    }

    // Vérifier les badges utilisateurs
    const userBadges = await connection.execute(`
      SELECT ub.user_id, u.email, b.name, ub.earned_at 
      FROM user_badges ub 
      JOIN users u ON ub.user_id = u.id 
      JOIN badges b ON ub.badge_id = b.id 
      ORDER BY ub.earned_at DESC
    `);
    
    console.log(`\n🎖️ Badges obtenus par les utilisateurs: ${userBadges[0].length}`);
    
    if (userBadges[0].length > 0) {
      userBadges[0].forEach((userBadge, index) => {
        console.log(`${index + 1}. User: ${userBadge.email} | Badge: ${userBadge.name} | Obtenu: ${userBadge.earned_at}`);
      });
    }

    // Statistiques générales
    console.log('\n📊 === STATISTIQUES GÉNÉRALES ===');
    
    const stats = await connection.execute(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM fails) as total_fails,
        (SELECT COUNT(*) FROM badge_definitions) as total_badges,
        (SELECT COUNT(*) FROM user_badges) as total_user_badges,
        (SELECT COUNT(*) FROM fail_reactions) as total_reactions
    `);
    
    const stat = stats[0][0];
    console.log(`
📈 RÉSUMÉ:
   👥 Utilisateurs: ${stat.total_users}
   📝 Fails: ${stat.total_fails}
   🏆 Badges: ${stat.total_badges}
   🎖️ Badges obtenus: ${stat.total_user_badges}
   👍 Réactions: ${stat.total_reactions}
    `);

    // Test d'authentification
    console.log('\n🔐 === TEST D\'AUTHENTIFICATION ===');
    
    if (users[0].length > 0) {
      const testUser = users[0][0];
      console.log(`Utilisateur de test: ${testUser.email}`);
      
      const bcrypt = require('bcrypt');
      const testPassword = 'password123';
      
      try {
        // Récupérer le hash du mot de passe
        const userWithPassword = await connection.execute('SELECT password_hash FROM users WHERE id = ?', [testUser.id]);
        
        if (userWithPassword[0].length > 0) {
          const storedHash = userWithPassword[0][0].password_hash;
          console.log(`Hash stocké: ${storedHash.substring(0, 20)}...`);
          
          // Test de comparaison (ne fonctionnera que si le mot de passe est 'password123')
          const isValid = await bcrypt.compare(testPassword, storedHash);
          console.log(`Test mot de passe '${testPassword}': ${isValid ? '✅ Valide' : '❌ Invalide'}`);
        }
      } catch (error) {
        console.log('⚠️ Erreur test authentification:', error.message);
      }
    }

    console.log('\n✅ Vérification terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Fonction pour créer un utilisateur de test
async function createTestUser() {
  let connection;

  try {
    console.log('🔧 Création d\'un utilisateur de test...');
    connection = await mysql.createConnection(dbConfig);

    const bcrypt = require('bcrypt');
    const testEmail = 'admin@test.com';
    const testPassword = 'admin123';
    const testDisplayName = 'Admin Test';

    // Vérifier si l'utilisateur existe déjà
    const existing = await connection.execute('SELECT id FROM users WHERE email = ?', [testEmail]);
    
    if (existing[0].length > 0) {
      console.log('⚠️ Utilisateur de test déjà existant');
      return;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(testPassword, 12);

    // Créer l'utilisateur
    const userResult = await connection.execute(
      `INSERT INTO users (email, password_hash, display_name, email_confirmed, created_at, updated_at) 
       VALUES (?, ?, ?, 1, NOW(), NOW())`,
      [testEmail, hashedPassword, testDisplayName]
    );

    const userId = userResult[0].insertId;

    // Créer le profil
    await connection.execute(
      `INSERT INTO user_profiles (user_id, bio, is_public, created_at, updated_at) 
       VALUES (?, ?, 1, NOW(), NOW())`,
      [userId, 'Utilisateur de test administrateur']
    );

    console.log(`✅ Utilisateur de test créé:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Mot de passe: ${testPassword}`);
    console.log(`   ID: ${userId}`);

  } catch (error) {
    console.error('❌ Erreur création utilisateur test:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-test')) {
    await createTestUser();
  }
  
  await checkUsers();
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkUsers,
  createTestUser
};