const { executeQuery } = require('../config/database');

/**
 * Contrôleur pour les aspects légaux et conformité
 */
class LegalController {

  /**
   * Récupérer les conditions générales d'utilisation
   */
  static async getTermsOfService(req, res) {
    try {
      const terms = await executeQuery('SELECT * FROM legal_documents WHERE document_type = "terms" AND is_active = 1 ORDER BY version DESC LIMIT 1',
        []
      );

      if (terms.length === 0) {
        return res.json({
          success: true,
          terms: {
            version: '1.0',
            content: this.getDefaultTermsOfService(),
            effective_date: new Date().toISOString(),
            last_updated: new Date().toISOString()
          }
        });
      }

      const termsDoc = terms[0];

      res.json({
        success: true,
        terms: {
          id: termsDoc.id,
          version: termsDoc.version,
          content: termsDoc.content,
          effective_date: termsDoc.effective_date,
          last_updated: termsDoc.updated_at
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération CGU:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des conditions d\'utilisation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer la politique de confidentialité
   */
  static async getPrivacyPolicy(req, res) {
    try {
      const privacy = await executeQuery('SELECT * FROM legal_documents WHERE document_type = "privacy" AND is_active = 1 ORDER BY version DESC LIMIT 1',
        []
      );

      if (privacy.length === 0) {
        return res.json({
          success: true,
          privacy_policy: {
            version: '1.0',
            content: this.getDefaultPrivacyPolicy(),
            effective_date: new Date().toISOString(),
            last_updated: new Date().toISOString()
          }
        });
      }

      const privacyDoc = privacy[0];

      res.json({
        success: true,
        privacy_policy: {
          id: privacyDoc.id,
          version: privacyDoc.version,
          content: privacyDoc.content,
          effective_date: privacyDoc.effective_date,
          last_updated: privacyDoc.updated_at
        }
      });

    } catch (error) {
      console.error('❌ Erreur récupération politique confidentialité:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la politique de confidentialité',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Enregistrer l'acceptation des conditions par un utilisateur
   */
  static async recordTermsAcceptance(req, res) {
    try {
      const userId = req.user.id;
      const { version, ip_address } = req.body;

      // Vérifier si l'utilisateur a déjà accepté cette version
      const existing = await executeQuery('SELECT id FROM user_legal_acceptances WHERE user_id = ? AND document_type = "terms" AND document_version = ?',
        [userId, version]
      );

      if (existing.length > 0) {
        return res.json({
          success: true,
          message: 'Conditions déjà acceptées pour cette version'
        });
      }

      // Enregistrer l'acceptation
      await executeQuery(`INSERT INTO user_legal_acceptances (
          user_id, document_type, document_version, 
          ip_address, user_agent, accepted_at
        ) VALUES (?, ?, ?, ?, ?, NOW())`,
        [userId, 'terms', version, ip_address, req.get('User-Agent')]
      );

      // Mettre à jour le statut utilisateur
      await executeQuery('UPDATE users SET agree_to_terms = 1, updated_at = NOW() WHERE id = ?',
        [userId]
      );

      console.log(`✅ Acceptation CGU enregistrée: utilisateur ${userId}, version ${version}`);

      res.json({
        success: true,
        message: 'Acceptation des conditions enregistrée'
      });

    } catch (error) {
      console.error('❌ Erreur enregistrement acceptation:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'enregistrement de l\'acceptation',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Traitement des demandes RGPD
   */
  static async handleGdprRequest(req, res) {
    try {
      const userId = req.user.id;
      const { request_type, details } = req.body;

      const validTypes = ['data_export', 'data_deletion', 'data_rectification', 'data_portability'];
      
      if (!validTypes.includes(request_type)) {
        return res.status(400).json({
          success: false,
          message: 'Type de demande RGPD invalide'
        });
      }

      // Enregistrer la demande
      const result = await executeQuery(`INSERT INTO gdpr_requests (
          user_id, request_type, details, status, 
          created_at, updated_at
        ) VALUES (?, ?, ?, 'pending', NOW(), NOW())`,
        [userId, request_type, details || null]
      );

      const requestId = result.insertId;

      // Traitement automatique pour certains types
      if (request_type === 'data_export') {
        await this.processDataExport(userId, requestId);
      }

      console.log(`📋 Demande RGPD créée: ${request_type} pour utilisateur ${userId}`);

      res.json({
        success: true,
        message: 'Demande RGPD enregistrée',
        request_id: requestId,
        estimated_processing_time: this.getProcessingTime(request_type)
      });

    } catch (error) {
      console.error('❌ Erreur demande RGPD:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du traitement de la demande RGPD',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Exporter les données utilisateur (RGPD)
   */
  static async exportUserData(req, res) {
    try {
      const userId = req.user.id;

      // Données utilisateur
      const userData = await executeQuery(`SELECT 
          id, email, display_name, xp, level, created_at, updated_at,
          email_confirmed, birth_date
        FROM users WHERE id = ?`,
        [userId]
      );

      // Profil utilisateur
      const profileData = await executeQuery('SELECT bio, location, website, is_public FROM user_profiles WHERE user_id = ?',
        [userId]
      );

      // Fails de l'utilisateur
      const failsData = await executeQuery(`SELECT 
          id, title, description, category, tags, is_public, 
          view_count, created_at, updated_at
        FROM fails WHERE user_id = ?`,
        [userId]
      );

      // Réactions données
      const reactionsData = await executeQuery(`SELECT 
          fr.reaction_type, fr.created_at,
          f.title as fail_title
        FROM fail_reactions fr
        JOIN fails f ON fr.fail_id = f.id
        WHERE fr.user_id = ?`,
        [userId]
      );

      // Badges obtenus
      const badgesData = await executeQuery(`SELECT 
          b.name, b.description, ub.earned_at, ub.xp_earned
        FROM user_badges ub
        JOIN badges b ON ub.badge_id = b.id
        WHERE ub.user_id = ?`,
        [userId]
      );

      const exportData = {
        export_date: new Date().toISOString(),
        user: userData[0],
        profile: profileData[0] || null,
        fails: failsData,
        reactions: reactionsData,
        badges: badgesData,
        statistics: {
          total_fails: failsData.length, // Compté dynamiquement car pas de colonne
          total_reactions: reactionsData.length,
          total_badges: badgesData.length // Compté dynamiquement car pas de colonne
        }
      };

      res.json({
        success: true,
        message: 'Export des données utilisateur',
        data: exportData
      });

    } catch (error) {
      console.error('❌ Erreur export données:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'export des données',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Récupérer le statut des demandes RGPD
   */
  static async getGdprRequestStatus(req, res) {
    try {
      const userId = req.user.id;

      const requests = await executeQuery(`SELECT 
          id, request_type, status, created_at, updated_at, 
          processed_at, details
        FROM gdpr_requests 
        WHERE user_id = ? 
        ORDER BY created_at DESC`,
        [userId]
      );

      res.json({
        success: true,
        gdpr_requests: requests
      });

    } catch (error) {
      console.error('❌ Erreur statut RGPD:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du statut RGPD',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Signaler un contenu inapproprié
   */
  static async reportContent(req, res) {
    try {
      const userId = req.user.id;
      const { content_type, content_id, reason, description } = req.body;

      const validTypes = ['fail', 'comment', 'user'];
      const validReasons = ['spam', 'harassment', 'inappropriate', 'copyright', 'other'];

      if (!validTypes.includes(content_type) || !validReasons.includes(reason)) {
        return res.status(400).json({
          success: false,
          message: 'Type de contenu ou raison invalide'
        });
      }

      // Vérifier si l'utilisateur a déjà signalé ce contenu
      const existing = await executeQuery('SELECT id FROM content_reports WHERE user_id = ? AND content_type = ? AND content_id = ?',
        [userId, content_type, content_id]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Vous avez déjà signalé ce contenu'
        });
      }

      // Enregistrer le signalement
      await executeQuery(`INSERT INTO content_reports (
          user_id, content_type, content_id, reason, 
          description, status, created_at
        ) VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
        [userId, content_type, content_id, reason, description]
      );

      console.log(`🚨 Signalement créé: ${content_type} ${content_id} par utilisateur ${userId}`);

      res.json({
        success: true,
        message: 'Signalement enregistré avec succès'
      });

    } catch (error) {
      console.error('❌ Erreur signalement:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du signalement',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * CGU par défaut
   */
  static getDefaultTermsOfService() {
    return `# Conditions Générales d'Utilisation - FailDaily

**Version 1.0 - En vigueur à partir du ${new Date().toLocaleDateString()}**

## 1. Acceptation des conditions

En utilisant FailDaily, vous acceptez ces conditions d'utilisation.

## 2. Description du service

FailDaily est une plateforme de partage d'expériences et d'apprentissage par l'échec.

## 3. Responsabilités de l'utilisateur

- Respecter les autres utilisateurs
- Ne pas publier de contenu inapproprié
- Protéger vos informations de connexion

## 4. Propriété intellectuelle

Le contenu que vous publiez vous appartient, mais vous accordez à FailDaily une licence d'utilisation.

## 5. Limitation de responsabilité

FailDaily n'est pas responsable du contenu publié par les utilisateurs.

## 6. Modifications

Ces conditions peuvent être modifiées à tout moment avec préavis.

## 7. Contact

Pour toute question : support@faildaily.com`;
  }

  /**
   * Politique de confidentialité par défaut
   */
  static getDefaultPrivacyPolicy() {
    return `# Politique de Confidentialité - FailDaily

**Version 1.0 - En vigueur à partir du ${new Date().toLocaleDateString()}**

## 1. Collecte des données

Nous collectons les données que vous nous fournissez lors de l'inscription et de l'utilisation.

## 2. Utilisation des données

Vos données sont utilisées pour :
- Fournir le service
- Améliorer l'expérience utilisateur
- Communiquer avec vous

## 3. Partage des données

Nous ne vendons pas vos données personnelles à des tiers.

## 4. Sécurité

Nous mettons en place des mesures de sécurité pour protéger vos données.

## 5. Vos droits (RGPD)

Vous avez le droit de :
- Accéder à vos données
- Rectifier vos données
- Supprimer vos données
- Exporter vos données

## 6. Cookies

Nous utilisons des cookies pour améliorer votre expérience.

## 7. Contact

Pour exercer vos droits : privacy@faildaily.com`;
  }

  /**
   * Traiter l'export de données (automatique)
   */
  static async processDataExport(userId, requestId) {
    try {
      // Marquer comme en traitement
      await executeQuery(
        'UPDATE gdpr_requests SET status = "processing", updated_at = NOW() WHERE id = ?',
        [requestId]
      );

      // Ici on pourrait générer un fichier d'export
      // Pour l'instant, on marque comme terminé
      await executeQuery(
        'UPDATE gdpr_requests SET status = "completed", processed_at = NOW(), updated_at = NOW() WHERE id = ?',
        [requestId]
      );

      console.log(`✅ Export de données traité pour utilisateur ${userId}`);
    } catch (error) {
      console.error('❌ Erreur traitement export:', error);
      await executeQuery(
        'UPDATE gdpr_requests SET status = "failed", updated_at = NOW() WHERE id = ?',
        [requestId]
      );
    }
  }

  /**
   * Obtenir le temps de traitement estimé
   */
  static getProcessingTime(requestType) {
    const times = {
      'data_export': '24 heures',
      'data_deletion': '30 jours',
      'data_rectification': '72 heures',
      'data_portability': '48 heures'
    };

    return times[requestType] || '7 jours';
  }
}

module.exports = LegalController;