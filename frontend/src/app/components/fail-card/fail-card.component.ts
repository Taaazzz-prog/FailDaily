import { Component, Input, OnInit, OnDestroy, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Fail } from '../../models/fail.model';
import { FailService } from '../../services/fail.service';
import { ImageUrlService } from '../../services/image-url.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { FailCategory } from '../../models/enums';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { MysqlService } from '../../services/mysql.service';
import { CommentsThreadComponent } from '../comments-thread/comments-thread.component';
import { ToastController, PopoverController, ViewWillEnter } from '@ionic/angular';
import { ImageFallbackDirective } from '../../directives/image-fallback.directive';

@Component({
  selector: 'app-fail-card',
  templateUrl: './fail-card.component.html',
  styleUrls: ['./fail-card.component.scss'],
  imports: [
    CommonModule, 
    IonicModule,
    TimeAgoPipe, 
    CommentsThreadComponent,
    ImageFallbackDirective
  ]
})
export class FailCardComponent implements OnInit, ViewWillEnter {
  @Input() fail!: Fail;
  userReactions: string[] = []; // Array des réactions de l'utilisateur
  showComments = false;
  hidden = false;
  pulseFlags: Record<string, boolean> = { courage: false, laugh: false, empathy: false, support: false };

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
    private imageUrlService: ImageUrlService,
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
      // toggle off
      try {
        const res: any = await this.failService.removeReaction(this.fail.id, 'courage');
        if (res?.summary) {
          this.fail.reactions = {
            courage: res.summary.counts.courage || 0,
            empathy: res.summary.counts.empathy || 0,
            laugh: res.summary.counts.laugh || 0,
            support: res.summary.counts.support || 0,
          } as any;
          this.userReactions = res.summary.userReaction ? [res.summary.userReaction] : [];
          this.cdr.detectChanges();
          this.triggerPulse('courage');
        } else {
          await this.refreshFailData();
        }
      } catch (e) { console.log('toggle courage off error', e); }
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (hapticError) {
      // Ignore les erreurs de haptic
    }

    try {
      const res: any = await this.failService.addReaction(this.fail.id, 'courage');
      if (res?.summary) {
        this.fail.reactions = {
          courage: res.summary.counts.courage || 0,
          empathy: res.summary.counts.empathy || 0,
          laugh: res.summary.counts.laugh || 0,
          support: res.summary.counts.support || 0,
        } as any;
        this.userReactions = res.summary.userReaction ? [res.summary.userReaction] : [];
        this.cdr.detectChanges();
        this.triggerPulse('courage');
      } else {
        await this.refreshFailData();
      }
    } catch (error) {
      console.log('Erreur lors de la réaction courage:', error);
    }
  }

  async onLaugh() {
    if (this.userReactions.includes('laugh')) {
      try {
        const res: any = await this.failService.removeReaction(this.fail.id, 'laugh');
        if (res?.summary) {
          this.fail.reactions = {
            courage: res.summary.counts.courage || 0,
            empathy: res.summary.counts.empathy || 0,
            laugh: res.summary.counts.laugh || 0,
            support: res.summary.counts.support || 0,
          } as any;
          this.userReactions = res.summary.userReaction ? [res.summary.userReaction] : [];
          this.cdr.detectChanges();
          this.triggerPulse('laugh');
        } else {
          await this.refreshFailData();
        }
      } catch (e) { console.log('toggle laugh off error', e); }
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (hapticError) {
      // Ignore les erreurs de haptic
    }

    try {
      const res: any = await this.failService.addReaction(this.fail.id, 'laugh');
      if (res?.summary) {
        this.fail.reactions = {
          courage: res.summary.counts.courage || 0,
          empathy: res.summary.counts.empathy || 0,
          laugh: res.summary.counts.laugh || 0,
          support: res.summary.counts.support || 0,
        } as any;
        this.userReactions = res.summary.userReaction ? [res.summary.userReaction] : [];
        this.cdr.detectChanges();
        this.triggerPulse('laugh');
      } else {
        await this.refreshFailData();
      }
    } catch (error) {
      console.log('Erreur lors de la réaction laugh:', error);
    }
  }

  async onEmpathy() {
    if (this.userReactions.includes('empathy')) {
      try {
        const res: any = await this.failService.removeReaction(this.fail.id, 'empathy');
        if (res?.summary) {
          this.fail.reactions = {
            courage: res.summary.counts.courage || 0,
            empathy: res.summary.counts.empathy || 0,
            laugh: res.summary.counts.laugh || 0,
            support: res.summary.counts.support || 0,
          } as any;
          this.userReactions = res.summary.userReaction ? [res.summary.userReaction] : [];
          this.cdr.detectChanges();
          this.triggerPulse('empathy');
        } else {
          await this.refreshFailData();
        }
      } catch (e) { console.log('toggle empathy off error', e); }
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (hapticError) {
      // Ignore les erreurs de haptic
    }

    try {
      const res: any = await this.failService.addReaction(this.fail.id, 'empathy');
      if (res?.summary) {
        this.fail.reactions = {
          courage: res.summary.counts.courage || 0,
          empathy: res.summary.counts.empathy || 0,
          laugh: res.summary.counts.laugh || 0,
          support: res.summary.counts.support || 0,
        } as any;
        this.userReactions = res.summary.userReaction ? [res.summary.userReaction] : [];
        this.cdr.detectChanges();
        this.triggerPulse('empathy');
      } else {
        await this.refreshFailData();
      }
    } catch (error) {
      console.log('Erreur lors de la réaction empathy:', error);
    }
  }

  async onSupport() {
    if (this.userReactions.includes('support')) {
      try {
        const res: any = await this.failService.removeReaction(this.fail.id, 'support');
        if (res?.summary) {
          this.fail.reactions = {
            courage: res.summary.counts.courage || 0,
            empathy: res.summary.counts.empathy || 0,
            laugh: res.summary.counts.laugh || 0,
            support: res.summary.counts.support || 0,
          } as any;
          this.userReactions = res.summary.userReaction ? [res.summary.userReaction] : [];
          this.cdr.detectChanges();
          this.triggerPulse('support');
        } else {
          await this.refreshFailData();
        }
      } catch (e) { console.log('toggle support off error', e); }
      return;
    }

    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (hapticError) {
      // Ignore les erreurs de haptic
    }

    try {
      const res: any = await this.failService.addReaction(this.fail.id, 'support');
      if (res?.summary) {
        this.fail.reactions = {
          courage: res.summary.counts.courage || 0,
          empathy: res.summary.counts.empathy || 0,
          laugh: res.summary.counts.laugh || 0,
          support: res.summary.counts.support || 0,
        } as any;
        this.userReactions = res.summary.userReaction ? [res.summary.userReaction] : [];
        this.cdr.detectChanges();
        this.triggerPulse('support');
      } else {
        await this.refreshFailData();
      }
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

  async onReportFail() {
    try {
      const ok = await this.failService.reportFail(this.fail.id);
      if (ok) {
        this.hidden = true; // masquer localement
        (await this.toastController.create({ message: 'Fail signalé', duration: 1500, color: 'warning' })).present();
        this.cdr.detectChanges();
      }
    } catch {}
  }

  private triggerPulse(type: 'courage' | 'laugh' | 'empathy' | 'support') {
    this.pulseFlags[type] = true;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.pulseFlags[type] = false;
      this.cdr.detectChanges();
    }, 400);
  }

  // Méthodes pour gérer les URLs d'images
  getFailImageUrl(): string {
    return this.imageUrlService.getFailImageUrl(this.fail.imageUrl);
  }

  getAuthorAvatarUrl(): string {
    return this.imageUrlService.getAvatarUrl(this.fail.authorAvatar);
  }
}
