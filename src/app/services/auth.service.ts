import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, catchError, switchMap } from 'rxjs';
import { User } from '../models/user.model';
import { SupabaseService } from './supabase.service';
import { DebugService } from './debug.service';
import { authLog } from '../utils/logger';

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

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();

  // ✅ AJOUT : Cache de session pour éviter les race conditions
  private sessionInitialized = false;
  private initPromise: Promise<void> | null = null;

  // ✅ NOUVEAU : Protection contre les appels concurrents
  private processingProfileLoad = false;
  private lastProcessedUserId: string | null = null;

  constructor(
    private supabase: SupabaseService,
    private debugService: DebugService
  ) {
    authLog('🔐 AuthService: Constructor called - initializing authentication service');
    this.initializeAuth();
  }

  /**
   * ✅ NOUVELLE MÉTHODE : Garantir que l'initialisation est terminée
   */
  async ensureInitialized(): Promise<User | null> {
    if (this.sessionInitialized) {
      const currentValue = this.currentUserSubject.value;
      return currentValue === undefined ? null : currentValue;
    }

    if (!this.initPromise) {
      authLog('🔐 AuthService: Force initialization...');
      this.initPromise = this.initializeAuth();
    }

    await this.initPromise;
    const currentValue = this.currentUserSubject.value;
    return currentValue === undefined ? null : currentValue;
  }

  /**
   * ✅ GESTION CACHE UTILISATEUR pour refresh instantané
   */
  private getCachedUser(): User | null {
    try {
      authLog('🔐 AuthService: Vérification du cache localStorage...');
      const cached = localStorage.getItem('faildaily_user_cache');
      if (cached) {
        authLog('🔐 AuthService: Cache trouvé, parsing...');
        const parsed = JSON.parse(cached);
        // Vérifier que le cache n'est pas trop vieux (max 1 heure)
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 3600000) {
          authLog('🔐 AuthService: Cache utilisateur valide trouvé pour:', parsed.user?.email);
          return parsed.user;
        } else {
          authLog('🔐 AuthService: Cache expiré, suppression...');
          localStorage.removeItem('faildaily_user_cache');
        }
      } else {
        authLog('🔐 AuthService: Aucun cache trouvé dans localStorage');
      }
    } catch (error) {
      console.error('🔐 AuthService: Erreur lecture cache:', error);
    }
    return null;
  }

  private setCachedUser(user: User): void {
    try {
      const cacheData = {
        user,
        timestamp: Date.now()
      };
      localStorage.setItem('faildaily_user_cache', JSON.stringify(cacheData));
      authLog('🔐 AuthService: Utilisateur mis en cache');
    } catch (error) {
      console.error('🔐 AuthService: Erreur écriture cache:', error);
    }
  }

  private clearCachedUser(): void {
    try {
      localStorage.removeItem('faildaily_user_cache');
      authLog('🔐 AuthService: Cache utilisateur nettoyé');
    } catch (error) {
      console.error('🔐 AuthService: Erreur nettoyage cache:', error);
    }
  }

  /**
   * ✅ MÉTHODE HELPER : Mettre à jour utilisateur avec cache automatique
   */
  private setCurrentUser(user: User | null): void {
    this.currentUserSubject.next(user);
    if (user) {
      this.setCachedUser(user);
    } else {
      this.clearCachedUser();
    }
  }



  private async initializeAuth() {
    authLog('🔐 AuthService: initializeAuth called');

    try {
      // ✅ CORRECTION : Vérifier d'abord le cache localStorage pour une réponse IMMEDIATE
      const cachedUser = this.getCachedUser();
      if (cachedUser) {
        authLog('🔐 AuthService: Cache trouvé - utilisateur défini immédiatement');
        this.currentUserSubject.next(cachedUser);
      }

      // ✅ CORRECTION : Maintenant que Supabase persiste les sessions, vérification plus simple
      authLog('🔐 AuthService: Vérification de la session Supabase...');
      const { data: { session }, error } = await this.supabase.client.auth.getSession();

      if (error) {
        console.error('🔐 AuthService: Erreur lors de la récupération de session:', error);
        // Si erreur de session ET pas de cache, déconnecter
        if (!cachedUser) {
          this.setCurrentUser(null);
        }
        this.sessionInitialized = true;
        return;
      }

      if (session?.user) {
        authLog('🔐 AuthService: Session Supabase trouvée pour:', session.user.email);

        try {
          let profile = await this.supabase.getProfile(session.user.id);
          authLog('🔐 AuthService: Profile chargé:', profile ? 'trouvé' : 'non trouvé');

          // Si pas de profil, en créer un
          if (!profile) {
            authLog('🔐 AuthService: Création du profil');
            profile = await this.supabase.createProfile(session.user);
          }

          // Créer l'objet User
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            displayName: profile?.display_name || 'Utilisateur',
            avatar: profile?.avatar_url || 'assets/anonymous-avatar.svg',
            joinDate: new Date(profile?.created_at || session.user.created_at),
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

          authLog('🔐 AuthService: Utilisateur défini avec session Supabase');
          this.setCurrentUser(user);
        } catch (profileError) {
          console.error('🔐 AuthService: Erreur chargement profil:', profileError);
          // En cas d'erreur de profil, créer un utilisateur basique
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email!,
            displayName: session.user.user_metadata?.['display_name'] || 'Utilisateur',
            avatar: 'assets/anonymous-avatar.svg',
            joinDate: new Date(session.user.created_at),
            totalFails: 0,
            couragePoints: 0,
            badges: [],
            emailConfirmed: true,
            registrationCompleted: false,
            legalConsent: undefined,
            ageVerification: undefined
          };
          this.setCurrentUser(basicUser);
        }
      } else {
        // ✅ Pas de session Supabase - garder le cache si disponible sinon déconnecter
        if (cachedUser) {
          authLog('🔐 AuthService: Pas de session Supabase mais cache valide - maintenir la connexion');
        } else {
          authLog('🔐 AuthService: Aucune session - déconnexion');
          this.setCurrentUser(null);
        }
      }

      this.sessionInitialized = true;

      authLog('🔐 AuthService: Configuration de l\'écoute des changements Supabase');
      // Écouter les changements d'authentification Supabase
      this.supabase.currentUser$.subscribe(async (supabaseUser: any) => {
        authLog('🔐 AuthService: Changement utilisateur Supabase:', supabaseUser?.id || 'null');

        if (!supabaseUser) {
          // ✅ SIMPLIFICATION : Avec persistSession=true, les déconnexions sont plus fiables
          authLog('🔐 AuthService: Déconnexion Supabase détectée');
          this.setCurrentUser(null);
          return;
        }

        // Si nouvel utilisateur connecté, charger son profil
        if (supabaseUser.id !== this.currentUserSubject.value?.id) {
          authLog('🔐 AuthService: Nouvel utilisateur connecté - chargement du profil');
          try {
            let profile = await this.supabase.getProfile(supabaseUser.id);
            if (!profile) {
              profile = await this.supabase.createProfile(supabaseUser);
            }

            const user: User = {
              id: supabaseUser.id,
              email: supabaseUser.email!,
              displayName: profile?.display_name || 'Utilisateur',
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

            this.setCurrentUser(user);
          } catch (error) {
            this.debugService.logError('AuthService', 'Erreur lors du chargement du profil utilisateur', error);
          }
        }
      });

    } catch (error) {
      this.debugService.logError('AuthService', 'Erreur lors de l\'initialisation', error);
      this.sessionInitialized = true;
      // En cas d'erreur globale, garder le cache si disponible
      const cachedUser = this.getCachedUser();
      if (!cachedUser) {
        this.setCurrentUser(null);
      }
    }
  }



  async login(credentials: LoginCredentials): Promise<User | null> {
    console.log('🔐 AuthService: Login attempt for:', credentials.email);

    try {
      // Authentification Supabase - retour immédiat
      const result = await this.supabase.signIn(credentials.email, credentials.password);

      if (result?.user) {
        console.log('✅ AuthService: User authenticated successfully');

        // Récupérer immédiatement le profil utilisateur
        let profile = await this.supabase.getProfile(result.user.id);

        if (!profile) {
          console.log('� AuthService: No profile found, creating one');
          profile = await this.supabase.createProfile(result.user);
        }

        // Créer l'objet utilisateur complet
        const user: User = {
          id: result.user.id,
          email: result.user.email!,
          displayName: profile?.display_name || 'Utilisateur',
          avatar: profile?.avatar_url || 'assets/anonymous-avatar.svg',
          joinDate: new Date(profile?.created_at || result.user.created_at),
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

        // Mettre à jour immédiatement le BehaviorSubject AVEC cache
        authLog('🔐 AuthService: Setting user as current with cache...');
        this.setCurrentUser(user);
        authLog('🔐 AuthService: User profile loaded, cached, and set as current user');

        return user;
      } else {
        authLog('🔐 AuthService: No user in authentication result');
        this.currentUserSubject.next(null);
        return null;
      }
    } catch (error: any) {
      console.error('🔐 AuthService: Login error:', error);

      if (error.message?.includes('Email not confirmed')) {
        authLog('🔐 AuthService: Email not confirmed error');
        throw new Error('Votre compte doit être confirmé par email avant de pouvoir vous connecter. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.');
      }

      if (error.message?.includes('Invalid credentials') || error.message?.includes('Invalid login credentials')) {
        authLog('🔐 AuthService: Invalid credentials error');
        throw new Error('Email ou mot de passe incorrect.');
      }

      authLog('🔐 AuthService: Unknown login error');
      throw new Error(error.message || 'Erreur de connexion inconnue.');
    }
  }

  register(data: RegisterData): Observable<User | null> {
    console.log('🔐 AuthService: Registration attempt for:', data.email);

    return from(this.supabase.signUp(data.email, data.password, data.displayName))
      .pipe(
        switchMap(async (result) => {
          if (result?.user) {
            console.log('✅ AuthService: User registered successfully');
            // Créer immédiatement un profil simple
            const profileData = {
              id: result.user.id,
              email: data.email,
              display_name: data.displayName,
              registration_completed: false,
              stats: { totalFails: 0, couragePoints: 0, badges: [] },
              preferences: {}
            };

            try {
              await this.supabase.updateProfile(result.user.id, profileData);
              console.log('✅ AuthService: Profile updated successfully');
            } catch (error) {
              console.log('ℹ️ AuthService: Profile will be created later:', error);
            }

            // Retourner l'utilisateur simple
            const user: User = {
              id: result.user.id,
              email: data.email,
              displayName: data.displayName,
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
          console.log('❌ AuthService: No user returned from signUp');
          return null;
        }),
        catchError((error) => {
          this.debugService.logError('AuthService', 'Registration error', error);
          throw error;
        })
      );
  }

  async completeRegistration(legalConsent: any, ageVerification: any): Promise<User | null> {
    console.log('🔐 AuthService: Starting registration completion...');

    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      console.error('🔐 AuthService: ERREUR CRITIQUE - Aucun utilisateur connecté pour finaliser l\'inscription');
      throw new Error('Aucun utilisateur connecté - impossible de finaliser l\'inscription');
    }

    console.log('🔐 AuthService: User found for completion:', currentUser.email, currentUser.id);

    try {
      console.log('🔐 AuthService: Calling supabase.completeRegistration...');
      await this.supabase.completeRegistration(currentUser.id, legalConsent, ageVerification);

      // Recharger le profil complet
      console.log('🔐 AuthService: Reloading complete profile...');
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
        },
        registrationCompleted: true
      };

      // Mettre à jour le cache utilisateur
      this.setCachedUser(updatedUser);
      this.currentUserSubject.next(updatedUser);
      console.log('🔐 AuthService: Registration completion successful');

      return updatedUser;
    } catch (error) {
      console.error('Complete registration error:', error);
      throw error;
    }
  }



  async logout(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.clearCachedUser(); // ✅ Nettoyer le cache lors de la déconnexion
      this.currentUserSubject.next(null);
      authLog('🔐 AuthService: Utilisateur déconnecté et cache nettoyé');
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value ?? null;
  }



  async updateUserProfile(profileData: any): Promise<void> {
    try {
      authLog('🔐 AuthService: Mise à jour du profil utilisateur:', profileData);

      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Mettre à jour le profil dans Supabase
      await this.supabase.updateProfile(currentUser.id, profileData);

      // Récupérer le profil mis à jour
      const updatedProfile = await this.supabase.getProfile(currentUser.id);

      if (updatedProfile) {
        // Mettre à jour l'utilisateur local avec les nouvelles données
        const updatedUser: User = {
          ...currentUser,
          displayName: updatedProfile.display_name || currentUser.displayName,
          preferences: {
            ...currentUser.preferences,
            ...updatedProfile.preferences,
            bio: updatedProfile.bio
          }
        };

        this.setCurrentUser(updatedUser);
      }

      authLog('🔐 AuthService: Profil utilisateur mis à jour avec succès');
    } catch (error) {
      console.error('🔐 AuthService: Erreur lors de la mise à jour du profil:', error);
      throw error;
    }
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

