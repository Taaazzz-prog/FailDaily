import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, map, catchError, switchMap, filter, take, timeout } from 'rxjs';
import { User } from '../models/user.model';
import { SupabaseService } from './supabase.service';
import { authLog } from '../utils/logger';

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
  private currentUserSubject = new BehaviorSubject<User | null | undefined>(undefined);
  public currentUser$ = this.currentUserSubject.asObservable();

  // ✅ AJOUT : Cache de session pour éviter les race conditions
  private sessionInitialized = false;
  private initPromise: Promise<void> | null = null;

  constructor(private supabase: SupabaseService) {
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

  /**
   * ✅ REFRESH SESSION : Tenter de rafraîchir une session Supabase expirée
   */
  private async attemptSessionRefresh(): Promise<boolean> {
    try {
      authLog('🔄 AuthService: Tentative de refresh de session...');
      const { data, error } = await this.supabase.client.auth.refreshSession();

      if (error || !data.session) {
        authLog('🔄 AuthService: Refresh de session échoué:', error?.message || 'No session');
        return false;
      }

      authLog('🔄 AuthService: Session rafraîchie avec succès');
      return true;
    } catch (error) {
      console.error('🔄 AuthService: Erreur lors du refresh:', error);
      return false;
    }
  }

  /**
   * ✅ RESTAURATION SESSION : Forcer Supabase à se reconnecter avec le cache utilisateur
   */
  private async forceSupabaseReconnection(cachedUser: User): Promise<boolean> {
    try {
      authLog('🔄 AuthService: Tentative de restauration forcée de session Supabase...');

      // Essayer d'abord de récupérer une session valide via le token stocké
      const { data: { session }, error: sessionError } = await this.supabase.client.auth.getSession();

      if (session) {
        authLog('🔄 AuthService: Session Supabase trouvée après re-vérification');
        return true;
      }

      // Essayer de trouver le token de session dans localStorage
      // Supabase stocke généralement sous la forme 'sb-<project-id>-auth-token'
      const storageKeys = Object.keys(localStorage).filter(key => key.includes('auth-token'));
      authLog('🔄 AuthService: Clés auth trouvées:', storageKeys);

      for (const key of storageKeys) {
        try {
          const storedSession = localStorage.getItem(key);
          if (storedSession) {
            const sessionData = JSON.parse(storedSession);
            if (sessionData.access_token && sessionData.refresh_token) {
              authLog('🔄 AuthService: Tentative de restauration via tokens stockés...');

              const { data, error } = await this.supabase.client.auth.setSession({
                access_token: sessionData.access_token,
                refresh_token: sessionData.refresh_token
              });

              if (data.session && !error) {
                authLog('🔄 AuthService: Session Supabase restaurée via tokens');
                return true;
              }
            }
          }
        } catch (tokenError) {
          authLog('🔄 AuthService: Erreur restauration via token:', tokenError);
          continue; // Essayer le prochain token
        }
      }

      // Si aucun token n'a fonctionné, maintenir l'utilisateur en cache
      authLog('🔄 AuthService: Session Supabase non récupérable - maintien du cache utilisateur');
      authLog('🔄 AuthService: L\'utilisateur reste connecté via le cache pour:', cachedUser.email);

      // Assurer que l'utilisateur reste défini dans le subject
      this.currentUserSubject.next(cachedUser);

      return false; // Session Supabase non restaurée mais utilisateur maintenu
    } catch (error) {
      console.error('🔄 AuthService: Erreur restauration forcée:', error);
      return false;
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
            displayName: profile?.display_name || profile?.username || 'Utilisateur',
            username: profile?.username || 'user',
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
            username: session.user.user_metadata?.['username'] || 'user',
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

            this.setCurrentUser(user);
          } catch (error) {
            console.error('🔐 AuthService: Erreur lors du chargement du profil utilisateur:', error);
          }
        }
      });

    } catch (error) {
      console.error('🔐 AuthService: Erreur lors de l\'initialisation:', error);
      this.sessionInitialized = true;
      // En cas d'erreur globale, garder le cache si disponible
      const cachedUser = this.getCachedUser();
      if (!cachedUser) {
        this.setCurrentUser(null);
      }
    }
  }

  private async createDefaultProfile(supabaseUser: any) {
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

  async login(credentials: LoginCredentials): Promise<User | null> {
    authLog('🔐 AuthService: login called for email:', credentials.email);

    try {
      // Authentification Supabase - retour immédiat
      const result = await this.supabase.signIn(credentials.email, credentials.password);
      authLog('🔐 AuthService: Supabase signIn result:', !!result);

      if (result?.user) {
        authLog('🔐 AuthService: User authenticated successfully');

        // Récupérer immédiatement le profil utilisateur
        let profile = await this.supabase.getProfile(result.user.id);

        if (!profile) {
          authLog('🔐 AuthService: No profile found, creating one');
          profile = await this.supabase.createProfile(result.user);
        }

        // Créer l'objet utilisateur complet
        const user: User = {
          id: result.user.id,
          email: result.user.email!,
          displayName: profile?.display_name || profile?.username || 'Utilisateur',
          username: profile?.username || 'user',
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
    authLog('🔐 AuthService: register called for email:', data.email, 'username:', data.username);

    return from(this.supabase.signUp(data.email, data.password, data.username))
      .pipe(
        switchMap(async (result) => {
          authLog('🔐 AuthService: Supabase signUp result:', result?.user ? 'success' : 'failed');

          if (result?.user) {
            authLog('🔐 AuthService: User created, creating profile data');
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
              authLog('🔐 AuthService: Updating profile in Supabase');
              await this.supabase.updateProfile(result.user.id, profileData);
              authLog('🔐 AuthService: Profile updated successfully');
            } catch (error) {
              authLog('🔐 AuthService: Profil sera créé plus tard:', error);
            }

            // Retourner l'utilisateur simple
            authLog('🔐 AuthService: Creating user object for registration');
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

            authLog('🔐 AuthService: Setting new user as current user');
            this.currentUserSubject.next(user);
            return user;
          }
          authLog('🔐 AuthService: No user returned from signUp');
          return null;
        }),
        catchError((error) => {
          console.error('🔐 AuthService: Registration error:', error);
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

  async updateCurrentUser(updatedUser: User): Promise<void> {
    try {
      authLog('🔐 AuthService: Mise à jour de l\'utilisateur:', updatedUser.id);

      // Mettre à jour le cache local
      this.setCachedUser(updatedUser);

      // Mettre à jour le BehaviorSubject
      this.setCurrentUser(updatedUser);

      authLog('🔐 AuthService: Utilisateur mis à jour avec succès');
    } catch (error) {
      console.error('🔐 AuthService: Erreur lors de la mise à jour de l\'utilisateur:', error);
      throw error;
    }
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

        await this.updateCurrentUser(updatedUser);
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

