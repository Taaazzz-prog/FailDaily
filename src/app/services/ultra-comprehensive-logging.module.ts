// ========================================
// MODULE PRINCIPAL DU SYSTÈME DE LOGS ULTRA-COMPLET
// ========================================
// Ce module initialise automatiquement tout le système de logging
// et peut être importé directement dans app.module.ts

import { NgModule } from '@angular/core';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';
import { LoggingIntegratorService } from './logging-integrator.service';

// Interface de configuration pour le module
export interface LoggingModuleConfig {
    enableConsoleLog?: boolean;
    enableDatabaseLog?: boolean;
    enableAutoIntegration?: boolean;
    enableMonitoring?: boolean;
    bufferSize?: number;
    flushInterval?: number;
    categories?: string[];
}

// Configuration par défaut
const DEFAULT_CONFIG: LoggingModuleConfig = {
    enableConsoleLog: true,
    enableDatabaseLog: true,
    enableAutoIntegration: true,
    enableMonitoring: true,
    bufferSize: 100,
    flushInterval: 30000,
    categories: ['auth', 'profile', 'fail', 'reaction', 'badge', 'navigation', 'admin', 'system', 'security']
};

@NgModule({
    providers: [
        ComprehensiveLoggerService,
        LoggingIntegratorService
    ]
})
export class UltraComprehensiveLoggingModule {

    constructor(
        private logger: ComprehensiveLoggerService,
        private integrator: LoggingIntegratorService
    ) {
        this.initializeLoggingSystem();
    }

    /**
     * Méthode statique pour configurer le module
     */
    static forRoot(config?: LoggingModuleConfig): any {
        return {
            ngModule: UltraComprehensiveLoggingModule,
            providers: [
                {
                    provide: 'LOGGING_CONFIG',
                    useValue: { ...DEFAULT_CONFIG, ...config }
                },
                ComprehensiveLoggerService,
                LoggingIntegratorService
            ]
        };
    }

    /**
     * Initialisation automatique du système de logging
     */
    private async initializeLoggingSystem(): Promise<void> {
        try {
            // Log d'initialisation du module
            await this.logger.logActivity({
                eventType: 'logging_module_init',
                eventCategory: 'system',
                action: 'initialize',
                title: 'Module de logging ultra-complet initialisé',
                description: 'Le système de logging complet est maintenant opérationnel avec tous les intercepteurs activés',
                payload: {
                    version: '2.0.0',
                    features: [
                        'comprehensive_database_logging',
                        'automatic_supabase_interception',
                        'realtime_monitoring',
                        'performance_tracking',
                        'user_session_management',
                        'advanced_statistics',
                        'error_tracking',
                        'security_logging'
                    ],
                    timestamp: new Date(),
                    environment: this.getEnvironment()
                }
            });

            console.log(`
╔══════════════════════════════════════════════════════════════╗
║                   🚀 FAILDAILY LOGGING SYSTEM                ║
║                      ULTRA-COMPLET ACTIVÉ                    ║
╠══════════════════════════════════════════════════════════════╣
║ ✅ Logging base de données PostgreSQL                        ║
║ ✅ Interception automatique Supabase                         ║
║ ✅ Monitoring temps réel                                     ║
║ ✅ Suivi des sessions utilisateur                            ║
║ ✅ Métriques de performance                                  ║
║ ✅ Tracking des erreurs et sécurité                         ║
║ ✅ Interface d'administration                                ║
║ ✅ Export et analytics avancés                              ║
╚══════════════════════════════════════════════════════════════╝
      `);

        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation du système de logging:', error);
        }
    }

    /**
     * Déterminer l'environnement d'exécution
     */
    private getEnvironment(): string {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'development';
            } else if (hostname.includes('staging') || hostname.includes('test')) {
                return 'staging';
            } else {
                return 'production';
            }
        }
        return 'unknown';
    }
}
