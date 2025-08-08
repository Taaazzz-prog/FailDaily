import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ConsentService } from '../../services/consent.service';
import { CustomValidators } from '../../utils/validators';
import { LegalConsentModalComponent } from '../../components/legal-consent-modal/legal-consent-modal.component';
import {
  ToastController, ModalController,
  IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel,
  IonInput, IonButton, IonSpinner, IonButtons, IonBackButton, IonText, IonIcon
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
  consentData: any = null; // Données de consentement du modal

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private consentService: ConsentService,
    private router: Router,
    private toastController: ToastController,
    private modalController: ModalController
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
      // D'abord, ouvrir le modal de consentement légal
      await this.openLegalConsentModal();
    }
  }

  /**
   * Ouvre le modal de consentement légal
   */
  async openLegalConsentModal() {
    const modal = await this.modalController.create({
      component: LegalConsentModalComponent,
      backdropDismiss: false,
      cssClass: 'legal-consent-modal'
    });

    await modal.present();

    const { data, role } = await modal.onDidDismiss();

    if (role === 'confirm' && data) {
      this.consentData = data;
      await this.processRegistration();
    } else {
      // L'utilisateur a annulé - ne pas continuer l'inscription
      const toast = await this.toastController.create({
        message: 'Inscription annulée. L\'acceptation des conditions est obligatoire.',
        duration: 3000,
        color: 'warning'
      });
      await toast.present();
    }
  }

  /**
   * Traite l'inscription après acceptation des CGU
   */
  async processRegistration() {
    if (!this.consentData) return;

    this.isLoading = true;

    try {
      const { displayName, email, password } = this.registerForm.value;

      // Données d'inscription avec informations de consentement
      const registerData = {
        email,
        password,
        username: displayName.toLowerCase().replace(/\s+/g, '_'),
        displayName,
        // Ajouter les données de consentement
        consentData: this.consentData,
        birthDate: this.consentData.birthDate,
        needsParentalConsent: this.consentData.needsParentalConsent
      };

      // Si consentement parental requis
      if (this.consentData.needsParentalConsent) {
        await this.handleParentalConsentRequired(registerData);
      } else {
        // Inscription normale
        await this.completeRegistration(registerData);
      }

    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      const toast = await this.toastController.create({
        message: 'Erreur lors de l\'inscription. Réessayez.',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }

    this.isLoading = false;
  }

  /**
   * Gère l'inscription avec consentement parental requis
   */
  async handleParentalConsentRequired(registerData: any) {
    // TODO: Envoyer email de validation parentale
    // Pour l'instant, on simule l'envoi

    const parentEmail = this.consentData.parentEmail;
    const childName = registerData.displayName;
    const childAge = this.calculateAge(new Date(this.consentData.birthDate));

    // Générer l'email de consentement parental
    const emailContent = this.consentService.generateParentalConsentEmail(
      parentEmail,
      childName,
      childAge
    );

    console.log('Email de consentement parental à envoyer:', emailContent);

    // TODO: Intégrer avec votre service d'email (ex: SendGrid, Mailgun)
    // await this.emailService.sendParentalConsentEmail(parentEmail, emailContent);

    // Pour l'instant, créer le compte en attente de validation parentale
    registerData.status = 'pending_parental_consent';
    registerData.parentEmail = parentEmail;

    await this.completeRegistration(registerData);

    const toast = await this.toastController.create({
      message: `Un email de validation a été envoyé à ${parentEmail}. Le compte sera activé après autorisation parentale.`,
      duration: 5000,
      color: 'warning'
    });
    await toast.present();
  }

  /**
   * Finalise l'inscription
   */
  async completeRegistration(registerData: any) {
    await this.authService.register(registerData).toPromise();

    // Enregistrer le consentement
    if (registerData.consentData) {
      // TODO: Obtenir l'ID utilisateur après inscription
      const userId = 'temp_user_id'; // À remplacer par le vrai ID
      await this.consentService.recordConsent(
        userId,
        registerData.consentData.documentsAccepted,
        {
          ipAddress: 'TODO', // À obtenir
          userAgent: navigator.userAgent
        }
      );
    }

    const message = registerData.status === 'pending_parental_consent'
      ? 'Compte créé ! En attente de validation parentale.'
      : 'Inscription réussie ! Bienvenue dans FailDaily 🎉';

    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color: 'success',
      cssClass: 'toast-encourage'
    });
    await toast.present();

    if (registerData.status !== 'pending_parental_consent') {
      this.router.navigate(['/tabs/home']);
    }
  }

  /**
   * Calcule l'âge à partir d'une date de naissance
   */
  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }
}
