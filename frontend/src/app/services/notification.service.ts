import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';
import { Platform } from '@ionic/angular';
import { ToastController, AlertController } from '@ionic/angular';

interface Notification {
  id?: string;
  userId: string;
  type: 'success' | 'warning' | 'error' | 'info' | 'badge' | 'system';
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionType?: string;
  actionData?: any;
}

interface NotificationPreferences {
  pushEnabled: boolean;
  emailEnabled: boolean;
  badgeNotifications: boolean;
  systemNotifications: boolean;
  dailyReminder: boolean;
  weeklyReport: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notifications.asObservable();
  
  private unreadCount = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCount.asObservable();

  private preferences: NotificationPreferences = {
    pushEnabled: true,
    emailEnabled: true,
    badgeNotifications: true,
    systemNotifications: true,
    dailyReminder: true,
    weeklyReport: false,
    soundEnabled: true,
    vibrationEnabled: true
  };

  constructor(
    private http: HttpClient,
    private platform: Platform,
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    console.log('🔔 NotificationService: Service de notifications initialisé');
    this.loadPreferences();
    this.initializeNotifications();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('faildaily_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private async initializeNotifications(): Promise<void> {
    try {
      await this.loadNotifications();
      this.scheduleNotificationCheck();
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error);
    }
  }

  // Chargement des notifications
  async loadNotifications(): Promise<void> {
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/notifications`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        this.notifications.next(response.notifications);
        this.updateUnreadCount(response.notifications);
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
    }
  }

  // Création de notifications
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      const response: any = await this.http.post(
        `${environment.api.baseUrl}/notifications`,
        notification,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        await this.loadNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
      return false;
    }
  }

  // Marquer comme lu
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const response: any = await this.http.put(
        `${environment.api.baseUrl}/notifications/${notificationId}/read`,
        {},
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        await this.loadNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur marquage lecture:', error);
      return false;
    }
  }

  // Marquer toutes comme lues
  async markAllAsRead(): Promise<boolean> {
    try {
      const response: any = await this.http.put(
        `${environment.api.baseUrl}/notifications/read-all`,
        {},
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        await this.loadNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur marquage toutes lues:', error);
      return false;
    }
  }

  // Suppression de notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const response: any = await this.http.delete(
        `${environment.api.baseUrl}/notifications/${notificationId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        await this.loadNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
      return false;
    }
  }

  // Nettoyage des anciennes notifications
  async cleanupOldNotifications(): Promise<boolean> {
    try {
      const response: any = await this.http.delete(
        `${environment.api.baseUrl}/notifications/cleanup`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        await this.loadNotifications();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur nettoyage notifications:', error);
      return false;
    }
  }

  // Notifications spécifiques
  async sendBadgeNotification(badgeName: string, badgeDescription: string): Promise<void> {
    await this.createNotification({
      userId: this.getCurrentUserId(),
      type: 'badge',
      title: '🏆 Nouveau badge débloqué !',
      message: `Félicitations ! Vous avez débloqué le badge "${badgeName}"`,
      data: {
        badgeName,
        badgeDescription
      },
      read: false
    });

    if (this.preferences.soundEnabled) {
      this.playNotificationSound();
    }

    await this.showToast('🏆 Nouveau badge débloqué !', 'success');
  }

  async sendSystemNotification(title: string, message: string, data?: any): Promise<void> {
    if (!this.preferences.systemNotifications) return;

    await this.createNotification({
      userId: this.getCurrentUserId(),
      type: 'system',
      title,
      message,
      data,
      read: false
    });
  }

  async sendDailyReminder(): Promise<void> {
    if (!this.preferences.dailyReminder) return;

    await this.createNotification({
      userId: this.getCurrentUserId(),
      type: 'info',
      title: '📅 Rappel quotidien',
      message: 'N\'oubliez pas de consulter vos fails d\'aujourd\'hui !',
      read: false
    });
  }

  async sendWeeklyReport(stats: any): Promise<void> {
    if (!this.preferences.weeklyReport) return;

    await this.createNotification({
      userId: this.getCurrentUserId(),
      type: 'info',
      title: '📊 Rapport hebdomadaire',
      message: `Cette semaine : ${stats.failsCount} fails, ${stats.badgesEarned} badges`,
      data: stats,
      read: false
    });
  }

  // Interface utilisateur
  async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' = 'primary'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      buttons: [
        {
          text: 'OK',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  async showAlert(title: string, message: string, buttons?: any[]): Promise<void> {
    const alert = await this.alertController.create({
      header: title,
      message,
      buttons: buttons || ['OK']
    });

    await alert.present();
  }

  async showConfirmAlert(title: string, message: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: title,
        message,
        buttons: [
          {
            text: 'Annuler',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Confirmer',
            handler: () => resolve(true)
          }
        ]
      });

      await alert.present();
    });
  }

  // Gestion des préférences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      this.preferences = { ...this.preferences, ...preferences };
      
      const response: any = await this.http.put(
        `${environment.api.baseUrl}/notifications/preferences`,
        this.preferences,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        this.savePreferences();
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Erreur mise à jour préférences:', error);
      return false;
    }
  }

  private loadPreferences(): void {
    try {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        this.preferences = { ...this.preferences, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.warn('⚠️ Erreur chargement préférences notifications:', error);
    }
  }

  private savePreferences(): void {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde préférences notifications:', error);
    }
  }

  // Utilitaires
  private updateUnreadCount(notifications: Notification[]): void {
    const unread = notifications.filter(n => !n.read).length;
    this.unreadCount.next(unread);
  }

  private getCurrentUserId(): string {
    try {
      const userStr = localStorage.getItem('current_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
      return '';
    } catch (error) {
      console.warn('⚠️ Erreur récupération ID utilisateur:', error);
      return '';
    }
  }

  private playNotificationSound(): void {
    if (this.platform.is('mobile') && this.preferences.soundEnabled) {
      // Son de notification mobile
      try {
        const audio = new Audio('assets/sounds/notification.mp3');
        audio.play();
      } catch (error) {
        console.warn('⚠️ Impossible de jouer le son de notification:', error);
      }
    }
  }

  private scheduleNotificationCheck(): void {
    // Vérifier les nouvelles notifications toutes les 30 secondes
    setInterval(() => {
      this.loadNotifications();
    }, 30000);
  }

  // Statistiques
  async getNotificationStats(): Promise<any> {
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/notifications/stats`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      return response.success ? response.stats : null;
    } catch (error) {
      console.error('❌ Erreur récupération stats notifications:', error);
      return null;
    }
  }

  // Export des notifications
  async exportNotifications(): Promise<any[]> {
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/notifications/export`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      return response.success ? response.notifications : [];
    } catch (error) {
      console.error('❌ Erreur export notifications:', error);
      return [];
    }
  }
}