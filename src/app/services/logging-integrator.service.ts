// ========================================
// INTÉGRATEUR AUTOMATIQUE DE LOGS FAILDAILY
// ========================================
// Ce service intercepte automatiquement TOUTES les actions existantes
// et les redirige vers le système de logging ultra-complet

import { Injectable } from '@angular/core';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';
import { SupabaseService } from './supabase.service';

@Injectable({
    providedIn: 'root'
})
export class LoggingIntegratorService {

    constructor(
        private logger: ComprehensiveLoggerService,
        private supabase: SupabaseService
    ) {
        this.interceptAllSupabaseActions();
        this.setupNavigationLogging();
        this.setupErrorHandling();
    }

    // ========================================
    // INTERCEPTION DES ACTIONS SUPABASE
    // ========================================

    private interceptAllSupabaseActions(): void {
        // Intercepter l'inscription (signature: email, password, displayName)
        const originalSignUp = this.supabase.signUp.bind(this.supabase);
        this.supabase.signUp = async (email: string, password: string, displayName: string) => {
            const correlationId = this.logger['generateCorrelationId']();
            this.logger.setCorrelationId(correlationId);

            await this.logger.logAuth('signup_attempt', `Tentative d'inscription pour ${email}`, { email, displayName });

            try {
                const result = await originalSignUp(email, password, displayName);

                if (result.error) {
                    await this.logger.logAuth('signup_failed', `Échec de l'inscription pour ${email}`,
                        { email, displayName, error: result.error.message }, false, result.error.message);
                } else {
                    await this.logger.logAuth('signup_success', `Inscription réussie pour ${email}`,
                        { email, displayName, userId: result.data?.user?.id });
                }

                return result;
            } catch (error) {
                await this.logger.logError(error as Error, 'signUp', { email, displayName });
                throw error;
            } finally {
                this.logger.clearCorrelationId();
            }
        };

        // Intercepter la connexion
        const originalSignIn = this.supabase.signIn.bind(this.supabase);
        this.supabase.signIn = async (email: string, password: string) => {
            const correlationId = this.logger['generateCorrelationId']();
            this.logger.setCorrelationId(correlationId);

            await this.logger.logAuth('signin_attempt', `Tentative de connexion pour ${email}`, { email });

            try {
                const result = await originalSignIn(email, password);

                if (result.error) {
                    await this.logger.logAuth('signin_failed', `Échec de connexion pour ${email}`,
                        { email, error: result.error.message }, false, result.error.message);

                    // Log de sécurité en cas d'échec répété
                    await this.logger.logSecurity('login_failure', `Tentative de connexion échouée`,
                        { email, timestamp: new Date() }, false, result.error.message);
                } else {
                    await this.logger.logAuth('signin_success', `Connexion réussie pour ${email}`,
                        { email, userId: result.data?.user?.id });

                    // Démarrer une nouvelle session
                    if (result.data?.user?.id) {
                        await this.logger.startUserSession(result.data.user.id);
                    }
                }

                return result;
            } catch (error) {
                await this.logger.logError(error as Error, 'signIn', { email });
                throw error;
            } finally {
                this.logger.clearCorrelationId();
            }
        };

        // Intercepter la déconnexion (retourne void)
        const originalSignOut = this.supabase.signOut.bind(this.supabase);
        this.supabase.signOut = async () => {
            const currentUser = this.supabase.getCurrentUserSync();

            await this.logger.logAuth('signout_attempt', `Déconnexion de ${currentUser?.email}`);

            try {
                await originalSignOut(); // Pas de retour à vérifier

                await this.logger.logAuth('signout_success', `Déconnexion réussie`);
                await this.logger.endUserSession();
            } catch (error) {
                await this.logger.logAuth('signout_failed', `Échec de déconnexion`,
                    { error: (error as Error).message }, false, (error as Error).message);
                await this.logger.logError(error as Error, 'signOut');
                throw error;
            }
        };

        // Intercepter la création de profil
        const originalCreateProfile = this.supabase.createProfile.bind(this.supabase);
        this.supabase.createProfile = async (profileData: any) => {
            await this.logger.logProfile('create_attempt', `Création de profil pour ${profileData.email}`, null, profileData);

            try {
                const result = await originalCreateProfile(profileData);

                if (result.error) {
                    await this.logger.logProfile('create_failed', `Échec de création de profil`,
                        null, profileData, false);
                } else {
                    await this.logger.logProfile('create_success', `Profil créé avec succès`,
                        null, result.data);
                }

                return result;
            } catch (error) {
                await this.logger.logError(error as Error, 'createProfile', profileData);
                throw error;
            }
        };

        // Intercepter la mise à jour de profil
        const originalUpdateProfile = this.supabase.updateProfile.bind(this.supabase);
        this.supabase.updateProfile = async (userId: string, updates: any) => {
            // Récupérer les anciennes valeurs
            const { data: oldProfile } = await this.supabase.getProfile(userId);

            await this.logger.logProfile('update_attempt', `Mise à jour du profil`, oldProfile, updates);

            try {
                const result = await originalUpdateProfile(userId, updates);

                if (result.error) {
                    await this.logger.logProfile('update_failed', `Échec de mise à jour du profil`,
                        oldProfile, updates, false);
                } else {
                    await this.logger.logProfile('update_success', `Profil mis à jour avec succès`,
                        oldProfile, result.data);
                }

                return result;
            } catch (error) {
                await this.logger.logError(error as Error, 'updateProfile', { userId, updates });
                throw error;
            }
        };

        // Intercepter l'ajout de réaction (signature: failId, reactionType, retourne void)
        const originalAddReaction = this.supabase.addReaction.bind(this.supabase);
        this.supabase.addReaction = async (failId: string, reactionType: string) => {
            // Récupérer les infos du fail
            const { data: fail } = await this.supabase.client
                .from('fails')
                .select('title, user_id')
                .eq('id', failId)
                .single();

            await this.logger.logReaction('add_attempt', `Ajout de réaction "${reactionType}"`,
                undefined, failId, fail?.user_id);

            try {
                await originalAddReaction(failId, reactionType); // Pas de retour à vérifier

                await this.logger.logReaction('add_success', `Réaction "${reactionType}" ajoutée`,
                    undefined, failId, fail?.user_id);
            } catch (error) {
                await this.logger.logReaction('add_failed', `Échec d'ajout de réaction`,
                    undefined, failId, fail?.user_id, false);
                await this.logger.logError(error as Error, 'addReaction', { failId, reactionType });
                throw error;
            }
        };

        // Intercepter la suppression de réaction (signature: failId, reactionType, retourne void)
        const originalRemoveReaction = this.supabase.removeReaction.bind(this.supabase);
        this.supabase.removeReaction = async (failId: string, reactionType: string) => {
            await this.logger.logReaction('remove_attempt', `Suppression de réaction "${reactionType}"`, undefined, failId);

            try {
                await originalRemoveReaction(failId, reactionType); // Pas de retour à vérifier

                await this.logger.logReaction('remove_success', `Réaction "${reactionType}" supprimée`, undefined, failId);
            } catch (error) {
                await this.logger.logReaction('remove_failed', `Échec de suppression de réaction`,
                    undefined, failId, undefined, false);
                await this.logger.logError(error as Error, 'removeReaction', { failId, reactionType });
                throw error;
            }
        };
    }

    // ========================================
    // LOGGING DE NAVIGATION AUTOMATIQUE
    // ========================================

    private setupNavigationLogging(): void {
        if (typeof window !== 'undefined') {
            let previousUrl = window.location.href;

            // Observer les changements d'URL
            const observer = new MutationObserver(() => {
                if (window.location.href !== previousUrl) {
                    this.logger.logNavigation('route_change', `Navigation vers ${window.location.pathname}`,
                        previousUrl, window.location.href, {
                        referrer: document.referrer,
                        timestamp: new Date()
                    });
                    previousUrl = window.location.href;
                }
            });

            observer.observe(document, { subtree: true, childList: true });

            // Log du chargement initial de la page
            this.logger.logNavigation('page_load', `Chargement de ${window.location.pathname}`,
                undefined, window.location.href, {
                referrer: document.referrer,
                loadTime: performance.now()
            });

            // Log des événements de navigation du navigateur
            window.addEventListener('popstate', (event) => {
                this.logger.logNavigation('browser_back_forward', `Navigation navigateur vers ${window.location.pathname}`,
                    undefined, window.location.href, {
                    state: event.state
                });
            });

            // Log de la visibilité de la page
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.logger.logNavigation('page_hidden', 'Page masquée');
                } else {
                    this.logger.logNavigation('page_visible', 'Page visible');
                }
            });

            // Log du focus/blur de la fenêtre
            window.addEventListener('focus', () => {
                this.logger.logNavigation('window_focus', 'Fenêtre active');
            });

            window.addEventListener('blur', () => {
                this.logger.logNavigation('window_blur', 'Fenêtre inactive');
            });
        }
    }

    // ========================================
    // GESTION AUTOMATIQUE DES ERREURS
    // ========================================

    private setupErrorHandling(): void {
        if (typeof window !== 'undefined') {
            // Capturer les erreurs JavaScript
            window.addEventListener('error', (event) => {
                this.logger.logError(event.error || new Error(event.message), 'global_error', {
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno,
                    target: event.target?.toString(),
                    type: 'javascript'
                });
            });

            // Capturer les erreurs de promesses non gérées
            window.addEventListener('unhandledrejection', (event) => {
                this.logger.logError(
                    new Error(event.reason?.message || 'Promise rejection non gérée'),
                    'unhandled_promise',
                    {
                        reason: event.reason,
                        type: 'promise'
                    }
                );
            });

            // Capturer les erreurs de chargement de ressources
            window.addEventListener('error', (event) => {
                if (event.target && event.target !== window) {
                    const element = event.target as any;
                    this.logger.logError(
                        new Error(`Échec de chargement de ressource: ${element.src || element.href}`),
                        'resource_load_error',
                        {
                            tagName: element.tagName,
                            src: element.src,
                            href: element.href,
                            type: 'resource'
                        }
                    );
                }
            }, true);
        }
    }

    // ========================================
    // MÉTHODES DE DEBUGGING AVANCÉ
    // ========================================

    /**
     * Activer le mode debug ultra-verbose
     */
    enableDebugMode(): void {
        // Intercepter tous les appels à console.log, warn, error
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;

        console.log = (...args) => {
            originalLog(...args);
            this.logger.logActivity({
                eventType: 'console_log',
                eventCategory: 'system',
                action: 'debug',
                title: 'Console Log',
                description: args.join(' '),
                payload: { args, level: 'log' }
            });
        };

        console.warn = (...args) => {
            originalWarn(...args);
            this.logger.logActivity({
                eventType: 'console_warn',
                eventCategory: 'system',
                action: 'debug',
                title: 'Console Warning',
                description: args.join(' '),
                payload: { args, level: 'warn' }
            });
        };

        console.error = (...args) => {
            originalError(...args);
            this.logger.logError(
                new Error(args.join(' ')),
                'console_error',
                { args, level: 'error' }
            );
        };
    }

    /**
     * Logger les performances de l'application
     */
    async logPerformanceMetrics(): Promise<void> {
        if ('performance' in window) {
            const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
            const paintEntries = performance.getEntriesByType('paint');

            await this.logger.logActivity({
                eventType: 'performance_metrics',
                eventCategory: 'system',
                action: 'performance',
                title: 'Métriques de performance',
                description: 'Collecte des métriques de performance de l\'application',
                payload: {
                    navigation: {
                        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
                        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
                        firstByte: navigation.responseStart - navigation.requestStart,
                        domProcessing: navigation.domComplete - navigation.domInteractive
                    },
                    paint: paintEntries.reduce((acc, entry) => {
                        acc[entry.name] = entry.startTime;
                        return acc;
                    }, {} as any),
                    memory: (performance as any).memory ? {
                        used: (performance as any).memory.usedJSHeapSize,
                        total: (performance as any).memory.totalJSHeapSize,
                        limit: (performance as any).memory.jsHeapSizeLimit
                    } : null,
                    timing: navigation.toJSON()
                }
            });
        }
    }

    /**
     * Logger l'utilisation de la mémoire
     */
    async logMemoryUsage(): Promise<void> {
        if ('memory' in performance) {
            const memory = (performance as any).memory;
            await this.logger.logActivity({
                eventType: 'memory_usage',
                eventCategory: 'system',
                action: 'memory',
                title: 'Utilisation mémoire',
                description: `Mémoire utilisée: ${Math.round(memory.usedJSHeapSize / 1024 / 1024)}MB`,
                payload: {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit,
                    percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
                }
            });
        }
    }

    /**
     * Démarrage automatique du monitoring
     */
    startAutomaticMonitoring(): void {
        // Métriques de performance toutes les 30 secondes
        setInterval(() => {
            this.logPerformanceMetrics();
            this.logMemoryUsage();
        }, 30000);

        // Log de l'activité utilisateur (scroll, click, etc.)
        let lastActivity = Date.now();

        ['scroll', 'click', 'keydown', 'mousemove', 'touchstart'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                const now = Date.now();
                if (now - lastActivity > 5000) { // Seulement si plus de 5 secondes d'inactivité
                    this.logger.logNavigation('user_activity', `Activité utilisateur: ${eventType}`,
                        undefined, undefined, { eventType, timestamp: new Date() });
                }
                lastActivity = now;
            }, { passive: true });
        });

        // Détection d'inactivité
        setInterval(() => {
            const now = Date.now();
            if (now - lastActivity > 300000) { // 5 minutes d'inactivité
                this.logger.logNavigation('user_inactive', 'Utilisateur inactif depuis 5 minutes');
                lastActivity = now; // Reset pour éviter les logs répétés
            }
        }, 60000); // Vérifier toutes les minutes
    }
}
