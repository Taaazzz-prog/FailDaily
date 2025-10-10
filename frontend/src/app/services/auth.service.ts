import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, catchError, switchMap, map, of, throwError, Subscription } from 'rxjs';
import { User } from '../models/user.model';
import { UserRole } from '../models/user-role.model';
import { MysqlService } from './mysql.service';
import { EventBusService, AppEvents } from './event-bus.service';
import { DebugService } from './debug.service';
import { DEFAULT_AVATAR } from '../utils/avatar-constants';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';
import { SecureLoggerService } from './secure-logger.service';
import { environment } from '../../environments/environment';

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

  // ✅ AJOUT : Système d'auto-déconnexion après inactivité
  private inactivityTimer: any = null;
  private readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes en millisecondes
  private lastActivityTime = Date.now();
  private apiUrl = environment.api.baseUrl || 'http://localhost:3000/api';
  private readonly legacyUserStorageKeys = ['current_user', 'faildaily_user'];
  private readonly userCacheStorageKey = 'faildaily_user_cache';
  private tokenStorageKeys: string[] = [];
  private primaryTokenKey!: string;
  private mysqlUserSubscription?: Subscription;

  constructor(
    private mysqlService: MysqlService,
    private eventBus: EventBusService,
    private debugService: DebugService,
    private logger: ComprehensiveLoggerService,
    private secureLogger: SecureLoggerService
  ) {
    console.log('🔐 AuthService: Constructor called - initializing authentication service');

    this.primaryTokenKey = 'auth_token';
    this.tokenStorageKeys = Array.from(new Set([this.primaryTokenKey, 'faildaily_token']));

    this.initializeAuth();
    
    // ✅ Système d'auto-déconnexion après inactivité
    if (typeof window !== 'undefined') {
      this.setupInactivityTimer();
      this.setupActivityListeners();

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
    
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private getTokenFromStorage(): string | null {
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

  private persistToken(token: string | null): void {
    if (!this.isBrowser()) {
      return;
    }

    if (token) {
      for (const key of this.tokenStorageKeys) {
        localStorage.setItem(key, token);
      }
    } else {
      for (const key of this.tokenStorageKeys) {
        localStorage.removeItem(key);
      }
    }
  }

  private persistLegacyUserSnapshots(user: User | null): void {
    if (!this.isBrowser()) {
      return;
    }

    const payload = user ? JSON.stringify(user) : null;
    for (const key of this.legacyUserStorageKeys) {
      if (payload) {
        localStorage.setItem(key, payload);
      } else {
        localStorage.removeItem(key);
      }
    }
  }

  private clearLegacyUserSnapshots(): void {
    this.persistLegacyUserSnapshots(null);
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
    if (!this.isBrowser()) {
      return null;
    }

    try {
      console.log('🔐 AuthService: Vérification du cache localStorage...');

      this.secureLogger.debug('🔍 CACHE DEBUG');
      this.secureLogger.logStorage('LocalStorage state', {
        faildaily_user: localStorage.getItem('faildaily_user'),
        faildaily_user_cache: localStorage.getItem(this.userCacheStorageKey),
        auth_token: localStorage.getItem(this.primaryTokenKey),
        faildaily_token: localStorage.getItem('faildaily_token'),
        current_user: localStorage.getItem('current_user'),
        allKeys: Object.keys(localStorage)
      });

      const token = this.getTokenFromStorage();
      if (!token) {
        this.secureLogger.warn('🚨 AUCUN TOKEN TROUVÉ - Suppression du cache utilisateur');
        localStorage.removeItem(this.userCacheStorageKey);
        this.clearLegacyUserSnapshots();
        return null;
      }

      const cached = localStorage.getItem(this.userCacheStorageKey);
      if (cached) {
        this.secureLogger.debug('🔐 AuthService: Cache trouvé, parsing...');
        const parsed = JSON.parse(cached);
        if (parsed.timestamp && (Date.now() - parsed.timestamp) < 3600000) {
          this.secureLogger.logToken('🔐 AuthService: Cache utilisateur valide trouvé pour:', parsed.user?.email);
          return parsed.user;
        }
        this.secureLogger.debug('🔐 AuthService: Cache expiré, suppression...');
        localStorage.removeItem(this.userCacheStorageKey);
      } else {
        console.log('🔐 AuthService: Aucun cache trouvé dans localStorage');
      }
    } catch (error) {
      console.error('🔐 AuthService: Erreur lecture cache:', error);
    }
    return null;
  }

  private setCachedUser(user: User): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      const cacheData = { user, timestamp: Date.now() };
      localStorage.setItem(this.userCacheStorageKey, JSON.stringify(cacheData));
      this.persistLegacyUserSnapshots(user);
      console.log('🔐 AuthService: Utilisateur mis en cache');
    } catch (error) {
      console.error('🔐 AuthService: Erreur écriture cache:', error);
    }
  }

  private clearCachedUser(): void {
    if (!this.isBrowser()) {
      return;
    }

    try {
      localStorage.removeItem(this.userCacheStorageKey);
      this.clearLegacyUserSnapshots();
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
    if (!this.isBrowser()) {
      return;
    }

    const token = this.getTokenFromStorage();
    
    // ✅ FIX: Seulement nettoyer si on a des tokens expirés - ne pas supprimer pour incohérence
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
    
    // ✅ FIX: Ne plus supprimer pour "incohérence" - laisser la session se rétablir
    // L'absence temporaire de cache ne justifie pas une déconnexion
  }

  private async initializeAuth() {
    console.log('🔐 AuthService: initializeAuth called');

    this.cleanupInconsistentData();

    if (this.isBrowser()) {
      console.log('🔍 DEBUG INITIALISATION:');
      console.log('  - localStorage ' + this.primaryTokenKey + ':', localStorage.getItem(this.primaryTokenKey));
      console.log('  - localStorage faildaily_token:', localStorage.getItem('faildaily_token'));
      console.log('  - localStorage faildaily_user:', localStorage.getItem('faildaily_user'));
      console.log('  - localStorage faildaily_user_cache:', localStorage.getItem(this.userCacheStorageKey));
      console.log('  - localStorage current_user:', localStorage.getItem('current_user'));
    }

    const token = this.getTokenFromStorage();

    if (!token) {
      console.log('🚨 Aucun token trouvé – nettoyage complet et déconnexion');
      this.clearAllAuthData();
      this.currentUserSubject.next(null);
      this.sessionInitialized = true;
      return;
    }

    this.persistToken(token);

    const cachedUser = this.getCachedUser();
    if (cachedUser) {
      console.log('🔐 AuthService: Cache utilisateur chargé immédiatement pour', cachedUser.email);
      this.currentUserSubject.next(cachedUser);
    }

    let currentUser: any = null;
    try {
      currentUser = await this.mysqlService.getCurrentUser();
    } catch (error) {
      console.error('🔐 AuthService: Erreur lors de la récupération de la session mysqlService:', error);
    }

    if (!currentUser) {
      if (!cachedUser) {
        console.log('🔐 AuthService: Aucune session valide – déconnexion');
        this.setCurrentUser(null);
      } else {
        console.log('🔐 AuthService: Session backend indisponible mais cache valide – maintien en mémoire');
      }
      this.sessionInitialized = true;
      this.ensureMysqlSubscription();
      return;
    }

    console.log('🔐 AuthService: Session mysqlService trouvée pour:', currentUser.email);

    try {
      let profile = await this.mysqlService.getProfile(currentUser.id);
      console.log('🔐 AuthService: Profile chargé:', profile ? 'trouvé' : 'non trouvé');

      if (!profile) {
        console.log('🔐 AuthService: Création du profil');
        profile = await this.mysqlService.createProfile(currentUser);
      }

      const user: User = {
        id: currentUser.id,
        email: currentUser.email!,
        displayName: profile?.data?.displayName || currentUser.displayName || 'Utilisateur',
        avatar: profile?.data?.avatarUrl || DEFAULT_AVATAR,
        joinDate: new Date(profile?.data?.createdAt || currentUser.joinDate),
        totalFails: profile?.data?.stats?.totalFails || 0,
        couragePoints: profile?.data?.stats?.couragePoints || 0,
        badges: profile?.data?.stats?.badges || [],
        role: currentUser.role || UserRole.USER,
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
          parentConsentDate: profile.data.ageVerification.parentConsentDate ? new Date(profile.data.ageVerification.parentConsentDate) : undefined
        } : undefined,
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
    } catch (profileError) {
      console.error('🔐 AuthService: Erreur chargement profil:', profileError);
      const basicUser: User = {
        id: currentUser.id,
        email: currentUser.email!,
        displayName: currentUser.displayName || 'Utilisateur',
        avatar: DEFAULT_AVATAR,
        joinDate: new Date(currentUser.joinDate),
        totalFails: 0,
        couragePoints: 0,
        badges: [],
        role: UserRole.USER,
        emailConfirmed: true,
        registrationCompleted: false,
        legalConsent: undefined,
        ageVerification: undefined
      };
      this.setCurrentUser(basicUser);
    }

    this.sessionInitialized = true;
    this.ensureMysqlSubscription();
  }

  private ensureMysqlSubscription(): void {
    if (this.mysqlUserSubscription || !this.mysqlService?.currentUser$) {
      return;
    }

    console.log('🔐 AuthService: Configuration de ecoute des changements mysqlService');
    this.mysqlUserSubscription = this.mysqlService.currentUser$.subscribe(async (mysqlServiceUser: any) => {
      console.log('🔐 AuthService: Changement utilisateur mysqlService:', mysqlServiceUser?.id || 'null');

      if (!mysqlServiceUser) {
        console.log('🔐 AuthService: Déconnexion mysqlService détectée');
        this.setCurrentUser(null);
        return;
      }

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
            role: (mysqlServiceUser.role as UserRole) || UserRole.USER,
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
  }
  async login(credentials: LoginCredentials): Promise<User | null> {
    this.secureLogger.logToken('🔐 AuthService: Login attempt for:', credentials.email);

    try {
      // Authentification mysqlService - retour immédiat
      const result = await this.mysqlService.signIn(credentials.email, credentials.password);
      this.secureLogger.log('🔐 AuthService: Login result structure:', result);

      if (result?.data?.user) {
        this.secureLogger.log('✅ AuthService: User authenticated successfully');

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
          const response = await fetch(`${this.apiUrl}/auth/register`, {
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
            this.persistToken(result.token);
            
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
    if (!this.isBrowser()) {
      return;
    }

    console.log('🧹 Nettoyage COMPLET de toutes les donnees authentification');

    this.persistToken(null);
    this.clearCachedUser();
    this.clearLegacyUserSnapshots();

    const keysToRemove = [
      'faildaily_token',
      'faildaily_user',
      this.userCacheStorageKey,
      this.primaryTokenKey,
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

    const allKeys = Object.keys(localStorage);
    const patternsToRemove = ['faildaily', 'user_', 'auth_', 'session_', 'login_'];

    allKeys.forEach(key => {
      if (patternsToRemove.some(pattern => key.toLowerCase().includes(pattern.toLowerCase()))) {
        console.log(`🗑️ Suppression automatique de ${key}`);
        localStorage.removeItem(key);
      }
    });

    console.log('🔍 APRÈS nettoyage - localStorage keys:', Object.keys(localStorage));

    if (this.mysqlUserSubscription) {
      this.mysqlUserSubscription.unsubscribe();
      this.mysqlUserSubscription = undefined;
    }

    this.sessionInitialized = false;
  }

  // Méthodes manquantes
  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value || null;
  }

  async logout(): Promise<void> {
    try {
      // Nettoyage local d'abord
      this.setCurrentUser(null);
    } catch (error) {
      console.warn('Erreur lors de la déconnexion:', error);
    }
    
    this.clearAllAuthData();
  }

  async updateUserProfile(profileData: any): Promise<any> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }
    return await this.mysqlService.updateProfile(currentUser.id, profileData);
  }

  async checkDisplayNameAvailable(displayName: string, excludeUserId?: string): Promise<boolean> {
    return await this.mysqlService.checkDisplayNameAvailable(displayName, excludeUserId);
  }

  async forceRefreshAuth(): Promise<void> {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      // Rechargement du profil depuis la base
      const profile = await this.mysqlService.getProfile(currentUser.id);
      if (profile?.success) {
        this.setCurrentUser({
          ...currentUser,
          ...profile.data
        });
      }
    }
  }

  private setupInactivityTimer(): void {
    // Timer d'inactivité - à implémenter si nécessaire
  }

  private setupActivityListeners(): void {
    // Listeners d'activité - à implémenter si nécessaire
  }
}