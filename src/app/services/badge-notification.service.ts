import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { EventBusService, AppEvents } from './event-bus.service';
import { CelebrationService } from './celebration.service';
import { Badge } from '../models/badge.model';

@Injectable({
  providedIn: 'root'
})
export class BadgeNotificationService {

  constructor(
    private toastController: ToastController,
    private router: Router,
    private eventBus: EventBusService,
    private celebrationService: CelebrationService
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
      message: `<div class="badge-notification">
        <div class="badge-info">
          <ion-icon name="${badge.icon}" class="badge-icon-toast"></ion-icon>
          <div class="badge-details">
            <div class="badge-name">${badge.name}</div>
            <div class="badge-description">${badge.description}</div>
            <div class="badge-rarity rarity-${badge.rarity}">${this.getRarityDisplayName(badge.rarity)}</div>
          </div>
        </div>
      </div>`,
      duration: 6000,
      position: 'top',
      color: 'success',
      cssClass: `badge-toast badge-toast-${badge.rarity}`,
      buttons: [
        {
          text: '👀 Voir mes badges',
          role: 'info',
          handler: () => {
            this.navigateToBadges();
          }
        },
        {
          text: '✨',
          role: 'cancel',
          handler: () => {
            // Animation de celebration
            this.triggerCelebrationEffect();
          }
        }
      ]
    });

    await toast.present();

    // Son de notification (si disponible)
    this.playNotificationSound();
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
            this.navigateToBadges();
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
   * Navigue vers la page des badges
   */
  private navigateToBadges(): void {
    this.router.navigate(['/badges'], {
      queryParams: { highlight: 'recent' }
    });
  }

  /**
   * Retourne le nom d'affichage d'une rareté
   */
  private getRarityDisplayName(rarity: string): string {
    const rarityMap: { [key: string]: string } = {
      'common': 'Commun',
      'rare': 'Rare',
      'epic': 'Épique',
      'legendary': 'Légendaire'
    };
    return rarityMap[rarity] || rarity;
  }

  /**
   * Déclenche un effet de célébration
   */
  private triggerCelebrationEffect(): void {
    this.celebrationService.triggerConfetti();
    this.celebrationService.triggerHapticFeedback([100, 30, 100, 30, 100]);
  }  /**
   * Joue un son de notification (si disponible)
   */
  private playNotificationSound(): void {
    try {
      // Son de notification simple
      const audio = new Audio('assets/sounds/badge-unlock.mp3');
      audio.volume = 0.3;
      audio.play().catch(() => {
        // Son non disponible, pas grave
      });
    } catch (e) {
      // Audio non supporté, pas grave
    }
  }
}