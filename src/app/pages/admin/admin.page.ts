import { Component, OnInit, OnDestroy } from '@angular/core';
import { AdminService } from '../../services/admin.service';
import { DebugService } from '../../services/debug.service';
import { SupabaseService } from '../../services/supabase.service';
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

    // Logs data
    systemLogs: any[] = [];
    reactionLogs: any[] = [];
    filteredLogs: any[] = [];
    logSearchTerm = '';
    selectedLogType = 'all';
    selectedLogPeriod = '24h';

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

    // Real-time data
    realTimeEvents: any[] = [];
    realTimeStats: any = {
        activeUsers: 0,
        eventsLastHour: 0,
        systemLoad: 'Normal'
    };
    autoRefreshEnabled = false;
    lastRealTimeUpdate: Date = new Date();
    systemAlerts: any[] = [];

    private autoRefreshSubscription?: Subscription;

    constructor(
        private adminService: AdminService,
        private debugService: DebugService,
        private supabaseService: SupabaseService,
        private alertController: AlertController,
        private toastController: ToastController
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
                await this.loadSpecificLogs();
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
            await this.loadSpecificLogs();
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
        try {
            const analysis = await this.adminService.analyzeDatabaseIntegrity();
            const toast = await this.toastController.create({
                message: `Analyse terminée: ${analysis.totalIssues || 0} problèmes détectés`,
                duration: 3000,
                color: analysis.totalIssues > 0 ? 'warning' : 'success'
            });
            toast.present();
        } catch (error) {
            console.error('Error analyzing database:', error);
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

    // ===== LOGS METHODS =====
    async loadSpecificLogs() {
        this.loading = true;
        try {
            const limit = 50;
            this.filteredLogs = await this.adminService.generateSpecificLogs(
                this.selectedLogType,
                this.selectedLogPeriod,
                limit
            );
        } catch (error) {
            console.error('Error loading specific logs:', error);
            this.filteredLogs = [];
        }
        this.loading = false;
    }

    async searchInLogs() {
        if (!this.logSearchTerm.trim()) {
            await this.loadSpecificLogs();
            return;
        }

        try {
            this.filteredLogs = await this.adminService.searchLogs(
                this.logSearchTerm,
                this.selectedLogType,
                this.selectedLogPeriod,
                30
            );
        } catch (error) {
            console.error('Error searching logs:', error);
        }
    }

    async exportLogs() {
        try {
            const allLogs = await this.adminService.exportAllLogs();
            const dataStr = JSON.stringify(allLogs, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `admin-logs-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            const toast = await this.toastController.create({
                message: 'Logs exportés avec succès!',
                duration: 2000,
                color: 'success'
            });
            toast.present();
        } catch (error) {
            console.error('Error exporting logs:', error);
        }
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
            this.lastRealTimeUpdate = new Date();

            // Statistiques temps réel
            this.realTimeStats.eventsLastHour = this.realTimeEvents.length;
            this.realTimeStats.activeUsers = new Set(
                this.realTimeEvents.map(e => e.user_id).filter(id => id)
            ).size;

        } catch (error) {
            console.error('Error loading real-time data:', error);
        }
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
    formatTimestamp(timestamp: string | Date): string {
        if (!timestamp) return 'Date inconnue';
        const date = new Date(timestamp);
        return date.toLocaleString('fr-FR');
    }

    getTimeAgo(timestamp: string | Date): string {
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
}
