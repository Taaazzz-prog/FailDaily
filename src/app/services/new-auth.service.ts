import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { HttpAuthService } from './http-auth.service';

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
    private httpAuthService: HttpAuthService,
    private http: HttpClient
  ) {
    console.log('🔄 NewAuthService: Service de transition Supabase → MySQL initialisé');
    this.initializeFromHttpAuth();
  }

  private initializeFromHttpAuth(): void {
    // Synchroniser avec le service HTTP principal
    this.httpAuthService.currentUser$.subscribe(user => {
      this.currentUserSubject.next(user);
    });
  }

  // Méthodes de compatibilité avec l'ancien AuthService Supabase
  async signUp(email: string, password: string, displayName: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await this.httpAuthService.register({
        email,
        password,
        displayName
      });

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de l\'inscription'
      };
    }
  }

  async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await this.httpAuthService.login({
        email,
        password
      });

      return result;
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Erreur lors de la connexion'
      };
    }
  }

  async signOut(): Promise<void> {
    await this.httpAuthService.logout();
  }

  getCurrentUser(): User | null {
    return this.httpAuthService.getCurrentUser();
  }

  getCurrentUserSync(): User | null {
    return this.httpAuthService.getCurrentUserSync();
  }

  isAuthenticated(): boolean {
    return this.httpAuthService.isAuthenticated();
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
      const response: any = await this.http.get(`${environment.api.baseUrl}/auth/check-user`, {
        params: { email }
      }).toPromise();

      return response.exists === true;
    } catch (error) {
      console.warn('⚠️ Erreur vérification utilisateur existant:', error);
      return false;
    }
  }

  private async createMigratedUser(userData: any): Promise<void> {
    try {
      await this.http.post(`${environment.api.baseUrl}/auth/migrate-user`, userData).toPromise();
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
      const response: any = await this.http.get(`${environment.api.baseUrl}/health`).toPromise();
      return response.success === true;
    } catch (error) {
      console.error('❌ Test connexion MySQL échoué:', error);
      return false;
    }
  }

  async getMigrationStatus(): Promise<any> {
    try {
      const response = await this.http.get(`${environment.api.baseUrl}/migration/status`).toPromise();
      return response;
    } catch (error) {
      console.error('❌ Erreur récupération statut migration:', error);
      return { migrated: false, error: error };
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