import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { EventBusService, AppEvents } from './event-bus.service';
import { Badge } from '../models/badge.model';

@Injectable({
  providedIn: 'root'
})
export class BadgeNotificationService {

  constructor(
    private toastController: ToastController,
    private eventBus: EventBusService
  ) {
    this.setupBadgeNotifications();
  }

  /**
   * Configure les notifications de badges débloqués
   */
  private setupBadgeNotifications(): void {
    this.eventBus.on(AppEvents.BADGE_UNLOCKED).subscribe(async (payload) => {
      if (payload?.badges && Array.isArray(payload.badges)) {
        for (const badge of payload.badges) {
          await this.showBadgeUnlockedToast(badge);
        }
      }
    });
  }

  /**
   * Affiche une notification toast pour un badge débloqué
   */
  private async showBadgeUnlockedToast(badge: Badge): Promise<void> {
    const toast = await this.toastController.create({
      header: '🏆 Nouveau Badge Débloqué !',
      message: `${badge.name}: ${badge.description}`,
      duration: 4000,
      position: 'top',
      color: 'success',
      cssClass: 'badge-toast',
      buttons: [
        {
          text: 'Voir',
          role: 'info',
          handler: () => {
            // Naviguer vers la page des badges
            // Cette logique peut être ajoutée plus tard
            console.log('Navigation vers la page badges');
          }
        },
        {
          text: 'Fermer',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }

  /**
   * Affiche une notification pour plusieurs badges débloqués
   */
  async showMultipleBadgesUnlocked(badges: Badge[]): Promise<void> {
    if (badges.length === 0) return;

    if (badges.length === 1) {
      await this.showBadgeUnlockedToast(badges[0]);
      return;
    }

    const toast = await this.toastController.create({
      header: `🎉 ${badges.length} Nouveaux Badges !`,
      message: `Félicitations ! Vous avez débloqué ${badges.length} badges.`,
      duration: 5000,
      position: 'top',
      color: 'success',
      cssClass: 'multiple-badges-toast',
      buttons: [
        {
          text: 'Voir tous',
          role: 'info',
          handler: () => {
            console.log('Navigation vers la page badges');
          }
        },
        {
          text: 'Fermer',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}