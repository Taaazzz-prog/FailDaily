import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { Fail } from '../models/fail.model';
import { FailCategory } from '../models/enums';

// Interfaces pour la compatibilité
export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
}

export interface CreateFailData {
  title: string;
  description: string;
  category: FailCategory;
  image?: File;
  is_public: boolean;
}

export interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  requirements: any;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserStats {
  totalFails: number;
  totalReactionsGiven: number;
  totalReactionsReceived: number;
  couragePoints: number;
  totalBadges: number;
  streak: number;
  reactionsByType: any;
  failsByCategory: any;
  mostPopularFails: any[];
}

@Injectable({
  providedIn: 'root'
})
export class MysqlService {
  private apiUrl = environment.api.baseUrl || 'http://localhost:3001/api';
  
  // States management - équivalent service de base de données
  private currentUser: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public user$: Observable<User | null> = this.currentUser.asObservable();
  public currentUser$: Observable<User | null> = this.currentUser.asObservable();
  
  // Subject pour notifier les changements de données
  private profileUpdated = new Subject<void>();
  public profileUpdated$ = this.profileUpdated.asObservable();
  
  // Debounce pour éviter les appels multiples
  private authChangeTimeout: any = null;
  private lastAuthUserId: string | null = null;
  private profileOperationTimeout: any = null;
  private lastProfileUserId: string | null = null;
  
  private logger: any = null;

  constructor(private http: HttpClient) {
    console.log('🔧 MysqlService: Initialisation du service MySQL complet');
    this.loadStoredUser();
  }

  // ====== MÉTHODES UTILITAIRES ======

  setLogger(logger: any) {
    this.logger = logger;
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('current_user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUser.next(user);
        console.log('✅ Utilisateur restauré depuis le localStorage');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la restauration de l\'utilisateur:', error);
        this.clearAuthData();
      }
    }
  }

  private saveAuthData(token: string, user: User): void {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUser.next(user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUser.next(null);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private getMultipartHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private async handleError(error: any): Promise<never> {
    console.error('❌ MysqlService Error:', error);
    throw error;
  }

  // ====== AUTHENTIFICATION (9 méthodes) ======

  getCurrentUserSync(): User | null {
    return this.currentUser.value;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      if (this.currentUser.value) {
        return this.currentUser.value;
      }

      const token = localStorage.getItem('auth_token');
      if (!token) {
        return null;
      }

      const response: any = await this.http.get(`${this.apiUrl}/auth/me`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.user) {
        this.currentUser.next(response.user);
        return response.user;
      }

      return null;
    } catch (error) {
      console.log('🔐 MysqlService: Session expirée ou manquante:', error);
      this.clearAuthData();
      return null;
    }
  }

  async signUp(email: string, password: string, displayName: string): Promise<any> {
    try {
      console.log('📝 Tentative d\'inscription:', email);
      
      const response: any = await this.http.post(`${this.apiUrl}/auth/register`, {
        email,
        password,
        displayName,
        role: 'user'
      }).toPromise();

      if (response.success && response.token && response.user) {
        this.saveAuthData(response.token, response.user);
        console.log('✅ Inscription réussie pour:', response.user.email);
        return { data: { user: response.user, session: { access_token: response.token } } };
      } else {
        throw new Error(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);
      throw { message: error.error?.message || error.message || 'Erreur lors de l\'inscription' };
    }
  }

  async completeRegistration(userId: string, legalConsent: any, ageVerification: any): Promise<any> {
    try {
      console.log('🔧 MysqlService - Completing registration for user:', userId);

      const response: any = await this.http.put(`${this.apiUrl}/auth/complete-registration`, {
        userId,
        legalConsent,
        ageVerification
      }, { headers: this.getAuthHeaders() }).toPromise();

      if (response.success) {
        console.log('🔧 MysqlService - Registration completed successfully');
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la finalisation d\'inscription');
      }
    } catch (error: any) {
      console.error('🔧 MysqlService - Error completing registration:', error);
      throw error;
    }
  }

  async signIn(email: string, password: string): Promise<any> {
    try {
      console.log('🔐 Tentative de connexion:', email);
      
      const response: any = await this.http.post(`${this.apiUrl}/auth/login`, {
        email,
        password
      }).toPromise();

      if (response.success && response.token && response.user) {
        this.saveAuthData(response.token, response.user);
        console.log('✅ Connexion réussie pour:', response.user.email);
        
        // Log de connexion
        await this.logUserLogin(response.user.id);
        
        return { data: { user: response.user, session: { access_token: response.token } } };
      } else {
        throw new Error(response.message || 'Erreur lors de la connexion');
      }
    } catch (error: any) {
      console.error('❌ Erreur connexion:', error);
      throw { message: error.error?.message || error.message || 'Email ou mot de passe incorrect' };
    }
  }

  async signOut(): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/auth/logout`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();
    } catch (error) {
      console.warn('⚠️ Erreur lors de la déconnexion côté serveur:', error);
    } finally {
      this.clearAuthData();
      console.log('✅ Déconnexion locale effectuée');
    }
  }

  async clearAllSessions(): Promise<void> {
    try {
      console.log('🔐 MysqlService: Clearing all sessions and local storage');

      // Déconnecter côté serveur
      try {
        await this.http.post(`${this.apiUrl}/auth/clear-all-sessions`, {}, {
          headers: this.getAuthHeaders()
        }).toPromise();
      } catch (error) {
        console.warn('⚠️ Erreur côté serveur lors du nettoyage des sessions:', error);
      }

      // Vider le localStorage
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('auth_') || key.includes('current_user')) {
            localStorage.removeItem(key);
            console.log('🔐 MysqlService: Removed localStorage key:', key);
          }
        });
      }

      this.currentUser.next(null);
      console.log('🔐 MysqlService: All sessions cleared');
    } catch (error) {
      console.error('🔐 MysqlService: Error clearing sessions:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/auth/reset-password`, {
        email
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la réinitialisation');
      }
    } catch (error: any) {
      console.error('❌ Erreur réinitialisation mot de passe:', error);
      throw error;
    }
  }

  // ====== GESTION PROFILS (6 méthodes) ======

  async getProfile(userId: string): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/users/${userId}/profile`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.profile;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération du profil');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération profil:', error);
      throw error;
    }
  }

  async createProfile(user: any): Promise<any> {
    try {
      console.log('🔐 MysqlService: Creating profile for user:', user.id);

      const profileData = {
        id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name || user.email.split('@')[0],
        role: user.user_metadata?.role || 'user',
        avatar_url: null,
        courage_points: 0,
        streak: 0,
        is_public: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const response: any = await this.http.post(`${this.apiUrl}/users/profile`, profileData, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log('✅ MysqlService: Profile created/updated successfully');
        return response.profile;
      } else {
        throw new Error(response.message || 'Erreur lors de la création du profil');
      }
    } catch (error: any) {
      console.error('❌ MysqlService: Error creating profile:', error);
      throw error;
    }
  }

  async updateProfile(userId: string, profile: any): Promise<any> {
    try {
      console.log('🔄 MysqlService.updateProfile called with:', { userId, profile });

      // Filtrer les champs autorisés
      const allowedFields = [
        'display_name', 'avatar_url', 'bio', 'location', 'website',
        'date_of_birth', 'is_public', 'privacy_settings', 'notification_settings'
      ];

      const profileToUpdate = Object.keys(profile)
        .filter(key => allowedFields.includes(key))
        .reduce((obj: any, key) => {
          obj[key] = profile[key];
          return obj;
        }, {});

      profileToUpdate.updated_at = new Date().toISOString();

      console.log('📤 Envoi vers MySQL API (filtré):', profileToUpdate);

      const response: any = await this.http.put(`${this.apiUrl}/users/${userId}/profile`, profileToUpdate, {
        headers: this.getAuthHeaders()
      }).toPromise();

      console.log('📥 MySQL response:', { success: response.success });

      if (response.success) {
        console.log('✅ MySQL updateProfile success');
        this.profileUpdated.next();
        return response.profile;
      } else {
        console.error('❌ MySQL updateProfile error:', response.message);
        throw new Error(response.message || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error: any) {
      console.error('❌ Erreur updateProfile:', error);
      throw error;
    }
  }

  async getAllProfiles(): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/users/profiles`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.profiles;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des profils');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération profils:', error);
      throw error;
    }
  }

  async checkDisplayNameAvailable(displayName: string, excludeUserId?: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.set('displayName', displayName);
      if (excludeUserId) {
        params.set('excludeUserId', excludeUserId);
      }

      const response: any = await this.http.get(`${this.apiUrl}/users/check-display-name?${params.toString()}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response.available || false;
    } catch (error: any) {
      console.error('❌ Erreur vérification nom d\'affichage:', error);
      return false;
    }
  }

  async generateUniqueDisplayName(baseDisplayName: string): Promise<string> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/users/generate-display-name`, {
        baseDisplayName
      }, { headers: this.getAuthHeaders() }).toPromise();

      if (response.success) {
        return response.displayName;
      } else {
        throw new Error(response.message || 'Erreur lors de la génération du nom');
      }
    } catch (error: any) {
      console.error('❌ Erreur génération nom unique:', error);
      throw error;
    }
  }

  // ====== GESTION FAILS (11 méthodes) ======

  async createFail(fail: any): Promise<any> {
    try {
      console.log('📝 Création d\'un nouveau fail:', fail.title);

      let imageUrl = null;
      
      // Upload de l'image si présente
      if (fail.image) {
        try {
          imageUrl = await this.uploadImage(fail.image, 'fails', `fail_${Date.now()}.jpg`);
          console.log('📷 Image uploadée:', imageUrl);
        } catch (error) {
          console.warn('⚠️ Erreur upload image, création du fail sans image:', error);
        }
      }

      const failToCreate = {
        title: fail.title.trim(),
        description: fail.description.trim(),
        category: fail.category,
        image_url: imageUrl,
        is_public: fail.is_public !== false
      };

      const response: any = await this.http.post(`${this.apiUrl}/fails`, failToCreate, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.fail) {
        console.log('✅ Fail créé avec succès:', response.fail.id);
        
        // Ajouter des points de courage pour la création
        const currentUser = this.getCurrentUserSync();
        if (currentUser) {
          await this.addCouragePointsForFailCreation(currentUser.id);
        }
        
        return response.fail;
      } else {
        throw new Error(response.message || 'Erreur lors de la création du fail');
      }
    } catch (error: any) {
      console.error('❌ Erreur création fail:', error);
      throw error;
    }
  }

  async getFails(limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      const response: any = await this.http.get(`${this.apiUrl}/fails?${params.toString()}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.fails;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des fails');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération fails:', error);
      throw error;
    }
  }

  async getFailById(failId: string): Promise<any | null> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.fail;
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération fail:', error);
      return null;
    }
  }

  async getUserFails(userId: string): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/users/${userId}/fails`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.fails;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des fails');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération fails utilisateur:', error);
      throw error;
    }
  }

  async updateFail(failId: string, updates: any): Promise<any> {
    try {
      const response: any = await this.http.put(`${this.apiUrl}/fails/${failId}`, updates, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.fail;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour du fail');
      }
    } catch (error: any) {
      console.error('❌ Erreur mise à jour fail:', error);
      throw error;
    }
  }

  async addReaction(failId: string, reactionType: string): Promise<void> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      console.log(`👍 Ajout réaction ${reactionType} au fail ${failId}`);

      // Vérifier si l'utilisateur a déjà réagi
      const existingReaction = await this.getUserReactionForFail(failId);
      
      if (existingReaction === reactionType) {
        console.log('✅ Réaction identique, pas de changement');
        return;
      }

      const response: any = await this.http.post(`${this.apiUrl}/fails/${failId}/reactions`, {
        reactionType
      }, { headers: this.getAuthHeaders() }).toPromise();

      if (response.success) {
        console.log(`✅ Réaction ${reactionType} ajoutée avec succès`);
        
        // Mettre à jour les points de courage
        await this.updateCouragePoints(failId, reactionType, 1);
      } else {
        throw new Error(response.message || 'Erreur lors de l\'ajout de la réaction');
      }
    } catch (error: any) {
      console.error('❌ Erreur ajout réaction:', error);
      throw error;
    }
  }

  async removeReaction(failId: string, reactionType: string): Promise<void> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      console.log(`👎 Suppression réaction ${reactionType} du fail ${failId}`);

      const response: any = await this.http.delete(`${this.apiUrl}/fails/${failId}/reactions/${reactionType}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log(`✅ Réaction ${reactionType} supprimée avec succès`);
        
        // Mettre à jour les points de courage
        await this.updateCouragePoints(failId, reactionType, -1);
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression de la réaction');
      }
    } catch (error: any) {
      console.error('❌ Erreur suppression réaction:', error);
      throw error;
    }
  }

  async getUserReactionForFail(failId: string): Promise<string | null> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) return null;

      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}/my-reaction`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response.success ? response.reactionType : null;
    } catch (error: any) {
      console.warn('⚠️ Erreur récupération réaction utilisateur:', error);
      return null;
    }
  }

  async getUserReactionsForFail(failId: string): Promise<string[]> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) return [];

      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}/user-reactions`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response.success ? response.reactions : [];
    } catch (error: any) {
      console.warn('⚠️ Erreur récupération réactions utilisateur:', error);
      return [];
    }
  }

  private async updateReactionCount(failId: string, reactionType: string, delta: number): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/fails/${failId}/update-reaction-count`, {
        reactionType,
        delta
      }, { headers: this.getAuthHeaders() }).toPromise();
    } catch (error) {
      console.warn('⚠️ Erreur mise à jour compteur réactions:', error);
    }
  }

  private async updateReactionCountManual(failId: string, reactionType: string, delta: number): Promise<void> {
    try {
      const fail = await this.getFailById(failId);
      if (!fail) return;

      const currentCount = fail[`${reactionType}_count`] || 0;
      const newCount = Math.max(0, currentCount + delta);

      await this.updateFail(failId, {
        [`${reactionType}_count`]: newCount
      });
    } catch (error) {
      console.warn('⚠️ Erreur mise à jour manuelle compteur:', error);
    }
  }

  // ====== SYSTÈME COURAGE POINTS (5 méthodes) ======

  private async updateCouragePoints(failId: string, reactionType: string, delta: number): Promise<void> {
    try {
      // Récupérer le fail pour connaître l'auteur
      const fail = await this.getFailById(failId);
      if (!fail) return;

      const points = this.calculateCouragePoints(reactionType, delta);
      if (points === 0) return;

      await this.http.post(`${this.apiUrl}/users/${fail.user_id}/courage-points`, {
        points,
        reason: `Réaction ${reactionType} sur fail`,
        failId
      }, { headers: this.getAuthHeaders() }).toPromise();

      console.log(`✅ ${points} points de courage ajoutés à l'utilisateur ${fail.user_id}`);
    } catch (error) {
      console.warn('⚠️ Erreur mise à jour points de courage:', error);
    }
  }

  private calculateCouragePoints(reactionType: string, delta: number): number {
    const pointsMap: { [key: string]: number } = {
      'heart': 5,
      'thumbs_up': 3,
      'fire': 4,
      'clap': 3,
      'muscle': 4
    };

    const basePoints = pointsMap[reactionType] || 1;
    return basePoints * delta;
  }

  async debugCouragePoints(userId: string): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/users/${userId}/courage-points/debug`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.debug;
      } else {
        throw new Error(response.message || 'Erreur lors du debug des points');
      }
    } catch (error: any) {
      console.error('❌ Erreur debug points de courage:', error);
      throw error;
    }
  }

  private async addCouragePointsForFailCreation(userId: string): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/users/${userId}/courage-points`, {
        points: 10,
        reason: 'Création d\'un fail'
      }, { headers: this.getAuthHeaders() }).toPromise();

      console.log('✅ 10 points de courage ajoutés pour la création du fail');
    } catch (error) {
      console.warn('⚠️ Erreur ajout points création fail:', error);
    }
  }

  async testAddCouragePoints(userId: string, points: number = 10): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/users/${userId}/courage-points`, {
        points,
        reason: 'Test ajout points'
      }, { headers: this.getAuthHeaders() }).toPromise();

      console.log(`✅ ${points} points de courage ajoutés en test`);
    } catch (error) {
      console.warn('⚠️ Erreur test ajout points:', error);
    }
  }

  async getUserStats(userId: string): Promise<UserStats> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/users/${userId}/stats`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.stats;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération stats utilisateur:', error);
      throw error;
    }
  }

  // ====== SYSTÈME BADGES (7 méthodes) ======

  async getUserBadges(userId: string): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/users/${userId}/badges`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.badges;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des badges');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération badges utilisateur:', error);
      throw error;
    }
  }

  async getAllBadges(): Promise<Badge[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/badges`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.badges;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des badges');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération tous les badges:', error);
      throw error;
    }
  }

  async getAllAvailableBadges(): Promise<Badge[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/badges/available`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.badges;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des badges disponibles');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération badges disponibles:', error);
      throw error;
    }
  }

  async getUserBadgesNew(userId: string): Promise<string[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/users/${userId}/badges/ids`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.badgeIds;
      } else {
        return [];
      }
    } catch (error: any) {
      console.warn('⚠️ Erreur récupération IDs badges:', error);
      return [];
    }
  }

  async unlockBadge(userId: string, badgeId: string): Promise<boolean> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/users/${userId}/badges/${badgeId}/unlock`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log(`🏆 Badge ${badgeId} débloqué pour l'utilisateur ${userId}`);
        return true;
      } else {
        console.warn(`⚠️ Impossible de débloquer le badge ${badgeId}:`, response.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur déverrouillage badge:', error);
      return false;
    }
  }

  async getAllBadgeDefinitions(): Promise<Badge[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/badges/definitions`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.badges;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des définitions de badges');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération définitions badges:', error);
      throw error;
    }
  }

  async createBadgeDefinition(badgeData: any): Promise<Badge> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/badges/definitions`, badgeData, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log('✅ Définition de badge créée:', response.badge.name);
        return response.badge;
      } else {
        throw new Error(response.message || 'Erreur lors de la création de la définition de badge');
      }
    } catch (error: any) {
      console.error('❌ Erreur création définition badge:', error);
      throw error;
    }
  }

  async deleteBadgeDefinition(badgeId: string): Promise<void> {
    try {
      const response: any = await this.http.delete(`${this.apiUrl}/admin/badges/definitions/${badgeId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la suppression de la définition de badge');
      }

      console.log('✅ Définition de badge supprimée');
    } catch (error: any) {
      console.error('❌ Erreur suppression définition badge:', error);
      throw error;
    }
  }

  // ====== ADMINISTRATION (15 méthodes) ======

  async getAllUsers(): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/users`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.users;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des utilisateurs');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération utilisateurs:', error);
      throw error;
    }
  }

  async updateUserRole(userId: string, newRole: string): Promise<boolean> {
    try {
      const response: any = await this.http.put(`${this.apiUrl}/admin/users/${userId}/role`, {
        role: newRole
      }, { headers: this.getAuthHeaders() }).toPromise();

      if (response.success) {
        console.log(`✅ Rôle utilisateur ${userId} mis à jour vers ${newRole}`);
        return true;
      } else {
        console.warn(`⚠️ Erreur mise à jour rôle:`, response.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur mise à jour rôle utilisateur:', error);
      return false;
    }
  }

  async banUser(userId: string): Promise<boolean> {
    try {
      const response: any = await this.http.put(`${this.apiUrl}/admin/users/${userId}/ban`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log(`✅ Utilisateur ${userId} banni`);
        return true;
      } else {
        console.warn(`⚠️ Erreur bannissement:`, response.message);
        return false;
      }
    } catch (error: any) {
      console.error('❌ Erreur bannissement utilisateur:', error);
      return false;
    }
  }

  async getAllUsersWithRoles(): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/users/with-roles`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.users;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des utilisateurs avec rôles');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération utilisateurs avec rôles:', error);
      throw error;
    }
  }

  async getUsersByRole(role: string): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/users/by-role/${role}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.users;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des utilisateurs par rôle');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération utilisateurs par rôle:', error);
      throw error;
    }
  }

  async getTableCount(tableName: string): Promise<number> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/tables/${tableName}/count`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.count;
      } else {
        throw new Error(response.message || 'Erreur lors du comptage de la table');
      }
    } catch (error: any) {
      console.error('❌ Erreur comptage table:', error);
      throw error;
    }
  }

  async executeQuery(query: string): Promise<any> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/execute-query`, {
        query
      }, { headers: this.getAuthHeaders() }).toPromise();

      if (response.success) {
        return response.result;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'exécution de la requête');
      }
    } catch (error: any) {
      console.error('❌ Erreur exécution requête:', error);
      throw error;
    }
  }

  async getDashboardStats(): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/dashboard/stats`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.stats;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération stats dashboard:', error);
      throw error;
    }
  }

  async getPointsConfiguration(): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/points-config`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.config;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération de la configuration des points');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération config points:', error);
      throw error;
    }
  }

  async updatePointsConfiguration(config: any): Promise<void> {
    try {
      const response: any = await this.http.put(`${this.apiUrl}/admin/points-config`, config, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la mise à jour de la configuration');
      }

      console.log('✅ Configuration des points mise à jour');
    } catch (error: any) {
      console.error('❌ Erreur mise à jour config points:', error);
      throw error;
    }
  }

  async restoreEssentialConfigurations(): Promise<void> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/restore-configs`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la restauration des configurations');
      }

      console.log('✅ Configurations essentielles restaurées');
    } catch (error: any) {
      console.error('❌ Erreur restauration configurations:', error);
      throw error;
    }
  }

  async analyzeDatabaseIntegrity(): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/database/integrity`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.analysis;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'analyse d\'intégrité');
      }
    } catch (error: any) {
      console.error('❌ Erreur analyse intégrité:', error);
      throw error;
    }
  }

  async truncateTable(tableName: string, isAuthTable: boolean = false): Promise<{ success: boolean, message: string }> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/tables/${tableName}/truncate`, {
        isAuthTable
      }, { headers: this.getAuthHeaders() }).toPromise();

      return {
        success: response.success,
        message: response.message || 'Table vidée avec succès'
      };
    } catch (error: any) {
      console.error('❌ Erreur vidage table:', error);
      return {
        success: false,
        message: error.error?.message || error.message || 'Erreur lors du vidage de la table'
      };
    }
  }

  async deleteAllAuthUsers(): Promise<{ success: boolean, message: string }> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/users/delete-all`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return {
        success: response.success,
        message: response.message || 'Tous les utilisateurs supprimés'
      };
    } catch (error: any) {
      console.error('❌ Erreur suppression utilisateurs:', error);
      return {
        success: false,
        message: error.error?.message || error.message || 'Erreur lors de la suppression des utilisateurs'
      };
    }
  }

  async updateUserAccount(userId: string, updates: any): Promise<void> {
    try {
      const response: any = await this.http.put(`${this.apiUrl}/admin/users/${userId}/account`, updates, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la mise à jour du compte');
      }

      console.log('✅ Compte utilisateur mis à jour');
    } catch (error: any) {
      console.error('❌ Erreur mise à jour compte utilisateur:', error);
      throw error;
    }
  }

  // ====== LOGS & MONITORING (8 méthodes) ======

  async insertSystemLog(level: string, message: string, details?: any, userId?: string, action?: string): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/admin/logs`, {
        level,
        message,
        details,
        userId,
        action
      }, { headers: this.getAuthHeaders() }).toPromise();
    } catch (error) {
      console.warn('⚠️ Erreur insertion log système:', error);
    }
  }

  async getSystemLogs(limit: number = 50): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/logs/system?limit=${limit}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des logs système');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération logs système:', error);
      throw error;
    }
  }

  async getSystemLogsTable(limit: number = 100): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/logs/system/table?limit=${limit}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération de la table des logs');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération table logs:', error);
      throw error;
    }
  }

  async getReactionLogsTable(limit: number = 100): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/logs/reactions?limit=${limit}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des logs de réactions');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération logs réactions:', error);
      throw error;
    }
  }

  async getUserActivities(userId?: string, limit: number = 50): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      if (userId) {
        params.set('userId', userId);
      }

      const response: any = await this.http.get(`${this.apiUrl}/admin/users/activities?${params.toString()}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.activities;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des activités');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération activités utilisateur:', error);
      throw error;
    }
  }

  async getActivityLogsByType(logType: string, periodHours: number | null, limit: number): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.set('type', logType);
      params.set('limit', limit.toString());
      if (periodHours !== null) {
        params.set('periodHours', periodHours.toString());
      }

      const response: any = await this.http.get(`${this.apiUrl}/admin/logs/by-type?${params.toString()}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des logs par type');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération logs par type:', error);
      throw error;
    }
  }

  async logUserLogin(userId: string, ip?: string, userAgent?: string): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/admin/logs/user-login`, {
        userId,
        ip,
        userAgent
      }, { headers: this.getAuthHeaders() }).toPromise();
    } catch (error) {
      console.warn('⚠️ Erreur log connexion utilisateur:', error);
    }
  }

  async getUserManagementLogs(adminId?: string, targetUserId?: string, limit: number = 50): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      if (adminId) {
        params.set('adminId', adminId);
      }
      if (targetUserId) {
        params.set('targetUserId', targetUserId);
      }

      const response: any = await this.http.get(`${this.apiUrl}/admin/logs/user-management?${params.toString()}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.logs;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des logs de gestion');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération logs gestion utilisateur:', error);
      throw error;
    }
  }

  // ====== STORAGE & FILES (3 méthodes) ======

  async uploadFile(bucket: string, filePath: string, file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('bucket', bucket);
      formData.append('filePath', filePath);

      const response: any = await this.http.post(`${this.apiUrl}/storage/upload`, formData, {
        headers: this.getMultipartHeaders()
      }).toPromise();

      if (response.success) {
        console.log('📁 Fichier uploadé:', response.url);
        return response.url;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'upload du fichier');
      }
    } catch (error: any) {
      console.error('❌ Erreur upload fichier:', error);
      throw error;
    }
  }

  async uploadImage(file: File, bucket: string, fileName: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('bucket', bucket);
      formData.append('fileName', fileName);

      const response: any = await this.http.post(`${this.apiUrl}/storage/upload-image`, formData, {
        headers: this.getMultipartHeaders()
      }).toPromise();

      if (response.success) {
        console.log('🖼️ Image uploadée:', response.url);
        return response.url;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'upload de l\'image');
      }
    } catch (error: any) {
      console.error('❌ Erreur upload image:', error);
      throw error;
    }
  }

  async deleteFile(bucket: string, filePath: string): Promise<void> {
    try {
      const response: any = await this.http.delete(`${this.apiUrl}/storage/delete`, {
        headers: this.getAuthHeaders(),
        body: { bucket, filePath }
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la suppression du fichier');
      }

      console.log('🗑️ Fichier supprimé:', filePath);
    } catch (error: any) {
      console.error('❌ Erreur suppression fichier:', error);
      throw error;
    }
  }

  // ====== MAINTENANCE & DEBUG (6 méthodes) ======

  async fixInvalidReactionCounts(failId: string): Promise<void> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/maintenance/fix-reaction-counts`, {
        failId
      }, { headers: this.getAuthHeaders() }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la correction des compteurs');
      }

      console.log('✅ Compteurs de réactions corrigés pour le fail:', failId);
    } catch (error: any) {
      console.error('❌ Erreur correction compteurs réactions:', error);
      throw error;
    }
  }

  async analyzeSpecificFail(failId: string): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/maintenance/analyze-fail/${failId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.analysis;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'analyse du fail');
      }
    } catch (error: any) {
      console.error('❌ Erreur analyse fail spécifique:', error);
      throw error;
    }
  }

  async fixFailReactionCounts(failId: string): Promise<any> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/maintenance/fix-fail-reactions`, {
        failId
      }, { headers: this.getAuthHeaders() }).toPromise();

      if (response.success) {
        console.log('✅ Compteurs de réactions du fail corrigés');
        return response.result;
      } else {
        throw new Error(response.message || 'Erreur lors de la correction');
      }
    } catch (error: any) {
      console.error('❌ Erreur correction compteurs fail:', error);
      throw error;
    }
  }

  async deleteOrphanedReaction(reactionId: string): Promise<void> {
    try {
      const response: any = await this.http.delete(`${this.apiUrl}/admin/maintenance/orphaned-reactions/${reactionId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la suppression de la réaction orpheline');
      }

      console.log('✅ Réaction orpheline supprimée');
    } catch (error: any) {
      console.error('❌ Erreur suppression réaction orpheline:', error);
      throw error;
    }
  }

  async deleteUserReaction(adminId: string, reactionId: string, reason?: string): Promise<void> {
    try {
      const response: any = await this.http.delete(`${this.apiUrl}/admin/users/reactions/${reactionId}`, {
        headers: this.getAuthHeaders(),
        body: { adminId, reason }
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la suppression de la réaction');
      }

      console.log('✅ Réaction utilisateur supprimée par admin');
    } catch (error: any) {
      console.error('❌ Erreur suppression réaction utilisateur:', error);
      throw error;
    }
  }

  async deleteUserFail(adminId: string, failId: string, reason?: string): Promise<void> {
    try {
      const response: any = await this.http.delete(`${this.apiUrl}/admin/users/fails/${failId}`, {
        headers: this.getAuthHeaders(),
        body: { adminId, reason }
      }).toPromise();

      if (!response.success) {
        throw new Error(response.message || 'Erreur lors de la suppression du fail');
      }

      console.log('✅ Fail utilisateur supprimé par admin');
    } catch (error: any) {
      console.error('❌ Erreur suppression fail utilisateur:', error);
      throw error;
    }
  }

  // ====== MÉTHODES COMPLÉMENTAIRES ÉQUIVALENTES ======

  // Équivalent getClient()
  getClient(): any {
    return {
      // Retourner un objet avec les méthodes principales pour compatibilité
      auth: {
        getUser: () => this.getCurrentUser(),
        signOut: () => this.signOut()
      },
      from: (table: string) => ({
        select: () => this.executeQuery(`SELECT * FROM ${table}`),
        insert: (data: any) => this.executeQuery(`INSERT INTO ${table} SET ?`),
        update: (data: any) => this.executeQuery(`UPDATE ${table} SET ?`),
        delete: () => this.executeQuery(`DELETE FROM ${table}`)
      })
    };
  }

  // Méthodes utilitaires pour la migration
  async logUserManagementAction(
    adminId: string,
    action: string,
    targetUserId: string,
    details?: any
  ): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/admin/logs/user-management-action`, {
        adminId,
        action,
        targetUserId,
        details
      }, { headers: this.getAuthHeaders() }).toPromise();
    } catch (error) {
      console.warn('⚠️ Erreur log action gestion utilisateur:', error);
    }
  }

  // ===================================
  // FOLLOW SYSTEM METHODS
  // ===================================

  async followUser(followerId: string, followingId: string): Promise<any> {
    try {
      const response = await this.http.post(
        `\$\{this.apiUrl\}/follows`,
        { follower_id: followerId, following_id: followingId },
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.followUser error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<any> {
    try {
      const response = await this.http.delete(
        `\$\{this.apiUrl\}/follows/${followerId}/${followingId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.unfollowUser error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getFollowers(userId: string): Promise<any> {
    try {
      const response = await this.http.get(
        `\$\{this.apiUrl\}/users/${userId}/followers`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getFollowers error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getFollowing(userId: string): Promise<any> {
    try {
      const response = await this.http.get(
        `\$\{this.apiUrl\}/users/${userId}/following`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getFollowing error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getFollowersCount(userId: string): Promise<any> {
    try {
      const response = await this.http.get(
        `\$\{this.apiUrl\}/users/${userId}/followers/count`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getFollowersCount error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getFollowingCount(userId: string): Promise<any> {
    try {
      const response = await this.http.get(
        `\$\{this.apiUrl\}/users/${userId}/following/count`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getFollowingCount error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async isFollowing(followerId: string, followingId: string): Promise<any> {
    try {
      const response = await this.http.get(
        `\$\{this.apiUrl\}/follows/${followerId}/${followingId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.isFollowing error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getUsersByIds(userIds: string[]): Promise<any> {
    try {
      const response = await this.http.post(
        `\$\{this.apiUrl\}/users/batch`,
        { user_ids: userIds },
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getUsersByIds error:', error);
      return { data: null, error: error.error || error };
    }
  }

  // ===================================
  // COMPREHENSIVE LOGGING METHODS
  // ===================================

  async logComprehensiveActivity(logEntry: any): Promise<any> {
    try {
      const response = await this.http.post(
        `${this.apiUrl}/logs/comprehensive`,
        logEntry,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.logComprehensiveActivity error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getComprehensiveLogs(filters?: any): Promise<any> {
    try {
      const params = filters ? { params: filters } : {};
      const response = await this.http.get(
        `${this.apiUrl}/logs/comprehensive`,
        { headers: this.getAuthHeaders(), ...params }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getComprehensiveLogs error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async updateLogEntry(logId: string, updates: any): Promise<any> {
    try {
      const response = await this.http.put(
        `${this.apiUrl}/logs/comprehensive/${logId}`,
        updates,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.updateLogEntry error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async deleteLogEntry(logId: string): Promise<any> {
    try {
      const response = await this.http.delete(
        `${this.apiUrl}/logs/comprehensive/${logId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.deleteLogEntry error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async insertUserSession(session: any): Promise<any> {
    try {
      const response = await this.http.post(
        `${this.apiUrl}/sessions`,
        session,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.insertUserSession error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getUserSessions(filters?: any): Promise<any> {
    try {
      const params = filters ? { params: filters } : {};
      const response = await this.http.get(
        `${this.apiUrl}/sessions`,
        { headers: this.getAuthHeaders(), ...params }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getUserSessions error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async updateUserSession(sessionId: string, updates: any): Promise<any> {
    try {
      const response = await this.http.put(
        `${this.apiUrl}/sessions/${sessionId}`,
        updates,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.updateUserSession error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getUsageMetrics(filters?: any): Promise<any> {
    try {
      const params = filters ? { params: filters } : {};
      const response = await this.http.get(
        `${this.apiUrl}/metrics/usage`,
        { headers: this.getAuthHeaders(), ...params }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getUsageMetrics error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async insertUsageMetric(metric: any): Promise<any> {
    try {
      const response = await this.http.post(
        `${this.apiUrl}/metrics/usage`,
        metric,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.insertUsageMetric error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getUserCompleteHistory(params: any): Promise<any> {
    try {
      const response = await this.http.post(
        `${this.apiUrl}/users/complete-history`,
        params,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getUserCompleteHistory error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getUserActivityStats(params: any): Promise<any> {
    try {
      const response = await this.http.post(
        `${this.apiUrl}/users/activity-stats`,
        params,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getUserActivityStats error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getActivityLogs(filters?: any): Promise<any> {
    try {
      const params = filters ? { params: filters } : {};
      const response = await this.http.get(
        `${this.apiUrl}/logs/activity`,
        { headers: this.getAuthHeaders(), ...params }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getActivityLogs error:', error);
      return { data: null, error: error.error || error };
    }
  }

  async getUserFailsCount(userId: string): Promise<any> {
    try {
      const response = await this.http.get(
        `\$\{this.apiUrl\}/users/${userId}/fails/count`,
        { headers: this.getAuthHeaders() }
      ).toPromise();
      return { data: response, error: null };
    } catch (error: any) {
      console.error('❌ MysqlService.getUserFailsCount error:', error);
      return { data: null, error: error.error || error };
    }
  }

  // Méthode pour compatibilité avec l'ancien système
  async getMysqlClient(): Promise<any> {
    return this.getClient();
  }
}
