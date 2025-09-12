const mysql = require('mysql2/promise');

/**
 * Script pour vérifier et corriger les âges dans les profils utilisateurs
 */

const dbConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Mot de passe WampServer si configuré
  database: 'faildaily'
};

/**
 * Calcule l'âge à partir d'une date de naissance
 */
function calculateAge(birthDate) {
  if (!birthDate) return null;
  
  const birth = new Date(birthDate);
  const today = new Date();
  
  if (birth > today) return null; // Date future
  
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * Détermine la catégorie d'âge selon COPPA
 */
function determineAgeCategory(age) {
  if (age === null || age < 0) return 'unknown';
  if (age < 13) return 'child';
  if (age < 18) return 'teen';
  return 'adult';
}

/**
 * Valide une date de naissance
 */
function validateBirthDate(birthDate) {
  if (!birthDate) return { valid: false, reason: 'Date manquante' };
  
  const date = new Date(birthDate);
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 120, today.getMonth(), today.getDate()); // 120 ans max
  
  if (isNaN(date.getTime())) {
    return { valid: false, reason: 'Format de date invalide' };
  }
  
  if (date > today) {
    return { valid: false, reason: 'Date dans le futur' };
  }
  
  if (date < minDate) {
    return { valid: false, reason: 'Date trop ancienne (> 120 ans)' };
  }
  
  return { valid: true };
}

async function checkProfileAges() {
  let connection;

  try {
    console.log('🔍 Connexion à la base de données MySQL...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connexion établie');

    // Récupérer tous les profils avec dates de naissance
    console.log('\n📊 === ANALYSE DES ÂGES DANS LES PROFILS ===');
    
    const profiles = await connection.execute(`
      SELECT 
        up.user_id,
        u.email,
        u.display_name,
        up.birth_date,
        up.age_category,
        up.created_at,
        up.updated_at
      FROM user_profiles up
      JOIN users u ON up.user_id = u.id
      ORDER BY up.user_id
    `);

    console.log(`\n👤 Nombre total de profils: ${profiles[0].length}`);

    if (profiles[0].length === 0) {
      console.log('❌ Aucun profil trouvé');
      return;
    }

    let validProfiles = 0;
    let invalidProfiles = 0;
    let missingBirthDates = 0;
    let inconsistentCategories = 0;
    let updates = [];

    console.log('\n📋 Analyse détaillée:');
    console.log('=' .repeat(80));

    for (const profile of profiles[0]) {
      const { user_id, email, display_name, birth_date, age_category } = profile;
      
      console.log(`\n👤 Utilisateur: ${display_name} (${email})`);
      console.log(`   ID: ${user_id}`);
      console.log(`   Date de naissance: ${birth_date || 'Non renseignée'}`);
      console.log(`   Catégorie actuelle: ${age_category || 'Non définie'}`);

      if (!birth_date) {
        console.log('   ⚠️ Date de naissance manquante');
        missingBirthDates++;
        continue;
      }

      // Valider la date de naissance
      const validation = validateBirthDate(birth_date);
      if (!validation.valid) {
        console.log(`   ❌ Date invalide: ${validation.reason}`);
        invalidProfiles++;
        continue;
      }

      // Calculer l'âge actuel
      const currentAge = calculateAge(birth_date);
      const correctCategory = determineAgeCategory(currentAge);

      console.log(`   📅 Âge calculé: ${currentAge} ans`);
      console.log(`   🏷️ Catégorie correcte: ${correctCategory}`);

      if (age_category !== correctCategory) {
        console.log(`   🔄 Correction nécessaire: ${age_category} → ${correctCategory}`);
        inconsistentCategories++;
        
        updates.push({
          user_id,
          email,
          current_category: age_category,
          correct_category: correctCategory,
          age: currentAge
        });
      } else {
        console.log('   ✅ Catégorie correcte');
        validProfiles++;
      }
    }

    // Résumé des analyses
    console.log('\n📊 === RÉSUMÉ DE L\'ANALYSE ===');
    console.log(`✅ Profils valides: ${validProfiles}`);
    console.log(`❌ Profils invalides: ${invalidProfiles}`);
    console.log(`⚠️ Dates manquantes: ${missingBirthDates}`);
    console.log(`🔄 Corrections nécessaires: ${inconsistentCategories}`);

    // Proposer les corrections
    if (updates.length > 0) {
      console.log('\n🔧 === CORRECTIONS PROPOSÉES ===');
      
      for (const update of updates) {
        console.log(`👤 ${update.email}: ${update.current_category} → ${update.correct_category} (${update.age} ans)`);
      }

      console.log('\n❓ Appliquer les corrections automatiquement ? (Utilisez --fix pour corriger)');
    }

    // Statistiques par catégorie d'âge
    console.log('\n📈 === STATISTIQUES PAR CATÉGORIE ===');
    
    const categoryStats = await connection.execute(`
      SELECT 
        age_category,
        COUNT(*) as count,
        MIN(birth_date) as oldest_birth,
        MAX(birth_date) as youngest_birth
      FROM user_profiles 
      WHERE birth_date IS NOT NULL 
      GROUP BY age_category
      ORDER BY age_category
    `);

    if (categoryStats[0].length > 0) {
      for (const stat of categoryStats[0]) {
        const oldestAge = calculateAge(stat.oldest_birth);
        const youngestAge = calculateAge(stat.youngest_birth);
        
        console.log(`🏷️ ${stat.age_category || 'Non définie'}: ${stat.count} utilisateurs`);
        console.log(`   📅 Âges: ${youngestAge} - ${oldestAge} ans`);
      }
    }

    console.log('\n✅ Analyse terminée avec succès !');
    
    return updates;

  } catch (error) {
    console.error('❌ Erreur lors de l\'analyse:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

/**
 * Corrige automatiquement les catégories d'âge incorrectes
 */
async function fixAgeCategories() {
  let connection;

  try {
    console.log('🔧 Démarrage de la correction automatique...');
    connection = await mysql.createConnection(dbConfig);

    // Récupérer les profils à corriger
    const updates = await checkProfileAges();
    
    if (!updates || updates.length === 0) {
      console.log('✅ Aucune correction nécessaire');
      return;
    }

    console.log(`\n🔄 Correction de ${updates.length} profils...`);

    let corrected = 0;
    let errors = 0;

    for (const update of updates) {
      try {
        await connection.execute(
          'UPDATE user_profiles SET age_category = ?, updated_at = NOW() WHERE user_id = ?',
          [update.correct_category, update.user_id]
        );

        console.log(`✅ ${update.email}: Corrigé vers ${update.correct_category}`);
        corrected++;

      } catch (error) {
        console.error(`❌ Erreur correction ${update.email}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Résultats de la correction:`);
    console.log(`✅ Corrections réussies: ${corrected}`);
    console.log(`❌ Erreurs: ${errors}`);

    if (corrected > 0) {
      console.log('\n🎉 Corrections appliquées avec succès !');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

/**
 * Crée un rapport détaillé des âges
 */
async function generateAgeReport() {
  let connection;

  try {
    console.log('📊 Génération du rapport d\'âge...');
    connection = await mysql.createConnection(dbConfig);

    // Statistiques globales
    const globalStats = await connection.execute(`
      SELECT 
        COUNT(*) as total_profiles,
        COUNT(birth_date) as profiles_with_birth_date,
        COUNT(CASE WHEN age_category = 'child' THEN 1 END) as children,
        COUNT(CASE WHEN age_category = 'teen' THEN 1 END) as teens,
        COUNT(CASE WHEN age_category = 'adult' THEN 1 END) as adults,
        COUNT(CASE WHEN age_category IS NULL OR age_category = 'unknown' THEN 1 END) as unknown
      FROM user_profiles
    `);

    const stats = globalStats[0][0];

    console.log('\n📈 === RAPPORT D\'ÂGE DÉTAILLÉ ===');
    console.log(`📊 Profils total: ${stats.total_profiles}`);
    console.log(`📅 Avec date de naissance: ${stats.profiles_with_birth_date}`);
    console.log(`👶 Enfants (< 13 ans): ${stats.children}`);
    console.log(`🧑 Adolescents (13-17 ans): ${stats.teens}`);
    console.log(`👩 Adultes (18+ ans): ${stats.adults}`);
    console.log(`❓ Âge inconnu: ${stats.unknown}`);

    // Distribution par âge
    const ageDistribution = await connection.execute(`
      SELECT 
        YEAR(CURDATE()) - YEAR(birth_date) - 
        (RIGHT(CURDATE(), 5) < RIGHT(birth_date, 5)) as age,
        COUNT(*) as count
      FROM user_profiles 
      WHERE birth_date IS NOT NULL
      GROUP BY age
      ORDER BY age
    `);

    if (ageDistribution[0].length > 0) {
      console.log('\n📈 Distribution par âge:');
      for (const dist of ageDistribution[0]) {
        const category = determineAgeCategory(dist.age);
        const categoryIcon = category === 'child' ? '👶' : category === 'teen' ? '🧑' : '👩';
        console.log(`   ${categoryIcon} ${dist.age} ans: ${dist.count} utilisateur(s)`);
      }
    }

    console.log('\n✅ Rapport généré avec succès !');

  } catch (error) {
    console.error('❌ Erreur génération rapport:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Fonction principale
async function main() {
  const args = process.argv.slice(2);
  
  try {
    if (args.includes('--fix')) {
      await fixAgeCategories();
    } else if (args.includes('--report')) {
      await generateAgeReport();
    } else {
      await checkProfileAges();
    }
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  }
}

// Aide
function showHelp() {
  console.log(`
📖 Utilisation: node profile-age-check.js [options]

Options:
  (aucune)    Analyser les âges et détecter les incohérences
  --fix       Corriger automatiquement les catégories d'âge
  --report    Générer un rapport détaillé des âges
  --help      Afficher cette aide

Exemples:
  node profile-age-check.js           # Analyse simple
  node profile-age-check.js --fix     # Corriger automatiquement
  node profile-age-check.js --report  # Rapport détaillé
  `);
}

// Vérifier l'aide
if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

// Exécuter si appelé directement
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkProfileAges,
  fixAgeCategories,
  generateAgeReport,
  calculateAge,
  determineAgeCategory,
  validateBirthDate
};
