import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CustomValidators } from '../../utils/validators';
import {
  ToastController,
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonSpinner
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
    IonInput, IonButton, IonSpinner
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, CustomValidators.minLength(6)]]
    });
  }

  ngOnInit() { }

  async onLogin() {
    if (this.loginForm.valid) {
      this.isLoading = true;

      try {
        const { email, password } = this.loginForm.value;
        await this.authService.login({ email, password }).toPromise();

        const toast = await this.toastController.create({
          message: 'Connexion réussie !',
          duration: 2000,
          color: 'success',
          cssClass: 'toast-encourage'
        });
        await toast.present();

        // Attendre un peu que l'état soit mis à jour puis rediriger
        setTimeout(() => {
          this.router.navigate(['/home']);
        }, 100);
      } catch (error) {
        const toast = await this.toastController.create({
          message: 'Erreur de connexion. Vérifiez vos identifiants.',
          duration: 3000,
          color: 'danger'
        });
        await toast.present();
      }

      this.isLoading = false;
    }
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
