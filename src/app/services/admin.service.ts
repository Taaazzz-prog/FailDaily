import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { DebugService } from './debug.service';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    constructor(
        private supabaseService: SupabaseService,
        private debugService: DebugService
    ) { }

    // DASHBOARD STATS
    async getDashboardStats() {
        this.debugService.addLog('info', 'AdminService', 'Getting dashboard stats...');

        try {
            const stats = await this.supabaseService.getDashboardStats();

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
            return await this.supabaseService.getPointsConfiguration();
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting points config', error);
            throw error;
        }
    }

    async updatePointsConfiguration(config: any) {
        this.debugService.addLog('info', 'AdminService', 'Updating points configuration', config);

        try {
            await this.supabaseService.updatePointsConfiguration(config);
            await this.logSystemEvent('info', 'Points configuration updated', config);

            this.debugService.addLog('info', 'AdminService', 'Points configuration updated successfully');
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error updating points config', error);
            throw error;
        }
    }

    // SYSTEM LOGS
    async logSystemEvent(level: 'info' | 'warning' | 'error' | 'debug', message: string, details?: any, userId?: string, action?: string) {
        try {
            await this.supabaseService.insertSystemLog(level, message, details, userId, action);
        } catch (error) {
            console.error('Failed to log system event:', error);
        }
    }

    async getSystemLogs(limit: number = 100) {
        try {
            return await this.supabaseService.getSystemLogs(limit);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting system logs', error);
            throw error;
        }
    }

    // USER MANAGEMENT
    async getAllUsers() {
        try {
            return await this.supabaseService.getAllProfiles();
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting all users', error);
            throw error;
        }
    }

    async getUserActivities(userId?: string, limit: number = 50) {
        try {
            return await this.supabaseService.getUserActivities(userId, limit);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting user activities', error);
            throw error;
        }
    }

    // DATABASE INTEGRITY
    async analyzeDatabaseIntegrity() {
        try {
            return await this.supabaseService.analyzeDatabaseIntegrity();
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error analyzing database integrity', error);
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
                    await this.supabaseService.fixInvalidReactionCounts(invalidCount.fail_id);
                    fixedCount++;
                    this.debugService.addLog('info', 'AdminService', `Fixed reaction counts for fail ${invalidCount.fail_id}`);
                }
            }

            // Supprimer les réactions orphelines
            if (analysisResults.orphanedReactions && analysisResults.orphanedReactions.length > 0) {
                for (const orphanedReaction of analysisResults.orphanedReactions) {
                    await this.supabaseService.deleteOrphanedReaction(orphanedReaction.reaction_id);
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
            return await this.supabaseService.getReactionLogsTable(limit);
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
            const logs = await this.supabaseService.getActivityLogsByType(logType, periodHours, limit);

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
            await this.supabaseService.deleteUserReaction(adminId, reactionId, reason);
            await this.logSystemEvent('info', 'Réaction utilisateur supprimée', { reactionId, reason });
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error deleting user reaction', error);
            throw error;
        }
    }

    async deleteUserFail(failId: string, reason?: string): Promise<void> {
        try {
            const adminId = await this.getCurrentAdminId();
            await this.supabaseService.deleteUserFail(adminId, failId, reason);
            await this.logSystemEvent('info', 'Fail utilisateur supprimé', { failId, reason });
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error deleting user fail', error);
            throw error;
        }
    }

    async updateUserAccount(userId: string, updates: any, reason?: string): Promise<void> {
        try {
            const adminId = await this.getCurrentAdminId();
            await this.supabaseService.updateUserAccount(adminId, userId, updates, reason);
            await this.logSystemEvent('info', 'Compte utilisateur modifié', { userId, updates, reason });
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error updating user account', error);
            throw error;
        }
    }

    async getUserManagementLogs(userId?: string): Promise<any[]> {
        try {
            return await this.supabaseService.getUserManagementLogs(undefined, userId);
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting user management logs', error);
            return [];
        }
    }

    private async getCurrentAdminId(): Promise<string> {
        // Récupérer l'ID de l'admin connecté
        const currentUser = await this.supabaseService.getCurrentUser();
        return currentUser?.id || 'admin-temp-id';
    }

    // AMÉLIORATION DU TEMPS RÉEL
    async getRealTimeEvents() {
        try {
            // Obtenir les derniers événements en temps réel depuis la base de données
            const recentEvents = await this.supabaseService.getActivityLogsByType('all', 1, 10); // Dernière heure, 10 événements max

            return {
                events: recentEvents,
                lastUpdate: new Date().toISOString(),
                eventCount: recentEvents.length
            };
        } catch (error) {
            this.debugService.addLog('error', 'AdminService', 'Error getting real-time events', error);
            return { events: [], lastUpdate: new Date().toISOString(), eventCount: 0 };
        }
    }

    // RECHERCHE AVANCÉE DANS LES LOGS
    async searchLogs(searchTerm: string, logType: string = 'all', period: string = '24h', limit: number = 50): Promise<any[]> {
        try {
            const periodHours = this.getPeriodHours(period);
            const logs = await this.supabaseService.getActivityLogsByType(logType, periodHours, limit * 2); // Récupérer plus pour filtrer

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
