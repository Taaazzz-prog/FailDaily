import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, catchError, switchMap } from 'rxjs';
import { User } from '../models/user.model';
import { UserRole } from '../models/user-role.model';
import { MysqlService } from './mysql.service';
import { EventBusService, AppEvents } from './event-bus.service';
import { DebugService } from './debug.service';
import { DEFAULT_AVATAR } from '../utils/avatar-constants';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';

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
    private mysqlService: MysqlService,
    private eventBus: EventBusService,
    private debugService: DebugService,
    private logger: ComprehensiveLoggerService
  ) {
    console.log('🔐 AuthService: Constructor called - initializing authentication service');
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
      console.log('🔐 AuthService: Force initialization...');
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
      console.log('🔐 AuthService: Vérification du cache localStorage...');
      const cached = localStorage.getItem('faildaily_user_cache');
      if (cached) {
        console.log('🔐 AuthService: Cache trouvé, parsing...');
        const parsed = JSON.parse(cached);
        // Vérifier que le cache n'est pas trop vieux (max 1 heure)
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 3600000) {
          console.log('🔐 AuthService: Cache utilisateur valide trouvé pour:', parsed.user?.email);
          return parsed.user;
        } else {
          console.log('🔐 AuthService: Cache expiré, suppression...');
          localStorage.removeItem('faildaily_user_cache');
        }
      } else {
        console.log('🔐 AuthService: Aucun cache trouvé dans localStorage');
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
      console.log('🔐 AuthService: Utilisateur mis en cache');
    } catch (error) {
      console.error('🔐 AuthService: Erreur écriture cache:', error);
    }
  }

  private clearCachedUser(): void {
    try {
      localStorage.removeItem('faildaily_user_cache');
      console.log('🔐 AuthService: Cache utilisateur nettoyé');
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
    console.log('🔐 AuthService: initializeAuth called');

    try {
      // ✅ CORRECTION : Vérifier d'abord le cache localStorage pour une réponse IMMEDIATE
      const cachedUser = this.getCachedUser();
      if (cachedUser) {
        console.log('🔐 AuthService: Cache trouvé - utilisateur défini immédiatement');
        this.currentUserSubject.next(cachedUser);
      }

      // ✅ CORRECTION : Maintenant que mysqlService persiste les sessions, vérification plus simple
      console.log('🔐 AuthService: Vérification de la session mysqlService...');
      const { data: { session }, error } = await this.mysqlService.client.auth.getSession();

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
        console.log('🔐 AuthService: Session mysqlService trouvée pour:', session.user.email);

        try {
          let profile = await this.mysqlService.getProfile(session.user.id);
          console.log('🔐 AuthService: Profile chargé:', profile ? 'trouvé' : 'non trouvé');

          // Si pas de profil, en créer un
          if (!profile) {
            console.log('🔐 AuthService: Création du profil');
            profile = await this.mysqlService.createProfile(session.user);
          }

          // Créer l'objet User
          const user: User = {
            id: session.user.id,
            email: session.user.email!,
            displayName: profile?.display_name || 'Utilisateur',
            avatar: profile?.avatar_url || DEFAULT_AVATAR,
            joinDate: new Date(profile?.created_at || session.user.created_at),
            totalFails: profile?.stats?.totalFails || 0,
            couragePoints: profile?.stats?.couragePoints || 0,
            badges: profile?.stats?.badges || [],
            role: (session.user['role'] as UserRole) || (session.user.user_metadata?.['role'] as UserRole) || UserRole.USER, // ✅ Rôle depuis auth.users ou user_metadata
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
            } : undefined,
            // ✅ Ajout des préférences avec bio
            preferences: {
              bio: profile?.bio || '',
              theme: profile?.preferences?.theme || 'light',
              darkMode: (profile?.preferences?.theme || 'light') === 'dark',
              notificationsEnabled: profile?.preferences?.notifications?.enabled ?? true,
              reminderTime: profile?.preferences?.notifications?.reminderTime || '09:00',
              anonymousMode: profile?.preferences?.privacy?.anonymousMode ?? false,
              shareLocation: profile?.preferences?.privacy?.shareLocation ?? false,
              soundEnabled: profile?.preferences?.accessibility?.soundEnabled ?? true,
              hapticsEnabled: profile?.preferences?.accessibility?.hapticsEnabled ?? true,
              notifications: profile?.preferences?.notifications || {
                encouragement: true,
                reminderFrequency: 'weekly'
              }
            }
          };

          console.log('🔐 AuthService: Utilisateur défini avec session mysqlService');
          this.setCurrentUser(user);
        } catch (profileError) {
          console.error('🔐 AuthService: Erreur chargement profil:', profileError);
          // En cas d'erreur de profil, créer un utilisateur basique
          const basicUser: User = {
            id: session.user.id,
            email: session.user.email!,
            displayName: session.user.user_metadata?.['display_name'] || 'Utilisateur',
            avatar: DEFAULT_AVATAR,
            joinDate: new Date(session.user.created_at),
            totalFails: 0,
            couragePoints: 0,
            badges: [],
            role: UserRole.USER, // ✅ Rôle par défaut
            emailConfirmed: true,
            registrationCompleted: false,
            legalConsent: undefined,
            ageVerification: undefined
          };
          this.setCurrentUser(basicUser);
        }
      } else {
        // ✅ Pas de session mysqlService - garder le cache si disponible sinon déconnecter
        if (cachedUser) {
          console.log('🔐 AuthService: Pas de session mysqlService mais cache valide - maintenir la connexion');
        } else {
          console.log('🔐 AuthService: Aucune session - déconnexion');
          this.setCurrentUser(null);
        }
      }

      this.sessionInitialized = true;

      console.log('🔐 AuthService: Configuration de l\'écoute des changements mysqlService');
      // Écouter les changements d'authentification mysqlService
      this.mysqlService.currentUser$.subscribe(async (mysqlServiceUser: any) => {
        console.log('🔐 AuthService: Changement utilisateur mysqlService:', mysqlServiceUser?.id || 'null');

        if (!mysqlServiceUser) {
          // ✅ SIMPLIFICATION : Avec persistSession=true, les déconnexions sont plus fiables
          console.log('🔐 AuthService: Déconnexion mysqlService détectée');
          this.setCurrentUser(null);
          return;
        }

        // Si nouvel utilisateur connecté, charger son profil
        if (mysqlServiceUser.id !== this.currentUserSubject.value?.id) {
          console.log('🔐 AuthService: Nouvel utilisateur connecté - chargement du profil');
          try {
            let profile = await this.mysqlService.getProfile(mysqlServiceUser.id);
            if (!profile) {
              profile = await this.mysqlService.createProfile(mysqlServiceUser);
            }

            const user: User = {
              id: mysqlServiceUser.id,
              email: mysqlServiceUser.email!,
              displayName: profile?.display_name || 'Utilisateur',
              avatar: profile?.avatar_url || 'assets/anonymous-avatar.svg',
              joinDate: new Date(profile?.created_at || mysqlServiceUser.created_at),
              totalFails: profile?.stats?.totalFails || 0,
              couragePoints: profile?.stats?.couragePoints || 0,
              badges: profile?.stats?.badges || [],
              role: (mysqlServiceUser.role as UserRole) || UserRole.USER, // ✅ Rôle depuis auth.users
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
              } : undefined,
              // ✅ Ajout des préférences avec bio
              preferences: {
                bio: profile?.bio || '',
                theme: profile?.preferences?.theme || 'light',
                darkMode: (profile?.preferences?.theme || 'light') === 'dark',
                notificationsEnabled: profile?.preferences?.notifications?.enabled ?? true,
                reminderTime: profile?.preferences?.notifications?.reminderTime || '09:00',
                anonymousMode: profile?.preferences?.privacy?.anonymousMode ?? false,
                shareLocation: profile?.preferences?.privacy?.shareLocation ?? false,
                soundEnabled: profile?.preferences?.accessibility?.soundEnabled ?? true,
                hapticsEnabled: profile?.preferences?.accessibility?.hapticsEnabled ?? true,
                notifications: profile?.preferences?.notifications || {
                  encouragement: true,
                  reminderFrequency: 'weekly'
                }
              }
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
      // Authentification mysqlService - retour immédiat
      const result = await this.mysqlService.signIn(credentials.email, credentials.password);

      if (result?.user) {
        console.log('✅ AuthService: User authenticated successfully');

        // Logger la connexion réussie
        await this.logger.logAuth('login_success', `Connexion réussie`, {
          email: credentials.email,
          loginMethod: 'email'
        }, true);

        // Récupérer immédiatement le profil utilisateur
        let profile = await this.mysqlService.getProfile(result.user.id);

        if (!profile) {
          console.log('� AuthService: No profile found, creating one');
          profile = await this.mysqlService.createProfile(result.user);
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
          role: (result.user.role as UserRole) || UserRole.USER, // ✅ Rôle depuis auth.users
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
          } : undefined,
          // ✅ Ajout des préférences avec bio
          preferences: {
            bio: profile?.bio || '',
            theme: profile?.preferences?.theme || 'light',
            darkMode: (profile?.preferences?.theme || 'light') === 'dark',
            notificationsEnabled: profile?.preferences?.notifications?.enabled ?? true,
            reminderTime: profile?.preferences?.notifications?.reminderTime || '09:00',
            anonymousMode: profile?.preferences?.privacy?.anonymousMode ?? false,
            shareLocation: profile?.preferences?.privacy?.shareLocation ?? false,
            soundEnabled: profile?.preferences?.accessibility?.soundEnabled ?? true,
            hapticsEnabled: profile?.preferences?.accessibility?.hapticsEnabled ?? true,
            notifications: profile?.preferences?.notifications || {
              encouragement: true,
              reminderFrequency: 'weekly'
            }
          }
        };

        // Mettre à jour immédiatement le BehaviorSubject AVEC cache
        console.log('🔐 AuthService: Setting user as current with cache...');
        this.setCurrentUser(user);
        console.log('🔐 AuthService: User profile loaded, cached, and set as current user');

        return user;
      } else {
        console.log('🔐 AuthService: No user in authentication result');
        this.currentUserSubject.next(null);
        return null;
      }
    } catch (error: any) {
      console.error('🔐 AuthService: Login error:', error);

      // Logger l'échec de connexion
      await this.logger.logAuth('login_failed', `Échec de connexion`, {
        email: credentials.email,
        error: error.message || 'Erreur inconnue'
      }, false);

      if (error.message?.includes('Email not confirmed')) {
        console.log('🔐 AuthService: Email not confirmed error');
        throw new Error('Votre compte doit être confirmé par email avant de pouvoir vous connecter. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.');
      }

      if (error.message?.includes('Invalid credentials') || error.message?.includes('Invalid login credentials')) {
        console.log('🔐 AuthService: Invalid credentials error');
        throw new Error('Email ou mot de passe incorrect.');
      }

      console.log('🔐 AuthService: Unknown login error');
      throw new Error(error.message || 'Erreur de connexion inconnue.');
    }
  }

  // ✅ Validation temps réel du display_name
  async validateDisplayNameRealTime(displayName: string): Promise<{
    isAvailable: boolean;
    suggestedName?: string;
    message: string
  }> {
    try {
      console.log('🔍 Validating display_name in real-time:', displayName);

      if (!displayName || displayName.trim().length < 3) {
        return {
          isAvailable: false,
          message: 'Le pseudo doit contenir au moins 3 caractères'
        };
      }

      if (displayName.length > 30) {
        return {
          isAvailable: false,
          message: 'Le pseudo ne peut pas dépasser 30 caractères'
        };
      }

      const isAvailable = await this.mysqlService.checkDisplayNameAvailable(displayName.trim());

      if (isAvailable) {
        return {
          isAvailable: true,
          message: '✅ Ce pseudo est disponible'
        };
      } else {
        const suggestedName = await this.mysqlService.generateUniqueDisplayName(displayName.trim());
        return {
          isAvailable: false,
          suggestedName,
          message: `❌ Ce pseudo est déjà pris. Suggestion: ${suggestedName}`
        };
      }
    } catch (error) {
      console.error('❌ Error validating display_name:', error);
      return {
        isAvailable: false,
        message: 'Erreur lors de la vérification du pseudo'
      };
    }
  }

  register(data: RegisterData): Observable<User | null> {
    console.log('🔐 AuthService: Registration attempt for:', data.email);

    // ✅ ÉTAPE 1: Vérifier et générer un display_name unique AVANT de créer le compte
    return from(this.mysqlService.generateUniqueDisplayName(data.displayName))
      .pipe(
        switchMap(async (uniqueDisplayName) => {
          console.log('✅ AuthService: Unique display_name generated:', uniqueDisplayName);

          // ✅ ÉTAPE 2: Créer le compte avec le nom unique
          const result = await this.mysqlService.signUp(data.email, data.password, uniqueDisplayName);

          if (result?.user) {
            console.log('✅ AuthService: User registered successfully with unique name');

            // Logger l'inscription réussie
            await this.logger.logAuth('register_success', `Inscription réussie`, {
              email: data.email,
              displayName: uniqueDisplayName,
              registrationMethod: 'email'
            }, true);

            // ✅ ÉTAPE 3: Créer le profil (qui utilisera automatiquement le nom unique des metadata)
            try {
              const profile = await this.mysqlService.createProfile(result.user);
              console.log('✅ AuthService: Profile created with display_name:', profile?.display_name);

              // Retourner l'utilisateur avec le display_name unique confirmé
              const user: User = {
                id: result.user.id,
                email: data.email,
                displayName: uniqueDisplayName, // ✅ Utiliser le nom unique généré
                avatar: 'assets/anonymous-avatar.svg',
                joinDate: new Date(),
                totalFails: 0,
                couragePoints: 0,
                badges: [],
                role: UserRole.USER, // ✅ Rôle par défaut pour nouveaux utilisateurs
                emailConfirmed: true,
                registrationCompleted: false,
                legalConsent: undefined,
                ageVerification: undefined,
                // ✅ Ajout des préférences avec bio vide pour nouveau user
                preferences: {
                  bio: '',
                  theme: 'light',
                  darkMode: false,
                  notificationsEnabled: true,
                  reminderTime: '09:00',
                  anonymousMode: false,
                  shareLocation: false,
                  soundEnabled: true,
                  hapticsEnabled: true,
                  notifications: {
                    encouragement: true,
                    reminderFrequency: 'weekly'
                  }
                }
              };

              this.currentUserSubject.next(user);
              return user;
            } catch (error) {
              console.error('❌ AuthService: Error creating profile:', error);
              throw error;
            }
          }
          console.log('❌ AuthService: No user returned from signUp');
          return null;
        }),
        catchError((error) => {
          // Logger l'échec d'inscription
          this.logger.logAuth('register_failed', `Échec de l'inscription`, {
            email: data.email,
            error: error.message || 'Erreur inconnue'
          }, false);

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
      console.log('🔐 AuthService: Calling mysqlService.completeRegistration...');
      await this.mysqlService.completeRegistration(currentUser.id, legalConsent, ageVerification);

      // Recharger le profil complet
      console.log('🔐 AuthService: Reloading complete profile...');
      const profile = await this.mysqlService.getProfile(currentUser.id);
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
      const currentUser = this.getCurrentUser();

      // Logger la déconnexion avant de nettoyer les données utilisateur
      if (currentUser) {
        await this.logger.logAuth('logout', `Déconnexion`, {
          userId: currentUser.id,
          email: currentUser.email
        }, true);
      }

      await this.mysqlService.signOut();
      this.clearCachedUser(); // ✅ Nettoyer le cache lors de la déconnexion
      this.currentUserSubject.next(null);
      console.log('🔐 AuthService: Utilisateur déconnecté et cache nettoyé');
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
      console.log('🔐 AuthService: Mise à jour du profil utilisateur:', profileData);

      const currentUser = this.getCurrentUser();
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié');
      }

      // Mettre à jour le profil dans mysqlService
      await this.mysqlService.updateProfile(currentUser.id, profileData);

      // Récupérer le profil mis à jour
      const updatedProfile = await this.mysqlService.getProfile(currentUser.id);

      let updatedUser: User = currentUser;
      if (updatedProfile) {
        // Mettre à jour l'utilisateur local avec les nouvelles données
        updatedUser = {
          ...currentUser,
          displayName: updatedProfile.display_name || currentUser.displayName,
          avatar: updatedProfile.avatar_url || currentUser.avatar,
          preferences: {
            ...currentUser.preferences,
            ...updatedProfile.preferences,
            bio: updatedProfile.bio
          }
        };

        this.setCurrentUser(updatedUser);
      }

      // Émettre un événement pour notifier que le profil a été mis à jour
      console.log('🔐 AuthService: Émission de l\'événement USER_PROFILE_UPDATED avec:', updatedUser);
      this.eventBus.emit(AppEvents.USER_PROFILE_UPDATED, updatedUser);

      console.log('🔐 AuthService: Profil utilisateur mis à jour avec succès');
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
      await this.mysqlService.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  // ✅ NOUVEAU : Méthode publique pour vérifier l'unicité des noms
  async checkDisplayNameAvailable(displayName: string, excludeUserId?: string): Promise<boolean> {
    return this.mysqlService.checkDisplayNameAvailable(displayName, excludeUserId);
  }

  // ===== GESTION DES RÔLES =====

  /**
   * Récupérer tous les utilisateurs (admin uniquement)
   */
  async getAllUsers(): Promise<any[]> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès non autorisé - Admin requis');
    }

    return this.mysqlService.getAllUsers();
  }

  /**
   * Changer le rôle d'un utilisateur (admin uniquement)
   */
  async updateUserRole(userId: string, newRole: UserRole): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès non autorisé - Admin requis');
    }

    // Empêcher un admin de se retirer ses propres privilèges
    if (userId === currentUser.id && newRole !== UserRole.ADMIN) {
      throw new Error('Un administrateur ne peut pas modifier son propre rôle');
    }

    return this.mysqlService.updateUserRole(userId, newRole);
  }

  /**
   * Bannir un utilisateur (admin uniquement)
   */
  async banUser(userId: string): Promise<boolean> {
    const currentUser = this.getCurrentUser();
    if (!currentUser || currentUser.role !== UserRole.ADMIN) {
      throw new Error('Accès non autorisé - Admin requis');
    }

    // Empêcher un admin de se bannir lui-même
    if (userId === currentUser.id) {
      throw new Error('Un administrateur ne peut pas se bannir lui-même');
    }

    return this.mysqlService.banUser(userId);
  }
}

