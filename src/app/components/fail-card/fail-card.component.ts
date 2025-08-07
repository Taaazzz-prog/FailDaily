import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { Fail } from '../../models/fail.model';
import { FailService } from '../../services/fail.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

@Component({
  selector: 'app-fail-card',
  templateUrl: './fail-card.component.html',
  styleUrls: ['./fail-card.component.scss'],
  imports: [CommonModule, IonButton, IonIcon, TimeAgoPipe]
})
export class FailCardComponent implements OnInit {
  @Input() fail!: Fail;

  private encouragementMessages = [
    'Chaque échec est un pas vers la réussite ! 💪',
    'Tu as eu le courage de le partager ! 🌟',
    'On grandit à travers nos erreurs ! 🌱',
    'Bravo pour ton honnêteté ! ❤️',
    'Tu n\'es pas seul(e) dans cette aventure ! 🤝',
    'L\'imperfection, c\'est la perfection ! ✨'
  ];

  // Message d'encouragement fixe pour éviter les changements après détection
  encouragementMessage = '';

  constructor(private failService: FailService) { }

  ngOnInit() {
    // Générer le message d'encouragement une seule fois à l'initialisation
    this.encouragementMessage = this.getRandomEncouragement();
  }

  async onCourageHeart() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      await this.failService.addReaction(this.fail.id, 'courageHearts');
    } catch (error) {
      // Fallback si haptics non disponible
      await this.failService.addReaction(this.fail.id, 'courageHearts');
    }
  }

  async onLaugh() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      await this.failService.addReaction(this.fail.id, 'laughs');
    } catch (error) {
      await this.failService.addReaction(this.fail.id, 'laughs');
    }
  }

  async onSupport() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await this.failService.addReaction(this.fail.id, 'supports');
    } catch (error) {
      await this.failService.addReaction(this.fail.id, 'supports');
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'WORK': return 'var(--fail-blue)';
      case 'COOKING': return 'var(--fail-peach)';
      case 'SPORT': return 'var(--fail-mint)';
      case 'SOCIAL': return 'var(--fail-lavender)';
      case 'OTHER': return 'var(--fail-yellow)';
      default: return 'var(--fail-pink)';
    }
  }

  private getRandomEncouragement(): string {
    const randomIndex = Math.floor(Math.random() * this.encouragementMessages.length);
    return this.encouragementMessages[randomIndex];
  }
}
