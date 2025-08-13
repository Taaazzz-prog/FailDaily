import { Injectable } from '@angular/core';

// Interface pour la configuration sécurisée
interface SecureEnvironment {
    production: boolean;
    supabase: {
        url: string;
        anonKey: string;
    };
    firebase: {
        apiKey: string;
        authDomain: string;
        projectId: string;
        storageBucket: string;
        messagingSenderId: string;
        appId: string;
    };
    api: {
        baseUrl: string;
        moderationUrl: string;
        moderationKey: string;
        uploadMaxSize: number;
        imageQuality: number;
    };
    notifications: {
        vapidKey: string;
        enablePush: boolean;
        enableInApp: boolean;
        debugMode: boolean;
        retryAttempts: number;
        retryDelay: number;
    };
    app: {
        name: string;
        version: string;
        debugMode: boolean;
        maxFailsPerDay: number;
        courageHeartCooldown: number;
        anonymousMode: boolean;
        locationEnabled: boolean;
    };
    badges: {
        firstFailPoints: number;
        dailyStreakPoints: number;
        courageHeartPoints: number;
        communityHelpPoints: number;
    };
    features: {
        voiceNotes: boolean;
        groupChallenges: boolean;
        aiCounselor: boolean;
        darkModeAuto: boolean;
        hapticFeedback: boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class ConfigService {

    private config: SecureEnvironment;

    constructor() {
        this.config = this.loadConfiguration();
    }

    /**
     * Charge la configuration depuis les variables d'environnement
     */
    private loadConfiguration(): SecureEnvironment {
        return {
            production: this.getEnvVar('APP_ENV') !== 'development',

            supabase: {
                url: this.getEnvVar('SUPABASE_URL', 'http://127.0.0.1:54321'),
                anonKey: this.getEnvVar('SUPABASE_ANON_KEY')
            },

            firebase: {
                apiKey: this.getEnvVar('FIREBASE_API_KEY'),
                authDomain: this.getEnvVar('FIREBASE_AUTH_DOMAIN'),
                projectId: this.getEnvVar('FIREBASE_PROJECT_ID'),
                storageBucket: this.getEnvVar('FIREBASE_STORAGE_BUCKET'),
                messagingSenderId: this.getEnvVar('FIREBASE_MESSAGING_SENDER_ID'),
                appId: this.getEnvVar('FIREBASE_APP_ID')
            },

            api: {
                baseUrl: this.getEnvVar('SUPABASE_URL', 'http://127.0.0.1:54321'),
                moderationUrl: this.getEnvVar('OPENAI_API_URL', 'https://api.openai.com/v1'),
                moderationKey: this.getEnvVar('OPENAI_API_KEY'),
                uploadMaxSize: this.getEnvVar('APP_ENV') === 'development' ? 5 * 1024 * 1024 : 3 * 1024 * 1024,
                imageQuality: this.getEnvVar('APP_ENV') === 'development' ? 85 : 75
            },

            notifications: {
                vapidKey: this.getEnvVar('VAPID_PUBLIC_KEY'),
                enablePush: true,
                enableInApp: true,
                debugMode: this.getEnvVar('DEBUG_MODE', 'false') === 'true',
                retryAttempts: 3,
                retryDelay: this.getEnvVar('APP_ENV') === 'development' ? 2000 : 5000
            },

            app: {
                name: this.getEnvVar('APP_ENV') === 'development' ? 'FailDaily Dev' : 'FailDaily',
                version: '1.0.0-local',
                debugMode: this.getEnvVar('DEBUG_MODE', 'false') === 'true',
                maxFailsPerDay: this.getEnvVar('APP_ENV') === 'development' ? 10 : 3,
                courageHeartCooldown: this.getEnvVar('APP_ENV') === 'development' ? 1000 : 5000,
                anonymousMode: true,
                locationEnabled: this.getEnvVar('APP_ENV') !== 'development'
            },

            badges: {
                firstFailPoints: 10,
                dailyStreakPoints: 5,
                courageHeartPoints: 2,
                communityHelpPoints: 15
            },

            features: {
                voiceNotes: this.getEnvVar('APP_ENV') === 'development',
                groupChallenges: this.getEnvVar('APP_ENV') === 'development',
                aiCounselor: this.getEnvVar('APP_ENV') === 'development',
                darkModeAuto: true,
                hapticFeedback: true
            }
        };
    }

    /**
     * Récupère une variable d'environnement avec une valeur par défaut
     */
    private getEnvVar(key: string, defaultValue: string = ''): string {
        // En développement, utiliser les variables d'environnement
        // En production, ces valeurs seraient injectées par le serveur/build

        // Pour Ionic/Capacitor, les variables d'env sont accessibles via process.env
        if (typeof process !== 'undefined' && process.env) {
            return process.env[key] || defaultValue;
        }

        // Fallback pour le développement web
        const envVars = (window as any).__env__ || {};
        return envVars[key] || defaultValue;
    }

    /**
     * Getters publics pour accéder à la configuration
     */
    get environment(): SecureEnvironment {
        return { ...this.config }; // Retourne une copie pour éviter la mutation
    }

    get supabase() {
        return this.config.supabase;
    }

    get firebase() {
        return this.config.firebase;
    }

    get api() {
        return this.config.api;
    }

    get notifications() {
        return this.config.notifications;
    }

    get app() {
        return this.config.app;
    }

    get badges() {
        return this.config.badges;
    }

    get features() {
        return this.config.features;
    }

    /**
     * Vérifie si toutes les clés nécessaires sont configurées
     */
    validateConfiguration(): { valid: boolean; missing: string[] } {
        const requiredKeys = [
            'SUPABASE_URL',
            'SUPABASE_ANON_KEY',
            'VAPID_PUBLIC_KEY'
        ];

        const missing = requiredKeys.filter(key => !this.getEnvVar(key));

        return {
            valid: missing.length === 0,
            missing
        };
    }

    /**
     * Mode debug pour afficher la configuration (sans les clés sensibles)
     */
    debugConfiguration(): void {
        if (this.config.app.debugMode) {
            console.group('🔧 Configuration FailDaily');
            console.log('Environment:', this.getEnvVar('APP_ENV'));
            console.log('Supabase URL:', this.config.supabase.url);
            console.log('Debug Mode:', this.config.app.debugMode);
            console.log('Features:', this.config.features);

            const validation = this.validateConfiguration();
            if (!validation.valid) {
                console.warn('⚠️ Clés manquantes:', validation.missing);
            }

            console.groupEnd();
        }
    }
}
