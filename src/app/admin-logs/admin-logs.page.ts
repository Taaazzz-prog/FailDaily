// ========================================
// COMPOSANT D'ADMINISTRATION DES LOGS FAILDAILY
// ========================================
// Interface ultra-complète pour visualiser, filtrer et analyser tous les logs

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ComprehensiveLoggerService, LogEntry, UsageMetrics } from '../services/comprehensive-logger.service';
import { LoggingIntegratorService } from '../services/logging-integrator.service';
import { Subscription, interval } from 'rxjs';

interface LogFilter {
    category?: string;
    level?: string;
    userId?: string;
    dateFrom?: Date;
    dateTo?: Date;
    searchText?: string;
    successOnly?: boolean;
    errorOnly?: boolean;
}

@Component({
    selector: 'app-admin-logs',
    templateUrl: './admin-logs.page.html',
    styleUrls: ['./admin-logs.page.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminLogsPage implements OnInit, OnDestroy {

    // Données des logs
    logs: LogEntry[] = [];
    filteredLogs: LogEntry[] = [];
    realtimeLogs: LogEntry[] = [];
    userMetrics: UsageMetrics[] = [];

    // État de l'interface
    selectedLog: LogEntry | null = null;
    isLoadingLogs = false;
    isRealTimeEnabled = true;
    autoRefreshInterval = 5000; // 5 secondes

    // Filtres
    activeFilters: LogFilter = {};
    availableCategories = ['auth', 'profile', 'fail', 'reaction', 'badge', 'navigation', 'admin', 'system', 'security'];
    availableLevels = ['debug', 'info', 'warning', 'error', 'critical'];

    // Statistiques
    logStats = {
        total: 0,
        successful: 0,
        failed: 0,
        byCategory: {} as any,
        byHour: {} as any,
        topUsers: [] as any[],
        topActions: [] as any[]
    };

    // Vues disponibles
    currentView: 'logs' | 'stats' | 'metrics' | 'realtime' | 'users' = 'logs';

    private subscriptions: Subscription[] = [];

    constructor(
        private logger: ComprehensiveLoggerService,
        private integrator: LoggingIntegratorService
    ) { }

    async ngOnInit() {
        await this.loadInitialData();
        this.setupRealtimeUpdates();
        this.setupAutoRefresh();

        // Activer le monitoring automatique
        this.integrator.startAutomaticMonitoring();
    }

    ngOnDestroy() {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    // ========================================
    // CHARGEMENT DES DONNÉES
    // ========================================

    async loadInitialData() {
        this.isLoadingLogs = true;
        try {
            // Charger les logs récents
            await this.loadLogs();

            // Charger les métriques utilisateur
            await this.loadUserMetrics();

            // Calculer les statistiques
            this.calculateStatistics();

        } catch (error) {
            console.error('Erreur lors du chargement initial:', error);
            await this.logger.logError(error as Error, 'admin_logs_init');
        } finally {
            this.isLoadingLogs = false;
        }
    }

    async loadLogs(limit: number = 500) {
        try {
            // Charger depuis la base de données
            const dbLogs = await this.searchLogs();

            // Combiner avec les logs temps réel
            this.logs = [...this.realtimeLogs, ...dbLogs].slice(0, limit);

            this.applyFilters();
            this.calculateStatistics();

        } catch (error) {
            console.error('Erreur lors du chargement des logs:', error);
        }
    }

    async searchLogs(): Promise<LogEntry[]> {
        const query = this.activeFilters.searchText || '';
        const category = this.activeFilters.category;
        const startDate = this.activeFilters.dateFrom;
        const endDate = this.activeFilters.dateTo;

        return await this.logger.searchLogs(query, category, startDate, endDate);
    }

    async loadUserMetrics() {
        try {
            this.userMetrics = await this.logger.getUsageMetrics();
        } catch (error) {
            console.error('Erreur lors du chargement des métriques:', error);
        }
    }

    // ========================================
    // TEMPS RÉEL ET RAFRAÎCHISSEMENT
    // ========================================

    setupRealtimeUpdates() {
        // S'abonner aux logs temps réel
        const realtimeSub = this.logger.logs$.subscribe(logs => {
            this.realtimeLogs = logs;
            if (this.isRealTimeEnabled) {
                this.loadLogs();
            }
        });

        this.subscriptions.push(realtimeSub);
    }

    setupAutoRefresh() {
        if (this.autoRefreshInterval > 0) {
            const refreshSub = interval(this.autoRefreshInterval).subscribe(() => {
                if (this.isRealTimeEnabled) {
                    this.loadLogs();
                }
            });

            this.subscriptions.push(refreshSub);
        }
    }

    toggleRealTime() {
        this.isRealTimeEnabled = !this.isRealTimeEnabled;

        this.logger.logAdmin('toggle_realtime', 'Basculement du mode temps réel',
            undefined, { enabled: this.isRealTimeEnabled });
    }

    async forceRefresh() {
        await this.logger.logAdmin('force_refresh', 'Rafraîchissement forcé des logs');
        await this.loadInitialData();
    }

    // ========================================
    // FILTRAGE ET RECHERCHE
    // ========================================

    applyFilters() {
        let filtered = [...this.logs];

        // Filtre par catégorie
        if (this.activeFilters.category) {
            filtered = filtered.filter(log => log.eventCategory === this.activeFilters.category);
        }

        // Filtre par niveau
        if (this.activeFilters.level) {
            filtered = filtered.filter(log =>
                (log as any).event_level === this.activeFilters.level);
        }

        // Filtre par utilisateur
        if (this.activeFilters.userId) {
            filtered = filtered.filter(log => log.userId === this.activeFilters.userId);
        }

        // Filtre par texte
        if (this.activeFilters.searchText) {
            const searchLower = this.activeFilters.searchText.toLowerCase();
            filtered = filtered.filter(log =>
                log.title.toLowerCase().includes(searchLower) ||
                log.description?.toLowerCase().includes(searchLower) ||
                log.action.toLowerCase().includes(searchLower)
            );
        }

        // Filtre par succès/échec
        if (this.activeFilters.successOnly) {
            filtered = filtered.filter(log => log.success === true);
        }

        if (this.activeFilters.errorOnly) {
            filtered = filtered.filter(log => log.success === false);
        }

        // Filtre par date
        if (this.activeFilters.dateFrom) {
            filtered = filtered.filter(log => {
                const logDate = new Date((log as any).created_at || Date.now());
                return logDate >= this.activeFilters.dateFrom!;
            });
        }

        if (this.activeFilters.dateTo) {
            filtered = filtered.filter(log => {
                const logDate = new Date((log as any).created_at || Date.now());
                return logDate <= this.activeFilters.dateTo!;
            });
        }

        this.filteredLogs = filtered;
    }

    onFilterChange() {
        this.applyFilters();
    }

    clearFilters() {
        this.activeFilters = {};
        this.applyFilters();

        this.logger.logAdmin('clear_filters', 'Réinitialisation des filtres de logs');
    }

    // ========================================
    // STATISTIQUES ET ANALYTICS
    // ========================================

    calculateStatistics() {
        const logs = this.filteredLogs;

        this.logStats = {
            total: logs.length,
            successful: logs.filter(l => l.success === true).length,
            failed: logs.filter(l => l.success === false).length,
            byCategory: this.groupBy(logs, 'eventCategory'),
            byHour: this.groupByHour(logs),
            topUsers: this.getTopUsers(logs),
            topActions: this.getTopActions(logs)
        };
    }

    private groupBy(items: LogEntry[], key: keyof LogEntry): any {
        return items.reduce((groups, item) => {
            const group = (item[key] || 'unknown') as string;
            groups[group] = (groups[group] || 0) + 1;
            return groups;
        }, {} as any);
    }

    private groupByHour(logs: LogEntry[]): any {
        return logs.reduce((groups, log) => {
            const date = new Date((log as any).created_at || Date.now());
            const hour = date.getHours();
            groups[hour] = (groups[hour] || 0) + 1;
            return groups;
        }, {} as any);
    }

    private getTopUsers(logs: LogEntry[]): any[] {
        const userCounts = this.groupBy(logs.filter(l => l.userId), 'userId');
        return Object.entries(userCounts)
            .map(([userId, count]) => ({ userId, count }))
            .sort((a, b) => (b.count as number) - (a.count as number))
            .slice(0, 10);
    }

    private getTopActions(logs: LogEntry[]): any[] {
        const actionCounts = this.groupBy(logs, 'action');
        return Object.entries(actionCounts)
            .map(([action, count]) => ({ action, count }))
            .sort((a, b) => (b.count as number) - (a.count as number))
            .slice(0, 10);
    }

    // ========================================
    // ACTIONS ADMINISTRATIVES
    // ========================================

    selectLog(log: LogEntry) {
        this.selectedLog = log;

        this.logger.logAdmin('view_log_details', 'Consultation des détails d\'un log',
            undefined, { logId: log.id, eventType: log.eventType });
    }

    closeLogDetails() {
        this.selectedLog = null;
    }

    async exportLogs() {
        try {
            const exportData = {
                exportDate: new Date().toISOString(),
                totalLogs: this.filteredLogs.length,
                filters: this.activeFilters,
                statistics: this.logStats,
                logs: this.filteredLogs.map(log => ({
                    ...log,
                    // Masquer les données sensibles si nécessaire
                    payload: log.payload ? '***REDACTED***' : null
                }))
            };

            const blob = new Blob([JSON.stringify(exportData, null, 2)],
                { type: 'application/json' });

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `faildaily-logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            window.URL.revokeObjectURL(url);

            await this.logger.logAdmin('export_logs', 'Export des logs d\'activité',
                undefined, { logsCount: this.filteredLogs.length });

        } catch (error) {
            console.error('Erreur lors de l\'export:', error);
            await this.logger.logError(error as Error, 'export_logs');
        }
    }

    async clearLocalLogs() {
        if (confirm('Êtes-vous sûr de vouloir vider les logs locaux ?')) {
            this.logger.clearLocalLogs();
            await this.loadLogs();

            await this.logger.logAdmin('clear_local_logs', 'Vidage des logs locaux');
        }
    }

    async enableDebugMode() {
        this.integrator.enableDebugMode();

        await this.logger.logAdmin('enable_debug_mode', 'Activation du mode debug ultra-verbose');
    }

    async testLogging() {
        // Générer des logs de test
        await this.logger.logActivity({
            eventType: 'test_log',
            eventCategory: 'system',
            action: 'test',
            title: 'Log de test généré',
            description: 'Ceci est un log de test pour vérifier le système'
        });

        await this.logger.logError(new Error('Erreur de test'), 'admin_test', {
            isTest: true,
            timestamp: new Date()
        });

        await this.logger.logSecurity('test_security', 'Test de sécurité', {
            isTest: true
        });
    }

    // ========================================
    // NAVIGATION ET INTERFACE
    // ========================================

    switchView(view: typeof this.currentView) {
        this.currentView = view;

        this.logger.logAdmin('switch_view', `Basculement vers la vue ${view}`,
            undefined, { previousView: this.currentView, newView: view });
    }

    formatDate(date: string | Date): string {
        return new Date(date).toLocaleString('fr-FR');
    }

    formatDuration(ms?: number): string {
        if (!ms) return 'N/A';
        return `${ms}ms`;
    }

    getLogIcon(log: LogEntry): string {
        const icons = {
            auth: '👤',
            profile: '📝',
            fail: '❌',
            reaction: '👍',
            badge: '🏆',
            navigation: '🧭',
            admin: '⚙️',
            system: '🔧',
            security: '🔒'
        };
        return icons[log.eventCategory] || '📋';
    }

    getLogColor(log: LogEntry): string {
        if (log.success === false) return 'danger';
        if (log.eventCategory === 'security') return 'warning';
        if (log.eventCategory === 'admin') return 'primary';
        return 'medium';
    }

    // ========================================
    // HELPERS POUR LE TEMPLATE
    // ========================================

    get categoryOptions() {
        return this.availableCategories.map(cat => ({
            value: cat,
            label: cat.charAt(0).toUpperCase() + cat.slice(1)
        }));
    }

    get levelOptions() {
        return this.availableLevels.map(level => ({
            value: level,
            label: level.charAt(0).toUpperCase() + level.slice(1)
        }));
    }

    get statisticsEntries() {
        return Object.entries(this.logStats.byCategory).map(([category, count]) => ({
            category,
            count: count as number,
            percentage: Math.round((count as number) / this.logStats.total * 100)
        }));
    }

    trackByLogId(index: number, log: LogEntry): any {
        return log.id || index;
    }
}
