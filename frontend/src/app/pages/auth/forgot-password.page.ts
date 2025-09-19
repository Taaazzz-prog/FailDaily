import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpAuthService } from '../../services/http-auth.service';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonText, IonSpinner, IonProgressBar
}  from '@ionic/angular/standalone';

@Component({
  standalone: true,
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonText, IonProgressBar
  ]
})
export class ForgotPasswordPage {
  email = '';
  isSubmitting = false;
  error: string | null = null;
  success: string | null = null;

  constructor(private auth: HttpAuthService, private router: Router) {}

  get canSubmit(): boolean {
    return !!this.email && this.email.includes('@') && !this.isSubmitting;
  }

  async submit() {
    if (!this.canSubmit) return;
    this.error = null;
    this.success = null;
    this.isSubmitting = true;
    try {
      const ok = await this.auth.forgotPassword(this.email);
      if (ok) {
        this.success = 'Si cet email existe, un lien a été envoyé.';
        // Optionnel: redirection vers login après un court délai
        setTimeout(() => this.router.navigate(['/auth/login']), 1500);
      } else {
        this.error = 'Une erreur est survenue.';
      }
    } catch (e: any) {
      this.error = e?.error?.message || e?.message || 'Erreur lors de la demande.';
    } finally {
      this.isSubmitting = false;
    }
  }
}

