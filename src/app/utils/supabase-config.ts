/**
 * Configuration et utilitaires pour la transition Supabase → MySQL
 * Ce fichier gère la configuration legacy Supabase et aide à la migration
 */

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceKey?: string;
  dbConfig?: {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
  };
}

export interface MigrationStatus {
  isCompleted: boolean;
  phase: 'preparation' | 'data_export' | 'mysql_import' | 'api_setup' | 'frontend_update' | 'cleanup' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  errors: string[];
  notes: string[];
}

/**
 * Configuration Supabase legacy (pour référence et migration)
 */
export const LEGACY_SUPABASE_CONFIG: SupabaseConfig = {
  url: 'https://your-project.supabase.co', // URL de votre ancien projet
  anonKey: 'your-anon-key', // Clé publique Supabase
  serviceKey: 'your-service-key', // Clé service pour l'admin (si nécessaire)
  dbConfig: {
    host: 'db.your-project.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'your-db-password'
  }
};

/**
 * Nouvelle configuration MySQL
 */
export const MYSQL_CONFIG = {
  host: 'localhost',
  port: 3306,
  database: 'faildaily',
  user: 'root',
  password: '', // Password WampServer si configuré
  apiUrl: 'http://localhost:3001/api'
};

/**
 * Classe pour gérer la transition Supabase → MySQL
 */
export class SupabaseMigrationHelper {
  
  /**
   * Vérifie le statut de la migration
   */
  static getMigrationStatus(): MigrationStatus {
    try {
      const stored = localStorage.getItem('migration_status');
      if (stored) {
        const status = JSON.parse(stored);
        return {
          ...status,
          startedAt: status.startedAt ? new Date(status.startedAt) : undefined,
          completedAt: status.completedAt ? new Date(status.completedAt) : undefined
        };
      }
    } catch (error) {
      console.warn('⚠️ Erreur lecture statut migration:', error);
    }

    // Statut par défaut
    return {
      isCompleted: false,
      phase: 'preparation',
      errors: [],
      notes: []
    };
  }

  /**
   * Met à jour le statut de la migration
   */
  static updateMigrationStatus(updates: Partial<MigrationStatus>): void {
    try {
      const current = this.getMigrationStatus();
      const updated = { ...current, ...updates };
      
      if (updates.phase === 'completed' && !updated.completedAt) {
        updated.completedAt = new Date();
        updated.isCompleted = true;
      }

      localStorage.setItem('migration_status', JSON.stringify(updated));
      console.log(`📊 Statut migration mis à jour: ${updated.phase}`);
    } catch (error) {
      console.error('❌ Erreur mise à jour statut migration:', error);
    }
  }

  /**
   * Démarre la migration
   */
  static startMigration(): void {
    this.updateMigrationStatus({
      phase: 'preparation',
      startedAt: new Date(),
      notes: ['Migration Supabase → MySQL démarrée']
    });
  }

  /**
   * Marque la migration comme terminée
   */
  static completeMigration(): void {
    this.updateMigrationStatus({
      phase: 'completed',
      isCompleted: true,
      completedAt: new Date(),
      notes: ['Migration Supabase → MySQL terminée avec succès']
    });
  }

  /**
   * Ajoute une erreur à la migration
   */
  static addMigrationError(error: string): void {
    const status = this.getMigrationStatus();
    status.errors.push(`[${new Date().toISOString()}] ${error}`);
    this.updateMigrationStatus({ errors: status.errors });
  }

  /**
   * Ajoute une note à la migration
   */
  static addMigrationNote(note: string): void {
    const status = this.getMigrationStatus();
    status.notes.push(`[${new Date().toISOString()}] ${note}`);
    this.updateMigrationStatus({ notes: status.notes });
  }

  /**
   * Nettoie les données Supabase du localStorage
   */
  static cleanupSupabaseData(): void {
    try {
      const supabaseKeys = [
        'sb-faildaily-auth-token',
        'sb-faildaily-user',
        'sb-faildaily-session',
        'supabase.auth.token',
        'supabase.session',
        // Ajouter d'autres clés Supabase si nécessaire
      ];

      let cleanedCount = 0;
      supabaseKeys.forEach(key => {
        if (localStorage.getItem(key)) {
          localStorage.removeItem(key);
          cleanedCount++;
        }
      });

      console.log(`🧹 Nettoyage Supabase: ${cleanedCount} éléments supprimés`);
      this.addMigrationNote(`Nettoyage localStorage Supabase: ${cleanedCount} éléments`);
    } catch (error) {
      console.error('❌ Erreur nettoyage données Supabase:', error);
      this.addMigrationError(`Erreur nettoyage Supabase: ${error}`);
    }
  }

  /**
   * Vérifie si des données Supabase sont encore présentes
   */
  static hasSupabaseData(): boolean {
    const supabaseKeys = [
      'sb-faildaily-auth-token',
      'sb-faildaily-user',
      'sb-faildaily-session'
    ];

    return supabaseKeys.some(key => !!localStorage.getItem(key));
  }

  /**
   * Sauvegarde les données Supabase avant migration
   */
  static backupSupabaseData(): any {
    try {
      const backup: any = {};
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
          backup[key] = localStorage.getItem(key);
        }
      }

      const timestamp = new Date().toISOString();
      const backupData = {
        timestamp,
        data: backup
      };

      localStorage.setItem('supabase_backup', JSON.stringify(backupData));
      console.log('💾 Sauvegarde données Supabase créée');
      return backupData;
    } catch (error) {
      console.error('❌ Erreur sauvegarde Supabase:', error);
      return null;
    }
  }

  /**
   * Restaure les données Supabase depuis la sauvegarde
   */
  static restoreSupabaseData(): boolean {
    try {
      const backup = localStorage.getItem('supabase_backup');
      if (!backup) {
        console.warn('⚠️ Aucune sauvegarde Supabase trouvée');
        return false;
      }

      const backupData = JSON.parse(backup);
      Object.entries(backupData.data).forEach(([key, value]) => {
        localStorage.setItem(key, value as string);
      });

      console.log('🔄 Données Supabase restaurées');
      return true;
    } catch (error) {
      console.error('❌ Erreur restauration Supabase:', error);
      return false;
    }
  }

  /**
   * Génère un rapport de migration
   */
  static generateMigrationReport(): string {
    const status = this.getMigrationStatus();
    const duration = status.startedAt && status.completedAt 
      ? Math.round((status.completedAt.getTime() - status.startedAt.getTime()) / 1000)
      : null;

    return `
=== RAPPORT DE MIGRATION SUPABASE → MYSQL ===

Statut: ${status.isCompleted ? '✅ Terminée' : '🔄 En cours'}
Phase actuelle: ${status.phase}
${status.startedAt ? `Démarrée le: ${status.startedAt.toLocaleString()}` : ''}
${status.completedAt ? `Terminée le: ${status.completedAt.toLocaleString()}` : ''}
${duration ? `Durée: ${duration} secondes` : ''}

📝 Notes (${status.notes.length}):
${status.notes.map(note => `  • ${note}`).join('\n')}

${status.errors.length > 0 ? `❌ Erreurs (${status.errors.length}):\n${status.errors.map(error => `  • ${error}`).join('\n')}` : '✅ Aucune erreur'}

=== CONFIGURATION ===

Ancienne configuration Supabase:
  URL: ${LEGACY_SUPABASE_CONFIG.url}
  Database: ${LEGACY_SUPABASE_CONFIG.dbConfig?.database}

Nouvelle configuration MySQL:
  Host: ${MYSQL_CONFIG.host}:${MYSQL_CONFIG.port}
  Database: ${MYSQL_CONFIG.database}
  API: ${MYSQL_CONFIG.apiUrl}

=== ÉTAPES DE MIGRATION ===

1. ✅ Préparation de l'environnement
2. ✅ Installation WampServer + MySQL
3. ✅ Export/Import de la base de données
4. ✅ Mise en place de l'API Node.js
5. ✅ Migration des services Angular
6. ${status.isCompleted ? '✅' : '🔄'} Tests et validation
7. ${status.isCompleted ? '✅' : '⏳'} Nettoyage final

`.trim();
  }

  /**
   * Valide que MySQL est opérationnel
   */
  static async validateMysqlConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${MYSQL_CONFIG.apiUrl}/health`);
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('❌ Échec test connexion MySQL:', error);
      return false;
    }
  }

  /**
   * Vérifie que l'ancien Supabase n'est plus utilisé
   */
  static async validateSupabaseDisconnection(): Promise<boolean> {
    try {
      // Vérifier qu'aucune requête Supabase n'est active
      const hasSupabaseAuth = this.hasSupabaseData();
      const hasSupabaseConfig = !!LEGACY_SUPABASE_CONFIG.url;
      
      return !hasSupabaseAuth; // OK si pas de données auth Supabase
    } catch (error) {
      console.error('❌ Erreur validation déconnexion Supabase:', error);
      return false;
    }
  }

  /**
   * Execute les vérifications post-migration
   */
  static async runPostMigrationChecks(): Promise<{ success: boolean; details: any }> {
    const checks = {
      mysqlConnection: await this.validateMysqlConnection(),
      supabaseDisconnection: await this.validateSupabaseDisconnection(),
      hasBackup: !!localStorage.getItem('supabase_backup'),
      migrationCompleted: this.getMigrationStatus().isCompleted
    };

    const success = Object.values(checks).every(check => check === true);
    
    return {
      success,
      details: checks
    };
  }
}

/**
 * Constantes pour la migration
 */
export const MIGRATION_PHASES = {
  PREPARATION: 'preparation',
  DATA_EXPORT: 'data_export',
  MYSQL_IMPORT: 'mysql_import',
  API_SETUP: 'api_setup',
  FRONTEND_UPDATE: 'frontend_update',
  CLEANUP: 'cleanup',
  COMPLETED: 'completed'
} as const;

/**
 * Messages de phase de migration
 */
export const MIGRATION_PHASE_MESSAGES = {
  [MIGRATION_PHASES.PREPARATION]: '🔧 Préparation de l\'environnement',
  [MIGRATION_PHASES.DATA_EXPORT]: '📤 Export des données Supabase',
  [MIGRATION_PHASES.MYSQL_IMPORT]: '📥 Import vers MySQL',
  [MIGRATION_PHASES.API_SETUP]: '🔌 Configuration API Node.js',
  [MIGRATION_PHASES.FRONTEND_UPDATE]: '🎨 Mise à jour frontend',
  [MIGRATION_PHASES.CLEANUP]: '🧹 Nettoyage final',
  [MIGRATION_PHASES.COMPLETED]: '✅ Migration terminée'
};

/**
 * Export par défaut pour compatibilité
 */
export default {
  SupabaseMigrationHelper,
  LEGACY_SUPABASE_CONFIG,
  MYSQL_CONFIG,
  MIGRATION_PHASES,
  MIGRATION_PHASE_MESSAGES
};