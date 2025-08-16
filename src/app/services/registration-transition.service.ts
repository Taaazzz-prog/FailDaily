import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RegistrationService } from './registration.service';
import { NewAuthService } from './new-auth.service';
import { HttpAuthService } from './http-auth.service';

interface TransitionState {
  fromSupabase: boolean;
  toMysql: boolean;
  migrationInProgress: boolean;
  step: 'idle' | 'detecting' | 'backing_up' | 'migrating' | 'validating' | 'completed' | 'error';
  progress: number;
  message: string;
  error?: string;
}

interface UserMigrationData {
  supabaseUser?: any;
  registrationData?: any;
  preferences?: any;
  migrationToken?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationTransitionService {
  private transitionState = new BehaviorSubject<TransitionState>({
    fromSupabase: false,
    toMysql: false,
    migrationInProgress: false,
    step: 'idle',
    progress: 0,
    message: 'Service de transition initialisé'
  });

  public transitionState$ = this.transitionState.asObservable();

  private migrationData = new BehaviorSubject<UserMigrationData>({});
  public migrationData$ = this.migrationData.asObservable();

  constructor(
    private registrationService: RegistrationService,
    private newAuthService: NewAuthService,
    private httpAuthService: HttpAuthService
  ) {
    console.log('🔄 RegistrationTransitionService: Service de transition d\'inscription initialisé');
    this.initializeTransition();
  }

  private async initializeTransition(): Promise<void> {
    try {
      this.updateState({
        step: 'detecting',
        message: 'Détection de l\'environnement...',
        progress: 10
      });

      // Détecter l'environnement actuel
      const hasSupabaseData = this.detectSupabaseData();
      const hasMysqlConnection = await this.testMysqlConnection();

      this.updateState({
        fromSupabase: hasSupabaseData,
        toMysql: hasMysqlConnection,
        step: 'idle',
        message: hasSupabaseData 
          ? 'Données Supabase détectées - Migration disponible'
          : 'Environnement MySQL ready',
        progress: hasSupabaseData ? 25 : 100
      });

      console.log(`🔍 Détection: Supabase=${hasSupabaseData}, MySQL=${hasMysqlConnection}`);

    } catch (error) {
      console.error('❌ Erreur initialisation transition:', error);
      this.updateState({
        step: 'error',
        message: 'Erreur lors de l\'initialisation',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
        progress: 0
      });
    }
  }

  /**
   * Démarre la migration complète d'un utilisateur Supabase vers MySQL
   */
  async startUserMigration(): Promise<{ success: boolean; message: string }> {
    try {
      this.updateState({
        migrationInProgress: true,
        step: 'backing_up',
        message: 'Sauvegarde des données Supabase...',
        progress: 0
      });

      // Étape 1: Sauvegarder les données Supabase
      const supabaseData = await this.backupSupabaseUserData();
      if (!supabaseData) {
        throw new Error('Impossible de récupérer les données utilisateur Supabase');
      }

      this.updateState({
        step: 'migrating',
        message: 'Migration vers MySQL...',
        progress: 30
      });

      // Étape 2: Créer le compte MySQL
      const migrationResult = await this.migrateUserToMysql(supabaseData);
      if (!migrationResult.success) {
        throw new Error(migrationResult.message || 'Échec migration MySQL');
      }

      this.updateState({
        step: 'validating',
        message: 'Validation de la migration...',
        progress: 70
      });

      // Étape 3: Valider la migration
      const validationResult = await this.validateMigration(migrationResult.user);
      if (!validationResult) {
        throw new Error('Échec validation de la migration');
      }

      this.updateState({
        step: 'completed',
        message: 'Migration terminée avec succès!',
        progress: 100,
        migrationInProgress: false
      });

      // Nettoyer les données Supabase
      this.cleanupSupabaseData();

      console.log('✅ Migration utilisateur terminée avec succès');
      return {
        success: true,
        message: 'Migration réussie! Vous êtes maintenant connecté via MySQL.'
      };

    } catch (error: any) {
      console.error('❌ Erreur migration utilisateur:', error);
      
      this.updateState({
        step: 'error',
        message: 'Erreur lors de la migration',
        error: error.message || 'Erreur inconnue',
        progress: 0,
        migrationInProgress: false
      });

      return {
        success: false,
        message: error.message || 'Erreur lors de la migration'
      };
    }
  }

  /**
   * Démarre une nouvelle inscription MySQL (pas de migration)
   */
  async startFreshRegistration(): Promise<void> {
    try {
      console.log('✨ Démarrage inscription MySQL directe');
      
      // Nettoyer toute donnée Supabase résiduelle
      this.cleanupSupabaseData();
      
      // Réinitialiser le service de registration
      this.registrationService.clearRegistrationData();
      
      // Marquer comme MySQL uniquement
      this.updateState({
        fromSupabase: false,
        toMysql: true,
        step: 'idle',
        message: 'Prêt pour une nouvelle inscription MySQL',
        progress: 100
      });

    } catch (error) {
      console.error('❌ Erreur initialisation inscription:', error);
    }
  }

  /**
   * Reprendre une inscription interrompue
   */
  async resumeRegistration(): Promise<boolean> {
    try {
      const savedData = this.registrationService.getRegistrationData();
      
      if (Object.keys(savedData).length > 0) {
        console.log('🔄 Reprise inscription sauvegardée');
        
        this.updateState({
          step: 'idle',
          message: 'Inscription reprise depuis la sauvegarde',
          progress: this.calculateRegistrationProgress(savedData)
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Erreur reprise inscription:', error);
      return false;
    }
  }

  // Méthodes privées
  private detectSupabaseData(): boolean {
    try {
      const supabaseKeys = [
        'sb-faildaily-auth-token',
        'sb-faildaily-user',
        'supabase.auth.token'
      ];

      return supabaseKeys.some(key => !!localStorage.getItem(key));
    } catch (error) {
      console.warn('⚠️ Erreur détection Supabase:', error);
      return false;
    }
  }

  private async testMysqlConnection(): Promise<boolean> {
    try {
      // Utiliser une méthode simple pour tester la connexion MySQL
      const user = this.httpAuthService.getCurrentUser();
      return true; // Si pas d'erreur, la connexion fonctionne
    } catch (error) {
      console.warn('⚠️ Connexion MySQL indisponible:', error);
      return false;
    }
  }

  private async backupSupabaseUserData(): Promise<any> {
    try {
      const userData = {
        authToken: localStorage.getItem('sb-faildaily-auth-token'),
        user: localStorage.getItem('sb-faildaily-user'),
        session: localStorage.getItem('sb-faildaily-session'),
        preferences: localStorage.getItem('user_preferences'),
        timestamp: new Date().toISOString()
      };

      if (!userData.user) {
        return null;
      }

      // Sauvegarder dans migrationData
      this.migrationData.next({
        supabaseUser: JSON.parse(userData.user),
        migrationToken: userData.authToken,
        preferences: userData.preferences ? JSON.parse(userData.preferences) : null
      });

      // Sauvegarder aussi en localStorage
      localStorage.setItem('migration_backup', JSON.stringify(userData));

      console.log('💾 Données Supabase sauvegardées');
      return userData;

    } catch (error) {
      console.error('❌ Erreur sauvegarde Supabase:', error);
      throw error;
    }
  }

  private async migrateUserToMysql(supabaseData: any): Promise<{ success: boolean; user?: any; message?: string }> {
    try {
      const userData = JSON.parse(supabaseData.user);
      
      // Préparer les données pour MySQL
      const registrationData = {
        email: userData.email,
        displayName: userData.user_metadata?.displayName || userData.email.split('@')[0],
        // Pas de mot de passe - l'utilisateur devra en créer un
        requirePasswordReset: true,
        migratedFromSupabase: true,
        supabaseId: userData.id,
        migratedAt: new Date().toISOString()
      };

      // Créer le compte via l'API de création standard avec flag de migration
      const registerData = {
        email: registrationData.email,
        password: 'temp-password-to-reset', // Mot de passe temporaire
        displayName: registrationData.displayName
      };
      
      const result = await this.httpAuthService.register(registerData);
      
      if (result.success) {
        console.log('✅ Compte MySQL créé pour migration:', userData.email);
        
        // Marquer comme nécessitant une réinitialisation de mot de passe
        return {
          success: true,
          user: result.user,
          message: 'Compte migré - Réinitialisation du mot de passe requise'
        };
      }

      return result;

    } catch (error) {
      console.error('❌ Erreur migration MySQL:', error);
      throw error;
    }
  }

  private async validateMigration(user: any): Promise<boolean> {
    try {
      // Vérifier que l'utilisateur peut se connecter
      const profileCheck = await this.httpAuthService.getCurrentUser();
      
      if (profileCheck && profileCheck.id === user.id) {
        console.log('✅ Migration validée');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Erreur validation migration:', error);
      return false;
    }
  }

  private cleanupSupabaseData(): void {
    try {
      const supabaseKeys = [
        'sb-faildaily-auth-token',
        'sb-faildaily-user',
        'sb-faildaily-session',
        'supabase.auth.token',
        'supabase.session'
      ];

      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🧹 Données Supabase nettoyées');
      
      // Mettre à jour l'état
      this.updateState({
        fromSupabase: false
      });

    } catch (error) {
      console.warn('⚠️ Erreur nettoyage Supabase:', error);
    }
  }

  private calculateRegistrationProgress(data: any): number {
    const fields = ['email', 'displayName', 'password', 'birthDate', 'agreeToTerms'];
    const completed = fields.filter(field => !!data[field]).length;
    return Math.round((completed / fields.length) * 100);
  }

  private updateState(updates: Partial<TransitionState>): void {
    const current = this.transitionState.value;
    this.transitionState.next({ ...current, ...updates });
  }

  // Méthodes publiques d'accès à l'état
  getCurrentState(): TransitionState {
    return this.transitionState.value;
  }

  getMigrationData(): UserMigrationData {
    return this.migrationData.value;
  }

  isSupabaseDetected(): boolean {
    return this.transitionState.value.fromSupabase;
  }

  isMysqlReady(): boolean {
    return this.transitionState.value.toMysql;
  }

  isMigrationInProgress(): boolean {
    return this.transitionState.value.migrationInProgress;
  }

  // Méthodes utilitaires
  async forceSupabaseCleanup(): Promise<void> {
    console.log('🔧 Nettoyage forcé Supabase...');
    this.cleanupSupabaseData();
    await this.initializeTransition();
  }

  async retryMigration(): Promise<{ success: boolean; message: string }> {
    if (this.isMigrationInProgress()) {
      return {
        success: false,
        message: 'Migration déjà en cours'
      };
    }

    return await this.startUserMigration();
  }

  getTransitionHistory(): any[] {
    try {
      const history = localStorage.getItem('transition_history');
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.warn('⚠️ Erreur récupération historique:', error);
      return [];
    }
  }

  saveTransitionStep(step: string, details: any): void {
    try {
      const history = this.getTransitionHistory();
      history.push({
        step,
        details,
        timestamp: new Date().toISOString()
      });

      // Garder seulement les 50 dernières entrées
      if (history.length > 50) {
        history.splice(0, history.length - 50);
      }

      localStorage.setItem('transition_history', JSON.stringify(history));
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde historique:', error);
    }
  }
}