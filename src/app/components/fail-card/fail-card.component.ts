import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, ViewWillEnter, ToastController } from '@ionic/angular/standalone';
import { Fail } from '../../models/fail.model';
import { FailService } from '../../services/fail.service';
import { BadgeService } from '../../services/badge.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { FailCategory } from '../../models/enums';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { failLog } from '../../utils/logger';

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
      failLog('Erreur lors du chargement des réactions utilisateur:', error);
      this.userReactions = [];
    }
  }

  async onCourage() {
    // Si l'utilisateur a déjà réagi avec courage, ne rien faire
    if (this.userReactions.includes('courage')) {
      return;
    }

    // Sauvegarder l'état actuel pour le rollback
    const originalCount = this.fail.reactions.courage;
    const originalReactions = [...this.userReactions];

    try {
      // Haptics avec gestion d'erreur silencieuse
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (hapticError) {
        // Ignore les erreurs de haptic
      }

      // Mise à jour optimiste immédiate
      this.userReactions.push('courage');
      this.fail.reactions.courage++;

      // Tenter l'ajout de la réaction
      await this.failService.addReaction(this.fail.id, 'courage');

      // Vérifier les nouveaux badges seulement si la réaction a réussi
      this.checkForNewBadges();
    } catch (error) {
      // Rollback complet en cas d'erreur
      this.userReactions = originalReactions;
      this.fail.reactions.courage = originalCount;

      // Log l'erreur pour le debug mais n'affiche pas à l'utilisateur
      failLog('Erreur lors de la réaction courage:', error);
    }
  }

  async onLaugh() {
    // Si l'utilisateur a déjà réagi avec laugh, ne rien faire
    if (this.userReactions.includes('laugh')) {
      return;
    }

    // Sauvegarder l'état actuel pour le rollback
    const originalCount = this.fail.reactions.laugh;
    const originalReactions = [...this.userReactions];

    try {
      // Haptics avec gestion d'erreur silencieuse
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (hapticError) {
        // Ignore les erreurs de haptic
      }

      // Mise à jour optimiste immédiate
      this.userReactions.push('laugh');
      this.fail.reactions.laugh++;

      // Tenter l'ajout de la réaction
      await this.failService.addReaction(this.fail.id, 'laugh');

      // Vérifier les nouveaux badges seulement si la réaction a réussi
      this.checkForNewBadges();
    } catch (error) {
      // Rollback complet en cas d'erreur
      this.userReactions = originalReactions;
      this.fail.reactions.laugh = originalCount;

      // Log l'erreur pour le debug mais n'affiche pas à l'utilisateur
      failLog('Erreur lors de la réaction laugh:', error);
    }
  }

  async onEmpathy() {
    // Si l'utilisateur a déjà réagi avec empathy, ne rien faire
    if (this.userReactions.includes('empathy')) {
      return;
    }

    // Sauvegarder l'état actuel pour le rollback
    const originalCount = this.fail.reactions.empathy;
    const originalReactions = [...this.userReactions];

    try {
      // Haptics avec gestion d'erreur silencieuse
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (hapticError) {
        // Ignore les erreurs de haptic
      }

      // Mise à jour optimiste immédiate
      this.userReactions.push('empathy');
      this.fail.reactions.empathy++;

      // Tenter l'ajout de la réaction
      await this.failService.addReaction(this.fail.id, 'empathy');

      // Vérifier les nouveaux badges seulement si la réaction a réussi
      this.checkForNewBadges();
    } catch (error) {
      // Rollback complet en cas d'erreur
      this.userReactions = originalReactions;
      this.fail.reactions.empathy = originalCount;

      // Log l'erreur pour le debug mais n'affiche pas à l'utilisateur
      failLog('Erreur lors de la réaction empathy:', error);

      // Optionnel: Afficher un toast discret à l'utilisateur
      // this.presentErrorToast('Impossible d\'ajouter la réaction pour le moment');
    }
  }

  async onSupport() {
    // Si l'utilisateur a déjà réagi avec support, ne rien faire
    if (this.userReactions.includes('support')) {
      return;
    }

    // Sauvegarder l'état actuel pour le rollback
    const originalCount = this.fail.reactions.support;
    const originalReactions = [...this.userReactions];

    try {
      // Haptics avec gestion d'erreur silencieuse
      try {
        await Haptics.impact({ style: ImpactStyle.Medium });
      } catch (hapticError) {
        // Ignore les erreurs de haptic
      }

      // Mise à jour optimiste immédiate
      this.userReactions.push('support');
      this.fail.reactions.support++;

      // Tenter l'ajout de la réaction
      await this.failService.addReaction(this.fail.id, 'support');

      // Vérifier les nouveaux badges seulement si la réaction a réussi
      this.checkForNewBadges();
    } catch (error) {
      // Rollback complet en cas d'erreur
      this.userReactions = originalReactions;
      this.fail.reactions.support = originalCount;

      // Log l'erreur pour le debug mais n'affiche pas à l'utilisateur
      failLog('Erreur lors de la réaction support:', error);

      // Optionnel: Afficher un toast discret à l'utilisateur
      // this.presentErrorToast('Impossible d\'ajouter la réaction pour le moment');
    }
  }

  private async checkForNewBadges(): Promise<void> {
    try {
      // Ne plus déclencher de vérification ici car c'est déjà géré par l'EventBus
      // L'EventBus écoute REACTION_GIVEN et déclenche automatiquement la vérification
      // Évite les doublons et améliore les performances
      console.log('🏆 Badge check delegated to EventBus system');
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
