import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, ViewWillEnter, ToastController } from '@ionic/angular/standalone';
import { Fail } from '../../models/fail.model';
import { FailService } from '../../services/fail.service';
import { BadgeService } from '../../services/badge.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { FailCategory } from '../../models/enums';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-fail-card',
  templateUrl: './fail-card.component.html',
  styleUrls: ['./fail-card.component.scss'],
  imports: [CommonModule, IonButton, IonIcon, TimeAgoPipe]
})
export class FailCardComponent implements OnInit, ViewWillEnter {
  @Input() fail!: Fail;
  userReactions: string[] = []; // Array des réactions de l'utilisateur

  private encouragementMessages = [
    'Chaque échec est un pas vers la réussite ! 💪',
    'Tu as eu le courage de le partager ! 🌟',
    'On grandit à travers nos erreurs ! 🌱',
    'Bravo pour ton honnêteté ! ❤️',
    'Tu n\'es pas seul(e) dans cette aventure ! 🤝',
    'L\'imperfection, c\'est la perfection ! ✨'
  ];

  constructor(
    private failService: FailService,
    private toastController: ToastController,
    private badgeService: BadgeService
  ) { }

  async ngOnInit() {
    // Récupérer la réaction actuelle de l'utilisateur pour ce fail
    await this.loadUserReaction();
  }

  ionViewWillEnter() {
    // Recharger la réaction utilisateur à chaque fois que la vue devient active
    this.loadUserReaction();
  }

  private async loadUserReaction() {
    try {
      this.userReactions = await this.failService.getUserReactionsForFail(this.fail.id);
    } catch (error) {
      console.error('❌ Error loading user reactions:', error);
      this.userReactions = [];
    }
  }

  async onCourage() {
    // Si l'utilisateur a déjà réagi avec courage, ne rien faire
    if (this.userReactions.includes('courage')) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Fallback si haptics non disponible
    }

    try {
      await this.failService.addReaction(this.fail.id, 'courage');

      // Mise à jour optimiste locale
      this.userReactions.push('courage');
      this.fail.reactions.courage++;

      // Vérifier les nouveaux badges (sans logs excessifs)
      this.checkForNewBadges();
    } catch (error) {
      console.error('❌ Error during courage reaction:', error);
      // Rollback en cas d'erreur
      this.userReactions = this.userReactions.filter(r => r !== 'courage');
      this.fail.reactions.courage--;
    }
  }

  async onLaugh() {
    // Si l'utilisateur a déjà réagi avec laugh, ne rien faire
    if (this.userReactions.includes('laugh')) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      // Fallback si haptics non disponible
    }

    try {
      await this.failService.addReaction(this.fail.id, 'laugh');

      // Mise à jour optimiste locale
      this.userReactions.push('laugh');
      this.fail.reactions.laugh++;

      // Vérifier les nouveaux badges
      this.checkForNewBadges();
    } catch (error) {
      console.error('❌ Error during laugh reaction:', error);
      // Rollback en cas d'erreur
      this.userReactions = this.userReactions.filter(r => r !== 'laugh');
      this.fail.reactions.laugh--;
    }
  }

  async onEmpathy() {
    // Si l'utilisateur a déjà réagi avec empathy, ne rien faire
    if (this.userReactions.includes('empathy')) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Fallback si haptics non disponible
    }

    try {
      await this.failService.addReaction(this.fail.id, 'empathy');

      // Mise à jour optimiste locale
      this.userReactions.push('empathy');
      this.fail.reactions.empathy++;

      // Vérifier les nouveaux badges
      this.checkForNewBadges();
    } catch (error) {
      console.error('❌ Error during empathy reaction:', error);
      // Rollback en cas d'erreur
      this.userReactions = this.userReactions.filter(r => r !== 'empathy');
      this.fail.reactions.empathy--;
    }
  }

  async onSupport() {
    // Si l'utilisateur a déjà réagi avec support, ne rien faire
    if (this.userReactions.includes('support')) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      // Fallback si haptics non disponible
    }

    try {
      await this.failService.addReaction(this.fail.id, 'support');

      // Mise à jour optimiste locale
      this.userReactions.push('support');
      this.fail.reactions.support++;

      // Vérifier les nouveaux badges
      this.checkForNewBadges();
    } catch (error) {
      console.error('❌ Error during support reaction:', error);
      // Rollback en cas d'erreur
      this.userReactions = this.userReactions.filter(r => r !== 'support');
      this.fail.reactions.support--;
    }
  }

  private async checkForNewBadges(): Promise<void> {
    try {
      const newBadges = await this.badgeService.checkBadgesAfterAction('reaction_given');

      if (newBadges.length > 0) {
        for (const badge of newBadges) {
          await this.showBadgeUnlockedToast(badge);
        }
      }
    } catch (error) {
      console.error('❌ Error checking badges:', error);
    }
  }

  private async showBadgeUnlockedToast(badge: any): Promise<void> {
    const toast = await this.toastController.create({
      message: `� Badge déverrouillé : ${badge.name} !`,
      duration: 4000,
      color: 'success',
      position: 'top',
      cssClass: 'badge-unlock-toast'
    });

    await toast.present();
  }

  isReactionActive(reactionType: string): boolean {
    return this.userReactions.includes(reactionType);
  }

  getCategoryColor(category: FailCategory): string {
    switch (category) {
      case FailCategory.COURAGE: return 'var(--courage-color)';
      case FailCategory.HUMOUR: return 'var(--humour-color)';
      case FailCategory.ENTRAIDE: return 'var(--entraide-color)';
      case FailCategory.PERSEVERANCE: return 'var(--perseverance-color)';
      case FailCategory.SPECIAL: return 'var(--special-color)';
      default: return 'var(--pastel-pink)';
    }
  }
}
