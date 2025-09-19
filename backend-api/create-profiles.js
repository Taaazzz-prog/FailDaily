const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');

async function createMissingProfiles() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '@51008473@Alexia@',
    database: 'faildaily'
  });
  
  console.log('🔧 Création des profils manquants...');
  
  // Récupérer l'utilisateur bruno@taaazzz.be
  const [users] = await connection.execute(
    'SELECT id, email FROM users WHERE email = ?',
    ['bruno@taaazzz.be']
  );
  
  if (users.length === 0) {
    console.log('❌ Utilisateur bruno@taaazzz.be non trouvé');
    process.exit(1);
  }
  
  const user = users[0];
  console.log('👤 Utilisateur trouvé:', user.email, '| ID:', user.id);
  
  // Vérifier si le profil existe déjà
  const [existingProfiles] = await connection.execute(
    'SELECT id FROM profiles WHERE user_id = ?',
    [user.id]
  );
  
  if (existingProfiles.length > 0) {
    console.log('✅ Profil existe déjà pour cet utilisateur');
  } else {
    // Créer le profil
    const profileId = uuidv4();
    
    const stats = {
      failsCount: 3,
      failsAnonymousCount: 0,
      reactionsReceived: 0,
      reactionsGiven: 0,
      commentsCount: 0,
      badgesCount: 0,
      couragePoints: 30,
      loginDays: 1,
      streakDays: 1
    };
    
    const ageVerification = {
      isVerified: true,
      ageCategory: 'adult',
      isEligible: true,
      isMinor: false,
      verifiedAt: new Date().toISOString()
    };
    
    const preferences = {
      theme: 'auto',
      notifications: {
        badges: true,
        reactions: true,
        comments: true
      }
    };
    
    await connection.execute(`
      INSERT INTO profiles (
        id, user_id, display_name, username, bio, avatar_url,
        registration_completed, legal_consent, age_verification,
        preferences, stats, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      profileId,
      user.id,
      'Bruno Testeur',
      'bruno_test',
      'Utilisateur de test pour FailDaily',
      null,
      1,
      1,
      JSON.stringify(ageVerification),
      JSON.stringify(preferences),
      JSON.stringify(stats)
    ]);
    
    console.log('✅ Profil créé avec succès pour', user.email);
  }
  
  // Maintenant retester la requête anonymes
  console.log('');
  console.log('🧪 Test de la requête /fails/anonymes après création du profil:');
  
  const [fails] = await connection.execute(`
    SELECT f.id, f.title, f.description, f.category, f.image_url, f.is_anonyme,
           f.created_at, f.updated_at, f.comments_count,
           CASE 
             WHEN f.is_anonyme = 1 THEN 'Utilisateur anonyme'
             ELSE p.display_name
           END as authorName,
           CASE 
             WHEN f.is_anonyme = 1 THEN NULL
             ELSE p.avatar_url
           END as authorAvatar,
           p.user_id as authorId
    FROM fails f
    JOIN profiles p ON f.user_id = p.user_id
    LEFT JOIN fail_moderation fm ON f.id = fm.fail_id
    WHERE fm.status IS NULL OR fm.status NOT IN ('hidden', 'rejected')
    ORDER BY f.created_at DESC
    LIMIT 20
  `);
  
  console.log('✅ Fails maintenant disponibles:', fails.length);
  fails.forEach((f, i) => {
    console.log(`${i+1}. "${f.title}" | Auteur: ${f.authorName}`);
  });
  
  await connection.end();
}

createMissingProfiles().catch(console.error);