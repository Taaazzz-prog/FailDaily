import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { DebugService } from './debug.service';

@Injectable({
    providedIn: 'root'
})
export class AdminMysqlService {
    private apiUrl = environment.api.baseUrl || 'http://localhost:3000/api';

    constructor(
        private http: HttpClient,
        private debugService: DebugService
    ) { 
        console.log('🔧 AdminMysqlService: Initialisation du service admin MySQL');
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('faildaily_token');
        return new HttpHeaders({
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        });
    }

    // DASHBOARD STATS
    async getDashboardStats(): Promise<any> {
        this.debugService.addLog('info', 'AdminMysqlService', 'Getting dashboard stats...');

        try {
            const response = await this.http.get(`${this.apiUrl}/admin/stats`, {
                headers: this.getAuthHeaders()
            }).toPromise();

            this.debugService.addLog('info', 'AdminMysqlService', 'Dashboard stats loaded', response);
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting dashboard stats', error);
            throw error;
        }
    }

    // POINTS CONFIGURATION
    async getPointsConfiguration(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/points-config`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting points config', error);
            throw error;
        }
    }

    async updatePointsConfiguration(config: any): Promise<void> {
        this.debugService.addLog('info', 'AdminMysqlService', 'Updating points configuration', config);

        try {
            await this.http.put(`${this.apiUrl}/admin/points-config`, config, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', 'Points configuration updated', config);
            this.debugService.addLog('info', 'AdminMysqlService', 'Points configuration updated successfully');
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error updating points config', error);
            throw error;
        }
    }

    // RESTAURATION D'URGENCE
    async restoreEssentialConfigurations(): Promise<void> {
        this.debugService.addLog('info', 'AdminMysqlService', 'Restoring essential configurations...');

        try {
            await this.http.post(`${this.apiUrl}/admin/restore-configs`, {}, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', 'Essential configurations restored after database reset');
            this.debugService.addLog('info', 'AdminMysqlService', 'Essential configurations restored successfully');
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error restoring essential configurations', error);
            throw error;
        }
    }

    // SYSTEM LOGS
    async logSystemEvent(level: 'info' | 'warning' | 'error' | 'debug', message: string, details?: any, userId?: string, action?: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/logs/system`, {
                level,
                message,
                details,
                userId,
                action
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();
        } catch (error) {
            console.error('Failed to log system event:', error);
        }
    }

    async getSystemLogs(limit: number = 100): Promise<any[]> {
        try {
            const response: any = await this.http.get(`${this.apiUrl}/logs/system?limit=${limit}`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response.logs || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting system logs', error);
            throw error;
        }
    }

    // USER MANAGEMENT
    async getAllUsers(): Promise<any[]> {
        try {
            const response: any = await this.http.get(`${this.apiUrl}/admin/users`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response.users || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting all users', error);
            throw error;
        }
    }

    async getUserActivities(userId?: string, limit: number = 50): Promise<any[]> {
        try {
            const url = userId 
                ? `${this.apiUrl}/logs/user-activities/${userId}?limit=${limit}`
                : `${this.apiUrl}/admin/user-activities?limit=${limit}`;
                
            const response: any = await this.http.get(url, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response.activities || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting user activities', error);
            throw error;
        }
    }

    async updateUserRole(userId: string, newRole: string, reason?: string): Promise<void> {
        try {
            await this.http.put(`${this.apiUrl}/admin/users/${userId}/role`, {
                role: newRole,
                reason
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', `User role updated: ${userId} -> ${newRole}`, {
                userId,
                newRole,
                reason
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error updating user role', error);
            throw error;
        }
    }

    async banUser(userId: string, reason: string, duration?: number): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/users/${userId}/ban`, {
                reason,
                duration
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('warning', `User banned: ${userId}`, {
                userId,
                reason,
                duration
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error banning user', error);
            throw error;
        }
    }

    async unbanUser(userId: string, reason?: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/users/${userId}/unban`, {
                reason
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', `User unbanned: ${userId}`, {
                userId,
                reason
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error unbanning user', error);
            throw error;
        }
    }

    // BADGES MANAGEMENT
    async getAllBadges(): Promise<any[]> {
        try {
            const response: any = await this.http.get(`${this.apiUrl}/admin/badges`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response.badges || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting badges', error);
            throw error;
        }
    }

    async createBadge(badgeData: any): Promise<any> {
        try {
            const response = await this.http.post(`${this.apiUrl}/admin/badges`, badgeData, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', 'New badge created', badgeData);
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error creating badge', error);
            throw error;
        }
    }

    async updateBadge(badgeId: string, badgeData: any): Promise<void> {
        try {
            await this.http.put(`${this.apiUrl}/admin/badges/${badgeId}`, badgeData, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', `Badge updated: ${badgeId}`, badgeData);
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error updating badge', error);
            throw error;
        }
    }

    async deleteBadge(badgeId: string): Promise<void> {
        try {
            await this.http.delete(`${this.apiUrl}/admin/badges/${badgeId}`, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('warning', `Badge deleted: ${badgeId}`, { badgeId });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error deleting badge', error);
            throw error;
        }
    }

    async awardBadgeToUser(userId: string, badgeId: string, reason?: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/users/${userId}/badges/${badgeId}`, {
                reason
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', `Badge awarded: ${badgeId} to ${userId}`, {
                userId,
                badgeId,
                reason
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error awarding badge', error);
            throw error;
        }
    }

    async removeBadgeFromUser(userId: string, badgeId: string, reason?: string): Promise<void> {
        try {
            await this.http.delete(`${this.apiUrl}/admin/users/${userId}/badges/${badgeId}`, {
                headers: this.getAuthHeaders(),
                body: { reason }
            }).toPromise();

            await this.logSystemEvent('warning', `Badge removed: ${badgeId} from ${userId}`, {
                userId,
                badgeId,
                reason
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error removing badge', error);
            throw error;
        }
    }

    // FAILS MANAGEMENT
    async getAllFails(page: number = 1, limit: number = 50): Promise<any> {
        try {
            const response: any = await this.http.get(`${this.apiUrl}/admin/fails?page=${page}&limit=${limit}`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting fails', error);
            throw error;
        }
    }

    async moderateFail(failId: string, action: 'approve' | 'reject' | 'delete', reason?: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/fails/${failId}/moderate`, {
                action,
                reason
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', `Fail ${action}: ${failId}`, {
                failId,
                action,
                reason
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error moderating fail', error);
            throw error;
        }
    }

    async getFailReports(): Promise<any[]> {
        try {
            const response: any = await this.http.get(`${this.apiUrl}/admin/fail-reports`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response.reports || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting fail reports', error);
            throw error;
        }
    }

    async resolveFailReport(reportId: string, action: 'dismiss' | 'remove_fail' | 'ban_user', reason?: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/fail-reports/${reportId}/resolve`, {
                action,
                reason
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', `Fail report resolved: ${reportId} - ${action}`, {
                reportId,
                action,
                reason
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error resolving fail report', error);
            throw error;
        }
    }

    // DATABASE MANAGEMENT
    async getDatabaseHealth(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/database/health`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting database health', error);
            throw error;
        }
    }

    async optimizeDatabase(): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/database/optimize`, {}, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', 'Database optimization completed');
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error optimizing database', error);
            throw error;
        }
    }

    async backupDatabase(): Promise<any> {
        try {
            const response = await this.http.post(`${this.apiUrl}/admin/database/backup`, {}, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', 'Database backup created');
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error creating database backup', error);
            throw error;
        }
    }

    // ANALYTICS
    async getUserAnalytics(period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/analytics/users?period=${period}`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting user analytics', error);
            throw error;
        }
    }

    async getFailAnalytics(period: 'day' | 'week' | 'month' = 'week'): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/analytics/fails?period=${period}`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting fail analytics', error);
            throw error;
        }
    }

    async getBadgeAnalytics(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/analytics/badges`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting badge analytics', error);
            throw error;
        }
    }

    // NOTIFICATIONS MANAGEMENT
    async sendNotificationToUser(userId: string, title: string, message: string, type: string = 'info'): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/notifications/user/${userId}`, {
                title,
                message,
                type
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', `Notification sent to user: ${userId}`, {
                userId,
                title,
                type
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error sending notification', error);
            throw error;
        }
    }

    async sendNotificationToAll(title: string, message: string, type: string = 'info'): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/notifications/broadcast`, {
                title,
                message,
                type
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', 'Broadcast notification sent', {
                title,
                type
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error sending broadcast notification', error);
            throw error;
        }
    }

    // CONTENT MODERATION
    async getContentModerationQueue(): Promise<any[]> {
        try {
            const response: any = await this.http.get(`${this.apiUrl}/admin/moderation/queue`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response.items || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting moderation queue', error);
            throw error;
        }
    }

    async moderateContent(contentId: string, contentType: 'fail' | 'comment', action: 'approve' | 'reject', reason?: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/moderation/${contentType}/${contentId}`, {
                action,
                reason
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', `${contentType} ${action}: ${contentId}`, {
                contentId,
                contentType,
                action,
                reason
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error moderating content', error);
            throw error;
        }
    }

    // CONFIGURATION MANAGEMENT
    async getSystemConfiguration(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/config/system`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting system config', error);
            throw error;
        }
    }

    async updateSystemConfiguration(config: any): Promise<void> {
        try {
            await this.http.put(`${this.apiUrl}/admin/config/system`, config, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', 'System configuration updated', config);
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error updating system config', error);
            throw error;
        }
    }

    // EMERGENCY FUNCTIONS
    async emergencyShutdown(reason: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/emergency/shutdown`, {
                reason
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('error', 'Emergency shutdown initiated', { reason });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error initiating emergency shutdown', error);
            throw error;
        }
    }

    async emergencyMaintenance(enable: boolean, message?: string): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/emergency/maintenance`, {
                enable,
                message
            }, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('warning', `Maintenance mode ${enable ? 'enabled' : 'disabled'}`, {
                enable,
                message
            });
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error toggling maintenance mode', error);
            throw error;
        }
    }

    // UTILITIES
    async testConnection(): Promise<boolean> {
        try {
            const response: any = await this.http.get(`${this.apiUrl}/health`, {
                headers: this.getAuthHeaders()
            }).toPromise();
            
            return response.success === true;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Connection test failed', error);
            return false;
        }
    }

    async clearCache(): Promise<void> {
        try {
            await this.http.post(`${this.apiUrl}/admin/cache/clear`, {}, {
                headers: this.getAuthHeaders()
            }).toPromise();

            await this.logSystemEvent('info', 'Application cache cleared');
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error clearing cache', error);
            throw error;
        }
    }

    // ===== MÉTHODES RÉCUPÉRÉES DE L'ANCIEN SERVICE =====

    // MÉTHODES D'ACTIVITÉ ET STATUS
    async getTodayActivity(): Promise<number> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/activity/today`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.count || 0;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting today activity', error);
            return 0;
        }
    }

    async getSystemStatus(): Promise<'healthy' | 'warning' | 'error'> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/system/status`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.status || 'error';
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting system status', error);
            return 'error';
        }
    }

    async getRecentSystemErrors(): Promise<number> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/system/errors/recent`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.errorCount || 0;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting recent system errors', error);
            return 0;
        }
    }

    // REACTION LOGS
    async logReactionEvent(userId: string, failId: string, reactionType: string, pointsAwarded: number): Promise<void> {
        try {
            const logData = {
                userId,
                failId,
                reactionType,
                pointsAwarded,
                timestamp: new Date().toISOString()
            };

            await this.http.post(`${this.apiUrl}/admin/reactions/log`, logData, {
                headers: this.getAuthHeaders()
            }).toPromise();

            this.debugService.addLog('info', 'AdminMysqlService', `Reaction ${reactionType} logged`, logData);
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error logging reaction event', error);
            throw error;
        }
    }

    async getReactionLogs(limit: number = 100): Promise<any[]> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/reactions/logs?limit=${limit}`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.logs || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting reaction logs', error);
            throw error;
        }
    }

    // REAL-TIME DATA
    async getRealTimeData(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/realtime`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response || { reactions: [], fails: [], users: [] };
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting real-time data', error);
            throw error;
        }
    }

    async getRecentReactions(limit: number = 10): Promise<any[]> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/reactions/recent?limit=${limit}`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.reactions || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting recent reactions', error);
            return [];
        }
    }

    async getRecentFails(limit: number = 10): Promise<any[]> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/fails/recent?limit=${limit}`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.fails || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting recent fails', error);
            return [];
        }
    }

    async getActiveUsers(limit: number = 10): Promise<any[]> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/users/active?limit=${limit}`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.users || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting active users', error);
            return [];
        }
    }

    // DATABASE ANALYSIS - VERSION COMPLÈTE
    async analyzeDatabaseIntegrity(): Promise<any> {
        this.debugService.addLog('info', 'AdminMysqlService', 'Starting comprehensive database integrity analysis...');

        try {
            // Récupérer toutes les données d'analyse en parallèle
            const [stats, integrity, performance, inconsistencies] = await Promise.all([
                this.getDatabaseStats(),
                this.checkDataIntegrity(),
                this.checkPerformanceMetrics(),
                this.findDataInconsistencies()
            ]);

            const analysis: any = {
                stats,
                integrity,
                performance,
                inconsistencies,
                recommendations: [],
                analysis_date: new Date().toISOString(),
                analysis_duration: 0
            };

            // Générer les recommandations basées sur l'analyse
            analysis.recommendations = this.generateRecommendations(analysis);

            // Calculer un score de santé global
            analysis.health_score = this.calculateHealthScore(analysis);

            this.debugService.addLog('info', 'AdminMysqlService', 'Comprehensive database analysis completed', {
                health_score: analysis.health_score,
                recommendations_count: analysis.recommendations.length,
                inconsistencies_count: analysis.inconsistencies.length
            });

            return analysis;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error analyzing database integrity', error);
            throw error;
        }
    }

    async getDatabaseStats(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/database/stats`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.stats || {};
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting database stats', error);
            return {};
        }
    }

    async checkDataIntegrity(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/database/integrity`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.integrity || {};
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error checking data integrity', error);
            return {};
        }
    }

    async checkPerformanceMetrics(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/database/performance`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.performance || {};
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error checking performance metrics', error);
            return {};
        }
    }

    async findDataInconsistencies(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/database/inconsistencies`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.inconsistencies || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error finding data inconsistencies', error);
            return [];
        }
    }

    // USER DETAILS
    async getUserReactionDetails(userId: string, failId: string): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/users/${userId}/reactions/${failId}`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response || {};
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting user reaction details', error);
            throw error;
        }
    }

    // EXPORT FUNCTIONS
    async exportAllLogs(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/export/logs`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            this.debugService.addLog('info', 'AdminMysqlService', 'Logs exported successfully');
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error exporting logs', error);
            throw error;
        }
    }

    async exportDatabaseData(): Promise<any> {
        try {
            const response = await this.http.get(`${this.apiUrl}/admin/export/database`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            this.debugService.addLog('info', 'AdminMysqlService', 'Database data exported successfully');
            return response;
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error exporting database data', error);
            throw error;
        }
    }

    // USER ACTIVITIES AVEC RECHERCHE
    async getUserActivitiesAdvanced(searchTerm?: string, filterBy?: string, dateFilter?: string): Promise<any[]> {
        try {
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (filterBy && filterBy !== 'all') params.append('filter', filterBy);
            if (dateFilter && dateFilter !== 'all') params.append('date', dateFilter);

            const response = await this.http.get(`${this.apiUrl}/admin/users/activities?${params.toString()}`, {
                headers: this.getAuthHeaders()
            }).toPromise() as any;

            return response.activities || [];
        } catch (error) {
            this.debugService.addLog('error', 'AdminMysqlService', 'Error getting user activities', error);
            throw error;
        }
    }

    // MÉTHODE UTILITAIRE POUR FILTRAGE PAR DATE
    private getDateFilter(filter: string): string {
        const now = new Date();
        switch (filter) {
            case 'today':
                return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
            case 'week':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                return weekAgo.toISOString();
            case 'month':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                return monthAgo.toISOString();
            default:
                return new Date(0).toISOString();
        }
    }

    // GÉNÉRATION DE RECOMMANDATIONS POUR L'ANALYSE DE BASE DE DONNÉES
    private generateRecommendations(analysis: any): string[] {
        const recommendations = [];

        if (analysis.stats && analysis.stats.system_logs_count > 10000) {
            recommendations.push('Archiver les anciens logs système');
        }

        if (analysis.stats && analysis.stats.users_count === 0) {
            recommendations.push('Base de données vide - créer des données de test');
        }

        if (analysis.performance && analysis.performance.slow_queries > 5) {
            recommendations.push('Optimiser les requêtes lentes détectées');
        }

        if (analysis.integrity && analysis.integrity.orphaned_records > 0) {
            recommendations.push('Nettoyer les enregistrements orphelins');
        }

        if (analysis.stats && analysis.stats.disk_usage > 80) {
            recommendations.push('Libérer de l\'espace disque - usage critique');
        }

        if (analysis.inconsistencies && analysis.inconsistencies.length > 0) {
            recommendations.push('Corriger les incohérences de données détectées');
        }

        if (recommendations.length === 0) {
            recommendations.push('Système en bon état - aucune action requise');
        }

        return recommendations;
    }

    // CALCUL DU SCORE DE SANTÉ DE LA BASE DE DONNÉES
    private calculateHealthScore(analysis: any): number {
        let score = 100;

        // Pénalités basées sur les problèmes détectés
        if (analysis.inconsistencies && analysis.inconsistencies.length > 0) {
            score -= analysis.inconsistencies.length * 5; // -5 points par incohérence
        }

        if (analysis.performance && analysis.performance.slow_queries > 0) {
            score -= analysis.performance.slow_queries * 3; // -3 points par requête lente
        }

        if (analysis.integrity && analysis.integrity.orphaned_records > 0) {
            score -= Math.min(analysis.integrity.orphaned_records * 2, 20); // -2 points par orphelin, max -20
        }

        if (analysis.stats) {
            if (analysis.stats.disk_usage > 90) {
                score -= 20; // Usage disque critique
            } else if (analysis.stats.disk_usage > 80) {
                score -= 10; // Usage disque élevé
            }

            if (analysis.stats.system_logs_count > 50000) {
                score -= 10; // Trop de logs
            }
        }

        // S'assurer que le score reste entre 0 et 100
        return Math.max(0, Math.min(100, score));
    }
}