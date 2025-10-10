import { Injectable, inject } from '@angular/core';
import { Filesystem } from '@capacitor/filesystem';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { Fail } from '../models/fail.model';
import { FailCategory } from '../models/enums';
import { UserRole } from '../models/user-role.model';
import { DEFAULT_AVATAR } from '../utils/avatar-constants';

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
  account_status: string;
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
  private http = inject(HttpClient);
  private apiUrl = environment.api.baseUrl || 'http://localhost:3000/api';
  
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
  private readonly primaryTokenKey = 'auth_token';
  private readonly tokenStorageKeys = Array.from(new Set(['auth_token', 'faildaily_token']));
  private readonly userCacheStorageKey = 'faildaily_user_cache';

  constructor() {
    console.log('🔧 MysqlService: Initialisation du service MySQL complet');
    this.loadStoredUser();
  }

  // ====== MÉTHODES UTILITAIRES ======

  setLogger(logger: any) {
    this.logger = logger;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getStoredToken(): string | null {
    if (!this.isBrowser()) {
      return null;
    }

    for (const key of this.tokenStorageKeys) {
      const value = localStorage.getItem(key);
      if (value) {
        return value;
      }
    }
    return null;
  }

  private writeTokenToStorage(token: string | null): void {
    if (!this.isBrowser()) {
      return;
    }

    if (token) {
      this.tokenStorageKeys.forEach(key => localStorage.setItem(key, token));
    } else {
      this.tokenStorageKeys.forEach(key => localStorage.removeItem(key));
    }
  }

  private loadStoredUser(): void {
    const token = this.getStoredToken();
    const userData = this.isBrowser() ? localStorage.getItem(this.userCacheStorageKey) : null;
    
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
        const user = (parsed && parsed.user) ? parsed.user : parsed;
        if (user && user.role) {
          user.role = this.normalizeRole(user.role);
        }
        this.currentUser.next(user);
        console.log('✅ Utilisateur restauré depuis le localStorage');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la restauration de l\'utilisateur:', error);
        this.clearAuthData();
      }
    }
  }

  private saveAuthData(token: string, user: User): void {
    if (!this.isBrowser()) {
      return;
    }

    this.writeTokenToStorage(token);
    const cachePayload = JSON.stringify({ user, timestamp: Date.now() });
    localStorage.setItem(this.userCacheStorageKey, cachePayload);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUser.next(user);
    console.log('🔐 MysqlService: Données d\'authentification sauvegardées');
  }

  private clearAuthData(): void {
    if (!this.isBrowser()) {
      return;
    }

    this.writeTokenToStorage(null);
    localStorage.removeItem('faildaily_user');
    localStorage.removeItem(this.userCacheStorageKey);
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user');
    this.currentUser.next(null);
    console.log('🔐 MysqlService: Toutes les données d\'authentification nettoyées');
  }

  private getAuthHeaders(): HttpHeaders {
    const token = this.getStoredToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // Normalise les valeurs de rôle provenant du backend vers l'enum local
  private normalizeRole(role: any): UserRole {
    const r = String(role || '').toLowerCase().trim();
    if (['super_admin', 'super-admin', 'superadmin', 'owner', 'root'].includes(r)) {
      return UserRole.SUPER_ADMIN;
    }
    if (['admin', 'administrator'].includes(r)) {
      return UserRole.ADMIN;
    }
    if (['moderator', 'mod'].includes(r)) {
      return UserRole.MODERATOR;
    }
    return UserRole.USER;
  }

  private getMultipartHeaders(): HttpHeaders {
    const token = this.getStoredToken();
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

      const token = this.getStoredToken();
      if (!token) {
        return null;
      }

      // ✅ FIX: Utiliser l'endpoint existant /auth/profile au lieu de /auth/me
      const response: any = await this.http.get(`${this.apiUrl}/auth/profile`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.data) {
        // ✅ FIX: Adapter la structure de response.data pour correspondre à User
        const user: User = {
          id: response.data.id,
          email: response.data.email,
          displayName: response.data.displayName || 'Utilisateur',
          avatar: response.data.avatarUrl || DEFAULT_AVATAR,
          joinDate: new Date(response.data.createdAt),
          totalFails: 0, // À récupérer si nécessaire
          couragePoints: 0, // À récupérer si nécessaire
          badges: [], // À récupérer si nécessaire
          role: this.normalizeRole(response.data.role),
          emailConfirmed: true, // Supposer confirmé si on a pu récupérer le profil
          registrationCompleted: response.data.registrationCompleted || false,
          legalConsent: response.data.legalConsent ? {
            documentsAccepted: response.data.legalConsent.documentsAccepted || [],
            consentDate: new Date(response.data.legalConsent.consentDate),
            consentVersion: response.data.legalConsent.consentVersion || '1.0',
            marketingOptIn: response.data.legalConsent.marketingOptIn || false
          } : undefined,
          ageVerification: response.data.ageVerification ? {
            birthDate: new Date(response.data.ageVerification.birthDate),
            isMinor: response.data.ageVerification.isMinor,
            needsParentalConsent: response.data.ageVerification.needsParentalConsent,
            parentEmail: response.data.ageVerification.parentEmail,
            parentConsentDate: response.data.ageVerification.parentConsentDate ? 
              new Date(response.data.ageVerification.parentConsentDate) : undefined
          } : undefined,
          preferences: {
            bio: response.data.bio || '',
            theme: 'light',
            darkMode: false,
            notificationsEnabled: true,
            reminderTime: '09:00',
            anonymousMode: false,
            shareLocation: false,
            soundEnabled: true,
            hapticsEnabled: true
          }
        };
        this.currentUser.next(user);
        return user;
      }

      return null;
    } catch (error: any) {
      console.log('🔐 MysqlService: Erreur lors de la vérification de session:', error);
      
      // ✅ FIX: Ne pas déconnecter automatiquement - vérifier le type d'erreur
      if (error.status === 401 || error.status === 403) {
        // Token expiré ou invalide - déconnecter
        console.log('🔐 MysqlService: Token invalide ou expiré - déconnexion');
        this.clearAuthData();
      } else {
        // Erreur réseau ou temporaire - garder la session
        console.log('🔐 MysqlService: Erreur temporaire - conservation de la session');
        
        // Essayer de retourner les données en cache si disponibles
        const cachedUser = this.currentUser.value;
        if (cachedUser) {
          console.log('🔐 MysqlService: Utilisation des données en cache');
          return cachedUser;
        }
      }
      
      return null;
    }
  }

  async signUp(email: string, password: string, displayName: string, birthDate: string, agreeToTerms: boolean, agreeToNewsletter: boolean = false): Promise<any> {
    try {
      console.log('📝 Tentative d\'inscription complète:', email);
      
      const response: any = await this.http.post(`${this.apiUrl}/registration/register`, {
        email,
        password,
        displayName,
        birthDate,
        agreeToTerms,
        agreeToNewsletter
      }).toPromise();

      console.log('🔍 DEBUT DEBUG - Réponse complète du backend:', response);
      console.log('🔍 response.success:', response.success);
      console.log('🔍 response.token:', response.token ? 'présent' : 'absent');
      console.log('🔍 response.user:', response.user ? 'présent' : 'absent');
      console.log('🔍 response.message:', response.message);

      // ✅ Utiliser la bonne route qui retourne success: true
      if (response.success && response.token && response.user) {
        this.saveAuthData(response.token, response.user);
        console.log('✅ Inscription réussie pour:', response.user.email);
        return { data: { user: response.user, session: { access_token: response.token } } };
      } else {
        console.log('❌ Condition échouée - lancement d\'erreur avec message:', response.message);
        throw new Error(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);
      // Gérer les erreurs spécifiques du backend
      if (error.error?.code === 'AGE_RESTRICTION') {
        throw { message: error.error.message, code: 'AGE_RESTRICTION' };
      }
      throw { message: error.error?.message || error.message || 'Erreur lors de l\'inscription' };
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
      console.log('🔍 MysqlService: Getting profile for user:', userId);
      const response: any = await this.http.get(`${this.apiUrl}/auth/profile`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      console.log('✅ MysqlService: Profile response:', response);
      return response;
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

      const response: any = await this.http.post(`${this.apiUrl}/auth/profile`, profileData, {
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

      // Mapper vers le format attendu par le backend: PUT /api/auth/profile
      // Champs supportés: displayName, bio, avatarUrl
      const payload: any = {};
      if (profile.displayName !== undefined) payload.displayName = profile.displayName;
      if (profile.display_name !== undefined && payload.displayName === undefined) payload.displayName = profile.display_name;
      if (profile.bio !== undefined) payload.bio = profile.bio;
      if (profile.avatarUrl !== undefined) payload.avatarUrl = profile.avatarUrl;

      if (Object.keys(payload).length === 0) {
        console.log('ℹ️ Aucun champ valide à mettre à jour');
        return null;
      }

      console.log('📤 Envoi vers API /auth/profile:', payload);
      const response: any = await this.http.put(`${this.apiUrl}/auth/profile`, payload, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response?.success) {
        console.log('✅ Profil mis à jour via /auth/profile');
        this.profileUpdated.next();
        return response.data;
      } else {
        const message = response?.message || 'Erreur lors de la mise à jour du profil';
        console.error('❌ API /auth/profile error:', message);
        throw new Error(message);
      }
    } catch (error: any) {
      console.error('❌ Erreur updateProfile:', error);
      throw error;
    }
  }

  /**
   * Upload avatar fichier vers /api/upload/avatar
   * Retourne l'URL de l'avatar stocké côté backend.
   */
  async uploadAvatar(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response: any = await this.http.post(`${this.apiUrl}/upload/avatar`, formData, {
        headers: this.getMultipartHeaders()
      }).toPromise();

      if (response?.success && response?.data?.avatarUrl) {
        console.log('🖼️ Avatar uploadé:', response.data.avatarUrl);
        return response.data.avatarUrl;
      }
      throw new Error(response?.message || 'Upload avatar échoué');
    } catch (error) {
      console.error('❌ Erreur upload avatar:', error);
      throw error;
    }
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mime });
  }

  private base64ToBlob(base64: string, mime = 'image/jpeg'): Blob {
    const byteString = atob(base64);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mime });
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    let binary = '';
    const bytes = new Uint8Array(arrayBuffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  async uploadAvatarFromDataUrl(dataUrl: string, filename = `avatar_${Date.now()}.jpg`): Promise<string> {
    const blob = this.dataUrlToBlob(dataUrl);
    const file = new File([blob], filename, { type: blob.type });
    return this.uploadAvatar(file);
  }

  async uploadAvatarFromUri(fileUri: string, filename = `avatar_${Date.now()}.jpg`): Promise<string> {
    try {
      // Capacitor Filesystem returns base64 data
      const { data } = await Filesystem.readFile({ path: fileUri });
      let cleanBase64: string = '';
      if (typeof data === 'string') {
        cleanBase64 = (data.includes(',') ? data.split(',').pop() || '' : data);
      } else if (data) {
        // Blob case (web environment)
        cleanBase64 = await this.blobToBase64(data as Blob);
      }
      const blob = this.base64ToBlob(cleanBase64, 'image/jpeg');
      const file = new File([blob], filename, { type: 'image/jpeg' });
      return this.uploadAvatar(file);
    } catch (error) {
      console.error('❌ Erreur lecture fichier via Capacitor:', error);
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

      const response: any = await this.http.get(`${this.apiUrl}/registration/check-display-name?${params.toString()}`, {
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
      const response: any = await this.http.post(`${this.apiUrl}/registration/generate-display-name`, {
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
          imageUrl = await this.uploadImage(fail.image);
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
        is_anonyme: !!fail.is_anonyme
      };

      const response: any = await this.http.post(`${this.apiUrl}/fails`, failToCreate, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.fail) {
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

  async getPublicFails(limit: number = 20, offset: number = 0): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.set('limit', limit.toString());
      params.set('offset', offset.toString());

      console.log('📡 MysqlService: Appel API /fails/anonymes avec params:', { limit, offset });

      const response: any = await this.http.get(`${this.apiUrl}/fails/anonymes?${params.toString()}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      console.log('📡 MysqlService: Réponse brute du backend:', response);

      // Le backend retourne directement un tableau de fails
      if (Array.isArray(response)) {
        console.log('✅ MysqlService: Public fails récupérés avec succès:', response.length, 'fails');
        console.log('🔍 MysqlService: Premier fail détaillé:', response[0]);
        
        // Log détaillé de chaque fail pour debug
        response.forEach((fail, index) => {
          console.log(`🔍 Fail ${index + 1}:`, {
            id: fail.id,
            title: fail.title,
            authorId: fail.authorId,
            authorName: fail.authorName,
            authorAvatar: fail.authorAvatar,
            isAnonyme: fail.is_anonyme
          });
        });
        
        return response;
      } else if (response && response.fails) {
        // Format alternatif avec wrapper
        console.log('✅ MysqlService: Public fails récupérés avec succès:', response.fails.length, 'fails');
        return response.fails;
      } else {
        throw new Error('Réponse invalide du serveur');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération fails publics:', error);
      throw error;
    }
  }

  // Alias pour compatibilité avec l'ancien nom de méthode
  async getFails(limit: number = 20, offset: number = 0): Promise<any[]> {
    return this.getPublicFails(limit, offset);
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

  async addReaction(failId: string, reactionType: string): Promise<{ action: string; reactionType: string | null; summary: { counts: any; totalCount: number; userReaction: string | null } }> {
    try {
      // Harmoniser avec les types backend
      reactionType = this.mapReactionType(reactionType);
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) {
        throw new Error('Utilisateur non connecté');
      }

      console.log(`👍 Ajout réaction ${reactionType} au fail ${failId}`);

      // Vérifier si l'utilisateur a déjà réagi
      const existingReaction = await this.getUserReactionForFail(failId);
      
      if (existingReaction === reactionType) {
        console.log('✅ Réaction identique, pas de changement');
        return { action: 'unchanged', reactionType, summary: { counts: {}, totalCount: 0, userReaction: reactionType } };
      }

      const response: any = await this.http.post(`${this.apiUrl}/fails/${failId}/reactions`, {
        reactionType
      }, { headers: this.getAuthHeaders() }).toPromise();

      if (response.success) {
        console.log(`✅ Réaction ${reactionType} ajoutée avec succès`);
        
        // Vider le cache pour ce fail
        this.clearUserReactionCache(failId);
        
        // Mettre à jour les points de courage
        await this.updateCouragePoints(failId, reactionType, 1);
        return response.data || { action: 'added', reactionType, summary: { counts: {}, totalCount: 0, userReaction: reactionType } };
      } else {
        throw new Error(response.message || 'Erreur lors de l\'ajout de la réaction');
      }
    } catch (error: any) {
      console.error('❌ Erreur ajout réaction:', error);
      throw error;
    }
  }

  async removeReaction(failId: string, reactionType: string): Promise<{ summary?: { counts: any; totalCount: number; userReaction: string | null } }> {
    try {
      // Harmoniser avec les types backend
      reactionType = this.mapReactionType(reactionType);
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
        
        // Vider le cache pour ce fail
        this.clearUserReactionCache(failId);
        
        // Mettre à jour les points de courage
        await this.updateCouragePoints(failId, reactionType, -1);
        return response.data || {};
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

      const cacheKey = `${currentUser.id}-${failId}`;
      const now = Date.now();
      
      // Vérifier le cache
      const cached = this.userReactionsCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < this.USER_REACTIONS_CACHE_TTL) {
        return cached.data.length > 0 ? cached.data[0] : null;
      }

      // ✅ FIX: Utiliser l'endpoint existant /reactions qui retourne userReaction
      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}/reactions`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      let result: string | null = null;
      if (response.success && response.data) {
        result = response.data.userReaction;
        
        // Mettre en cache (convertir en array pour cohérence)
        const reactionsArray = result ? [result] : [];
        this.userReactionsCache.set(cacheKey, { data: reactionsArray, timestamp: now });
      }
      
      return result;
    } catch (error: any) {
      console.warn('⚠️ Erreur récupération réaction utilisateur:', error);
      return null;
    }
  }

  // Cache pour les réactions utilisateur avec TTL de 30 secondes
  private userReactionsCache = new Map<string, { data: string[], timestamp: number }>();
  private readonly USER_REACTIONS_CACHE_TTL = 60000; // 60 secondes (augmenté pour éviter surcharge)

  async getUserReactionsForFail(failId: string): Promise<string[]> {
    try {
      const currentUser = this.getCurrentUserSync();
      if (!currentUser) return [];

      const cacheKey = `${currentUser.id}-${failId}`;
      const now = Date.now();
      
      // Vérifier le cache
      const cached = this.userReactionsCache.get(cacheKey);
      if (cached && (now - cached.timestamp) < this.USER_REACTIONS_CACHE_TTL) {
        return cached.data;
      }

      // ✅ FIX: Utiliser l'endpoint existant /reactions qui retourne toutes les réactions
      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}/reactions`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      let result: string[] = [];
      if (response.success && response.data && response.data.reactions) {
        result = response.data.reactions.map((r: any) => r.type);
      }

      // Mettre en cache
      this.userReactionsCache.set(cacheKey, { data: result, timestamp: now });
      
      return result;
    } catch (error: any) {
      console.warn('⚠️ Erreur récupération réactions utilisateur:', error);
      return [];
    }
  }

  /**
   * Vider le cache des réactions utilisateur pour un fail spécifique
   */
  private clearUserReactionCache(failId: string): void {
    const currentUser = this.getCurrentUserSync();
    if (currentUser) {
      const cacheKey = `${currentUser.id}-${failId}`;
      this.userReactionsCache.delete(cacheKey);
    }
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Récupérer les comptes de réactions pour un fail
   */
  async getReactionsForFail(failId: string): Promise<{courage: number, empathy: number, laugh: number, support: number}> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}/reactions`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.data) {
        // Compter les réactions par type
        const reactionCounts = {
          courage: 0,
          empathy: 0,
          laugh: 0,
          support: 0
        };

        if (response.data.reactions && Array.isArray(response.data.reactions)) {
          response.data.reactions.forEach((reaction: any) => {
            if (reactionCounts.hasOwnProperty(reaction.type)) {
              reactionCounts[reaction.type as keyof typeof reactionCounts]++;
            }
          });
        }

        return reactionCounts;
      }
      
      return { courage: 0, empathy: 0, laugh: 0, support: 0 };
    } catch (error: any) {
      console.warn('⚠️ Erreur récupération comptes réactions:', error);
      return { courage: 0, empathy: 0, laugh: 0, support: 0 };
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
      // Vérifier que l'userId n'est pas undefined
      if (!userId || userId === 'undefined') {
        console.warn('⚠️ getUserStats appelé avec un userId invalide:', userId);
        return {
          totalFails: 0,
          totalReactionsGiven: 0,
          totalReactionsReceived: 0,
          couragePoints: 0,
          totalBadges: 0,
          streak: 0,
          reactionsByType: {},
          failsByCategory: {},
          mostPopularFails: []
        } as UserStats;
      }
      
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
      // Vérifier que l'userId n'est pas undefined
      if (!userId || userId === 'undefined') {
        console.warn('⚠️ getUserBadgesNew appelé avec un userId invalide:', userId);
        return [];
      }
      
      // Utiliser l'endpoint /me/badges plus efficace
      const response: any = await this.http.get(`${this.apiUrl}/users/me/badges`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.badges) {
        // Extraire les IDs des badges (structure: l'API retourne bd.id qui est l'identifiant du badge_definitions)
        const badgeIds = response.badges.map((badge: any) => badge.id);
        console.log('🔍 DEBUG getUserBadgesNew - Raw response badges:', response.badges);
        console.log('🔍 DEBUG getUserBadgesNew - Extracted badge IDs:', badgeIds);
        return badgeIds;
      } else {
        console.warn('⚠️ Aucun badge trouvé ou réponse invalide');
        return [];
      }
    } catch (error: any) {
      console.warn('⚠️ Erreur récupération badges utilisateur:', error);
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
      const response: any = await this.http.get(`${this.apiUrl}/admin/points/config`, {
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
      const response: any = await this.http.put(`${this.apiUrl}/admin/points/config`, config, {
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

  async bulkTruncateTables(tables: string[], isAuthTables: boolean = false): Promise<{ success: boolean, message: string, results?: any[] }> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/tables/bulk-truncate`, {
        tables,
        isAuthTables
      }, { headers: this.getAuthHeaders() }).toPromise();

      return {
        success: response.success,
        message: response.message || 'Opération terminée',
        results: response.results || []
      };
    } catch (error: any) {
      console.error('❌ Erreur vidage en masse:', error);
      return {
        success: false,
        message: error.error?.message || error.message || 'Erreur lors du vidage en masse'
      };
    }
  }

  async getDatabaseCounts(): Promise<{ success: boolean; counts: Record<string, number|null> }> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/db/counts`, {
        headers: this.getAuthHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('❌ Erreur getDatabaseCounts:', error);
      return { success: false, counts: {} } as any;
    }
  }

  async resetComplete(): Promise<{ success: boolean; message: string; results?: any[] }> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/admin/reset/complete`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();
      return response;
    } catch (error: any) {
      console.error('❌ Erreur resetComplete:', error);
      throw error?.error?.message || error?.message || 'Erreur reset complet';
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
      // Temporairement désactivé car la route n'existe pas encore
      // await this.http.post(`${this.apiUrl}/admin/logs/user-login`, {
      //   userId,
      //   ip,
      //   userAgent
      // }, { headers: this.getAuthHeaders() }).toPromise();
      console.log('📊 Log connexion utilisateur (désactivé temporairement):', { userId, ip, userAgent });
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

  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response: any = await this.http.post(`${this.apiUrl}/upload/image`, formData, {
        headers: this.getMultipartHeaders()
      }).toPromise();

      if (response?.success && response?.data?.imageUrl) {
        console.log('🖼️ Image uploadée:', response.data.imageUrl);
        return response.data.imageUrl;
      } else {
        throw new Error(response?.message || 'Erreur lors de l\'upload de l\'image');
      }
    } catch (error: any) {
      console.error('❌ Erreur upload image:', error);
      throw error;
    }
  }

  // ===== ADMIN LOGS (Backed by /api/admin/logs/*) =====

  async adminLogsSummary(days: number = 7): Promise<any> {
    const url = `${this.apiUrl}/admin/logs/summary?days=${days}`;
    const res: any = await this.http.get(url, { headers: this.getAuthHeaders() }).toPromise();
    return res?.success ? res : { success: false };
  }

  async adminLogsByDay(days: number = 7): Promise<any> {
    const url = `${this.apiUrl}/admin/logs/by-day?days=${days}`;
    const res: any = await this.http.get(url, { headers: this.getAuthHeaders() }).toPromise();
    return res?.success ? res : { success: false };
  }

  async adminLogsByUser(days: number = 7): Promise<any> {
    const url = `${this.apiUrl}/admin/logs/by-user?days=${days}`;
    const res: any = await this.http.get(url, { headers: this.getAuthHeaders() }).toPromise();
    return res?.success ? res : { success: false };
  }

  async adminLogsActions(days: number = 7): Promise<any> {
    const url = `${this.apiUrl}/admin/logs/actions?days=${days}`;
    const res: any = await this.http.get(url, { headers: this.getAuthHeaders() }).toPromise();
    return res?.success ? res : { success: false };
  }

  async adminLogsList(params: { limit?: number; offset?: number; level?: string; action?: string; userId?: string; start?: string; end?: string } = {}): Promise<any> {
    const qp = new URLSearchParams();
    if (params.limit) qp.set('limit', String(params.limit));
    if (params.offset) qp.set('offset', String(params.offset));
    if (params.level) qp.set('level', params.level);
    if (params.action) qp.set('action', params.action);
    if (params.userId) qp.set('userId', params.userId);
    if (params.start) qp.set('start', params.start);
    if (params.end) qp.set('end', params.end);
    const url = `${this.apiUrl}/admin/logs/list${qp.toString() ? '?' + qp.toString() : ''}`;
    const res: any = await this.http.get(url, { headers: this.getAuthHeaders() }).toPromise();
    return res?.success ? res : { success: false };
  }

  // Harmonisation des types de réactions côté FE -> BE
  private mapReactionType(rt: string): string {
    const t = String(rt || '').toLowerCase();
    const map: Record<string, string> = {
      // Synonymes FE → types BE
      'heart': 'courage',
      'fire': 'courage',
      'thumbs_up': 'support',
      'clap': 'support',
      'muscle': 'support',
      // Pass-through
      'courage': 'courage',
      'laugh': 'laugh',
      'empathy': 'empathy',
      'support': 'support'
    };
    return map[t] || t;
  }

  // Moderation API helpers
  async getReportedFails(threshold: number = 1): Promise<any[]> {
    const res: any = await this.http.get(`${this.apiUrl}/admin/fails/reported?threshold=${threshold}`, {
      headers: this.getAuthHeaders()
    }).toPromise();
    return res?.items || [];
  }

  async getReportedComments(threshold: number = 1): Promise<any[]> {
    const res: any = await this.http.get(`${this.apiUrl}/admin/comments/reported?threshold=${threshold}`, {
      headers: this.getAuthHeaders()
    }).toPromise();
    return res?.items || [];
  }

  async getFailsByStatus(status: 'approved'|'hidden'): Promise<any[]> {
    const res: any = await this.http.get(`${this.apiUrl}/admin/fails/by-status?status=${status}`, {
      headers: this.getAuthHeaders()
    }).toPromise();
    return res?.items || [];
  }

  async getCommentsByStatus(status: 'approved'|'hidden'): Promise<any[]> {
    const res: any = await this.http.get(`${this.apiUrl}/admin/comments/by-status?status=${status}`, {
      headers: this.getAuthHeaders()
    }).toPromise();
    return res?.items || [];
  }

  async setFailModerationStatus(failId: string, status: 'approved'|'hidden'|'under_review'): Promise<void> {
    await this.http.put(`${this.apiUrl}/admin/fails/${failId}/moderation`, { status }, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  async setCommentModerationStatus(commentId: string, status: 'approved'|'hidden'|'under_review'): Promise<void> {
    await this.http.put(`${this.apiUrl}/admin/comments/${commentId}/moderation`, { status }, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  async getModerationConfig(): Promise<{ failReportThreshold: number, commentReportThreshold: number, panelAutoRefreshSec: number }> {
    const res: any = await this.http.get(`${this.apiUrl}/admin/moderation/config`, {
      headers: this.getAuthHeaders()
    }).toPromise();
    return res?.config || { failReportThreshold: 1, commentReportThreshold: 1, panelAutoRefreshSec: 20 };
  }

  async updateModerationConfig(cfg: { failReportThreshold: number, commentReportThreshold: number, panelAutoRefreshSec?: number }): Promise<void> {
    await this.http.put(`${this.apiUrl}/admin/moderation/config`, cfg, {
      headers: this.getAuthHeaders()
    }).toPromise();
  }

  async reportFail(failId: string, reason?: string): Promise<any> {
    const body: any = reason ? { reason } : {};
    const response: any = await this.http.post(`${this.apiUrl}/fails/${failId}/report`, body, {
      headers: this.getAuthHeaders()
    }).toPromise();
    return response;
  }

  async getUserProfile(userId: string): Promise<any | null> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/admin/users/${userId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.user;
      } else {
        return null;
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération profil utilisateur:', error);
      return null;
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
