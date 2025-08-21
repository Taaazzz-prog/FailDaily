import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, catchError, switchMap, map, of, throwError } from 'rxjs';
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
  legalConsent: {
    documentsAccepted: string[];
    consentDate: string;
    consentVersion: string;
    marketingOptIn: boolean;
  };
  ageVerification: {
    birthDate: Date;
    isMinor: boolean;
    needsParentalConsent: boolean;
    parentEmail?: string;
    parentConsentDate?: Date;
  };
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
    
    // ✅ Nettoyer lors de la fermeture de l'onglet/application
    window.addEventListener('beforeunload', () => {
      if (!this.isAuthenticated()) {
        this.clearAllAuthData();
      }
    });
    
    // ✅ Nettoyer lors de la navigation
    window.addEventListener('pagehide', () => {
      if (!this.isAuthenticated()) {
        this.clearAllAuthData();
      }
    });
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
      
      // Debug complet de l'état du localStorage
      console.log('🔍 CACHE DEBUG:');
      console.log('  - faildaily_user:', localStorage.getItem('faildaily_user'));
      console.log('  - faildaily_user_cache:', localStorage.getItem('faildaily_user_cache'));
      console.log('  - faildaily_token:', localStorage.getItem('faildaily_token'));
      console.log('  - auth_token:', localStorage.getItem('auth_token'));
      console.log('  - current_user:', localStorage.getItem('current_user'));
      console.log('  - Toutes les clés localStorage:', Object.keys(localStorage));
      
      // ✅ CORRECTION CRITIQUE : Vérifier qu'on a un token avant de retourner l'utilisateur
      const token = localStorage.getItem('faildaily_token');
      if (!token) {
        console.log('🚨 AUCUN TOKEN TROUVÉ - Suppression du cache utilisateur');
        localStorage.removeItem('faildaily_user_cache');
        localStorage.removeItem('faildaily_user');
        return null;
      }
      
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



  /**
   * ✅ Nettoie automatiquement les données incohérentes au démarrage
   */
  private cleanupInconsistentData(): void {
    const token = localStorage.getItem('faildaily_token');
    const user = localStorage.getItem('faildaily_user');
    
    // Si on a un token mais pas d'utilisateur, ou vice versa, nettoyer
    if ((token && !user) || (!token && user)) {
      console.log('🧹 Détection de données incohérentes - nettoyage automatique');
      this.clearAllAuthData();
    }
    
    // Si on a un token expiré, le nettoyer
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < now) {
          console.log('🧹 Token expiré détecté - nettoyage automatique');
          this.clearAllAuthData();
        }
      } catch (error) {
        console.log('🧹 Token invalide détecté - nettoyage automatique');
        this.clearAllAuthData();
      }
    }
  }

  private async initializeAuth() {
    console.log('🔐 AuthService: initializeAuth called');
    
    // ✅ Nettoyer les données incohérentes en premier
    this.cleanupInconsistentData();
    
      // Debug complet de l'état à l'initialisation
      console.log('🔍 DEBUG INITIALISATION:');
      console.log('  - localStorage faildaily_token:', localStorage.getItem('faildaily_token'));
      console.log('  - localStorage faildaily_user:', localStorage.getItem('faildaily_user'));
      console.log('  - localStorage faildaily_user_cache:', localStorage.getItem('faildaily_user_cache'));
      console.log('  - localStorage auth_token:', localStorage.getItem('auth_token'));
      console.log('  - localStorage current_user:', localStorage.getItem('current_user'));

      try {
        // ✅ CORRECTION CRITIQUE : Vérifier d'abord qu'on a un TOKEN valide
        const token = localStorage.getItem('faildaily_token');
        if (!token) {
          console.log('🚨 AUCUN TOKEN - Suppression complète du cache et déconnexion');
          // Supprimer TOUT le cache si pas de token
          localStorage.removeItem('faildaily_user_cache');
          localStorage.removeItem('faildaily_user');
          localStorage.removeItem('faildaily_token');
          localStorage.removeItem('auth_token');
          localStorage.removeItem('current_user');
          this.currentUserSubject.next(null);
          return;
        }

        // ✅ CORRECTION : Vérifier d'abord le cache localStorage pour une réponse IMMEDIATE
        const cachedUser = this.getCachedUser();
        if (cachedUser && token) {
          console.log('🔐 AuthService: Cache ET token trouvés - utilisateur défini immédiatement:', cachedUser.email);
          this.currentUserSubject.next(cachedUser);
        } else {
          console.log('🔐 AuthService: Aucun cache utilisateur trouvé OU pas de token');
        }      // ✅ CORRECTION : Maintenant que mysqlService persiste les sessions, vérification plus simple
      console.log('🔐 AuthService: Vérification de la session mysqlService...');
      const currentUser = await this.mysqlService.getCurrentUser();

      if (!currentUser) {
        console.error('🔐 AuthService: Pas de session active');
        // Si erreur de session ET pas de cache, déconnecter
        if (!cachedUser) {
          this.setCurrentUser(null);
        }
        this.sessionInitialized = true;
        return;
      }

      if (currentUser) {
        console.log('🔐 AuthService: Session mysqlService trouvée pour:', currentUser.email);

        try {
          let profile = await this.mysqlService.getProfile(currentUser.id);
          console.log('🔐 AuthService: Profile chargé:', profile ? 'trouvé' : 'non trouvé');

          // Si pas de profil, en créer un
          if (!profile) {
            console.log('🔐 AuthService: Création du profil');
            profile = await this.mysqlService.createProfile(currentUser);
          }

          // Créer l'objet User
          const user: User = {
            id: currentUser.id,
            email: currentUser.email!,
            displayName: profile?.data?.displayName || currentUser.displayName || 'Utilisateur',
            avatar: profile?.data?.avatarUrl || DEFAULT_AVATAR,
            joinDate: new Date(profile?.data?.createdAt || currentUser.joinDate),
            totalFails: profile?.data?.stats?.totalFails || 0,
            couragePoints: profile?.data?.stats?.couragePoints || 0,
            badges: profile?.data?.stats?.badges || [],
            role: currentUser.role || UserRole.USER, // ✅ Rôle depuis currentUser
            emailConfirmed: profile?.data?.emailConfirmed || false,
            registrationCompleted: profile?.data?.registrationCompleted || false,
            legalConsent: profile?.data?.legalConsent ? {
              documentsAccepted: profile.data.legalConsent.documentsAccepted,
              consentDate: new Date(profile.data.legalConsent.consentDate),
              consentVersion: profile.data.legalConsent.consentVersion,
              marketingOptIn: profile.data.legalConsent.marketingOptIn
            } : undefined,
            ageVerification: profile?.data?.ageVerification ? {
              birthDate: new Date(profile.data.ageVerification.birthDate),
              isMinor: profile.data.ageVerification.isMinor,
              needsParentalConsent: profile.data.ageVerification.needsParentalConsent,
              parentEmail: profile.data.ageVerification.parentEmail,
              parentConsentDate: profile.data.ageVerification.parentConsentDate ?
                new Date(profile.data.ageVerification.parentConsentDate) : undefined
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
            id: currentUser.id,
            email: currentUser.email!,
            displayName: currentUser.displayName || 'Utilisateur',
            avatar: DEFAULT_AVATAR,
            joinDate: new Date(currentUser.joinDate),
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
              displayName: profile?.data?.displayName || 'Utilisateur',
              avatar: profile?.data?.avatarUrl || 'assets/anonymous-avatar.svg',
              joinDate: new Date(profile?.data?.createdAt || mysqlServiceUser.created_at),
              totalFails: profile?.data?.stats?.totalFails || 0,
              couragePoints: profile?.data?.stats?.couragePoints || 0,
              badges: profile?.data?.stats?.badges || [],
              role: (mysqlServiceUser.role as UserRole) || UserRole.USER, // ✅ Rôle depuis auth.users
              emailConfirmed: profile?.data?.emailConfirmed || false,
              registrationCompleted: profile?.data?.registrationCompleted || false,
              legalConsent: profile?.data?.legalConsent ? {
                documentsAccepted: profile.data.legalConsent.documentsAccepted,
                consentDate: new Date(profile.data.legalConsent.consentDate),
                consentVersion: profile.data.legalConsent.consentVersion,
                marketingOptIn: profile.data.legalConsent.marketingOptIn
              } : undefined,
              ageVerification: profile?.data?.ageVerification ? {
                birthDate: new Date(profile.data.ageVerification.birthDate),
                isMinor: profile.data.ageVerification.isMinor,
                needsParentalConsent: profile.data.ageVerification.needsParentalConsent,
                parentEmail: profile.data.ageVerification.parentEmail,
                parentConsentDate: profile.data.ageVerification.parentConsentDate ?
                  new Date(profile.data.ageVerification.parentConsentDate) : undefined
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
      console.log('🔐 AuthService: Login result structure:', JSON.stringify(result, null, 2));

      if (result?.data?.user) {
        console.log('✅ AuthService: User authenticated successfully');

        // Logger la connexion réussie
        await this.logger.logAuth('login_success', `Connexion réussie`, {
          email: credentials.email,
          loginMethod: 'email'
        }, true);

        // Récupérer immédiatement le profil utilisateur
        let profile = await this.mysqlService.getProfile(result.data.user.id);

        if (!profile) {
          console.log('� AuthService: No profile found, creating one');
          profile = await this.mysqlService.createProfile(result.data.user);
        }

        // Créer l'objet utilisateur complet
        const user: User = {
          id: result.data.user.id,
          email: result.data.user.email!,
          displayName: profile?.data?.displayName || 'Utilisateur',
          avatar: profile?.data?.avatarUrl || 'assets/anonymous-avatar.svg',
          joinDate: new Date(profile?.data?.createdAt || result.data.user.created_at),
          totalFails: profile?.data?.stats?.totalFails || 0,
          couragePoints: profile?.data?.stats?.couragePoints || 0,
          badges: profile?.data?.stats?.badges || [],
          role: (result.data.user.role as UserRole) || UserRole.USER, // ✅ Rôle depuis auth.users
          emailConfirmed: profile?.data?.emailConfirmed || false,
          registrationCompleted: profile?.data?.registrationCompleted || false,
          legalConsent: profile?.data?.legalConsent ? {
            documentsAccepted: profile.data.legalConsent.documentsAccepted,
            consentDate: new Date(profile.data.legalConsent.consentDate),
            consentVersion: profile.data.legalConsent.consentVersion,
            marketingOptIn: profile.data.legalConsent.marketingOptIn
          } : undefined,
          ageVerification: profile?.data?.ageVerification ? {
            birthDate: new Date(profile.data.ageVerification.birthDate),
            isMinor: profile.data.ageVerification.isMinor,
            needsParentalConsent: profile.data.ageVerification.needsParentalConsent,
            parentEmail: profile.data.ageVerification.parentEmail,
            parentConsentDate: profile.data.ageVerification.parentConsentDate ?
              new Date(profile.data.ageVerification.parentConsentDate) : undefined
          } : undefined,
          // ✅ Ajout des préférences avec bio
          preferences: {
            bio: profile?.data?.bio || '',
            theme: profile?.data?.preferences?.theme || 'light',
            darkMode: (profile?.data?.preferences?.theme || 'light') === 'dark',
            notificationsEnabled: profile?.data?.preferences?.notifications?.enabled ?? true,
            reminderTime: profile?.data?.preferences?.notifications?.reminderTime || '09:00',
            anonymousMode: profile?.data?.preferences?.privacy?.anonymousMode ?? false,
            shareLocation: profile?.data?.preferences?.privacy?.shareLocation ?? false,
            soundEnabled: profile?.data?.preferences?.accessibility?.soundEnabled ?? true,
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

    // ✅ ÉTAPE 1: Vérifier et générer un display_name unique AVANT d'envoyer au backend
    return from(this.validateDisplayNameRealTime(data.displayName))
      .pipe(
        switchMap(async (displayNameResult) => {
          let finalDisplayName = data.displayName;
          
          // Si le nom n'est pas disponible, utiliser la suggestion
          if (!displayNameResult.isAvailable && displayNameResult.suggestedName) {
            finalDisplayName = displayNameResult.suggestedName;
            console.log('✅ AuthService: Using suggested unique display_name:', finalDisplayName);
          } else if (!displayNameResult.isAvailable) {
            throw new Error('Le nom d\'affichage n\'est pas disponible');
          }

          // ✅ ÉTAPE 2: Préparer les données pour l'API backend
          const registerData = {
            email: data.email,
            password: data.password,
            displayName: finalDisplayName, // Utiliser le nom unique
            birthDate: data.ageVerification.birthDate instanceof Date 
              ? data.ageVerification.birthDate.toISOString().split('T')[0] 
              : data.ageVerification.birthDate,
            agreeToTerms: data.legalConsent.documentsAccepted?.length > 0 || false,
            agreeToNewsletter: data.legalConsent.marketingOptIn || false,
            // ✅ Ajouter l'email parent si fourni pour les mineurs
            parentEmail: data.ageVerification.parentEmail
          };

          console.log('🔍 AuthService: Sending registration data to backend API:', registerData);

          // ✅ ÉTAPE 3: Appel à l'API backend
          const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
          });

          const result = await response.json();
          console.log('🔍 AuthService: Backend response:', result);

          if (!response.ok) {
            throw new Error(result.message || 'Erreur lors de l\'inscription');
          }

          // ✅ GESTION DES DEUX CAS DE RÉPONSE
          if (result.requiresParentalConsent) {
            // Cas mineur: pas de token, retour informations utilisateur
            console.log('👶 AuthService: Mineur - autorisation parentale requise');
            
            // Logger l'inscription en attente
            this.logger.logAuth('register_pending', `Inscription en attente - autorisation parentale`, {
              email: data.email,
              displayName: finalDisplayName,
              age: result.user.age
            }, true);

            // Retourner les informations utilisateur avec statut spécial
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              displayName: result.user.displayName,
              avatar: DEFAULT_AVATAR,
              joinDate: new Date(),
              totalFails: 0,
              couragePoints: 0,
              badges: [],
              role: UserRole.USER,
              emailConfirmed: true,
              registrationCompleted: false, // Inscription non complète
              ageVerification: {
                birthDate: new Date(data.ageVerification.birthDate),
                isMinor: true,
                needsParentalConsent: true,
                parentEmail: data.ageVerification.parentEmail,
                parentConsentDate: undefined
              },
              legalConsent: {
                documentsAccepted: data.legalConsent.documentsAccepted,
                consentDate: new Date(data.legalConsent.consentDate),
                consentVersion: data.legalConsent.consentVersion,
                marketingOptIn: data.legalConsent.marketingOptIn
              },
              preferences: this.getDefaultPreferences()
            };

            // NE PAS stocker le token ni mettre à jour currentUserSubject pour les mineurs
            return user;

          } else if (result.token && result.user) {
            // Cas adulte: inscription complète avec token
            console.log('🎂 AuthService: Adulte - inscription complète');
            
            // Stocker le token
            localStorage.setItem('faildaily_token', result.token);
            
            // Logger l'inscription réussie
            this.logger.logAuth('register_success', `Inscription réussie`, {
              email: result.user.email,
              displayName: result.user.displayName
            }, true);

            // Créer l'objet utilisateur complet
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              displayName: result.user.displayName,
              avatar: DEFAULT_AVATAR,
              joinDate: new Date(result.user.createdAt),
              totalFails: 0,
              couragePoints: 0,
              badges: [],
              role: UserRole.USER,
              emailConfirmed: true,
              registrationCompleted: true,
              ageVerification: {
                birthDate: new Date(data.ageVerification.birthDate),
                isMinor: false,
                needsParentalConsent: false,
                parentEmail: undefined,
                parentConsentDate: undefined
              },
              legalConsent: {
                documentsAccepted: data.legalConsent.documentsAccepted,
                consentDate: new Date(data.legalConsent.consentDate),
                consentVersion: data.legalConsent.consentVersion,
                marketingOptIn: data.legalConsent.marketingOptIn
              },
              preferences: this.getDefaultPreferences()
            };

            this.currentUserSubject.next(user);
            return user;
          } else {
            throw new Error('Réponse invalide du serveur');
          }
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

  /**
   * Retourne les préférences par défaut
   */
  private getDefaultPreferences() {
    return {
      bio: '',
      theme: 'light' as 'light' | 'dark' | 'auto',
      darkMode: false,
      notificationsEnabled: true,
      reminderTime: '09:00',
      anonymousMode: false,
      shareLocation: false,
      soundEnabled: true,
      hapticsEnabled: true,
      notifications: {
        encouragement: true,
        reminderFrequency: 'weekly' as 'daily' | 'weekly' | 'monthly'
      }
    };
  }

  /**
   * ✅ MÉTHODE DE NETTOYAGE COMPLET pour supprimer TOUS les résidus d'authentification
   */
  private clearAllAuthData(): void {
    console.log('🧹 Nettoyage COMPLET de toutes les données d\'authentification');
    
    // Liste EXHAUSTIVE de toutes les clés possibles
    const keysToRemove = [
      'faildaily_token',
      'faildaily_user',
      'faildaily_user_cache',
      'auth_token',
      'current_user',
      'user_token',
      'user_data',
      'session_token',
      'login_token',
      'CapacitorStorage.currentUser',
      'CapacitorStorage.fails'
    ];
    
    console.log('🔍 AVANT nettoyage - localStorage keys:', Object.keys(localStorage));
    
    keysToRemove.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        console.log(`🗑️ Suppression de ${key}:`, value.substring(0, 50) + '...');
        localStorage.removeItem(key);
      }
    });

    // Nettoyage agressif : supprimer TOUTES les clés qui commencent par faildaily, user_, auth_, etc.
    const allKeys = Object.keys(localStorage);
    const patternsToRemove = ['faildaily', 'user_', 'auth_', 'session_', 'login_'];
    
    allKeys.forEach(key => {
      if (patternsToRemove.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()))) {
        console.log(`🗑️ Suppression automatique de ${key}`);
        localStorage.removeItem(key);
      }
    });
    
    console.log('🔍 APRÈS nettoyage - localStorage keys:', Object.keys(localStorage));
    
    // Force la réinitialisation de l'état
    this.sessionInitialized = false;
  }


  async logout(): Promise<void> {
    try {
      const currentUser = this.getCurrentUser();
      console.log('🔐 AuthService: Début logout - Utilisateur actuel:', currentUser?.email || 'aucun');
      
      // Debug complet de l'état avant logout
      console.log('🔍 DEBUG AVANT LOGOUT:');
      console.log('  - currentUserSubject.value:', this.currentUserSubject.value);
      console.log('  - isAuthenticated():', this.isAuthenticated());
      console.log('  - localStorage faildaily_token:', localStorage.getItem('faildaily_token'));
      console.log('  - localStorage faildaily_user:', localStorage.getItem('faildaily_user'));
      console.log('  - localStorage faildaily_user_cache:', localStorage.getItem('faildaily_user_cache'));
      console.log('  - localStorage auth_token:', localStorage.getItem('auth_token'));
      console.log('  - localStorage current_user:', localStorage.getItem('current_user'));

      // Logger la déconnexion avant de nettoyer les données utilisateur
      if (currentUser) {
        await this.logger.logAuth('logout', `Déconnexion`, {
          userId: currentUser.id,
          email: currentUser.email
        }, true);
      }

      // Nettoyer toutes les données d'authentification
      await this.mysqlService.signOut();
      this.clearCachedUser(); // ✅ Nettoyer le cache lors de la déconnexion
      
      // ✅ Utiliser la méthode de nettoyage complet
      this.clearAllAuthData();
      
      // Mettre à jour l'état ET forcer la notification
      this.currentUserSubject.next(null);
      
      // Debug complet de l'état après logout
      console.log('� DEBUG APRÈS LOGOUT:');
      console.log('  - currentUserSubject.value:', this.currentUserSubject.value);
      console.log('  - isAuthenticated():', this.isAuthenticated());
      console.log('  - localStorage faildaily_token:', localStorage.getItem('faildaily_token'));
      console.log('  - localStorage faildaily_user:', localStorage.getItem('faildaily_user'));
      console.log('  - localStorage faildaily_user_cache:', localStorage.getItem('faildaily_user_cache'));
      console.log('  - localStorage auth_token:', localStorage.getItem('auth_token'));
      console.log('  - localStorage current_user:', localStorage.getItem('current_user'));
      
      console.log('🔐 AuthService: Utilisateur déconnecté - État final:', this.isAuthenticated());
      
      // TODO: Ajouter événement de déconnexion quand disponible
      // this.eventBus.emit(AppEvents.USER_LOGGED_OUT);
      
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * ✅ Force un rafraîchissement complet de l'authentification
   */
  async forceRefreshAuth(): Promise<void> {
    console.log('🔄 AuthService: Force refresh de l\'authentification');
    
    // Réinitialiser l'état
    this.sessionInitialized = false;
    this.processingProfileLoad = false;
    this.lastProcessedUserId = null;
    this.initPromise = null;
    
    // Nettoyer et réinitialiser
    this.clearAllAuthData();
    this.currentUserSubject.next(null);
    
    // Redémarrer l'initialisation
    await this.initializeAuth();
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
          displayName: updatedProfile.data?.displayName || currentUser.displayName,
          avatar: updatedProfile.data?.avatarUrl || currentUser.avatar,
          preferences: {
            ...currentUser.preferences,
            ...updatedProfile.data?.preferences,
            bio: updatedProfile.data?.bio
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

