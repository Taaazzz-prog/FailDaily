import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HttpAuthService } from '../../services/http-auth.service';

@Component({
  standalone: true,
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule]
})
export class ResetPasswordPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(HttpAuthService);

  token = signal<string>('');
  newPassword = signal<string>('');
  confirmPassword = signal<string>('');
  isSubmitting = signal<boolean>(false);
  error = signal<string | null>(null);
  success = signal<string | null>(null);

  constructor() {
    const t = this.route.snapshot.queryParamMap.get('token');
    if (t) this.token.set(t);
  }

  get canSubmit(): boolean {
    const p1 = this.newPassword();
    const p2 = this.confirmPassword();
    return !!this.token() && p1.length >= 6 && p1 === p2 && !this.isSubmitting();
  }

  async submit() {
    if (!this.canSubmit) return;
    this.error.set(null);
    this.success.set(null);
    this.isSubmitting.set(true);
    try {
      const ok = await this.auth.resetPassword(this.token(), this.newPassword());
      if (ok) {
        this.success.set('Votre mot de passe a été réinitialisé. Vous pouvez vous connecter.');
        // Optionnel: redirection vers login après un court délai
        setTimeout(() => this.router.navigate(['/auth/login']), 1200);
      }
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Erreur lors de la réinitialisation');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}

