/**
 * TEST SPÉCIFIQUE: VALIDATION "PROCHAINS DÉFIS"
 * =============================================
 * 
 * Ce test se concentre spécifiquement sur la validation que les badges
 * débloqués n'apparaissent plus dans la liste "Prochains défis"
 */

const { executeQuery } = require('../src/config/database');

class NextChallengesValidator {
  
  /**
   * Test principal pour "Prochains défis"
   */
  async validateNextChallenges(userId) {
    console.log('🎯 === VALIDATION "PROCHAINS DÉFIS" ===');
    
    try {
      // 1. Récupérer les badges débloqués par l'utilisateur
      const unlockedBadges = await this.getUserUnlockedBadges(userId);
      console.log(`📊 Badges débloqués: ${unlockedBadges.length}`);
      
      // 2. Récupérer tous les badges disponibles
      const allBadges = await this.getAllAvailableBadges();
      console.log(`📊 Badges totaux: ${allBadges.length}`);
      
      // 3. Calculer les "Prochains défis" (badges non débloqués)
      const nextChallenges = this.calculateNextChallenges(allBadges, unlockedBadges);
      console.log(`🎯 Prochains défis: ${nextChallenges.length}`);
      
      // 4. Valider qu'aucun badge débloqué n'apparaît dans les prochains défis
      const validation = this.validateExclusion(nextChallenges, unlockedBadges);
      
      // 5. Test avec l'API frontend pour vérifier la cohérence
      await this.testFrontendAPI(userId);
      
      // 6. Générer le rapport
      this.generateValidationReport(validation, unlockedBadges, nextChallenges);
      
      return validation;
      
    } catch (error) {
      console.error('❌ Erreur validation "Prochains défis":', error);
      throw error;
    }
  }
  
  /**
   * Récupérer les badges débloqués par l'utilisateur
   */
  async getUserUnlockedBadges(userId) {
    const query = `
      SELECT ub.badge_id, bd.name, bd.category, bd.rarity, ub.unlocked_at
      FROM user_badges ub
      JOIN badge_definitions bd ON ub.badge_id = bd.id
      WHERE ub.user_id = ?
      ORDER BY ub.unlocked_at DESC
    `;
    
    return await executeQuery(query, [userId]);
  }
  
  /**
   * Récupérer tous les badges disponibles
   */
  async getAllAvailableBadges() {
    const query = `
      SELECT id, name, description, icon, category, rarity, 
             requirement_type, requirement_value
      FROM badge_definitions
      ORDER BY 
        CASE rarity 
          WHEN 'common' THEN 1 
          WHEN 'rare' THEN 2 
          WHEN 'epic' THEN 3 
          WHEN 'legendary' THEN 4 
        END,
        category, requirement_value
    `;
    
    return await executeQuery(query);
  }
  
  /**
   * Calculer les "Prochains défis" en excluant les badges débloqués
   */
  calculateNextChallenges(allBadges, unlockedBadges) {
    const unlockedIds = new Set(unlockedBadges.map(b => b.badge_id));
    
    return allBadges.filter(badge => !unlockedIds.has(badge.id));
  }
  
  /**
   * Valider que l'exclusion fonctionne correctement
   */
  validateExclusion(nextChallenges, unlockedBadges) {
    const unlockedIds = new Set(unlockedBadges.map(b => b.badge_id));
    const validation = {
      isValid: true,
      errors: [],
      details: {
        totalBadges: 0,
        unlockedCount: unlockedBadges.length,
        nextChallengesCount: nextChallenges.length,
        incorrectInclusions: []
      }
    };
    
    // Vérifier qu'aucun badge débloqué n'apparaît dans nextChallenges
    const incorrectInclusions = nextChallenges.filter(badge => 
      unlockedIds.has(badge.id)
    );
    
    if (incorrectInclusions.length > 0) {
      validation.isValid = false;
      validation.errors.push(
        `${incorrectInclusions.length} badges débloqués apparaissent encore dans "Prochains défis"`
      );
      validation.details.incorrectInclusions = incorrectInclusions;
    }
    
    // Vérifier la cohérence mathématique
    const expectedTotal = unlockedBadges.length + nextChallenges.length;
    validation.details.totalBadges = expectedTotal;
    
    return validation;
  }
  
  /**
   * Tester l'API frontend pour vérifier la cohérence
   */
  async testFrontendAPI(userId) {
    console.log('🔗 Test API frontend...');
    
    try {
      // Simuler l'appel GET /api/badges/available
      const availableBadges = await this.getAllAvailableBadges();
      
      // Simuler l'appel GET /api/users/:id/badges
      const userBadges = await this.getUserUnlockedBadges(userId);
      
      // Mapper selon la logique frontend
      const frontendMapped = availableBadges.map(badge => {
        const isUnlocked = userBadges.some(ub => ub.badge_id === badge.id);
        
        return {
          id: badge.id,
          name: badge.name,
          description: badge.description,
          icon: badge.icon,
          category: badge.category,
          rarity: badge.rarity,
          requirements: {
            type: badge.requirement_type,
            value: badge.requirement_value
          },
          isUnlocked: isUnlocked,
          unlockedAt: isUnlocked ? 
            userBadges.find(ub => ub.badge_id === badge.id)?.unlocked_at : null
        };
      });
      
      // Calculer les "Prochains défis" selon la logique frontend
      const frontendNextChallenges = frontendMapped.filter(b => !b.isUnlocked);
      
      console.log(`✅ API frontend: ${frontendNextChallenges.length} prochains défis`);
      
      return frontendNextChallenges;
      
    } catch (error) {
      console.error('❌ Erreur test API frontend:', error);
      return [];
    }
  }
  
  /**
   * Générer le rapport de validation
   */
  generateValidationReport(validation, unlockedBadges, nextChallenges) {
    console.log('\n🎯 === RAPPORT VALIDATION "PROCHAINS DÉFIS" ===');
    
    if (validation.isValid) {
      console.log('✅ VALIDATION RÉUSSIE!');
      console.log(`✅ Aucun badge débloqué dans "Prochains défis"`);
    } else {
      console.log('❌ VALIDATION ÉCHOUÉE!');
      validation.errors.forEach(error => {
        console.log(`❌ ${error}`);
      });
      
      if (validation.details.incorrectInclusions.length > 0) {
        console.log('\n🚨 Badges débloqués incorrectement inclus:');
        validation.details.incorrectInclusions.forEach(badge => {
          console.log(`  - ${badge.name} (${badge.id})`);
        });
      }
    }
    
    console.log('\n📊 STATISTIQUES:');
    console.log(`📌 Badges débloqués: ${validation.details.unlockedCount}`);
    console.log(`🎯 Prochains défis: ${validation.details.nextChallengesCount}`);
    console.log(`📊 Total cohérent: ${validation.details.totalBadges}`);
    
    // Afficher quelques exemples de badges débloqués
    if (unlockedBadges.length > 0) {
      console.log('\n🏆 Exemples badges débloqués:');
      unlockedBadges.slice(0, 5).forEach(badge => {
        console.log(`  ✅ ${badge.name} (${badge.category})`);
      });
    }
    
    // Afficher quelques exemples de prochains défis
    if (nextChallenges.length > 0) {
      console.log('\n🎯 Exemples prochains défis:');
      nextChallenges.slice(0, 5).forEach(badge => {
        console.log(`  🎯 ${badge.name} (${badge.requirement_type}=${badge.requirement_value})`);
      });
    }
  }
  
  /**
   * Test rapide avec un utilisateur spécifique
   */
  async quickTest(userEmail) {
    console.log(`🔍 Test rapide pour: ${userEmail}`);
    
    const user = await executeQuery(`
      SELECT id FROM users WHERE email = ?
    `, [userEmail]);
    
    if (user.length === 0) {
      throw new Error(`Utilisateur non trouvé: ${userEmail}`);
    }
    
    return await this.validateNextChallenges(user[0].id);
  }
}

module.exports = NextChallengesValidator;