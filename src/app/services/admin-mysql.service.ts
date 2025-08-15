import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, from, map, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { DebugService } from './debug.service';

@Injectable({
    providedIn: 'root'
})
export class AdminMysqlService {
    private apiUrl = environment.api.baseUrl || 'http://localhost:3001/api';

    constructor(
        private http: HttpClient,
        private debugService: DebugService
    ) { 
        console.log('🔧 AdminMysqlService: Initialisation du service admin MySQL');
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
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
}