import { Injectable } from '@angular/core';
import { MysqlService } from './mysql.service';
import { DebugService } from './debug.service';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    constructor(
        private MysqlService: MysqlService,
        private debugService: DebugService
    ) { }

    // DASHBOARD STATS
    async getDashboardStats() {
        this.debugService.addLog('info', 'AdminService', 'Getting dashboard stats...');

        try {
            const stats = await this.MysqlService.getDashboardStats();

            this.debugService.addLog('info', 'AdminService', 'Dashboard stats loaded', stats);
            return stats;
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting dashboard stats', error);
            throw error;
        }
    }

    // POINTS CONFIGURATION
    async getPointsConfiguration() {
        try {
            return await this.MysqlService.getPointsConfiguration();
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting points config', error);
            throw error;
        }
    }

    async updatePointsConfiguration(config: any) {
        this.debugService.addLog('info', 'AdminService', 'Updating points configuration', config);

        try {
            await this.MysqlService.updatePointsConfiguration(config);
            await this.logSystemEvent('info', 'Points configuration updated', config);

            this.debugService.addLog('info', 'AdminService', 'Points configuration updated successfully');
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error updating points config', error);
            throw error;
        }
    }

    // RESTAURATION D'URGENCE
    async restoreEssentialConfigurations() {
        this.debugService.addLog('info', 'AdminService', 'Restoring essential configurations...');

        try {
            await this.MysqlService.restoreEssentialConfigurations();
            await this.logSystemEvent('info', 'Essential configurations restored after database reset');

            this.debugService.addLog('info', 'AdminService', 'Essential configurations restored successfully');
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error restoring essential configurations', error);
            throw error;
        }
    }

    // SYSTEM LOGS
    async logSystemEvent(level: 'info' | 'warning' | 'error' | 'debug', message: string, details?: any, userId?: string, action?: string) {
        try {
            await this.MysqlService.insertSystemLog(level, message, details, userId, action);
        } catch (error) {
            console.error('Failed to log system event:', error);
        }
    }

    async getSystemLogs(limit: number = 100) {
        try {
            return await this.MysqlService.getSystemLogs(limit);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting system logs', error);
            throw error;
        }
    }

    // ===== Admin Logs (new endpoints) =====
    async getAdminLogsSummary(days: number = 7) {
        const res = await this.MysqlService.adminLogsSummary(days);
        return res?.success ? res : { totals: {}, topActions: [] };
    }

    async getAdminLogsByDay(days: number = 7) {
        const res = await this.MysqlService.adminLogsByDay(days);
        return res?.success ? res : { days: [] };
    }

    async getAdminLogsByUser(days: number = 7) {
        const res = await this.MysqlService.adminLogsByUser(days);
        return res?.success ? res : { users: [] };
    }

    async getAdminLogsActions(days: number = 7) {
        const res = await this.MysqlService.adminLogsActions(days);
        return res?.success ? res : { actions: [] };
    }

    async getAdminLogsList(params: { limit?: number; offset?: number; level?: string; action?: string; userId?: string; start?: string; end?: string } = {}) {
        const res = await this.MysqlService.adminLogsList(params);
        return res?.success ? res : { logs: [], pagination: { limit: params.limit || 200, offset: params.offset || 0, count: 0 } };
    }

    // USER MANAGEMENT
    async getAllUsers() {
        try {
            return await this.MysqlService.getAllUsers();
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting all users', error);
            throw error;
        }
    }

    async getUserActivities(userId?: string, limit: number = 50) {
        try {
            return await this.MysqlService.getUserActivities(userId, limit);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting user activities', error);
            throw error;
        }
    }

    // DATABASE INTEGRITY
    async analyzeDatabaseIntegrity() {
        try {
            return await this.MysqlService.analyzeDatabaseIntegrity();
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error analyzing database integrity', error);
            throw error;
        }
    }

    async analyzeSpecificFail(failId: string) {
        this.debugService.addLog('info', 'AdminService', 'Analyzing specific fail', { failId });
        try {
            return await this.MysqlService.analyzeSpecificFail(failId);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error analyzing specific fail', error);
            throw error;
        }
    }

    async fixFailReactionCounts(failId: string) {
        this.debugService.addLog('info', 'AdminService', 'Fixing fail reaction counts', { failId });
        try {
            return await this.MysqlService.fixFailReactionCounts(failId);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error fixing fail reaction counts', error);
            throw error;
        }
    }

    async fixDatabaseIssues(analysisResults: any) {
        this.debugService.addLog('info', 'AdminService', 'Fixing database issues', analysisResults);

        try {
            let fixedCount = 0;

            // Corriger les compteurs invalides
            if (analysisResults.invalidCounts && analysisResults.invalidCounts.length > 0) {
                for (const invalidCount of analysisResults.invalidCounts) {
                    await this.MysqlService.fixInvalidReactionCounts(invalidCount.fail_id);
                    fixedCount++;
                    this.debugService.addLog('info', 'AdminService', `Fixed reaction counts for fail ${invalidCount.fail_id}`);
                }
            }

            // Supprimer les réactions orphelines
            if (analysisResults.orphanedReactions && analysisResults.orphanedReactions.length > 0) {
                for (const orphanedReaction of analysisResults.orphanedReactions) {
                    await this.MysqlService.deleteOrphanedReaction(orphanedReaction.reaction_id);
                    fixedCount++;
                    this.debugService.addLog('info', 'AdminService', `Deleted orphaned reaction ${orphanedReaction.reaction_id}`);
                }
            }

            await this.logSystemEvent('info', `Database issues fixed: ${fixedCount} problems corrected`, {
                invalidCounts: analysisResults.invalidCounts?.length || 0,
                orphanedReactions: analysisResults.orphanedReactions?.length || 0,
                fixedCount
            });

            this.debugService.addLog('info', 'AdminService', `Database issues fixed: ${fixedCount} problems corrected`);
            return { success: true, fixedCount };
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error fixing database issues', error);
            throw error;
        }
    }

    // DB COUNTS (sanity check)
    async getDatabaseCounts() {
        try {
            return await this.MysqlService.getDatabaseCounts();
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting DB counts', error);
            throw error;
        }
    }

    // REACTION LOGS
    async logReactionEvent(userId: string, failId: string, reactionType: string, pointsAwarded: number) {
        try {
            const logEntry = {
                user_id: userId,
                fail_id: failId,
                reaction_type: reactionType,
                points_awarded: pointsAwarded,
                timestamp: new Date().toISOString()
            };

            await this.logSystemEvent('info', `Reaction ${reactionType} added`, logEntry);
        } catch (error) {
            console.error('Failed to log reaction event:', error);
        }
    }

    async getReactionLogs(limit: number = 100) {
        try {
            return await this.MysqlService.getReactionLogsTable(limit);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting reaction logs', error);
            throw error;
        }
    }

    // EXPORT DATA
    async exportAllLogs() {
        try {
            const [systemLogs, reactionLogs, userActivities] = await Promise.all([
                this.getSystemLogs(1000),
                this.getReactionLogs(1000),
                this.getUserActivities()
            ]);

            return {
                systemLogs,
                reactionLogs,
                userActivities,
                exportedAt: new Date().toISOString()
            };
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error exporting logs', error);
            throw error;
        }
    }

    // REAL-TIME DATA
    async getRealTimeData() {
        try {
            const [recentLogs, dashboardStats] = await Promise.all([
                this.getSystemLogs(20),
                this.getDashboardStats()
            ]);

            return {
                recentEvents: recentLogs,
                stats: dashboardStats,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting real-time data', error);
            throw error;
        }
    }

    // GÉNÉRATEUR DE LOGS SPÉCIFIQUES - VERSION AVEC VRAIES DONNÉES
    async generateSpecificLogs(logType: string, period: string, limit: number): Promise<any[]> {
        this.debugService.addLog('info', 'AdminService', `Generating REAL logs: type=${logType}, period=${period}, limit=${limit}`);

        try {
            const periodHours = this.getPeriodHours(period);

            // Utiliser la nouvelle fonction SQL qui retourne les vraies données
            const logs = await this.MysqlService.getActivityLogsByType(logType, periodHours, limit);

            // Convertir les données pour l'interface
            return logs.map((log: any) => ({
                id: log.id,
                timestamp: log.log_timestamp,
                level: log.level,
                category: log.category,
                message: log.message,
                user_id: log.user_id,
                user_name: log.user_name,
                user_email: log.user_email,
                details: log.details,
                showDetails: false
            }));
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error generating specific logs', error);
            throw error;
        }
    }

    private getPeriodHours(period: string): number | null {
        switch (period) {
            case '1h': return 1;
            case '24h': return 24;
            case '7d': return 24 * 7;
            case '30d': return 24 * 30;
            case 'all':
            default: return null;
        }
    }

    // ===== GESTION UTILISATEUR AVANCÉE =====

    async deleteUserReaction(reactionId: string, reason?: string): Promise<void> {
        try {
            const adminId = await this.getCurrentAdminId();
            await this.MysqlService.deleteUserReaction(adminId, reactionId, reason);
            await this.logSystemEvent('info', 'Réaction utilisateur supprimée', { reactionId, reason });
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error deleting user reaction', error);
            throw error;
        }
    }

    async deleteUserFail(failId: string, reason?: string): Promise<void> {
        try {
            const adminId = await this.getCurrentAdminId();
            await this.MysqlService.deleteUserFail(adminId, failId, reason);
            await this.logSystemEvent('info', 'Fail utilisateur supprimé', { failId, reason });
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error deleting user fail', error);
            throw error;
        }
    }

    async updateUserAccount(userId: string, updates: any, reason?: string): Promise<void> {
        try {
            const adminId = await this.getCurrentAdminId();
            await this.MysqlService.updateUserAccount(userId, updates);
            await this.logSystemEvent('info', 'Compte utilisateur modifié', { userId, updates, reason });
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error updating user account', error);
            throw error;
        }
    }

    async getUserManagementLogs(userId?: string): Promise<any[]> {
        try {
            return await this.MysqlService.getUserManagementLogs(undefined, userId);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting user management logs', error);
            return [];
        }
    }

    private async getCurrentAdminId(): Promise<string> {
        // Récupérer l'ID de l'admin connecté
        const currentUser = await this.MysqlService.getCurrentUser();
        return currentUser?.id || 'admin-temp-id';
    }

    // AMÉLIORATION DU TEMPS RÉEL
    async getRealTimeEvents() {
        try {
            // 1. Récupérer les utilisateurs actifs via une méthode alternative
            const activeUsers = await this.getActiveUsers();

            // 2. Récupérer les événements récents (dernière heure)
            const recentEvents = await this.MysqlService.getActivityLogsByType('all', 1, 50);

            // 3. Filtrer les événements vraiment récents (derniers 30 min)
            const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
            const veryRecentEvents = recentEvents.filter(event =>
                new Date(event.log_timestamp) > thirtyMinutesAgo
            );

            // 4. Si pas d'utilisateurs actifs détectés mais qu'on sait qu'il y en a un connecté
            const currentUser = await this.MysqlService.getCurrentUser();
            const finalActiveCount = activeUsers.length > 0 ? activeUsers.length : (currentUser ? 1 : 0);

            console.log('🔴 Real-time monitoring:', {
                dbEvents: veryRecentEvents.length,
                activeUsersFromLogs: activeUsers.length,
                currentUserExists: !!currentUser,
                finalActiveCount: finalActiveCount
            });

            // 5. Si pas d'utilisateurs actifs détectés, essayer de récupérer le profil de l'utilisateur actuel
            let finalActiveUsers = activeUsers;
            if (activeUsers.length === 0 && currentUser) {
                try {
                    const currentUserProfile = await this.MysqlService.getUserProfile(currentUser.id);
                    if (currentUserProfile) {
                        finalActiveUsers = [currentUserProfile];
                    } else {
                        // Fallback avec les données minimales
                        finalActiveUsers = [{
                            id: currentUser.id,
                            display_name: currentUser.displayName || 'Utilisateur actuel',
                            username: currentUser.email?.split('@')[0] || 'user',
                            email: currentUser.email
                        }];
                    }
                } catch (error) {
                    // En cas d'erreur, utiliser les données de base
                    finalActiveUsers = [{
                        id: currentUser.id,
                        display_name: currentUser.displayName || 'Utilisateur actuel',
                        username: currentUser.email?.split('@')[0] || currentUser.email?.split('@')[0],
                        email: currentUser.email
                    }];
                }
            }

            return {
                events: veryRecentEvents,
                lastUpdate: new Date().toISOString(),
                eventCount: veryRecentEvents.length,
                activeUsersCount: finalActiveCount,
                activeUsers: finalActiveUsers
            };
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting real-time events', error);
            // Fallback: Au minimum détecter l'utilisateur actuel s'il existe
            const currentUser = await this.MysqlService.getCurrentUser();
            let fallbackActiveUsers: any[] = [];

            if (currentUser) {
                try {
                    const currentUserProfile = await this.MysqlService.getUserProfile(currentUser.id);
                    fallbackActiveUsers = currentUserProfile ? [currentUserProfile] : [{
                        id: currentUser.id,
                        display_name: currentUser.displayName || 'Utilisateur actuel',
                        username: currentUser.email?.split('@')[0] || currentUser.email?.split('@')[0],
                        email: currentUser.email
                    }];
                } catch (profileError) {
                    fallbackActiveUsers = [{
                        id: currentUser.id,
                        display_name: currentUser.displayName || 'Utilisateur actuel',
                        username: currentUser.email?.split('@')[0] || currentUser.email?.split('@')[0],
                        email: currentUser.email
                    }];
                }
            }

            return {
                events: [],
                lastUpdate: new Date().toISOString(),
                eventCount: 0,
                activeUsersCount: currentUser ? 1 : 0,
                activeUsers: fallbackActiveUsers
            };
        }
    }    // Nouvelle méthode pour récupérer les utilisateurs actifs
    private async getActiveUsers(): Promise<any[]> {
        try {
            // Récupérer tous les logs récents et filtrer côté frontend pour éviter l'endpoint by-type problématique
            const logsResponse = await this.MysqlService.adminLogsList({ limit: 100 });
            const allRecentLogs = logsResponse.logs || [];
            
            console.log('🔍 DEBUG getActiveUsers - Logs response:', logsResponse.success, allRecentLogs.length, 'logs');
            
            // Filtrer pour ne garder que les connexions récentes (1 heure)
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const recentLogins = allRecentLogs.filter((log: any) => 
                log.action === 'user_login' && 
                new Date(log.timestamp || log.created_at) > oneHourAgo
            );
            
            console.log('🔍 DEBUG getActiveUsers - Recent logins found:', recentLogins.length, 'from', allRecentLogs.length, 'total logs');

            // Extraire les IDs utilisateurs uniques
            const activeUserIds = [...new Set(recentLogins.map((log: any) => log.user_id).filter(Boolean))];

            // Récupérer les profils des utilisateurs actifs
            const activeUsers = await Promise.all(
                activeUserIds.map(async (userId: any) => {
                    try {
                        return await this.MysqlService.getProfile(userId as string);
                    } catch {
                        return null;
                    }
                })
            );

            console.log('🟢 Active users found:', activeUsers.filter(Boolean).length, 'from', activeUserIds.length, 'login events');
            return activeUsers.filter(Boolean);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting active users', error);
            return [];
        }
    }

    // RECHERCHE AVANCÉE DANS LES LOGS
    async searchLogs(searchTerm: string, logType: string = 'all', period: string = '24h', limit: number = 50): Promise<any[]> {
        try {
            const periodHours = this.getPeriodHours(period);
            const logs = await this.MysqlService.getActivityLogsByType(logType, periodHours, limit * 2); // Récupérer plus pour filtrer

            // Filtrer par terme de recherche
            const filteredLogs = logs.filter((log: any) => {
                const searchInMessage = log.message && log.message.toLowerCase().includes(searchTerm.toLowerCase());
                const searchInUserName = log.user_name && log.user_name.toLowerCase().includes(searchTerm.toLowerCase());
                const searchInCategory = log.category && log.category.toLowerCase().includes(searchTerm.toLowerCase());

                return searchInMessage || searchInUserName || searchInCategory;
            });

            return filteredLogs.slice(0, limit);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error searching logs', error);
            return [];
        }
    }
}
