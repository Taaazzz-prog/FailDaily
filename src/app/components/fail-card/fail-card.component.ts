import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { Fail } from '../../models/fail.model';
import { FailService } from '../../services/fail.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';
import { FailCategory } from '../../models/enums';
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

  constructor(private failService: FailService) { }

  ngOnInit() {
    // Le message d'encouragement est déjà dans le fail object
  }

  async onCourage() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      await this.failService.addReaction(this.fail.id, 'courage');
    } catch (error) {
      // Fallback si haptics non disponible
      await this.failService.addReaction(this.fail.id, 'courage');
    }
  }

  async onLaugh() {
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
      await this.failService.addReaction(this.fail.id, 'laugh');
    } catch (error) {
      await this.failService.addReaction(this.fail.id, 'laugh');
    }
  }

  async onEmpathy() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await this.failService.addReaction(this.fail.id, 'empathy');
    } catch (error) {
      await this.failService.addReaction(this.fail.id, 'empathy');
    }
  }

  async onSupport() {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await this.failService.addReaction(this.fail.id, 'support');
    } catch (error) {
      await this.failService.addReaction(this.fail.id, 'support');
    }
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
