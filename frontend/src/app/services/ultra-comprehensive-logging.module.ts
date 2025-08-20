// ========================================
// MODULE PRINCIPAL DU SYSTÈME DE LOGS ULTRA-COMPLET
// ========================================
// Ce module initialise automatiquement tout le système de logging
// Version nettoyée - LoggingIntegratorService supprimé

import { NgModule } from '@angular/core';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';
import { LoggingSetupService } from './logging-setup.service';

// Interface de configuration pour le module
export interface LoggingModuleConfig {
    enableConsoleLog?: boolean;
    enableDatabaseLog?: boolean;
    enableMonitoring?: boolean;
    bufferSize?: number;
    flushInterval?: number;
    categories?: string[];
}

// Configuration par défaut
const DEFAULT_CONFIG: LoggingModuleConfig = {
    enableConsoleLog: false, // Désactivé - remplacé par PostgreSQL
    enableDatabaseLog: true,
    enableMonitoring: true,
    bufferSize: 100,
    flushInterval: 30000,
    categories: ['auth', 'profile', 'fail', 'reaction', 'badge', 'navigation', 'admin', 'system', 'security', 'social']
};

@NgModule({
    providers: [
        ComprehensiveLoggerService,
        LoggingSetupService
    ]
})
export class UltraComprehensiveLoggingModule {

    constructor(
        private logger: ComprehensiveLoggerService,
        private setupService: LoggingSetupService
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
                LoggingSetupService
            ]
        };
    }

    /**
     * Initialisation automatique du système de logging
     */
    private async initializeLoggingSystem(): Promise<void> {
        try {
            console.log('🚀 UltraComprehensiveLoggingModule: Système de logging PostgreSQL initialisé');

            // Le logging est maintenant intégré directement dans chaque service
            // via LoggingSetupService qui configure les dépendances

        } catch (error) {
            console.error('❌ UltraComprehensiveLoggingModule: Erreur d\'initialisation:', error);
        }
    }
}
