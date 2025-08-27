import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { DebugService } from '../../services/debug.service';
import { MysqlService } from '../../services/mysql.service';
import { ComprehensiveLoggerService } from '../../services/comprehensive-logger.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController } from '@ionic/angular';
import { interval, Subscription } from 'rxjs';

@Component({
    selector: 'app-admin',
    templateUrl: './admin.page.html',
    styleUrls: ['./admin.page.scss'],
    standalone: true,
    imports: [CommonModule, FormsModule, IonicModule]
})
export class AdminPage implements OnInit, OnDestroy {
    selectedSegment = 'dashboard';
    loading = false;

    // Dashboard data
    dashboardStats: any = {
        totalUsers: 0,
        totalFails: 0,
        totalReactions: 0,
        todayActivity: 0,
        systemStatus: 'healthy'
    };

    // Points configuration
    pointsConfig: any = {
        createFailPoints: 5,
        courageReactionPoints: 2,
        laughReactionPoints: 1,
        empathyReactionPoints: 2,
        supportReactionPoints: 3,
        dailyBonusPoints: 10
    };

    // Logs Admin (nouvelles vues)
    isLoadingLogs = false;
    logDays = 7;
    selectedLogTab: 'summary' | 'by-day' | 'by-user' | 'by-action' | 'list' = 'summary';
    logsSummary: any = { totals: {}, topActions: [] };
    logsByDay: any[] = [];
    logsByUser: any[] = [];
    logsActions: any[] = [];
    logsList: any[] = [];
    logsListPagination = { limit: 200, offset: 0, count: 0 };
    logsListFilters: { level?: string; action?: string; userId?: string; start?: string; end?: string } = {
        level: '', action: '', userId: '', start: '', end: ''
    };
    // Compat héritée pour le template existant
    isRealTimeLogsEnabled: boolean = false;
    logFilters: any = { activityType: '', level: '', period: '24h', userId: '' };
    logsStats: any = { totalToday: 0, errorsToday: 0, activeUsers: 0, avgResponseTime: 0 };
    comprehensiveLogs: any[] = [];
    selectedLogForDetails: any = null;
    logsPage: number = 0;

    // User management
    allUsers: any[] = [];
    selectedUser: any = null;
    userEditForm: any = {};
    showReactionsModal = false;
    showFailsModal = false;
    userReactions: any[] = [];
    userFails: any[] = [];
    userReactionsCount = 0;
    userFailsCount = 0;

    // Database analysis results
    databaseAnalysis: any = null;
    showAnalysisResults = false;

    // Detailed fail analysis
    failAnalysisDetails: any = null;
    showFailAnalysisModal = false;

    // Real-time data
    realTimeEvents: any[] = [];
    activeUsersList: any[] = [];
    realTimeStats: any = {
        activeUsers: 0,
        eventsLastHour: 0,
        systemLoad: 'Normal'
    };
    autoRefreshEnabled = false;
    lastRealTimeUpdate: Date = new Date();
    systemAlerts: any[] = [];

    // Database management
    truncateResults: Array<{ table: string, success: boolean, message: string }> = [];

    // Badge management
    showBadgeManagementModal = false;
    badgeDefinitions: any[] = [];
    duplicateBadges: any[] = [];
    newBadge: any = {
        name: '',
        description: '',
        icon: '',
        category: '',
        rarity: '',
        requirement_type: '',
        requirement_value: null
    };

    private autoRefreshSubscription?: Subscription;

    constructor(
        private adminService: AdminService,
        private debugService: DebugService,
        private MysqlService: MysqlService,
        private comprehensiveLoggerService: ComprehensiveLoggerService,
        private alertController: AlertController,
        private toastController: ToastController,
        private cdr: ChangeDetectorRef
    ) { }

    async ngOnInit() {
        await this.loadDashboardData();
        await this.loadPointsConfiguration();
        await this.loadAllUsers();
    }

    ngOnDestroy() {
        this.stopAutoRefresh();
    }

    async onSegmentChanged(event: any) {
        this.selectedSegment = event.detail.value;

        switch (this.selectedSegment) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'config':
                await this.loadPointsConfiguration();
                break;
            case 'users':
                await this.loadAllUsers();
                break;
            case 'logs':
                await this.loadAdminLogsAll();
                break;
            case 'realtime':
                await this.loadRealTimeData();
                break;
        }
    }

    async refresh(event?: any) {
        await this.loadDashboardData();
        await this.loadPointsConfiguration();
        await this.loadAllUsers();
        if (this.selectedSegment === 'logs') {
            await this.loadAdminLogsAll();
        }
        if (this.selectedSegment === 'realtime') {
            await this.loadRealTimeData();
        }
        if (event) {
            event.target.complete();
        }
    }

    // ===== DASHBOARD METHODS =====
    async loadDashboardData() {
        this.loading = true;
        try {
            this.dashboardStats = await this.adminService.getDashboardStats();
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
        this.loading = false;
    }

    async analyzeDatabase() {
        this.loading = true;
        this.showAnalysisResults = false;
        try {
            const analysis = await this.adminService.analyzeDatabaseIntegrity();
            this.databaseAnalysis = analysis;
            this.showAnalysisResults = true;

            const toast = await this.toastController.create({
                message: analysis.error ?
                    `Erreur lors de l'analyse: ${analysis.errorMessage}` :
                    `Analyse terminée: ${analysis.totalIssues || 0} problèmes détectés`,
                duration: 4000,
                color: analysis.error ? 'danger' : (analysis.totalIssues > 0 ? 'warning' : 'success'),
                buttons: [
                    {
                        text: 'Voir détails',
                        handler: () => {
                            this.showAnalysisResults = true;
                        }
                    },
                    {
                        text: 'OK',
                        role: 'cancel'
                    }
                ]
            });
            toast.present();
        } catch (error) {
            console.error('Error analyzing database:', error);
            const errorToast = await this.toastController.create({
                message: `Erreur lors de l'analyse: ${error}`,
                duration: 5000,
                color: 'danger'
            });
            errorToast.present();
        }
        this.loading = false;
    }

    getStatusColor(status: string): string {
        switch (status) {
            case 'healthy': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'danger';
            default: return 'medium';
        }
    }

    // Méthodes pour l'analyse de la base de données
    closeAnalysisResults() {
        this.showAnalysisResults = false;
        this.databaseAnalysis = null;
    }

    getAnalysisStatusColor(): string {
        if (!this.databaseAnalysis) return 'medium';
        if (this.databaseAnalysis.error) return 'danger';
        return this.databaseAnalysis.totalIssues > 0 ? 'warning' : 'success';
    }

    getAnalysisStatusText(): string {
        if (!this.databaseAnalysis) return 'Non analysé';
        if (this.databaseAnalysis.error) return 'Erreur';
        return this.databaseAnalysis.totalIssues > 0 ? 'Problèmes détectés' : 'Base saine';
    }

    // ===== MÉTHODES POUR ANALYSER LES FAILS PROBLÉMATIQUES =====
    async analyzeProblematicFail(fail: any) {
        this.loading = true;
        try {
            const analysis = await this.adminService.analyzeSpecificFail(fail.id);
            this.failAnalysisDetails = analysis;
            this.showFailAnalysisModal = true;
        } catch (error) {
            console.error('Error analyzing fail:', error);
            const toast = await this.toastController.create({
                message: `Erreur lors de l'analyse: ${error}`,
                duration: 3000,
                color: 'danger'
            });
            toast.present();
        }
        this.loading = false;
    }

    closeFailAnalysisModal() {
        this.showFailAnalysisModal = false;
        this.failAnalysisDetails = null;
    }

    async fixFromAnalysisModal() {
        if (!this.failAnalysisDetails) return;

        await this.fixProblematicFail({
            id: this.failAnalysisDetails.id,
            title: this.failAnalysisDetails.title
        });

        this.closeFailAnalysisModal();
    }

    // Méthodes utilitaires pour l'affichage des réactions
    getUsersForReactionType(reactionType: string): string {
        if (!this.failAnalysisDetails?.reactionDetails?.[reactionType]) return '';
        return this.failAnalysisDetails.reactionDetails[reactionType]
            .map((r: any) => r.user)
            .join(', ');
    } async fixProblematicFail(fail: any) {
        this.loading = true;
        try {
            const result = await this.adminService.fixFailReactionCounts(fail.id);

            const toast = await this.toastController.create({
                message: `Fail "${fail.title}" corrigé! Compteurs mis à jour.`,
                duration: 3000,
                color: 'success'
            });
            toast.present();

            // Relancer l'analyse pour voir les changements
            setTimeout(() => {
                this.analyzeDatabase();
            }, 1000);
        } catch (error) {
            console.error('Error fixing fail:', error);
            const toast = await this.toastController.create({
                message: `Erreur lors de la correction: ${error}`,
                duration: 3000,
                color: 'danger'
            });
            toast.present();
        }
        this.loading = false;
    }

    async fixAllProblematicFails() {
        if (!this.databaseAnalysis?.integrityIssues?.problematicFails?.length) return;

        const alert = await this.alertController.create({
            header: 'Corriger tous les fails problématiques',
            message: `Voulez-vous corriger automatiquement tous les ${this.databaseAnalysis.integrityIssues.problematicFails.length} fails problématiques? Cette action recalculera les compteurs basés sur les réactions réelles.`,
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Corriger tout',
                    handler: async () => {
                        this.loading = true;
                        let fixed = 0;
                        let errors = 0;

                        for (const fail of this.databaseAnalysis.integrityIssues.problematicFails) {
                            try {
                                await this.adminService.fixFailReactionCounts(fail.id);
                                fixed++;
                            } catch (error) {
                                console.error(`Error fixing fail ${fail.id}:`, error);
                                errors++;
                            }
                        }

                        const toast = await this.toastController.create({
                            message: `Correction terminée! ${fixed} fails corrigés, ${errors} erreurs.`,
                            duration: 4000,
                            color: errors > 0 ? 'warning' : 'success'
                        });
                        toast.present();

                        this.loading = false;
                        // Relancer l'analyse
                        setTimeout(() => {
                            this.analyzeDatabase();
                        }, 1000);
                    }
                }
            ]
        });
        await alert.present();
    }

    // ===== POINTS CONFIGURATION =====
    async loadPointsConfiguration() {
        try {
            this.pointsConfig = await this.adminService.getPointsConfiguration();
        } catch (error) {
            console.error('Error loading points config:', error);
        }
    }

    async savePointsConfiguration() {
        try {
            await this.adminService.updatePointsConfiguration(this.pointsConfig);
            const toast = await this.toastController.create({
                message: 'Configuration sauvegardée avec succès!',
                duration: 2000,
                color: 'success'
            });
            toast.present();
        } catch (error) {
            console.error('Error saving points config:', error);
            const toast = await this.toastController.create({
                message: 'Erreur lors de la sauvegarde',
                duration: 2000,
                color: 'danger'
            });
            toast.present();
        }
    }

    async resetPointsConfiguration() {
        const alert = await this.alertController.create({
            header: 'Confirmer la réinitialisation',
            message: 'Voulez-vous vraiment réinitialiser la configuration des points?',
            buttons: [
                { text: 'Annuler', role: 'cancel' },
                {
                    text: 'Réinitialiser',
                    handler: () => {
                        this.pointsConfig = {
                            createFailPoints: 5,
                            courageReactionPoints: 2,
                            laughReactionPoints: 1,
                            empathyReactionPoints: 2,
                            supportReactionPoints: 3,
                            dailyBonusPoints: 10
                        };
                    }
                }
            ]
        });
        await alert.present();
    }

    // ===== LOGS ADMIN (nouvel affichage par onglets) =====
    async loadAdminLogsAll() {
        this.isLoadingLogs = true;
        try {
            const [summary, byDay, byUser, actions, list] = await Promise.all([
                this.adminService.getAdminLogsSummary(this.logDays),
                this.adminService.getAdminLogsByDay(this.logDays),
                this.adminService.getAdminLogsByUser(this.logDays),
                this.adminService.getAdminLogsActions(this.logDays),
                this.adminService.getAdminLogsList({
                    limit: this.logsListPagination.limit,
                    offset: this.logsListPagination.offset,
                    level: this.logsListFilters.level || undefined,
                    action: this.logsListFilters.action || undefined,
                    userId: this.logsListFilters.userId || undefined,
                    start: this.logsListFilters.start || undefined,
                    end: this.logsListFilters.end || undefined
                })
            ]);
            this.logsSummary = { totals: summary?.totals || {}, topActions: summary?.topActions || [] };
            this.logsByDay = byDay?.days || [];
            this.logsByUser = byUser?.users || [];
            this.logsActions = actions?.actions || [];
            this.logsList = list?.logs || [];
            this.logsListPagination = list?.pagination || this.logsListPagination;
            // Map vers les anciennes variables pour compat UI existante sans refonte massive
            // comprehensiveLogs (liste) et logsStats (cartes)
            (this as any).comprehensiveLogs = this.logsList;
            (this as any).logsStats = {
                totalToday: this.logsSummary?.totals?.total || 0,
                errorsToday: this.logsSummary?.totals?.errors || 0,
                activeUsers: this.logsByUser?.length || 0,
                avgResponseTime: 0
            };
        } catch (e) {
            console.error('❌ loadAdminLogsAll error:', e);
            this.logsSummary = { totals: {}, topActions: [] };
            this.logsByDay = [];
            this.logsByUser = [];
            this.logsActions = [];
            this.logsList = [];
        }
        this.isLoadingLogs = false;
    }

    async onLogTabChanged(ev?: any) {
        // Switch tabs without reloading unless needed
        if (ev && ev.detail && ev.detail.value) {
            this.selectedLogTab = ev.detail.value;
        }
        // Optionally could lazy-load specific tabs here
    }

    async onLogDaysChanged(days: number) {
        this.logDays = Math.max(1, days || 7);
        this.logsListPagination.offset = 0;
        await this.loadAdminLogsAll();
    }

    // (Note) loadMoreLogs hérité plus bas pour compat (utilise comprehensiveLogs)

    async applyAdminLogListFilters() {
        this.logsListPagination.offset = 0;
        const listRes = await this.adminService.getAdminLogsList({
            limit: this.logsListPagination.limit,
            offset: 0,
            level: this.logsListFilters.level || undefined,
            action: this.logsListFilters.action || undefined,
            userId: this.logsListFilters.userId || undefined,
            start: this.logsListFilters.start || undefined,
            end: this.logsListFilters.end || undefined
        });
        if (listRes?.success) {
            this.logsList = listRes.logs || [];
            this.logsListPagination = listRes.pagination || this.logsListPagination;
            (this as any).comprehensiveLogs = this.logsList;
        }
    }

    getLevelColor(level: string): string {
        const l = String(level || '').toLowerCase();
        if (l === 'error') return 'danger';
        if (l === 'warning') return 'warning';
        if (l === 'debug') return 'medium';
        return 'primary';
    }

    getActionIcon(action?: string): string {
        const a = String(action || '').toLowerCase();
        if (a.startsWith('user_')) return 'key-outline'; // register/login/logout/password
        if (a.startsWith('fail_')) return 'document-text-outline';
        if (a.startsWith('comment_')) return 'chatbubbles-outline';
        if (a.startsWith('reaction_')) return 'happy-outline';
        if (a.startsWith('moderation')) return 'shield-checkmark-outline';
        if (a.includes('security') || a.includes('token')) return 'alert-circle-outline';
        return 'information-circle-outline';
    }

    getActionColor(action?: string): string {
        const a = String(action || '').toLowerCase();
        if (a.startsWith('user_')) return 'primary';
        if (a.startsWith('fail_')) return 'tertiary';
        if (a.startsWith('comment_')) return 'success';
        if (a.startsWith('reaction_')) return 'warning';
        if (a.startsWith('moderation')) return 'medium';
        if (a.includes('security') || a.includes('token')) return 'danger';
        return 'medium';
    }

    // Helpers requis par le template (compat)
    toggleRealTimeLogsLegacy() {
        this.isRealTimeLogsEnabled = !this.isRealTimeLogsEnabled;
    }
    getLogIcon(level: string): string {
        const l = String(level || '').toLowerCase();
        if (l === 'error') return 'close-circle-outline';
        if (l === 'warning') return 'warning-outline';
        if (l === 'debug') return 'bug-outline';
        return 'information-circle-outline';
    }
    getLogColor(level: string): string { return this.getLevelColor(level); }
    formatTimestamp(ts: any): string { try { return new Date(ts).toLocaleString(); } catch { return String(ts || ''); } }
    getTimeAgo(ts: any): string {
        try { const d = new Date(ts).getTime(); const diff = Math.max(0, Date.now() - d); const m = Math.floor(diff/60000); if (m<60) return `${m} min`; const h = Math.floor(m/60); if (h<24) return `${h} h`; const days = Math.floor(h/24); return `${days} j`; } catch {} return '';
    }

    // Toast helpers
    async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' = 'primary') {
        try {
            const toast = await this.toastController.create({ message, duration: 2500, color });
            await toast.present();
        } catch {}
    }
    showErrorToast(msg: string) { this.showToast(msg, 'danger'); }
    showSuccessToast(msg: string) { this.showToast(msg, 'success'); }
    showInfoToast(msg: string) { this.showToast(msg, 'primary'); }

    // Actions UI héritées (no-op ou ponts)
    viewLogDetails(log: any) {
        this.selectedLogForDetails = log;
    }
    viewUserLogs(userId: string) {
        this.logsListFilters.userId = userId;
        this.applyAdminLogListFilters();
    }
    async exportComprehensiveLogs() {
        try {
            const rows = this.comprehensiveLogs || [];
            const header = ['id','level','action','message','user','created_at'];
            const lines = [header.join(',')].concat(rows.map((r: any) => [
                r.id,
                r.level || '',
                r.action || '',
                (r.message || r.description || '').toString().replace(/[\n\r,]/g,' '),
                r.display_name || r.user_name || r.user_email || '',
                (r.created_at || r.timestamp || '')
            ].join(',')));
            const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = 'logs.csv'; a.click(); URL.revokeObjectURL(url);
        } catch {}
    }
    async refreshComprehensiveLogs() {
        await this.loadAdminLogsAll();
    }

    /**
     * Convertit la période en heures pour l'API
     */
    private getPeriodInHours(period: string): number {
        switch (period) {
            case '1h': return 1;
            case '24h': return 24;
            case '7d': return 24 * 7;
            case '30d': return 24 * 30;
            default: return 24;
        }
    }

    /**
     * Applique les filtres avancés
     */
    async applyLogFilters() {
        this.logsPage = 0; // Reset pagination
        await this.loadComprehensiveLogs();
    }

    /**
     * Construit l'objet filtres pour PostgreSQL
     */
    private buildLogFilters() {
        const filters: any = {};
        
        if (this.logFilters.activityType) {
            filters.activity_type = this.logFilters.activityType;
        }
        
        if (this.logFilters.level) {
            filters.level = this.logFilters.level;
        }
        
        if (this.logFilters.userId) {
            filters.user_id = this.logFilters.userId;
        }
        
        // Gestion des périodes
        const now = new Date();
        switch (this.logFilters.period) {
            case '1h':
                filters.start_date = new Date(now.getTime() - 60 * 60 * 1000);
                break;
            case '24h':
                filters.start_date = new Date(now.getTime() - 24 * 60 * 60 * 1000);
                break;
            case '7d':
                filters.start_date = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                filters.start_date = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                break;
        }
        
        filters.end_date = now;
        
        return filters;
    }

    /**
     * Active/désactive les logs temps réel
     */
    toggleRealTimeLogs() {
        this.isRealTimeLogsEnabled = !this.isRealTimeLogsEnabled;
        
        if (this.isRealTimeLogsEnabled) {
            this.startRealTimeLogs();
        } else {
            this.stopRealTimeLogs();
        }
    }

    private realTimeLogsSubscription?: Subscription;

    private startRealTimeLogsLegacy() {
        console.log('🔴 Activation logs temps réel');
        
        // Rafraîchissement toutes les 10 secondes
        this.realTimeLogsSubscription = interval(10000).subscribe(async () => {
            await this.loadComprehensiveLogs();
            await this.loadLogsStatistics();
        });
        
        this.showSuccessToast('Logs temps réel activés');
    }

    private stopRealTimeLogsLegacy() {
        console.log('⏹️ Arrêt logs temps réel');
        
        if (this.realTimeLogsSubscription) {
            this.realTimeLogsSubscription.unsubscribe();
            this.realTimeLogsSubscription = undefined;
        }
        
        this.showInfoToast('Logs temps réel désactivés');
    }

    /**
     * Charge plus de logs (pagination)
     */
    async loadMoreLogsLegacy() {
        if (this.isLoadingLogs) return;
        
        this.logsPage++;
        const currentCount = this.comprehensiveLogs.length;
        
        await this.loadComprehensiveLogs();
        
        // Si aucun nouveau log, on remet la page précédente
        if (this.comprehensiveLogs.length === currentCount) {
            this.logsPage = Math.max(0, this.logsPage - 1);
        }
    }

    /**
     * Rafraîchit les logs
     */
    async refreshComprehensiveLogsLegacy() {
        this.logsPage = 0;
        await this.loadComprehensiveLogs();
        await this.loadLogsStatistics();
        this.showSuccessToast('Logs rafraîchis');
    }

    /**
     * Exporte les logs complets
     */
    async exportComprehensiveLogsLegacy() {
        try {
            // Utilisation de la vraie signature (3 paramètres)
            const allLogs = await this.MysqlService.getActivityLogsByType(
                'all',
                24 * 30, // 30 jours en heures
                1000
            );
            
            const dataStr = JSON.stringify(allLogs, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `comprehensive-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            this.showSuccessToast('Logs exportés avec succès!');
        } catch (error) {
            console.error('❌ Erreur export logs:', error);
            this.showErrorToast('Erreur lors de l\'export');
        }
    }

    /**
     * Affiche les détails d'un log
     */
    async viewLogDetailsLegacy(log: any) {
        this.selectedLogForDetails = log;
    }

    /**
     * Ferme les détails du log
     */
    closeLogDetails() {
        this.selectedLogForDetails = null;
    }

    /**
     * Formate les métadonnées pour l'affichage
     */
    formatMetadata(metadata: any): string {
        try {
            return JSON.stringify(metadata, null, 2);
        } catch (error) {
            return String(metadata);
        }
    }

    /**
     * Retourne l'icône selon le type d'activité
     */
    getLogActivityIcon(activityType: string): string {
        switch (activityType?.toLowerCase()) {
            case 'auth':
                return 'key-outline';
            case 'user_action':
                return 'hand-left-outline';
            case 'admin':
                return 'shield-outline';
            case 'security':
                return 'alert-outline';
            case 'error':
                return 'bug-outline';
            case 'performance':
                return 'speedometer-outline';
            default:
                return 'information-outline';
        }
    }

    /**
     * Affiche l'historique complet d'un utilisateur
     */
    async viewUserLogsLegacy(userId: string) {
        try {
            // Pour l'instant, utilisons les logs généraux filtrés par utilisateur
            const userLogs = await this.MysqlService.getActivityLogsByType('all', 24 * 7, 100);
            const filteredUserLogs = userLogs.filter((log: any) => log.user_id === userId);
            
            const alert = await this.alertController.create({
                header: `Historique Utilisateur`,
                message: `
                    <div style="text-align: left; max-height: 400px; overflow-y: auto;">
                        ${filteredUserLogs.map((log: any) => `
                            <div style="border-bottom: 1px solid #ccc; padding: 5px 0;">
                                <strong>${log.activity_type}</strong> - ${log.level}<br>
                                ${log.description}<br>
                                <small>${new Date(log.created_at).toLocaleString()}</small>
                            </div>
                        `).join('')}
                    </div>
                `,
                buttons: ['Fermer']
            });
            await alert.present();
        } catch (error) {
            console.error('❌ Erreur historique utilisateur:', error);
            this.showErrorToast('Erreur lors du chargement de l\'historique');
        }
    }

    /**
     * Retourne la couleur selon le niveau de log
     */
    getLogLevelColorLegacy(level: string): string {
        switch (level?.toLowerCase()) {
            case 'critical':
            case 'error':
                return 'danger';
            case 'warning':
                return 'warning';
            case 'info':
                return 'primary';
            default:
                return 'medium';
        }
    }

    // Méthodes utilitaires pour les toasts
    private async showSuccessToastLegacy(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            color: 'success'
        });
        toast.present();
    }

    private async showErrorToastLegacy(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 3000,
            color: 'danger'
        });
        toast.present();
    }

    private async showInfoToastLegacy(message: string) {
        const toast = await this.toastController.create({
            message,
            duration: 2000,
            color: 'medium'
        });
        toast.present();
    }

    // ===== USER MANAGEMENT =====
    async loadAllUsers() {
        try {
            this.allUsers = await this.adminService.getAllUsers();
        } catch (error) {
            console.error('Error loading users:', error);
            this.allUsers = [];
        }
    }

    showUserActions(user: any) {
        this.selectedUser = user;
        this.userEditForm = {
            display_name: user.display_name || user.username,
            role: user.role || 'user',
            points: user.points || 0,
            reason: ''
        };
        this.loadUserData();
    }

    hideUserActions() {
        this.selectedUser = null;
        this.userEditForm = {};
        this.showReactionsModal = false;
        this.showFailsModal = false;
    }

    async loadUserData() {
        if (!this.selectedUser) return;

        try {
            // Charger les réactions et fails de l'utilisateur
            // Ces méthodes devront être ajoutées au service
            this.userReactionsCount = 0; // À implémenter
            this.userFailsCount = 0; // À implémenter
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    async updateUserAccount() {
        if (!this.selectedUser || !this.userEditForm.reason.trim()) {
            const toast = await this.toastController.create({
                message: 'Veuillez remplir la raison de la modification',
                duration: 2000,
                color: 'warning'
            });
            toast.present();
            return;
        }

        const alert = await this.alertController.create({
            header: 'Confirmer la modification',
            message: `Modifier le compte de ${this.selectedUser.display_name || this.selectedUser.username}?`,
            buttons: [
                { text: 'Annuler', role: 'cancel' },
                {
                    text: 'Confirmer',
                    handler: async () => {
                        try {
                            const updates = {
                                display_name: this.userEditForm.display_name,
                                role: this.userEditForm.role,
                                points: this.userEditForm.points
                            };

                            await this.adminService.updateUserAccount(
                                this.selectedUser.id,
                                updates,
                                this.userEditForm.reason
                            );

                            const toast = await this.toastController.create({
                                message: 'Compte modifié avec succès!',
                                duration: 2000,
                                color: 'success'
                            });
                            toast.present();

                            await this.loadAllUsers();
                            this.hideUserActions();
                        } catch (error) {
                            console.error('Error updating user account:', error);
                            const toast = await this.toastController.create({
                                message: 'Erreur lors de la modification',
                                duration: 2000,
                                color: 'danger'
                            });
                            toast.present();
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    showUserReactions() {
        this.showReactionsModal = true;
        // Charger les réactions de l'utilisateur
    }

    showUserFails() {
        this.showFailsModal = true;
        // Charger les fails de l'utilisateur
    }

    async deleteReactionConfirm(reaction: any) {
        const alert = await this.alertController.create({
            header: 'Supprimer la réaction',
            message: 'Êtes-vous sûr de vouloir supprimer cette réaction?',
            inputs: [
                {
                    name: 'reason',
                    type: 'text',
                    placeholder: 'Raison de la suppression...'
                }
            ],
            buttons: [
                { text: 'Annuler', role: 'cancel' },
                {
                    text: 'Supprimer',
                    handler: async (data) => {
                        try {
                            await this.adminService.deleteUserReaction(reaction.id, data.reason);
                            const toast = await this.toastController.create({
                                message: 'Réaction supprimée',
                                duration: 2000,
                                color: 'success'
                            });
                            toast.present();
                            this.showUserReactions(); // Recharger
                        } catch (error) {
                            console.error('Error deleting reaction:', error);
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    async deleteFailConfirm(fail: any) {
        const alert = await this.alertController.create({
            header: 'Supprimer le fail',
            message: 'Êtes-vous sûr de vouloir supprimer ce fail?',
            inputs: [
                {
                    name: 'reason',
                    type: 'text',
                    placeholder: 'Raison de la suppression...'
                }
            ],
            buttons: [
                { text: 'Annuler', role: 'cancel' },
                {
                    text: 'Supprimer',
                    handler: async (data) => {
                        try {
                            await this.adminService.deleteUserFail(fail.id, data.reason);
                            const toast = await this.toastController.create({
                                message: 'Fail supprimé',
                                duration: 2000,
                                color: 'success'
                            });
                            toast.present();
                            this.showUserFails(); // Recharger
                        } catch (error) {
                            console.error('Error deleting fail:', error);
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    // ===== REAL-TIME METHODS =====
    async loadRealTimeData() {
        try {
            const realTimeData = await this.adminService.getRealTimeEvents();
            this.realTimeEvents = realTimeData.events || [];
            this.activeUsersList = realTimeData.activeUsers || [];
            this.lastRealTimeUpdate = new Date();

            // Statistiques temps réel améliorées
            this.realTimeStats.eventsLastHour = realTimeData.eventCount || 0;
            this.realTimeStats.activeUsers = realTimeData.activeUsersCount || 0;

            console.log('🔴 Real-time data loaded:', {
                events: this.realTimeEvents.length,
                activeUsers: this.realTimeStats.activeUsers,
                eventsLastHour: this.realTimeStats.eventsLastHour,
                realTimeStatsObject: this.realTimeStats,
                activeUsersList: this.activeUsersList
            });

            // Force Angular change detection
            this.cdr.detectChanges();

        } catch (error) {
            console.error('Error loading real-time data:', error);
        }
    }

    async loadComprehensiveLogs() {
        await this.loadAdminLogsAll();
    }
    async loadLogsStatistics() {
        // derive from summary
        this.logsStats = {
            totalToday: this.logsSummary?.totals?.total || 0,
            errorsToday: this.logsSummary?.totals?.errors || 0,
            activeUsers: (this.logsByUser || []).length,
            avgResponseTime: 0
        };
    }

    toggleAutoRefresh() {
        if (this.autoRefreshEnabled) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }
    }

    private startAutoRefresh() {
        this.autoRefreshSubscription = interval(5000).subscribe(() => {
            if (this.selectedSegment === 'realtime') {
                this.loadRealTimeData();
            }
        });
    }

    private stopAutoRefresh() {
        if (this.autoRefreshSubscription) {
            this.autoRefreshSubscription.unsubscribe();
        }
    }

    // ===== UTILITY METHODS =====
    formatTimestampLegacy(timestamp: string | Date): string {
        if (!timestamp) return 'Date inconnue';
        const date = new Date(timestamp);
        return date.toLocaleString('fr-FR');
    }

    getTimeAgoLegacy(timestamp: string | Date): string {
        if (!timestamp) return '';
        const now = new Date();
        const past = new Date(timestamp);
        const diffMs = now.getTime() - past.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));

        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins} min`;
        if (diffMins < 1440) return `Il y a ${Math.floor(diffMins / 60)} h`;
        return `Il y a ${Math.floor(diffMins / 1440)} j`;
    }

    getReactionIcon(reactionType: string): string {
        const icons: { [key: string]: string } = {
            courage: 'shield-checkmark',
            laugh: 'happy',
            empathy: 'heart',
            support: 'hand-right'
        };
        return icons[reactionType] || 'heart';
    }

    getEventIcon(category: string): string {
        const icons: { [key: string]: string } = {
            'Comptes': 'person-add',
            'Fails': 'warning',
            'Réactions': 'heart',
            'Connexions': 'log-in',
            'Admin': 'settings',
            'Système': 'cog'
        };
        return icons[category] || 'information-circle';
    }

    getEventColor(level: string): string {
        const colors: { [key: string]: string } = {
            'error': 'danger',
            'warning': 'warning',
            'info': 'primary',
            'debug': 'medium'
        };
        return colors[level] || 'primary';
    }

    // ====== DATABASE MANAGEMENT METHODS ======

    private async showToast(message: string, color: string = 'primary') {
        const toast = await this.toastController.create({
            message: message,
            duration: 3000,
            position: 'bottom',
            color: color,
            buttons: [
                {
                    text: 'OK',
                    role: 'cancel'
                }
            ]
        });
        await toast.present();
    }

    async truncateTable(tableName: string) {
        const alert = await this.alertController.create({
            header: '⚠️ Confirmation',
            message: `Êtes-vous sûr de vouloir vider complètement la table "${tableName}" ? Cette action est irréversible !`,
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Vider la table',
                    role: 'destructive',
                    handler: () => {
                        this.performTruncate(tableName, false);
                    }
                }
            ]
        });

        await alert.present();
    }

    async truncateAuthTable(tableName: string) {
        const alert = await this.alertController.create({
            header: '🔥 DANGER - CONFIRMATION DOUBLE',
            message: `ATTENTION ! Vous allez vider la table "${tableName}" qui contient les données d'authentification ! Cela va supprimer TOUS les utilisateurs ! Tapez "DELETE" pour confirmer :`,
            inputs: [
                {
                    name: 'confirmation',
                    type: 'text',
                    placeholder: 'Tapez DELETE pour confirmer'
                }
            ],
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'SUPPRIMER TOUT',
                    role: 'destructive',
                    handler: (data) => {
                        if (data.confirmation === 'DELETE') {
                            this.performTruncate(tableName, true);
                        } else {
                            this.showToast('Confirmation incorrecte. Action annulée.', 'warning');
                        }
                    }
                }
            ]
        });

        await alert.present();
    }

    async truncateAllAppTables() {
        const alert = await this.alertController.create({
            header: '💥 Confirmation - Toutes les tables APP',
            message: 'Voulez-vous vider TOUTES les tables de l\'application FailDaily (15 tables) ?',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Vider toutes les tables APP',
                    role: 'destructive',
                    handler: () => {
                        const appTables = [
                            'fails', 'reactions', 'profiles', 'comments', 'badges', 'user_badges',
                            'system_logs', 'activity_logs', 'reaction_logs', 'user_activities',
                            'user_management_logs', 'user_preferences', 'app_config'
                        ];
                        this.performBulkTruncate(appTables, false);
                    }
                }
            ]
        });

        await alert.present();
    }

    async truncateAllAuthTables() {
        const alert = await this.alertController.create({
            header: '🔥 DANGER - Toutes les tables AUTH',
            message: 'ATTENTION ! Cela va supprimer TOUS les utilisateurs et sessions ! Tapez "DELETE ALL" pour confirmer :',
            inputs: [
                {
                    name: 'confirmation',
                    type: 'text',
                    placeholder: 'Tapez DELETE ALL pour confirmer'
                }
            ],
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'TOUT SUPPRIMER',
                    role: 'destructive',
                    handler: (data) => {
                        if (data.confirmation === 'DELETE ALL') {
                            this.performBulkTruncate(['auth.users', 'auth.identities', 'auth.sessions', 'auth.refresh_tokens'], true);
                        } else {
                            this.showToast('Confirmation incorrecte. Action annulée.', 'warning');
                        }
                    }
                }
            ]
        });

        await alert.present();
    }

    async truncateEverything() {
        const alert = await this.alertController.create({
            header: '💀 RESET COMPLET DE LA BASE',
            message: 'DERNIÈRE CHANCE ! Cela va supprimer TOUTES les données utilisateur, fails, commentaires, logs, etc. Les définitions de badges seront PRÉSERVÉES. Tapez "RESET ALL DATA" pour confirmer :',
            inputs: [
                {
                    name: 'confirmation',
                    type: 'text',
                    placeholder: 'Tapez RESET ALL DATA pour confirmer'
                }
            ],
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: '💀 RESET COMPLET',
                    role: 'destructive',
                    handler: (data) => {
                        if (data.confirmation === 'RESET ALL DATA') {
                            this.performCompleteReset();
                        } else {
                            this.showToast('Confirmation incorrecte. Action annulée.', 'warning');
                        }
                    }
                }
            ]
        });

        await alert.present();
    }

    private async performTruncate(tableName: string, isAuthTable: boolean) {
        this.loading = true;
        try {
            const result = await this.MysqlService.truncateTable(tableName, isAuthTable);
            this.truncateResults.unshift({
                table: tableName,
                success: result.success,
                message: result.message || (result.success ? 'Table vidée avec succès' : 'Erreur lors du vidage')
            });

            if (result.success) {
                await this.showToast(`Table "${tableName}" vidée avec succès`, 'success');
                // Recharger les données si on est sur le dashboard
                if (this.selectedSegment === 'dashboard') {
                    await this.loadDashboardData();
                }
            } else {
                await this.showToast(`Erreur lors du vidage de "${tableName}": ${result.message}`, 'danger');
            }
        } catch (error) {
            console.error('Erreur lors du truncate:', error);
            this.truncateResults.unshift({
                table: tableName,
                success: false,
                message: `Erreur: ${error}`
            });
            await this.showToast(`Erreur lors du vidage de "${tableName}"`, 'danger');
        } finally {
            this.loading = false;
        }
    }

    private async performBulkTruncate(tables: string[], areAuthTables: boolean) {
        this.loading = true;
        let successCount = 0;
        let errorCount = 0;

        for (const table of tables) {
            try {
                const result = await this.MysqlService.truncateTable(table, areAuthTables);
                this.truncateResults.unshift({
                    table: table,
                    success: result.success,
                    message: result.message || (result.success ? 'Vidée avec succès' : 'Erreur lors du vidage')
                });

                if (result.success) {
                    successCount++;
                } else {
                    errorCount++;
                }
            } catch (error) {
                console.error(`Erreur lors du truncate de ${table}:`, error);
                this.truncateResults.unshift({
                    table: table,
                    success: false,
                    message: `Erreur: ${error}`
                });
                errorCount++;
            }
        }

        this.loading = false;
        await this.showToast(`Opération terminée: ${successCount} réussies, ${errorCount} échouées`,
            errorCount === 0 ? 'success' : 'warning');

        // Recharger les données si on est sur le dashboard
        if (this.selectedSegment === 'dashboard') {
            await this.loadDashboardData();
        }
    }

    private async performCompleteReset() {
        this.loading = true;

        try {
            // D'abord vider les tables de l'app (SANS app_config qui contient les configurations critiques)
            const appTables = [
                'fails', 'reactions', 'profiles', 'comments', 'badges', 'user_badges',
                'system_logs', 'activity_logs', 'reaction_logs', 'user_activities',
                'user_management_logs', 'user_preferences'
                // NOTE: app_config est volontairement exclue pour préserver les configurations
            ];
            await this.performBulkTruncate(appTables, false);

            // Supprimer tous les utilisateurs d'authentification avec la nouvelle fonction RPC
            try {
                const result = await this.MysqlService.deleteAllAuthUsers();
                this.truncateResults.unshift({
                    table: 'auth.users',
                    success: result.success,
                    message: result.success ? `✅ ${result.message}` : `❌ ${result.message}`
                });

                if (result.success) {
                    this.debugService.addLog('info', 'AdminPage', `Auth users deleted: ${result.message}`);
                } else {
                    console.error('Erreur suppression utilisateurs:', result.message);
                }
            } catch (userError) {
                this.truncateResults.unshift({
                    table: 'auth.users',
                    success: false,
                    message: '❌ Erreur suppression utilisateurs: ' + userError
                });
                console.error('Erreur suppression utilisateurs:', userError);
            }

            // Restaurer les configurations essentielles avec remise à zéro des stats
            // (puisqu'on vient de vider toutes les données, il faut remettre les compteurs à zéro)
            try {
                await this.adminService.restoreEssentialConfigurations();
                this.truncateResults.unshift({
                    table: 'app_config (reset stats)',
                    success: true,
                    message: '✅ Stats remises à zéro après reset des données'
                });
                this.debugService.addLog('info', 'AdminPage', 'Stats reset to zero after data cleanup');
            } catch (restoreError) {
                this.truncateResults.unshift({
                    table: 'app_config (reset stats)',
                    success: false,
                    message: '❌ Erreur remise à zéro des stats: ' + restoreError
                });
                console.error('Erreur remise à zéro stats:', restoreError);
            }

            await this.showToast('🔥 RESET COMPLET TERMINÉ ! Tous les utilisateurs et données supprimés.', 'success');
        } catch (error) {
            console.error('Erreur lors du reset complet:', error);
            await this.showToast('❌ Erreur lors du reset complet: ' + error, 'danger');
        } finally {
            this.loading = false;
        }
    }

    // SUPPRESSION DE TOUS LES UTILISATEURS
    async deleteAllUsers() {
        const alert = await this.alertController.create({
            header: '🚨 SUPPRESSION DE TOUS LES UTILISATEURS',
            message: `
            <div style="color: red; font-weight: bold;">
                ⚠️ DANGER EXTRÊME ⚠️
            </div>
            <br>
            Cette action va supprimer DÉFINITIVEMENT tous les comptes utilisateurs de la base de données d'authentification.
            <br><br>
            <strong>Conséquences :</strong>
            <ul>
                <li>❌ Tous les utilisateurs seront supprimés</li>
                <li>❌ Toutes les sessions seront invalidées</li>
                <li>❌ Action IRRÉVERSIBLE</li>
            </ul>
            <br>
            Êtes-vous absolument certain de vouloir continuer ?
            `,
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel',
                    cssClass: 'secondary'
                },
                {
                    text: '🗑️ SUPPRIMER TOUS LES UTILISATEURS',
                    cssClass: 'danger',
                    handler: () => {
                        this.performDeleteAllUsers();
                    }
                }
            ]
        });

        await alert.present();
    }

    private async performDeleteAllUsers() {
        this.loading = true;

        try {
            const result = await this.MysqlService.deleteAllAuthUsers();

            this.truncateResults.unshift({
                table: 'auth.users (RPC)',
                success: result.success,
                message: result.success ? `✅ ${result.message}` : `❌ ${result.message}`
            });

            if (result.success) {
                await this.showToast(`🧹 ${result.message}`, 'success');
                this.debugService.addLog('info', 'AdminPage', `All auth users deleted: ${result.message}`);
            } else {
                await this.showToast(`❌ Erreur: ${result.message}`, 'danger');
                console.error('Erreur suppression utilisateurs:', result.message);
            }
        } catch (error) {
            console.error('Erreur lors de la suppression des utilisateurs:', error);
            await this.showToast('❌ Erreur lors de la suppression des utilisateurs: ' + error, 'danger');

            this.truncateResults.unshift({
                table: 'auth.users (RPC)',
                success: false,
                message: '❌ Erreur inattendue: ' + error
            });
        } finally {
            this.loading = false;

            // Recharger les données si on est sur le dashboard
            if (this.selectedSegment === 'dashboard') {
                await this.loadDashboardData();
            }
        }
    }

    // RESTAURATION D'URGENCE
    async emergencyRestoreConfigurations() {
        const alert = await this.alertController.create({
            header: '🚨 Restauration d\'Urgence',
            message: 'Cette action va restaurer les configurations essentielles (points_config, etc.) dans la table app_config. Utile si l\'application ne fonctionne plus après un reset.',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: '🛠️ Restaurer',
                    handler: () => {
                        this.performEmergencyRestore();
                    }
                }
            ]
        });

        await alert.present();
    }

    private async performEmergencyRestore() {
        this.loading = true;

        try {
            await this.adminService.restoreEssentialConfigurations();

            this.truncateResults.unshift({
                table: 'app_config (restore)',
                success: true,
                message: '✅ Configurations essentielles restaurées avec succès'
            });

            await this.showToast('✅ Configurations essentielles restaurées ! L\'application devrait fonctionner normalement.', 'success');

            // Recharger les données pour refléter les changements
            await this.loadPointsConfiguration();

        } catch (error) {
            this.truncateResults.unshift({
                table: 'app_config (restore)',
                success: false,
                message: '❌ Erreur lors de la restauration: ' + error
            });

            console.error('Erreur restauration d\'urgence:', error);
            await this.showToast('❌ Erreur lors de la restauration: ' + error, 'danger');
        } finally {
            this.loading = false;
        }
    }

    // ====== NOUVELLES MÉTHODES POUR LES TABLES SUPPLÉMENTAIRES ======

    async truncateRealtimePartitions() {
        const alert = await this.alertController.create({
            header: '⚡ Vider toutes les partitions Realtime',
            message: 'Voulez-vous vider toutes les partitions de messages (messages_2025_08_xx) ?',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Vider toutes les partitions',
                    role: 'destructive',
                    handler: () => {
                        this.performRealtimePartitionsCleanup();
                    }
                }
            ]
        });
        await alert.present();
    }

    private async performRealtimePartitionsCleanup() {
        this.loading = true;
        const partitionTables = [
            'realtime.messages_2025_08_13',
            'realtime.messages_2025_08_14',
            'realtime.messages_2025_08_15',
            'realtime.messages_2025_08_16',
            'realtime.messages_2025_08_17'
        ];

        await this.performBulkTruncate(partitionTables, false);
    }

    // ====== MÉTHODES DE GESTION DES BADGES ======

    async manageBadgeDefinitions() {
        this.showBadgeManagementModal = true;
        await this.loadBadgeDefinitions();
    }

    closeBadgeManagementModal() {
        this.showBadgeManagementModal = false;
        this.resetNewBadgeForm();
    }

    async loadBadgeDefinitions() {
        try {
            this.loading = true;
            const badges = await this.MysqlService.getAllBadgeDefinitions();
            this.badgeDefinitions = badges || [];
            this.identifyDuplicateBadges();
        } catch (error) {
            console.error('Erreur lors du chargement des badges:', error);
            await this.showToast('Erreur lors du chargement des badges', 'danger');
        } finally {
            this.loading = false;
        }
    }

    private identifyDuplicateBadges() {
        const seen = new Map();
        this.duplicateBadges = [];

        for (const badge of this.badgeDefinitions) {
            const key = `${badge.name}-${badge.category}-${badge.requirement_type}`;
            if (seen.has(key)) {
                this.duplicateBadges.push(badge);
                if (!this.duplicateBadges.includes(seen.get(key))) {
                    this.duplicateBadges.push(seen.get(key));
                }
            } else {
                seen.set(key, badge);
            }
        }
    }

    isDuplicateBadge(badge: any): boolean {
        return this.duplicateBadges.some(dup => dup.id === badge.id);
    }

    getBadgeRarityColor(rarity: string): string {
        const colors: { [key: string]: string } = {
            'common': 'medium',
            'rare': 'primary',
            'epic': 'secondary',
            'legendary': 'tertiary' // Violet/magenta au lieu de jaune
        };
        return colors[rarity] || 'medium';
    }

    async removeDuplicateBadges() {
        const alert = await this.alertController.create({
            header: '⚠️ Supprimer les doublons',
            message: `Voulez-vous supprimer ${this.duplicateBadges.length} badges en double ?`,
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Supprimer les doublons',
                    role: 'destructive',
                    handler: async () => {
                        await this.performRemoveDuplicates();
                    }
                }
            ]
        });
        await alert.present();
    }

    private async performRemoveDuplicates() {
        this.loading = true;
        let successCount = 0;
        let errorCount = 0;

        for (const badge of this.duplicateBadges) {
            try {
                await this.MysqlService.deleteBadgeDefinition(badge.id);
                successCount++;
            } catch (error) {
                console.error(`Erreur lors de la suppression du badge ${badge.name}:`, error);
                errorCount++;
            }
        }

        this.loading = false;
        await this.showToast(`Doublons supprimés: ${successCount} réussis, ${errorCount} échoués`,
            errorCount === 0 ? 'success' : 'warning');

        // Recharger la liste
        await this.loadBadgeDefinitions();
    }

    async deleteBadgeDefinition(badgeId: string) {
        const alert = await this.alertController.create({
            header: '🗑️ Supprimer le badge',
            message: 'Voulez-vous vraiment supprimer ce badge ?',
            buttons: [
                {
                    text: 'Annuler',
                    role: 'cancel'
                },
                {
                    text: 'Supprimer',
                    role: 'destructive',
                    handler: async () => {
                        try {
                            await this.MysqlService.deleteBadgeDefinition(badgeId);
                            await this.showToast('Badge supprimé avec succès', 'success');
                            await this.loadBadgeDefinitions();
                        } catch (error) {
                            console.error('Erreur lors de la suppression:', error);
                            await this.showToast('Erreur lors de la suppression', 'danger');
                        }
                    }
                }
            ]
        });
        await alert.present();
    }

    isNewBadgeValid(): boolean {
        return !!(
            this.newBadge.name?.trim() &&
            this.newBadge.description?.trim() &&
            this.newBadge.icon &&
            this.newBadge.category &&
            this.newBadge.rarity &&
            this.newBadge.requirement_type &&
            this.newBadge.requirement_value > 0
        );
    }

    async addBadgeDefinition() {
        if (!this.isNewBadgeValid()) {
            await this.showToast('Veuillez remplir tous les champs', 'warning');
            return;
        }

        try {
            this.loading = true;
            await this.MysqlService.createBadgeDefinition(this.newBadge);
            await this.showToast('Badge créé avec succès', 'success');
            this.resetNewBadgeForm();
            await this.loadBadgeDefinitions();
        } catch (error) {
            console.error('Erreur lors de la création du badge:', error);
            await this.showToast('Erreur lors de la création du badge', 'danger');
        } finally {
            this.loading = false;
        }
    }

    private resetNewBadgeForm() {
        this.newBadge = {
            name: '',
            description: '',
            icon: '',
            category: '',
            rarity: '',
            requirement_type: '',
            requirement_value: null
        };
    }
}
