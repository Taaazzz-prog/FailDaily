import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { MysqlService } from './mysql.service';

/**
 * Service de transition entre Supabase et MySQL
 * Ce service fait le pont entre l'ancien système Supabase et le nouveau système MySQL
 */
@Injectable({
  providedIn: 'root'
})
export class NewAuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private mysqlService: MysqlService,
    private http: HttpClient
  ) {
    console.log('🔄 NewAuthService: Service de transition Supabase → MySQL initialisé');
    this.initializeFromMysqlService();
  }

  private initializeFromMysqlService(): void {
    // Synchroniser avec le service MySQL principal
    this.mysqlService.currentUser$.subscribe(user => {
      this.currentUserSubject.next(user);
    });
  }

  // Méthodes de compatibilité avec l'ancien AuthService Supabase
  async signUp(email: string, password: string, displayName: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await this.mysqlService.signUp(email, password, displayName);

      if (result.data?.user) {
        return {
          success: true,
          user: result.data.user
        };
      } else {
        return {
          success: false,
          error: 'Erreur lors de l\'inscription'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'inscription'
      };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await this.mysqlService.signIn(email, password);

      if (result.data?.user) {
        return {
          success: true,
          user: result.data.user
        };
      } else {
        return {
          success: false,
          error: 'Erreur lors de la connexion'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la connexion'
      };
    }
  }

  async signOut(): Promise<void> {
    await this.mysqlService.signOut();
  }

  getCurrentUser(): User | null {
    return this.mysqlService.getCurrentUserSync();
  }

  getCurrentUserSync(): User | null {
    return this.mysqlService.getCurrentUserSync();
  }

  isAuthenticated(): boolean {
    return this.mysqlService.getCurrentUserSync() !== null;
  }

  // Observable pour la compatibilité
  get isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  // Méthodes de migration des données
  async migrateFromSupabase(): Promise<boolean> {
    try {
      console.log('🔄 Début de la migration des données Supabase → MySQL');

      // Vérifier si des données Supabase existent encore
      const supabaseData = this.getSupabaseData();
      if (!supabaseData) {
        console.log('ℹ️ Aucune donnée Supabase à migrer');
        return true;
      }

      // Migrer les données utilisateur
      await this.migrateUserData(supabaseData);

      // Nettoyer les données Supabase
      this.cleanupSupabaseData();

      console.log('✅ Migration Supabase → MySQL terminée');
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de la migration:', error);
      return false;
    }
  }

  private getSupabaseData(): any {
    try {
      // Récupérer les données stockées par l'ancien service Supabase
      const supabaseSession = localStorage.getItem('sb-faildaily-auth-token');
      const supabaseUser = localStorage.getItem('sb-faildaily-user');
      
      if (supabaseSession && supabaseUser) {
        return {
          session: JSON.parse(supabaseSession),
          user: JSON.parse(supabaseUser)
        };
      }
      return null;
    } catch (error) {
      console.warn('⚠️ Erreur lors de la récupération des données Supabase:', error);
      return null;
    }
  }

  private async migrateUserData(supabaseData: any): Promise<void> {
    try {
      // Extraire les informations utilisateur de Supabase
      const supabaseUser = supabaseData.user;
      
      // Vérifier si l'utilisateur existe déjà dans MySQL
      const existingUser = await this.checkUserExists(supabaseUser.email);
      
      if (!existingUser) {
        console.log('👤 Migration des données utilisateur:', supabaseUser.email);
        
        // Créer le compte dans MySQL avec les données Supabase
        await this.createMigratedUser({
          email: supabaseUser.email,
          displayName: supabaseUser.user_metadata?.displayName || supabaseUser.email.split('@')[0],
          supabaseId: supabaseUser.id,
          createdAt: supabaseUser.created_at
        });
      } else {
        console.log('ℹ️ Utilisateur déjà migré:', supabaseUser.email);
      }
    } catch (error) {
      console.error('❌ Erreur migration données utilisateur:', error);
      throw error;
    }
  }

  private async checkUserExists(email: string): Promise<boolean> {
    try {
      // Utiliser l'endpoint de vérification d'email de l'API MySQL
      const response: any = await this.http.get(`${environment.api.baseUrl}/auth/check-email`, {
        params: { email },
        headers: new HttpHeaders({
          'Content-Type': 'application/json'
        })
      }).toPromise();

      return response.exists === true;
    } catch (error) {
      console.warn('⚠️ Erreur vérification utilisateur existant:', error);
      return false;
    }
  }

  private async createMigratedUser(userData: any): Promise<void> {
    try {
      // Utiliser l'inscription normale mais avec des données de migration
      await this.mysqlService.signUp(
        userData.email, 
        'migration-password-' + Math.random().toString(36).substring(7), // Mot de passe temporaire
        userData.displayName
      );
      console.log('✅ Utilisateur migré avec succès');
    } catch (error) {
      console.error('❌ Erreur création utilisateur migré:', error);
      throw error;
    }
  }

  private cleanupSupabaseData(): void {
    try {
      // Supprimer les données Supabase du localStorage
      const supabaseKeys = [
        'sb-faildaily-auth-token',
        'sb-faildaily-user',
        'sb-faildaily-session',
        'supabase.auth.token'
      ];

      supabaseKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log('🧹 Données Supabase nettoyées du localStorage');
    } catch (error) {
      console.warn('⚠️ Erreur lors du nettoyage des données Supabase:', error);
    }
  }

  // Méthodes de diagnostic
  async testMysqlConnection(): Promise<boolean> {
    try {
      // Tester via une méthode existante du MysqlService
      const currentUser = await this.mysqlService.getCurrentUser();
      return true; // Si pas d'erreur, la connexion fonctionne
    } catch (error) {
      console.error('❌ Test connexion MySQL échoué:', error);
      return false;
    }
  }

  async getMigrationStatus(): Promise<any> {
    try {
      return {
        migrated: this.isUsingMysql() && !this.isUsingSupabase(),
        authMode: this.getAuthenticationMode(),
        hasSupabaseData: this.isUsingSupabase(),
        hasMysqlData: this.isUsingMysql()
      };
    } catch (error) {
      console.error('❌ Erreur récupération statut migration:', error);
      return { 
        migrated: false, 
        error: error,
        authMode: 'none'
      };
    }
  }

  // Méthodes utilitaires pour la transition
  isUsingSupabase(): boolean {
    return !!localStorage.getItem('sb-faildaily-auth-token');
  }

  isUsingMysql(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getAuthenticationMode(): 'supabase' | 'mysql' | 'none' {
    if (this.isUsingMysql()) return 'mysql';
    if (this.isUsingSupabase()) return 'supabase';
    return 'none';
  }

  // Méthode pour forcer la migration si nécessaire
  async forceMigration(): Promise<boolean> {
    try {
      console.log('🔄 Migration forcée démarrée');
      
      // Déconnecter de Supabase si connecté
      if (this.isUsingSupabase()) {
        this.cleanupSupabaseData();
      }

      // Rediriger vers la page de connexion MySQL
      return true;
    } catch (error) {
      console.error('❌ Erreur migration forcée:', error);
      return false;
    }
  }

  // Événements de transition
  onMigrationComplete(): Observable<boolean> {
    return new Observable(observer => {
      this.currentUser$.subscribe(user => {
        if (user && this.isUsingMysql() && !this.isUsingSupabase()) {
          observer.next(true);
          observer.complete();
        }
      });
    });
  }
}