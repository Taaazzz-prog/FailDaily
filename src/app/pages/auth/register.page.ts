import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../utils/validators';
import {
  ToastController,
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonSpinner, IonButtons, IonBackButton, IonText
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonSpinner, IonButtons, IonBackButton, IonText
  ]
})
export class RegisterPage implements OnInit {
  registerForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.registerForm = this.fb.group({
      displayName: ['', [Validators.required, CustomValidators.minLength(2), CustomValidators.noWhitespace]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, CustomValidators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit() { }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  async onRegister() {
    if (this.registerForm.valid) {
      this.isLoading = true;

      try {
        const { displayName, email, password } = this.registerForm.value;
        await this.authService.register(displayName, email, password).toPromise();

        const toast = await this.toastController.create({
          message: 'Inscription réussie ! Bienvenue dans FailDaily 🎉',
          duration: 3000,
          color: 'success',
          cssClass: 'toast-encourage'
        });
        await toast.present();

        this.router.navigate(['/tabs/home']);
      } catch (error) {
        const toast = await this.toastController.create({
          message: 'Erreur lors de l\'inscription. Réessayez.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }

      this.isLoading = false;
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
