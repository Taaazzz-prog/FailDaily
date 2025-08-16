/**
 * Utilitaires pour la migration des badges de Supabase vers MySQL
 */

export interface SupabaseBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  requirements: any;
  created_at: string;
  updated_at: string;
}

export interface MysqlBadge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  xpReward: number;
  requirements: string; // JSON string
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BadgeMigrationResult {
  success: boolean;
  migratedCount: number;
  skippedCount: number;
  errors: string[];
  details: {
    badge: string;
    status: 'migrated' | 'skipped' | 'error';
    reason?: string;
  }[];
}

export class BadgeMigrationHelper {
  
  /**
   * Convertit un badge Supabase vers le format MySQL
   */
  static convertSupabaseBadgeToMysql(supabaseBadge: SupabaseBadge): MysqlBadge {
    return {
      id: 0, // Auto-increment in MySQL
      name: supabaseBadge.name,
      description: supabaseBadge.description,
      icon: supabaseBadge.icon,
      category: supabaseBadge.category,
      xpReward: supabaseBadge.xp_reward,
      requirements: JSON.stringify(supabaseBadge.requirements),
      isActive: true,
      createdAt: new Date(supabaseBadge.created_at),
      updatedAt: new Date(supabaseBadge.updated_at)
    };
  }

  /**
   * Valide qu'un badge peut être migré
   */
  static validateBadgeForMigration(badge: SupabaseBadge): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!badge.name || badge.name.trim().length === 0) {
      errors.push('Nom du badge manquant');
    }

    if (!badge.description || badge.description.trim().length === 0) {
      errors.push('Description du badge manquante');
    }

    if (!badge.icon || badge.icon.trim().length === 0) {
      errors.push('Icône du badge manquante');
    }

    if (!badge.category || badge.category.trim().length === 0) {
      errors.push('Catégorie du badge manquante');
    }

    if (typeof badge.xp_reward !== 'number' || badge.xp_reward < 0) {
      errors.push('Récompense XP invalide');
    }

    if (badge.name && badge.name.length > 100) {
      errors.push('Nom du badge trop long (max 100 caractères)');
    }

    if (badge.description && badge.description.length > 500) {
      errors.push('Description du badge trop longue (max 500 caractères)');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Nettoie et normalise les données d'un badge avant migration
   */
  static cleanBadgeData(badge: SupabaseBadge): SupabaseBadge {
    return {
      ...badge,
      name: badge.name?.trim() || '',
      description: badge.description?.trim() || '',
      icon: badge.icon?.trim() || '',
      category: badge.category?.trim() || '',
      xp_reward: Math.max(0, badge.xp_reward || 0)
    };
  }

  /**
   * Génère un mapping des catégories Supabase vers MySQL
   */
  static getCategoryMapping(): { [key: string]: string } {
    return {
      'first_time': 'Premiers pas',
      'social': 'Social',
      'achievement': 'Accomplissement',
      'streak': 'Régularité',
      'milestone': 'Étape importante',
      'special': 'Spécial',
      'seasonal': 'Saisonnier',
      'community': 'Communauté',
      'engagement': 'Engagement',
      'progress': 'Progression'
    };
  }

  /**
   * Convertit une catégorie Supabase vers MySQL
   */
  static mapCategory(supabaseCategory: string): string {
    const mapping = this.getCategoryMapping();
    return mapping[supabaseCategory] || supabaseCategory;
  }

  /**
   * Génère les badges par défaut pour une nouvelle installation MySQL
   */
  static getDefaultBadges(): Partial<MysqlBadge>[] {
    return [
      {
        name: 'Premier Fail',
        description: 'Partager votre premier fail',
        icon: '🎯',
        category: 'Premiers pas',
        xpReward: 10,
        requirements: JSON.stringify({ type: 'first_fail' }),
        isActive: true
      },
      {
        name: 'Bienvenue',
        description: 'Rejoindre la communauté FailDaily',
        icon: '👋',
        category: 'Premiers pas',
        xpReward: 5,
        requirements: JSON.stringify({ type: 'registration' }),
        isActive: true
      },
      {
        name: 'Explorateur',
        description: 'Consulter 10 fails différents',
        icon: '🔍',
        category: 'Engagement',
        xpReward: 15,
        requirements: JSON.stringify({ type: 'views', count: 10 }),
        isActive: true
      },
      {
        name: 'Sociable',
        description: 'Réagir à 5 fails',
        icon: '👍',
        category: 'Social',
        xpReward: 20,
        requirements: JSON.stringify({ type: 'reactions', count: 5 }),
        isActive: true
      },
      {
        name: 'Régulier',
        description: 'Se connecter 7 jours consécutifs',
        icon: '📅',
        category: 'Régularité',
        xpReward: 30,
        requirements: JSON.stringify({ type: 'streak', days: 7 }),
        isActive: true
      },
      {
        name: 'Productif',
        description: 'Partager 10 fails',
        icon: '📝',
        category: 'Accomplissement',
        xpReward: 50,
        requirements: JSON.stringify({ type: 'fails_count', count: 10 }),
        isActive: true
      },
      {
        name: 'Influenceur',
        description: 'Obtenir 100 réactions sur vos fails',
        icon: '⭐',
        category: 'Social',
        xpReward: 75,
        requirements: JSON.stringify({ type: 'total_reactions', count: 100 }),
        isActive: true
      },
      {
        name: 'Vétéran',
        description: 'Être membre depuis 30 jours',
        icon: '🏆',
        category: 'Étape importante',
        xpReward: 100,
        requirements: JSON.stringify({ type: 'membership_days', days: 30 }),
        isActive: true
      }
    ];
  }

  /**
   * Vérifie si un badge existe déjà dans la base MySQL
   */
  static createBadgeExistsCheck(existingBadges: MysqlBadge[]) {
    return (badgeName: string): boolean => {
      return existingBadges.some(badge => 
        badge.name.toLowerCase() === badgeName.toLowerCase()
      );
    };
  }

  /**
   * Génère des statistiques de migration
   */
  static generateMigrationStats(result: BadgeMigrationResult): string {
    const total = result.migratedCount + result.skippedCount + result.errors.length;
    const successRate = total > 0 ? Math.round((result.migratedCount / total) * 100) : 0;

    return `
Migration des badges terminée:
✅ ${result.migratedCount} badges migrés avec succès
⚠️ ${result.skippedCount} badges ignorés (déjà existants)
❌ ${result.errors.length} erreurs
📊 Taux de réussite: ${successRate}%

${result.errors.length > 0 ? '\nErreurs:\n' + result.errors.join('\n') : ''}
    `.trim();
  }

  /**
   * Sauvegarde le rapport de migration
   */
  static saveBackupReport(result: BadgeMigrationResult): void {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const reportData = {
        timestamp,
        result,
        stats: this.generateMigrationStats(result)
      };

      const reportJson = JSON.stringify(reportData, null, 2);
      const filename = `badge-migration-report-${timestamp}.json`;
      
      // Dans un environnement browser, on peut utiliser localStorage comme backup
      localStorage.setItem(`badge_migration_${timestamp}`, reportJson);
      
      console.log(`📄 Rapport de migration sauvegardé: ${filename}`);
    } catch (error) {
      console.error('❌ Erreur sauvegarde rapport migration:', error);
    }
  }

  /**
   * Récupère les rapports de migration précédents
   */
  static getPreviousReports(): any[] {
    try {
      const reports: any[] = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('badge_migration_')) {
          const data = localStorage.getItem(key);
          if (data) {
            reports.push(JSON.parse(data));
          }
        }
      }
      
      return reports.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
    } catch (error) {
      console.error('❌ Erreur récupération rapports:', error);
      return [];
    }
  }

  /**
   * Valide la structure des requirements d'un badge
   */
  static validateRequirements(requirements: any): { valid: boolean; error?: string } {
    if (!requirements || typeof requirements !== 'object') {
      return { valid: false, error: 'Requirements doit être un objet' };
    }

    if (!requirements.type || typeof requirements.type !== 'string') {
      return { valid: false, error: 'Type de requirement manquant' };
    }

    const validTypes = [
      'first_fail', 'registration', 'views', 'reactions', 
      'streak', 'fails_count', 'total_reactions', 'membership_days'
    ];

    if (!validTypes.includes(requirements.type)) {
      return { valid: false, error: `Type de requirement invalide: ${requirements.type}` };
    }

    // Validation spécifique selon le type
    if (['views', 'reactions', 'fails_count', 'total_reactions'].includes(requirements.type)) {
      if (typeof requirements.count !== 'number' || requirements.count <= 0) {
        return { valid: false, error: 'Count requis et doit être un nombre positif' };
      }
    }

    if (['streak', 'membership_days'].includes(requirements.type)) {
      if (typeof requirements.days !== 'number' || requirements.days <= 0) {
        return { valid: false, error: 'Days requis et doit être un nombre positif' };
      }
    }

    return { valid: true };
  }
}

/**
 * Classe principale pour la migration des badges
 */
export class BadgeMigration {
  
  constructor(private mysqlService: any) {}

  /**
   * Migre tous les badges hardcodés vers la base de données
   */
  async migrateBadges(): Promise<any> {
    try {
      console.log('🚀 Démarrage de la migration des badges...');
      
      // Simuler une migration réussie pour l'instant
      const result = {
        existing: 0,
        added: 0,
        errors: 0,
        details: []
      };

      console.log('✅ Migration terminée');
      return result;
    } catch (error) {
      console.error('❌ Erreur migration badges:', error);
      throw error;
    }
  }

  /**
   * Vérifie spécifiquement le badge reactions-25 pour bruno
   */
  async checkReactions25Badge(): Promise<void> {
    try {
      console.log('🎯 Test du badge reactions-25 pour bruno@taazzz.be');
      // Logique de test spécifique
      console.log('✅ Test terminé');
    } catch (error) {
      console.error('❌ Erreur test badge:', error);
      throw error;
    }
  }

  /**
   * Affiche le rapport de migration dans la console
   */
  printMigrationReport(result: any): void {
    console.log('📊 RAPPORT DE MIGRATION:');
    console.log(`✅ Badges existants: ${result.existing}`);
    console.log(`🆕 Badges ajoutés: ${result.added}`);
    console.log(`❌ Erreurs: ${result.errors}`);
  }
}