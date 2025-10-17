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

  // Debouncing pour éviter les requêtes excessives
  private lastLoadTime = 0;
  private readonly LOAD_DEBOUNCE_MS = 2000; // 2 secondes entre chargements
  private isLoading = false;
  private backendAvailable = true;
  private backendWarningShown = false;

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
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private async initializeNotifications(): Promise<void> {
    try {
      await this.loadNotifications();
      if (this.backendAvailable) {
        this.scheduleNotificationCheck();
      }
    } catch (error) {
      console.error('❌ Erreur initialisation notifications:', error);
    }
  }

  // Chargement des notifications avec debouncing
  async loadNotifications(): Promise<void> {
    if (!this.backendAvailable) {
      return;
    }

    const now = Date.now();
    
    // Debouncing : éviter les appels trop fréquents
    if (this.isLoading || (now - this.lastLoadTime) < this.LOAD_DEBOUNCE_MS) {
      console.log('🔄 NotificationService: Chargement ignoré (debounce)');
      return;
    }
    
    this.isLoading = true;
    this.lastLoadTime = now;
    
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/notifications`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        this.notifications.next(response.notifications);
        this.updateUnreadCount(response.notifications);
      } else {
        this.handleBackendError(new Error('Réponse notifications invalide'));
      }
    } catch (error) {
      console.error('❌ Erreur chargement notifications:', error);
      this.handleBackendError(error);
    } finally {
      this.isLoading = false;
    }
  }

  // Création de notifications
  async createNotification(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<boolean> {
    if (!this.backendAvailable) {
      return false;
    }
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
      this.handleBackendError(new Error('Réponse création notification invalide'));
      return false;
    } catch (error) {
      console.error('❌ Erreur création notification:', error);
      this.handleBackendError(error);
      return false;
    }
  }

  // Marquer comme lu
  async markAsRead(notificationId: string): Promise<boolean> {
    if (!this.backendAvailable) {
      return false;
    }
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
      this.handleBackendError(new Error('Réponse markAsRead invalide'));
      return false;
    } catch (error) {
      console.error('❌ Erreur marquage lecture:', error);
      this.handleBackendError(error);
      return false;
    }
  }

  // Marquer toutes comme lues
  async markAllAsRead(): Promise<boolean> {
    if (!this.backendAvailable) {
      return false;
    }
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
      this.handleBackendError(new Error('Réponse markAll invalide'));
      return false;
    } catch (error) {
      console.error('❌ Erreur marquage toutes lues:', error);
      this.handleBackendError(error);
      return false;
    }
  }

  // Suppression de notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    if (!this.backendAvailable) {
      return false;
    }
    try {
      const response: any = await this.http.delete(
        `${environment.api.baseUrl}/notifications/${notificationId}`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        await this.loadNotifications();
        return true;
      }
      this.handleBackendError(new Error('Réponse delete notification invalide'));
      return false;
    } catch (error) {
      console.error('❌ Erreur suppression notification:', error);
      this.handleBackendError(error);
      return false;
    }
  }

  // Nettoyage des anciennes notifications
  async cleanupOldNotifications(): Promise<boolean> {
    if (!this.backendAvailable) {
      return false;
    }
    try {
      const response: any = await this.http.delete(
        `${environment.api.baseUrl}/notifications/cleanup`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        await this.loadNotifications();
        return true;
      }
      this.handleBackendError(new Error('Réponse cleanup notifications invalide'));
      return false;
    } catch (error) {
      console.error('❌ Erreur nettoyage notifications:', error);
      this.handleBackendError(error);
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
    if (!this.backendAvailable) {
      this.preferences = { ...this.preferences, ...preferences };
      this.savePreferences();
      return true;
    }

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
      this.handleBackendError(new Error('Réponse update preferences invalide'));
      return false;
    } catch (error) {
      console.error('❌ Erreur mise à jour préférences:', error);
      this.handleBackendError(error);
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
    if (!this.backendAvailable) {
      return;
    }
    const interval = setInterval(() => {
      if (!this.backendAvailable) {
        clearInterval(interval);
        return;
      }
      if (document.visibilityState === 'visible') {
        void this.loadNotifications();
      }
    }, 60000);
  }

  // Statistiques
  async getNotificationStats(): Promise<any> {
    if (!this.backendAvailable) {
      return null;
    }
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/notifications/stats`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        return response.stats;
      }
      this.handleBackendError(new Error('Réponse stats notifications invalide'));
      return null;
    } catch (error) {
      console.error('❌ Erreur récupération stats notifications:', error);
      this.handleBackendError(error);
      return null;
    }
  }

  // Export des notifications
  async exportNotifications(): Promise<any[]> {
    if (!this.backendAvailable) {
      return [];
    }
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/notifications/export`,
        { headers: this.getAuthHeaders() }
      ).toPromise();

      if (response.success) {
        return response.notifications;
      }
      this.handleBackendError(new Error('Réponse export notifications invalide'));
      return [];
    } catch (error) {
      console.error('❌ Erreur export notifications:', error);
      this.handleBackendError(error);
      return [];
    }
  }

  private handleBackendError(error: any): void {
    const status = error?.status ?? error?.response?.status;
    if (status === 404 || status === 0 || status === 503 || error?.code === 'ERR_NETWORK') {
      this.backendAvailable = false;
      this.notifications.next([]);
      this.updateUnreadCount([]);
      console.warn('🔕 Backend notifications indisponible, désactivation des appels.', error);
      if (!this.backendWarningShown) {
        this.backendWarningShown = true;
        void this.presentWarningToast('Notifications indisponibles dans cet environnement.');
      }
    }
  }

  private async presentWarningToast(message: string): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message,
        duration: 3000,
        color: 'warning',
        icon: 'notifications-off-outline',
        position: 'bottom'
      });
      await toast.present();
    } catch (error) {
      console.warn('⚠️ Impossible d\'afficher le toast de notification:', error);
    }
  }
}
