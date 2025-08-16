const { executeQuery } = require('../config/database');

/**
 * Contrôleur pour la vérification d'âge
 */
class AgeVerificationController {

  /**
   * Vérifier l'âge d'un utilisateur
   */
  static async verifyAge(req, res) {
    try {
      const { birthDate } = req.body;

      if (!birthDate) {
        return res.status(400).json({
          success: false,
          message: 'Date de naissance requise'
        });
      }

      const birthDateObj = new Date(birthDate);
      const today = new Date();
      
      // Vérifier que la date est valide
      if (isNaN(birthDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format de date invalide'
        });
      }

      // Vérifier que la date n'est pas dans le futur
      if (birthDateObj > today) {
        return res.status(400).json({
          success: false,
          message: 'La date de naissance ne peut pas être dans le futur'
        });
      }

      // Calculer l'âge
      const age = this.calculateAge(birthDateObj);

      // Vérifier l'âge minimum (13 ans pour les réseaux sociaux)
      const minimumAge = 13;
      const isEligible = age >= minimumAge;

      // Déterminer la catégorie d'âge
      let ageCategory = 'adult';
      if (age < 13) {
        ageCategory = 'child';
      } else if (age < 18) {
        ageCategory = 'teen';
      } else if (age < 65) {
        ageCategory = 'adult';
      } else {
        ageCategory = 'senior';
      }

      // Log de la vérification
      console.log(`🔍 Vérification d'âge: ${age} ans (${ageCategory}) - Éligible: ${isEligible}`);

      res.json({
        success: true,
        verification: {
          age,
          ageCategory,
          isEligible,
          minimumAge,
          message: isEligible 
            ? 'Âge vérifié avec succès'
            : `Vous devez avoir au moins ${minimumAge} ans pour utiliser cette application`
        }
      });

    } catch (error) {
      console.error('❌ Erreur vérification d\'âge:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification d\'âge',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Mettre à jour la date de naissance d'un utilisateur
   */
  static async updateBirthDate(req, res) {
    try {
      const userId = req.user.id;
      const { birthDate } = req.body;

      if (!birthDate) {
        return res.status(400).json({
          success: false,
          message: 'Date de naissance requise'
        });
      }

      const birthDateObj = new Date(birthDate);
      
      // Vérifications de base
      if (isNaN(birthDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Format de date invalide'
        });
      }

      if (birthDateObj > new Date()) {
        return res.status(400).json({
          success: false,
          message: 'La date de naissance ne peut pas être dans le futur'
        });
      }

      // Vérifier l'âge minimum
      const age = this.calculateAge(birthDateObj);
      if (age < 13) {
        return res.status(400).json({
          success: false,
          message: 'Vous devez avoir au moins 13 ans pour utiliser cette application'
        });
      }

      // Vérifier si l'utilisateur existe
      const users = await executeQuery(
        req.dbConnection,
        'SELECT id, birth_date FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Mettre à jour la date de naissance
      await executeQuery(
        req.dbConnection,
        'UPDATE users SET birth_date = ?, updated_at = NOW() WHERE id = ?',
        [birthDate, userId]
      );

      // Log de la mise à jour
      console.log(`📅 Date de naissance mise à jour pour l'utilisateur ${userId}: ${age} ans`);

      res.json({
        success: true,
        message: 'Date de naissance mise à jour avec succès',
        age,
        ageCategory: this.getAgeCategory(age)
      });

    } catch (error) {
      console.error('❌ Erreur mise à jour date de naissance:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de la date de naissance',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtenir les statistiques d'âge des utilisateurs
   */
  static async getAgeStatistics(req, res) {
    try {
      const stats = await executeQuery(
        req.dbConnection,
        `SELECT 
          COUNT(*) as total_users,
          AVG(YEAR(CURDATE()) - YEAR(birth_date) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(birth_date, '%m%d'))) as average_age,
          COUNT(CASE WHEN YEAR(CURDATE()) - YEAR(birth_date) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(birth_date, '%m%d')) BETWEEN 13 AND 17 THEN 1 END) as teens,
          COUNT(CASE WHEN YEAR(CURDATE()) - YEAR(birth_date) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(birth_date, '%m%d')) BETWEEN 18 AND 24 THEN 1 END) as young_adults,
          COUNT(CASE WHEN YEAR(CURDATE()) - YEAR(birth_date) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(birth_date, '%m%d')) BETWEEN 25 AND 34 THEN 1 END) as adults_25_34,
          COUNT(CASE WHEN YEAR(CURDATE()) - YEAR(birth_date) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(birth_date, '%m%d')) BETWEEN 35 AND 44 THEN 1 END) as adults_35_44,
          COUNT(CASE WHEN YEAR(CURDATE()) - YEAR(birth_date) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(birth_date, '%m%d')) BETWEEN 45 AND 54 THEN 1 END) as adults_45_54,
          COUNT(CASE WHEN YEAR(CURDATE()) - YEAR(birth_date) - (DATE_FORMAT(CURDATE(), '%m%d') < DATE_FORMAT(birth_date, '%m%d')) >= 55 THEN 1 END) as seniors
        FROM users 
        WHERE birth_date IS NOT NULL`
      );

      const ageStats = stats[0];

      // Calculer les pourcentages
      const total = ageStats.total_users;
      const percentages = {
        teens: total > 0 ? Math.round((ageStats.teens / total) * 100) : 0,
        young_adults: total > 0 ? Math.round((ageStats.young_adults / total) * 100) : 0,
        adults_25_34: total > 0 ? Math.round((ageStats.adults_25_34 / total) * 100) : 0,
        adults_35_44: total > 0 ? Math.round((ageStats.adults_35_44 / total) * 100) : 0,
        adults_45_54: total > 0 ? Math.round((ageStats.adults_45_54 / total) * 100) : 0,
        seniors: total > 0 ? Math.round((ageStats.seniors / total) * 100) : 0
      };

      res.json({
        success: true,
        statistics: {
          total_users: ageStats.total_users,
          average_age: Math.round(ageStats.average_age * 10) / 10,
          age_groups: {
            teens_13_17: {
              count: ageStats.teens,
              percentage: percentages.teens
            },
            young_adults_18_24: {
              count: ageStats.young_adults,
              percentage: percentages.young_adults
            },
            adults_25_34: {
              count: ageStats.adults_25_34,
              percentage: percentages.adults_25_34
            },
            adults_35_44: {
              count: ageStats.adults_35_44,
              percentage: percentages.adults_35_44
            },
            adults_45_54: {
              count: ageStats.adults_45_54,
              percentage: percentages.adults_45_54
            },
            seniors_55_plus: {
              count: ageStats.seniors,
              percentage: percentages.seniors
            }
          }
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération statistiques d\'âge:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques d\'âge',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Vérifier la conformité COPPA (Children's Online Privacy Protection Act)
   */
  static async checkCoppaCompliance(req, res) {
    try {
      const { birthDate } = req.body;

      if (!birthDate) {
        return res.status(400).json({
          success: false,
          message: 'Date de naissance requise pour la vérification COPPA'
        });
      }

      const age = this.calculateAge(new Date(birthDate));
      
      // COPPA s'applique aux enfants de moins de 13 ans
      const isCoppaApplicable = age < 13;
      const canRegister = age >= 13;

      res.json({
        success: true,
        coppa_compliance: {
          age,
          is_coppa_applicable: isCoppaApplicable,
          can_register: canRegister,
          requires_parental_consent: isCoppaApplicable,
          message: isCoppaApplicable 
            ? 'Consentement parental requis pour les utilisateurs de moins de 13 ans'
            : 'Utilisateur éligible pour l\'inscription'
        }
      });

    } catch (error) {
      console.error('❌ Erreur vérification COPPA:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la vérification de conformité COPPA',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Obtenir l'âge d'un utilisateur spécifique
   */
  static async getUserAge(req, res) {
    try {
      const userId = req.user.id;

      const users = await executeQuery(
        req.dbConnection,
        'SELECT birth_date FROM users WHERE id = ?',
        [userId]
      );

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      const user = users[0];

      if (!user.birth_date) {
        return res.status(400).json({
          success: false,
          message: 'Date de naissance non renseignée'
        });
      }

      const age = this.calculateAge(new Date(user.birth_date));
      const ageCategory = this.getAgeCategory(age);

      res.json({
        success: true,
        age_info: {
          age,
          age_category: ageCategory,
          birth_date: user.birth_date,
          is_adult: age >= 18,
          is_teen: age >= 13 && age < 18
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération âge utilisateur:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'âge utilisateur',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Calculer l'âge à partir d'une date de naissance
   */
  static calculateAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  /**
   * Déterminer la catégorie d'âge
   */
  static getAgeCategory(age) {
    if (age < 13) return 'child';
    if (age < 18) return 'teen';
    if (age < 25) return 'young_adult';
    if (age < 35) return 'adult';
    if (age < 55) return 'middle_aged';
    return 'senior';
  }

  /**
   * Valider le format de date
   */
  static isValidDate(dateString) {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  }

  /**
   * Vérifier si une date est dans une plage raisonnable
   */
  static isReasonableAge(birthDate) {
    const age = this.calculateAge(birthDate);
    return age >= 0 && age <= 120; // Plage d'âge raisonnable
  }
}

module.exports = AgeVerificationController;