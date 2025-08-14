// ========================================
// SERVICE DE LOGGING ULTRA-COMPLET FAILDAILY
// ========================================
// Ce service capture TOUTES les actions utilisateur avec une intégration parfaite
// avec le système de logs PostgreSQL pour un debugging ultra-précis

import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { BehaviorSubject, Observable } from 'rxjs';

export interface LogEntry {
    id?: string;
    eventType: string;
    eventCategory: 'auth' | 'profile' | 'fail' | 'reaction' | 'badge' | 'navigation' | 'admin' | 'system' | 'security';
    action: string;
    title: string;
    description?: string;
    userId?: string;
    resourceType?: string;
    resourceId?: string;
    targetUserId?: string;
    payload?: any;
    oldValues?: any;
    newValues?: any;
    success?: boolean;
    errorMessage?: string;
    executionTimeMs?: number;
    correlationId?: string;
}

export interface UserSession {
    id?: string;
    userId: string;
    sessionStart: Date;
    sessionEnd?: Date;
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: any;
    isActive: boolean;
}

export interface UsageMetrics {
    userId: string;
    date: string;
    loginsCount: number;
    failsCreated: number;
    failsViewed: number;
    reactionsGiven: number;
    reactionsReceived: number;
    profileUpdates: number;
    badgesEarned: number;
    sessionDuration: number;
    errorsEncountered: number;
    successfulActions: number;
}

@Injectable({
    providedIn: 'root'
})
export class ComprehensiveLoggerService {

    private currentSession: UserSession | null = null;
    private logBuffer: LogEntry[] = [];
    private isOnline = navigator.onLine;
    private sessionId = this.generateSessionId();
    private correlationId: string | null = null;

    // Observables pour le monitoring en temps réel
    private logsSubject = new BehaviorSubject<LogEntry[]>([]);
    public logs$ = this.logsSubject.asObservable();

    private metricsSubject = new BehaviorSubject<UsageMetrics | null>(null);
    public metrics$ = this.metricsSubject.asObservable();

    // Configuration de logging par environnement
    private logConfig = {
        enableConsoleLog: true,
        enableDatabaseLog: true,
        enableBuffering: true,
        bufferSize: 100,
        flushInterval: 30000, // 30 secondes
        enablePerformanceTracking: true,
        enableUserBehaviorTracking: true
    };

    constructor(private supabase: SupabaseService) {
        this.initializeLogger();
        this.setupEventListeners();
        this.startPeriodicFlush();
    }

    // ========================================
    // MÉTHODES PRINCIPALES DE LOGGING
    // ========================================

    /**
     * Log universel pour toutes les actions
     */
    async logActivity(entry: LogEntry): Promise<string | null> {
        const startTime = performance.now();

        // Enrichir l'entrée avec le contexte
        const currentUserId = this.getCurrentUserId();
        const enrichedEntry: LogEntry = {
            ...entry,
            correlationId: entry.correlationId || this.correlationId || this.generateCorrelationId(),
            executionTimeMs: entry.executionTimeMs || Math.round(performance.now() - startTime),
            userId: entry.userId || (currentUserId || undefined),
            success: entry.success !== undefined ? entry.success : true
        };

        // Ajouter au buffer local pour l'UI
        this.addToBuffer(enrichedEntry);

        // Log console en développement
        if (this.logConfig.enableConsoleLog) {
            this.logToConsole(enrichedEntry);
        }

        // Envoyer à la base de données
        if (this.logConfig.enableDatabaseLog && this.isOnline) {
            return await this.logToDatabase(enrichedEntry);
        } else if (this.logConfig.enableBuffering) {
            // Garder en buffer si hors ligne
            this.logBuffer.push(enrichedEntry);
            return 'buffered';
        }

        return null;
    }

    /**
     * Méthodes spécialisées pour chaque catégorie
     */

    // AUTHENTIFICATION
    async logAuth(action: string, title: string, details?: any, success: boolean = true, error?: string) {
        return await this.logActivity({
            eventType: `auth_${action}`,
            eventCategory: 'auth',
            action,
            title,
            description: `Action d'authentification: ${action}`,
            payload: details,
            success,
            errorMessage: error
        });
    }

    // PROFIL UTILISATEUR
    async logProfile(action: string, title: string, oldValues?: any, newValues?: any, success: boolean = true) {
        return await this.logActivity({
            eventType: `profile_${action}`,
            eventCategory: 'profile',
            action,
            title,
            description: `Action sur le profil: ${action}`,
            resourceType: 'profile',
            oldValues,
            newValues,
            success
        });
    }

    // FAILS
    async logFail(action: string, title: string, failId?: string, details?: any, success: boolean = true) {
        return await this.logActivity({
            eventType: `fail_${action}`,
            eventCategory: 'fail',
            action,
            title,
            description: `Action sur un fail: ${action}`,
            resourceType: 'fail',
            resourceId: failId,
            payload: details,
            success
        });
    }

    // RÉACTIONS
    async logReaction(action: string, title: string, reactionId?: string, failId?: string, targetUserId?: string, success: boolean = true) {
        return await this.logActivity({
            eventType: `reaction_${action}`,
            eventCategory: 'reaction',
            action,
            title,
            description: `Action de réaction: ${action}`,
            resourceType: 'reaction',
            resourceId: reactionId,
            targetUserId,
            payload: { failId },
            success
        });
    }

    // BADGES
    async logBadge(action: string, title: string, badgeId?: string, details?: any, success: boolean = true) {
        return await this.logActivity({
            eventType: `badge_${action}`,
            eventCategory: 'badge',
            action,
            title,
            description: `Action de badge: ${action}`,
            resourceType: 'badge',
            resourceId: badgeId,
            payload: details,
            success
        });
    }

    // NAVIGATION
    async logNavigation(action: string, title: string, fromRoute?: string, toRoute?: string, details?: any) {
        return await this.logActivity({
            eventType: `navigation_${action}`,
            eventCategory: 'navigation',
            action,
            title,
            description: `Navigation: ${action}`,
            payload: {
                fromRoute,
                toRoute,
                timestamp: new Date(),
                ...details
            }
        });
    }

    // ADMINISTRATION
    async logAdmin(action: string, title: string, targetUserId?: string, details?: any, success: boolean = true) {
        return await this.logActivity({
            eventType: `admin_${action}`,
            eventCategory: 'admin',
            action,
            title,
            description: `Action administrative: ${action}`,
            targetUserId,
            payload: details,
            success
        });
    }

    // SÉCURITÉ
    async logSecurity(action: string, title: string, details?: any, success: boolean = true, error?: string) {
        return await this.logActivity({
            eventType: `security_${action}`,
            eventCategory: 'security',
            action,
            title,
            description: `Événement de sécurité: ${action}`,
            payload: {
                ipAddress: await this.getUserIP(),
                userAgent: navigator.userAgent,
                timestamp: new Date(),
                ...details
            },
            success,
            errorMessage: error
        });
    }

    // ERREURS
    async logError(error: Error, context?: string, details?: any) {
        return await this.logActivity({
            eventType: 'error_occurred',
            eventCategory: 'system',
            action: 'error',
            title: `Erreur: ${error.name}`,
            description: error.message,
            payload: {
                context,
                stack: error.stack,
                userAgent: navigator.userAgent,
                url: window.location.href,
                timestamp: new Date(),
                ...details
            },
            success: false,
            errorMessage: error.message
        });
    }

    // ========================================
    // GESTION DES SESSIONS
    // ========================================

    async startUserSession(userId: string): Promise<void> {
        const deviceInfo = await this.getDeviceInfo();

        this.currentSession = {
            userId,
            sessionStart: new Date(),
            ipAddress: await this.getUserIP(),
            userAgent: navigator.userAgent,
            deviceInfo,
            isActive: true
        };

        // Enregistrer la session en base
        const { data, error } = await this.supabase.client
            .from('user_sessions')
            .insert([{
                user_id: userId,
                session_start: this.currentSession.sessionStart.toISOString(),
                ip_address: this.currentSession.ipAddress,
                user_agent: this.currentSession.userAgent,
                device_fingerprint: JSON.stringify(deviceInfo),
                is_mobile: deviceInfo.isMobile,
                browser: deviceInfo.browser,
                os: deviceInfo.os
            }])
            .select()
            .single();

        if (data) {
            this.currentSession.id = data.id;
        }

        await this.logAuth('session_start', 'Session utilisateur démarrée', { sessionId: this.currentSession.id });
    }

    async endUserSession(): Promise<void> {
        if (!this.currentSession) return;

        const sessionEnd = new Date();
        const durationMinutes = Math.round((sessionEnd.getTime() - this.currentSession.sessionStart.getTime()) / 60000);

        // Mettre à jour la session en base
        if (this.currentSession.id) {
            await this.supabase.client
                .from('user_sessions')
                .update({
                    session_end: sessionEnd.toISOString(),
                    duration_minutes: durationMinutes,
                    logout_type: 'manual'
                })
                .eq('id', this.currentSession.id);
        }

        await this.logAuth('session_end', 'Session utilisateur terminée', {
            sessionId: this.currentSession.id,
            duration: durationMinutes
        });

        this.currentSession = null;
    }

    // ========================================
    // MÉTHODES DE REQUÊTE ET ANALYTICS
    // ========================================

    /**
     * Récupérer l'historique complet d'un utilisateur
     */
    async getUserHistory(userId?: string, limit: number = 100): Promise<LogEntry[]> {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) return [];

        const { data, error } = await this.supabase.client
            .rpc('get_user_complete_history', {
                p_user_id: targetUserId,
                p_limit: limit
            });

        if (error) {
            await this.logError(new Error(error.message), 'getUserHistory');
            return [];
        }

        return data || [];
    }

    /**
     * Récupérer les statistiques d'activité d'un utilisateur
     */
    async getUserStats(userId?: string): Promise<any> {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) return null;

        const { data, error } = await this.supabase.client
            .rpc('get_user_activity_stats', {
                p_user_id: targetUserId
            });

        if (error) {
            await this.logError(new Error(error.message), 'getUserStats');
            return null;
        }

        return data;
    }

    /**
     * Récupérer les métriques d'utilisation
     */
    async getUsageMetrics(userId?: string, days: number = 30): Promise<UsageMetrics[]> {
        const targetUserId = userId || this.getCurrentUserId();
        if (!targetUserId) return [];

        const { data, error } = await this.supabase.client
            .from('usage_metrics')
            .select('*')
            .eq('user_id', targetUserId)
            .gte('metric_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
            .order('metric_date', { ascending: false });

        if (error) {
            await this.logError(new Error(error.message), 'getUsageMetrics');
            return [];
        }

        return data || [];
    }

    /**
     * Rechercher dans les logs
     */
    async searchLogs(query: string, category?: string, startDate?: Date, endDate?: Date): Promise<LogEntry[]> {
        let supabaseQuery = this.supabase.client
            .from('activity_logs')
            .select('*')
            .ilike('title', `%${query}%`);

        if (category) {
            supabaseQuery = supabaseQuery.eq('event_category', category);
        }

        if (startDate) {
            supabaseQuery = supabaseQuery.gte('created_at', startDate.toISOString());
        }

        if (endDate) {
            supabaseQuery = supabaseQuery.lte('created_at', endDate.toISOString());
        }

        const { data, error } = await supabaseQuery
            .order('created_at', { ascending: false })
            .limit(1000);

        if (error) {
            await this.logError(new Error(error.message), 'searchLogs');
            return [];
        }

        return data || [];
    }

    // ========================================
    // MÉTHODES PRIVÉES
    // ========================================

    private async logToDatabase(entry: LogEntry): Promise<string | null> {
        try {
            const { data, error } = await this.supabase.client
                .rpc('log_comprehensive_activity', {
                    p_event_type: entry.eventType,
                    p_event_category: entry.eventCategory,
                    p_action: entry.action,
                    p_title: entry.title,
                    p_user_id: entry.userId,
                    p_resource_type: entry.resourceType,
                    p_resource_id: entry.resourceId,
                    p_target_user_id: entry.targetUserId,
                    p_description: entry.description,
                    p_payload: entry.payload ? JSON.stringify(entry.payload) : null,
                    p_old_values: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
                    p_new_values: entry.newValues ? JSON.stringify(entry.newValues) : null,
                    p_ip_address: await this.getUserIP(),
                    p_user_agent: navigator.userAgent,
                    p_session_id: this.sessionId,
                    p_success: entry.success,
                    p_error_message: entry.errorMessage,
                    p_execution_time_ms: entry.executionTimeMs,
                    p_correlation_id: entry.correlationId
                });

            if (error) {
                console.error('Erreur lors de l\'insertion du log:', error);
                // Ajouter au buffer en cas d'erreur
                this.logBuffer.push(entry);
                return null;
            }

            return data;
        } catch (error) {
            console.error('Erreur lors du logging:', error);
            this.logBuffer.push(entry);
            return null;
        }
    }

    private logToConsole(entry: LogEntry): void {
        const style = this.getConsoleStyle(entry.eventCategory);
        console.group(`%c[${entry.eventCategory.toUpperCase()}] ${entry.title}`, style);
        console.log('Action:', entry.action);
        console.log('Description:', entry.description);
        console.log('Succès:', entry.success);
        if (entry.payload) console.log('Données:', entry.payload);
        if (entry.errorMessage) console.error('Erreur:', entry.errorMessage);
        console.log('Timestamp:', new Date().toISOString());
        console.groupEnd();
    }

    private getConsoleStyle(category: string): string {
        const styles = {
            auth: 'color: #4CAF50; font-weight: bold;',
            profile: 'color: #2196F3; font-weight: bold;',
            fail: 'color: #FF9800; font-weight: bold;',
            reaction: 'color: #E91E63; font-weight: bold;',
            badge: 'color: #9C27B0; font-weight: bold;',
            navigation: 'color: #607D8B; font-weight: bold;',
            admin: 'color: #F44336; font-weight: bold;',
            system: 'color: #795548; font-weight: bold;',
            security: 'color: #FF5722; font-weight: bold; background: #FFF3E0;'
        };
        return styles[category as keyof typeof styles] || 'color: #333;';
    }

    private addToBuffer(entry: LogEntry): void {
        const logs = this.logsSubject.value;
        const updatedLogs = [entry, ...logs].slice(0, this.logConfig.bufferSize);
        this.logsSubject.next(updatedLogs);
    }

    private async flushBuffer(): Promise<void> {
        if (this.logBuffer.length === 0 || !this.isOnline) return;

        const toFlush = [...this.logBuffer];
        this.logBuffer = [];

        for (const entry of toFlush) {
            await this.logToDatabase(entry);
        }
    }

    private startPeriodicFlush(): void {
        setInterval(() => {
            this.flushBuffer();
        }, this.logConfig.flushInterval);
    }

    private setupEventListeners(): void {
        // Gérer les changements de connectivité
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.flushBuffer();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
        });

        // Gérer la fermeture de la page
        window.addEventListener('beforeunload', () => {
            if (this.currentSession) {
                // Tentative de log synchrone
                navigator.sendBeacon('/api/log-session-end', JSON.stringify({
                    sessionId: this.currentSession.id,
                    endTime: new Date().toISOString()
                }));
            }
        });
    }

    private async initializeLogger(): Promise<void> {
        // Configuration basée sur l'environnement
        const isDev = window.location.hostname === 'localhost';
        this.logConfig.enableConsoleLog = isDev;

        await this.logActivity({
            eventType: 'logger_initialized',
            eventCategory: 'system',
            action: 'initialize',
            title: 'Service de logging initialisé',
            description: 'Le service de logging ultra-complet est maintenant actif'
        });
    }

    // ========================================
    // UTILITAIRES
    // ========================================

    private generateSessionId(): string {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    private generateCorrelationId(): string {
        return 'correlation_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    private getCurrentUserId(): string | null {
        const user = this.supabase.getCurrentUserSync();
        return user?.id || null;
    }

    private async getUserIP(): Promise<string> {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    }

    private async getDeviceInfo(): Promise<any> {
        const ua = navigator.userAgent;
        return {
            isMobile: /Mobi|Android/i.test(ua),
            browser: this.getBrowserName(ua),
            os: this.getOSName(ua),
            screen: `${screen.width}x${screen.height}`,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            cookieEnabled: navigator.cookieEnabled,
            onLine: navigator.onLine
        };
    }

    private getBrowserName(ua: string): string {
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Edge')) return 'Edge';
        return 'Unknown';
    }

    private getOSName(ua: string): string {
        if (ua.includes('Windows')) return 'Windows';
        if (ua.includes('Mac')) return 'macOS';
        if (ua.includes('Linux')) return 'Linux';
        if (ua.includes('Android')) return 'Android';
        if (ua.includes('iOS')) return 'iOS';
        return 'Unknown';
    }

    // ========================================
    // MÉTHODES PUBLIQUES POUR L'UI
    // ========================================

    public setCorrelationId(id: string): void {
        this.correlationId = id;
    }

    public clearCorrelationId(): void {
        this.correlationId = null;
    }

    public getRecentLogs(limit: number = 50): LogEntry[] {
        return this.logsSubject.value.slice(0, limit);
    }

    public clearLocalLogs(): void {
        this.logsSubject.next([]);
    }

    public exportLogs(): string {
        return JSON.stringify(this.logsSubject.value, null, 2);
    }
}
