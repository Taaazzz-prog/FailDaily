import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../utils/validators';
import {
  ToastController,
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonSpinner, IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonSpinner, IonText
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  failedAttempts = 0;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    console.log('🔐 LoginPage - Constructor called');
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, CustomValidators.minLength(6)]]
    });
    console.log('🔐 LoginPage - Form initialized');
  }

  ngOnInit() {
    console.log('🔐 LoginPage - ngOnInit called');
  }

  async onLogin() {
    console.log('🔐 LoginPage - onLogin called');
    console.log('🔐 LoginPage - Form valid:', this.loginForm.valid);
    console.log('🔐 LoginPage - Form values:', this.loginForm.value);

    if (this.loginForm.valid) {
      this.isLoading = true;
      console.log('🔐 LoginPage - Loading started');

      try {
        const { email, password } = this.loginForm.value;
        console.log('🔐 LoginPage - Attempting login with email:', email);

        // Appel direct et immédiat de la méthode login
        const user = await this.authService.login({ email, password });
        console.log('🔐 LoginPage - Login completed, user received:', !!user);

        if (user) {
          const toast = await this.toastController.create({
            message: 'Connexion réussie !',
            duration: 2000,
            color: 'success',
            cssClass: 'toast-encourage'
          });
          await toast.present();
          console.log('🔐 LoginPage - Success toast shown');

          // Navigation immédiate
          console.log('🔐 LoginPage - Redirecting to home...');
          await this.router.navigate(['/']);
          console.log('🔐 LoginPage - Navigation completed');
        } else {
          throw new Error('Aucun utilisateur retourné après l\'authentification');
        }

      } catch (error: any) {
        console.error('🔐 LoginPage - Login failed:', error);
        const errorMessage = error?.message || 'Erreur de connexion. Vérifiez vos identifiants.';
        const toast = await this.toastController.create({
          message: errorMessage,
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
        console.log('🔐 LoginPage - Error toast shown');
        this.failedAttempts++;
      } finally {
        this.isLoading = false;
        console.log('🔐 LoginPage - Loading finished');
      }
    } else {
      console.warn('🔐 LoginPage - Form is invalid:', this.loginForm.errors);
    }
  }

  goToRegister() {
    console.log('🔐 LoginPage - Navigating to register');
    this.router.navigate(['/auth/register']);
  }

  goToForgotPassword() {
    console.log('🔐 LoginPage - Navigating to forgot-password');
    this.router.navigate(['/auth/forgot-password']);
  }

  get showHelpHint(): boolean {
    return this.failedAttempts >= 3;
  }
}
