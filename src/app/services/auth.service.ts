import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, map, catchError, switchMap, filter, take, timeout } from 'rxjs';
import { User } from '../models/user.model';
import { SupabaseService } from './supabase.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  displayName?: string;
  legalConsent?: any;
  ageVerification?: any;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    // Écouter les changements d'authentification Supabase
    this.supabase.currentUser$.subscribe(async (supabaseUser: any) => {
      if (supabaseUser) {
        try {
          // Récupérer le profil complet depuis Supabase
          const profile = await this.supabase.getProfile(supabaseUser.id);

          // Si pas de profil, créer un utilisateur basique
          if (!profile) {
            const user: User = {
              id: supabaseUser.id,
              email: supabaseUser.email!,
              displayName: supabaseUser.user_metadata?.display_name || 'Utilisateur',
              username: supabaseUser.user_metadata?.username || 'user',
              avatar: 'assets/anonymous-avatar.svg',
              joinDate: new Date(supabaseUser.created_at),
              totalFails: 0,
              couragePoints: 0,
              badges: [],
              emailConfirmed: true,
              registrationCompleted: false,
              legalConsent: undefined,
              ageVerification: undefined
            };

            this.currentUserSubject.next(user);
            return;
          }

          // Convertir en format User de l'app avec profil complet
          const user: User = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            displayName: profile?.display_name || profile?.username || 'Utilisateur',
            username: profile?.username || 'user',
            avatar: profile?.avatar_url || 'assets/anonymous-avatar.svg',
            joinDate: new Date(profile?.created_at || supabaseUser.created_at),
            totalFails: profile?.stats?.totalFails || 0,
            couragePoints: profile?.stats?.couragePoints || 0,
            badges: profile?.stats?.badges || [],
            emailConfirmed: profile?.email_confirmed || false,
            registrationCompleted: profile?.registration_completed || false,
            legalConsent: profile?.legal_consent ? {
              documentsAccepted: profile.legal_consent.documentsAccepted,
              consentDate: new Date(profile.legal_consent.consentDate),
              consentVersion: profile.legal_consent.consentVersion,
              marketingOptIn: profile.legal_consent.marketingOptIn
            } : undefined,
            ageVerification: profile?.age_verification ? {
              birthDate: new Date(profile.age_verification.birthDate),
              isMinor: profile.age_verification.isMinor,
              needsParentalConsent: profile.age_verification.needsParentalConsent,
              parentEmail: profile.age_verification.parentEmail,
              parentConsentDate: profile.age_verification.parentConsentDate ?
                new Date(profile.age_verification.parentConsentDate) : undefined
            } : undefined
          };

          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Créer un profil par défaut si pas trouvé
          if ((error as any)?.message?.includes('No rows returned')) {
            await this.createDefaultProfile(supabaseUser);
          } else {
            this.currentUserSubject.next(null);
          }
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  } private async createDefaultProfile(supabaseUser: any) {
    try {
      const username = supabaseUser.user_metadata?.username ||
        supabaseUser.email?.split('@')[0] ||
        'user_' + Date.now();

      const profileData = {
        id: supabaseUser.id,
        username,
        email: supabaseUser.email!,
        display_name: supabaseUser.user_metadata?.display_name || username,
        stats: {
          totalFails: 0,
          couragePoints: 0,
          badges: []
        },
        preferences: {}
      };

      // Insérer le profil dans Supabase
      const profile = await this.supabase.updateProfile(supabaseUser.id, profileData);

      const user: User = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        displayName: profile.display_name || username,
        username: profile.username,
        avatar: 'assets/anonymous-avatar.svg',
        joinDate: new Date(),
        totalFails: 0,
        couragePoints: 0,
        badges: []
      };

      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Error creating default profile:', error);
      this.currentUserSubject.next(null);
    }
  }

  login(credentials: LoginCredentials): Observable<User | null> {
    return from(this.supabase.signIn(credentials.email, credentials.password))
      .pipe(
        switchMap(() => {
          // Attendre que l'utilisateur soit mis à jour via l'observable supabase.currentUser$
          return this.currentUser$.pipe(
            filter(user => user !== undefined),
            take(1),
            timeout(5000)
          );
        }),
        catchError((error) => {
          console.error('Login error:', error);

          if (error.message?.includes('Email not confirmed')) {
            throw new Error('Votre compte doit être confirmé par email avant de pouvoir vous connecter. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.');
          }

          if (error.message?.includes('Invalid credentials')) {
            throw new Error('Email ou mot de passe incorrect.');
          }

          if (error.message?.includes('Invalid login credentials')) {
            throw new Error('Email ou mot de passe incorrect.');
          }

          throw new Error(error.message || 'Erreur de connexion inconnue.');
        })
      );
  }

  register(data: RegisterData): Observable<User | null> {
    return from(this.supabase.signUp(data.email, data.password, data.username))
      .pipe(
        switchMap(async (result) => {
          if (result?.user) {
            // Créer immédiatement un profil simple
            const profileData = {
              id: result.user.id,
              username: data.username,
              email: data.email,
              display_name: data.username,
              registration_completed: false,
              stats: { totalFails: 0, couragePoints: 0, badges: [] },
              preferences: {}
            };

            try {
              await this.supabase.updateProfile(result.user.id, profileData);
            } catch (error) {
              console.warn('Profil sera créé plus tard:', error);
            }

            // Retourner l'utilisateur simple
            const user: User = {
              id: result.user.id,
              email: data.email,
              displayName: data.username,
              username: data.username,
              avatar: 'assets/anonymous-avatar.svg',
              joinDate: new Date(),
              totalFails: 0,
              couragePoints: 0,
              badges: [],
              emailConfirmed: true,
              registrationCompleted: false,
              legalConsent: undefined,
              ageVerification: undefined
            };

            this.currentUserSubject.next(user);
            return user;
          }
          return null;
        }),
        catchError((error) => {
          console.error('Registration error:', error);
          throw error;
        })
      );
  }

  async completeRegistration(legalConsent: any, ageVerification: any): Promise<User | null> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Aucun utilisateur connecté');
    }

    try {
      await this.supabase.completeRegistration(currentUser.id, legalConsent, ageVerification);

      // Recharger le profil complet
      const profile = await this.supabase.getProfile(currentUser.id);
      const updatedUser: User = {
        ...currentUser,
        legalConsent: {
          documentsAccepted: legalConsent.documentsAccepted,
          consentDate: new Date(legalConsent.consentDate),
          consentVersion: legalConsent.consentVersion,
          marketingOptIn: legalConsent.marketingOptIn
        },
        ageVerification: {
          birthDate: new Date(ageVerification.birthDate),
          isMinor: ageVerification.isMinor,
          needsParentalConsent: ageVerification.needsParentalConsent,
          parentEmail: ageVerification.parentEmail,
          parentConsentDate: ageVerification.parentConsentDate ?
            new Date(ageVerification.parentConsentDate) : undefined
        }
      };

      this.currentUserSubject.next(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error('Complete registration error:', error);
      throw error;
    }
  }

  async checkRegistrationStatus(userId?: string): Promise<any> {
    const targetUserId = userId || this.getCurrentUser()?.id;
    if (!targetUserId) {
      throw new Error('Aucun utilisateur spécifié');
    }

    try {
      return await this.supabase.checkRegistrationStatus(targetUserId);
    } catch (error) {
      console.error('Check registration status error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await this.supabase.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
}
