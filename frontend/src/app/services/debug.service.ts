import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface DebugLog {
    id: string;
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    service: string;
    message: string;
    data?: any;
    stackTrace?: string;
}

@Injectable({
    providedIn: 'root'
})
export class DebugService {
    private logs: DebugLog[] = [];
    private logsSubject = new BehaviorSubject<DebugLog[]>([]);
    private maxLogs = 1000; // Limite pour éviter la surcharge mémoire

    public logs$ = this.logsSubject.asObservable();
    private isEnabled = true; // Activé en développement
    private ignoreNavigatorLockErrors = true; // ✅ Nouveau : Ignorer les erreurs NavigatorLock non critiques

    constructor() {
        // Intercepter les erreurs globales
        this.interceptConsoleErrors();
        this.interceptUnhandledErrors();
    }

    private interceptConsoleErrors() {
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        const originalConsoleLog = console.log;

        console.error = (...args: any[]) => {
            const message = args.join(' ');
            // ✅ Filtrer les erreurs NavigatorLock de l'ancien système (non critiques)
            if (this.ignoreNavigatorLockErrors &&
                (message.includes('NavigatorLockAcquireTimeoutError') ||
                    message.includes('lock:faildaily-mysql-auth') ||
                    message.includes('Acquiring an exclusive Navigator LockManager lock'))) {
                // Erreur NavigatorLock ignorée - SDK MySQL interne
                return;
            }
            this.addLog('error', 'Console', message, args.length > 1 ? args : args[0]);
            originalConsoleError.apply(console, args);
        };

        console.warn = (...args: any[]) => {
            this.addLog('warn', 'Console', args.join(' '), args.length > 1 ? args : args[0]);
            originalConsoleWarn.apply(console, args);
        };

        // Intercepter seulement les logs avec des emojis spécifiques (nos logs de debug)
        console.log = (...args: any[]) => {
            const message = args.join(' ');
            if (message.includes('🔐') || message.includes('❌') || message.includes('⚠️') ||
                message.includes('✅') || message.includes('🔄') || message.includes('📤') ||
                message.includes('📥') || message.includes('ℹ️')) {
                const service = this.extractServiceFromMessage(message);
                this.addLog('info', service, message, args.length > 1 ? args : args[0]);
            }
            originalConsoleLog.apply(console, args);
        };
    }

    private interceptUnhandledErrors() {
        window.addEventListener('error', (event) => {
            this.addLog('error', 'Global', event.message, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error
            }, event.error?.stack);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.addLog('error', 'Promise', `Unhandled Promise Rejection: ${event.reason}`, {
                reason: event.reason
            });
        });
    }

    private extractServiceFromMessage(message: string): string {
        if (message.includes('AuthService')) return 'AuthService';
        if (message.includes('MysqlService')) return 'MysqlService';
        if (message.includes('BadgeService')) return 'BadgeService';
        if (message.includes('FailService')) return 'FailService';
        if (message.includes('PushService')) return 'PushService';
        return 'Unknown';
    }

    addLog(level: DebugLog['level'], service: string, message: string, data?: any, stackTrace?: string) {
        if (!this.isEnabled) return;

        const log: DebugLog = {
            id: this.generateId(),
            timestamp: new Date(),
            level,
            service,
            message,
            data,
            stackTrace
        };

        this.logs.unshift(log); // Ajouter au début pour avoir les plus récents en premier

        // Limiter le nombre de logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(0, this.maxLogs);
        }

        this.logsSubject.next([...this.logs]);
    }

    private generateId(): string {
        return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Méthodes utilitaires pour l'usage dans les services
    logInfo(service: string, message: string, data?: any) {
        this.addLog('info', service, message, data);
    }

    logWarn(service: string, message: string, data?: any) {
        this.addLog('warn', service, message, data);
    }

    logError(service: string, message: string, error?: any) {
        this.addLog('error', service, message, error, error?.stack);
    }

    logDebug(service: string, message: string, data?: any) {
        this.addLog('debug', service, message, data);
    }

    // Méthodes pour la page de debug
    getLogs(filter?: {
        level?: DebugLog['level'][];
        service?: string[];
        since?: Date;
    }): DebugLog[] {
        let filteredLogs = [...this.logs];

        if (filter) {
            if (filter.level && filter.level.length > 0) {
                filteredLogs = filteredLogs.filter(log => filter.level!.includes(log.level));
            }

            if (filter.service && filter.service.length > 0) {
                filteredLogs = filteredLogs.filter(log => filter.service!.includes(log.service));
            }

            if (filter.since) {
                filteredLogs = filteredLogs.filter(log => log.timestamp >= filter.since!);
            }
        }

        return filteredLogs;
    }

    clearLogs() {
        this.logs = [];
        this.logsSubject.next([]);
    }

    exportLogs(filter?: any): string {
        const logsToExport = filter ? this.getLogs(filter) : this.logs;

        const exportData = {
            timestamp: new Date().toISOString(),
            totalLogs: logsToExport.length,
            logs: logsToExport.map(log => ({
                timestamp: log.timestamp.toISOString(),
                level: log.level,
                service: log.service,
                message: log.message,
                data: log.data ? JSON.stringify(log.data, null, 2) : undefined,
                stackTrace: log.stackTrace
            }))
        };

        return JSON.stringify(exportData, null, 2);
    }

    // Méthode pour désactiver en production
    setEnabled(enabled: boolean) {
        this.isEnabled = enabled;
        
        // En production, si on active le debug pour un admin, 
        // on réactive aussi temporairement console.* pour cette session
        if (enabled && window.location.hostname !== 'localhost') {
            this.restoreConsoleForAdmin();
        }
    }

    // Méthode pour restaurer les console.* pour les admins en production
    private restoreConsoleForAdmin() {
        const originalConsole = {
            log: console.log,
            error: console.error,
            warn: console.warn,
            info: console.info,
            debug: console.debug
        };

        // Vérifier si les console.* ont été désactivés (remplacés par noop)
        if (console.log.toString().includes('function(){}') || 
            console.log.toString().includes('[native code]') === false) {
            
            // Restaurer console.log avec un préfixe admin
            (window as any).console.log = (...args: any[]) => {
                originalConsole.log('[ADMIN]', ...args);
            };
            
            console.log('🔧 Console restauré pour admin en production');
        }
    }
}
