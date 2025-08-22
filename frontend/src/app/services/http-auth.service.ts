import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, from, catchError, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  legalConsent?: any;
  ageVerification?: any;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HttpAuthService {
  private apiUrl = environment.api.baseUrl || 'http://localhost:3000/api';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('🔐 HttpAuthService: Initialisation du service d\'authentification HTTP');
    this.loadStoredUser();
  }

  private loadStoredUser(): void {
    const token = localStorage.getItem('faildaily_token');
    const userData = localStorage.getItem('current_user');
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
        console.log('✅ Utilisateur restauré depuis le localStorage');
      } catch (error) {
        console.warn('⚠️ Erreur lors de la restauration de l\'utilisateur:', error);
        this.clearAuthData();
      }
    }
  }

  private saveAuthData(token: string, user: User): void {
    localStorage.setItem('faildaily_token', token);
    localStorage.setItem('current_user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('faildaily_token');
    localStorage.removeItem('current_user');
    this.currentUserSubject.next(null);
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('faildaily_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  async register(registerData: RegisterData): Promise<AuthResponse> {
    try {
      console.log('📝 Tentative d\'inscription:', registerData.email);
      
      const response: any = await this.http.post(`${this.apiUrl}/auth/register`, {
        email: registerData.email,
        password: registerData.password,
        displayName: registerData.displayName,
        legalConsent: registerData.legalConsent,
        ageVerification: registerData.ageVerification
      }).toPromise();

      if (response.success && response.token && response.user) {
        this.saveAuthData(response.token, response.user);
        console.log('✅ Inscription réussie pour:', response.user.email);
        
        return {
          success: true,
          token: response.token,
          user: response.user,
          message: 'Inscription réussie'
        };
      } else {
        throw new Error(response.message || 'Erreur lors de l\'inscription');
      }
    } catch (error: any) {
      console.error('❌ Erreur inscription:', error);
      
      return {
        success: false,
        error: error.error?.message || error.message || 'Erreur lors de l\'inscription'
      };
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('🔑 Tentative de connexion:', credentials.email);
      
      const response: any = await this.http.post(`${this.apiUrl}/auth/login`, {
        email: credentials.email,
        password: credentials.password
      }).toPromise();

      if (response.success && response.token && response.user) {
        this.saveAuthData(response.token, response.user);
        console.log('✅ Connexion réussie pour:', response.user.email);
        
        // Log de connexion
        await this.logUserLogin(response.user.id);
        
        return {
          success: true,
          token: response.token,
          user: response.user,
          message: 'Connexion réussie'
        };
      } else {
        throw new Error(response.message || 'Identifiants invalides');
      }
    } catch (error: any) {
      console.error('❌ Erreur connexion:', error);
      
      return {
        success: false,
        error: error.error?.message || error.message || 'Erreur lors de la connexion'
      };
    }
  }

  async logout(): Promise<void> {
    try {
      const currentUser = this.currentUserSubject.value;
      if (currentUser) {
        console.log('👋 Déconnexion de:', currentUser.email);
        
        // Log de déconnexion sur le serveur
        await this.http.post(`${this.apiUrl}/auth/logout`, {}, {
          headers: this.getAuthHeaders()
        }).toPromise();
      }
    } catch (error) {
      console.warn('⚠️ Erreur lors de la déconnexion serveur:', error);
    } finally {
      this.clearAuthData();
      console.log('✅ Données d\'authentification supprimées');
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserSync(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('faildaily_token');
    const user = this.currentUserSubject.value;
    return !!(token && user);
  }

  getAuthToken(): string | null {
    return localStorage.getItem('faildaily_token');
  }

  async refreshUser(): Promise<User | null> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        throw new Error('Pas de token d\'authentification');
      }

      const response: any = await this.http.get(`${this.apiUrl}/auth/me`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.user) {
        const userData = JSON.stringify(response.user);
        localStorage.setItem('current_user', userData);
        this.currentUserSubject.next(response.user);
        console.log('✅ Données utilisateur mises à jour');
        return response.user;
      } else {
        throw new Error('Impossible de récupérer les données utilisateur');
      }
    } catch (error) {
      console.error('❌ Erreur refresh utilisateur:', error);
      this.clearAuthData();
      return null;
    }
  }

  async updateProfile(profileData: any): Promise<User | null> {
    try {
      const response: any = await this.http.put(`${this.apiUrl}/profile`, profileData, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.user) {
        const userData = JSON.stringify(response.user);
        localStorage.setItem('current_user', userData);
        this.currentUserSubject.next(response.user);
        console.log('✅ Profil mis à jour');
        return response.user;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      console.error('❌ Erreur mise à jour profil:', error);
      throw error;
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/auth/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log('✅ Mot de passe modifié avec succès');
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('❌ Erreur changement mot de passe:', error);
      throw error;
    }
  }

  async forgotPassword(email: string): Promise<boolean> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/auth/forgot-password`, {
        email
      }).toPromise();

      if (response.success) {
        console.log('✅ Email de récupération envoyé');
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'envoi de l\'email de récupération');
      }
    } catch (error) {
      console.error('❌ Erreur forgot password:', error);
      throw error;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/auth/reset-password`, {
        token,
        newPassword
      }).toPromise();

      if (response.success) {
        console.log('✅ Mot de passe réinitialisé avec succès');
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la réinitialisation du mot de passe');
      }
    } catch (error) {
      console.error('❌ Erreur reset password:', error);
      throw error;
    }
  }

  async deleteAccount(password: string): Promise<boolean> {
    try {
      const response: any = await this.http.delete(`${this.apiUrl}/auth/delete-account`, {
        headers: this.getAuthHeaders(),
        body: { password }
      }).toPromise();

      if (response.success) {
        console.log('✅ Compte supprimé avec succès');
        this.clearAuthData();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression du compte');
      }
    } catch (error) {
      console.error('❌ Erreur suppression compte:', error);
      throw error;
    }
  }

  private async logUserLogin(userId: string): Promise<void> {
    try {
      const ipAddress = await this.getClientIP();
      const userAgent = navigator.userAgent;

      await this.http.post(`${this.apiUrl}/logs/user-login`, {
        userId,
        ipAddress,
        userAgent
      }, {
        headers: this.getAuthHeaders()
      }).toPromise();
    } catch (error) {
      console.warn('⚠️ Erreur lors du log de connexion:', error);
    }
  }

  private async getClientIP(): Promise<string> {
    try {
      // En développement, retourner une IP fictive
      if (environment.production === false) {
        return '127.0.0.1';
      }
      
      // En production, utiliser un service pour obtenir l'IP réelle
      const response: any = await this.http.get('https://api.ipify.org?format=json').toPromise();
      return response.ip || 'unknown';
    } catch (error) {
      return 'unknown';
    }
  }

  async validateToken(): Promise<boolean> {
    try {
      const token = this.getAuthToken();
      if (!token) {
        return false;
      }

      const response: any = await this.http.get(`${this.apiUrl}/auth/validate`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return true;
      } else {
        this.clearAuthData();
        return false;
      }
    } catch (error) {
      console.warn('⚠️ Token invalide, déconnexion automatique');
      this.clearAuthData();
      return false;
    }
  }

  // Observables pour l'état d'authentification
  get isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(
      map(user => !!user)
    );
  }

  // Méthode de compatibilité avec l'ancien service
  getCurrentUserObservable(): Observable<User | null> {
    return this.currentUser$;
  }
}