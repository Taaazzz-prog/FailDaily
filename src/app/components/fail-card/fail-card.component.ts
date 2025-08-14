import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon, ViewWillEnter, ToastController, PopoverController } from '@ionic/angular/standalone';
import { Fail } from '../../models/fail.model';
import { FailService } from '../../services/fail.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { FailCategory } from '../../models/enums';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { SupabaseService } from '../../services/supabase.service';
import { AuthService } from '../../services/auth.service';

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
    private cdr: ChangeDetectorRef
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
      console.log('Erreur lors du chargement des réactions utilisateur:', error);
      this.userReactions = [];
    }
  }

  async onCourage() {
    if (this.userReactions.includes('courage')) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (hapticError) {
      // Ignore les erreurs de haptic
    }

    try {
      // 1. Envoyer à la base
      await this.failService.addReaction(this.fail.id, 'courage');

      // 2. Récupérer la VRAIE valeur de la base
      const updatedFail = await this.failService.getFailById(this.fail.id);
      if (updatedFail) {
        this.fail.reactions = updatedFail.reactions;
      }

      // 3. Recharger les réactions utilisateur
      await this.loadUserReaction();
      this.cdr.detectChanges();
    } catch (error) {
      console.log('Erreur lors de la réaction courage:', error);
    }
  }

  async onLaugh() {
    if (this.userReactions.includes('laugh')) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (hapticError) {
      // Ignore les erreurs de haptic
    }

    try {
      // 1. Envoyer à la base
      await this.failService.addReaction(this.fail.id, 'laugh');

      // 2. Récupérer la VRAIE valeur de la base
      const updatedFail = await this.failService.getFailById(this.fail.id);
      if (updatedFail) {
        this.fail.reactions = updatedFail.reactions;
      }

      // 3. Recharger les réactions utilisateur
      await this.loadUserReaction();
      this.cdr.detectChanges();
    } catch (error) {
      console.log('Erreur lors de la réaction laugh:', error);
    }
  }

  async onEmpathy() {
    if (this.userReactions.includes('empathy')) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (hapticError) {
      // Ignore les erreurs de haptic
    }

    try {
      // 1. Envoyer à la base
      await this.failService.addReaction(this.fail.id, 'empathy');

      // 2. Récupérer la VRAIE valeur de la base
      const updatedFail = await this.failService.getFailById(this.fail.id);
      if (updatedFail) {
        this.fail.reactions = updatedFail.reactions;
      }

      // 3. Recharger les réactions utilisateur
      await this.loadUserReaction();
      this.cdr.detectChanges();
    } catch (error) {
      console.log('Erreur lors de la réaction empathy:', error);
    }
  }

  async onSupport() {
    if (this.userReactions.includes('support')) {
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (hapticError) {
      // Ignore les erreurs de haptic
    }

    try {
      // 1. Envoyer à la base
      await this.failService.addReaction(this.fail.id, 'support');

      // 2. Récupérer la VRAIE valeur de la base
      const updatedFail = await this.failService.getFailById(this.fail.id);
      if (updatedFail) {
        this.fail.reactions = updatedFail.reactions;
      }

      // 3. Recharger les réactions utilisateur
      await this.loadUserReaction();
      this.cdr.detectChanges();
    } catch (error) {
      console.log('Erreur lors de la réaction support:', error);
    }
  }

  /**
   * Recharge les données du fail depuis la base de données
   */
  private async refreshFailData() {
    try {
      console.log(`🔄 Refreshing data for fail ${this.fail.id}...`);
      console.log(`🔄 Current reactions:`, this.fail.reactions);

      // Attendre un peu pour que la base de données soit à jour
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedFail = await this.failService.getFailById(this.fail.id);
      if (updatedFail) {
        console.log(`✅ Updated reactions from DB:`, updatedFail.reactions);

        // Mettre à jour les compteurs de réactions
        this.fail.reactions = { ...updatedFail.reactions };

        console.log(`✅ Local reactions after update:`, this.fail.reactions);

        // Forcer la détection de changement
        this.cdr.detectChanges();
      }

      // Recharger les réactions de l'utilisateur
      await this.loadUserReaction();
    } catch (error) {
      console.log('❌ Erreur lors du refresh des données du fail:', error);
    }
  }

  isReactionActive(reactionType: string): boolean {
    return this.userReactions.includes(reactionType);
  }

  getCategoryColor(category: FailCategory): string {
    const colors: { [key: string]: string } = {
      [FailCategory.COURAGE]: 'primary',
      [FailCategory.HUMOUR]: 'secondary',
      [FailCategory.ENTRAIDE]: 'tertiary',
      [FailCategory.PERSEVERANCE]: 'success',
      [FailCategory.SPECIAL]: 'warning',
      [FailCategory.TRAVAIL]: 'danger',
      [FailCategory.SPORT]: 'medium',
      [FailCategory.CUISINE]: 'dark',
      [FailCategory.TRANSPORT]: 'light',
      [FailCategory.TECHNOLOGIE]: 'secondary',
      [FailCategory.RELATIONS]: 'primary',
      [FailCategory.FINANCES]: 'tertiary',
      [FailCategory.BRICOLAGE]: 'success',
      [FailCategory.APPRENTISSAGE]: 'danger',
      [FailCategory.SANTE]: 'warning',
      [FailCategory.VOYAGE]: 'medium',
      [FailCategory.COMMUNICATION]: 'dark'
    };
    return colors[category] || 'medium';
  }
}
