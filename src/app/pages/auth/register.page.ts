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

      // Étape 1: Créer le compte utilisateur
      const registerData = {
        email,
        password,
        username: displayName.toLowerCase().replace(/\s+/g, '_'),
        displayName
      };

      await this.authService.register(registerData).toPromise();

      // Attendre un peu pour que l'utilisateur soit bien créé
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Étape 2: Préparer les données de consentement légal
      const legalConsent = {
        documentsAccepted: this.consentData.documentsAccepted,
        consentDate: this.consentData.timestamp || new Date().toISOString(),
        consentVersion: '1.0',
        marketingOptIn: this.consentData.marketingOptIn || false
      };

      // Étape 3: Préparer les données de vérification d'âge
      const ageVerification = {
        birthDate: this.consentData.birthDate,
        isMinor: this.consentData.needsParentalConsent || false,
        needsParentalConsent: this.consentData.needsParentalConsent || false,
        parentEmail: this.consentData.parentEmail || null,
        parentConsentDate: null // Sera rempli quand le parent accepte
      };

      // Si consentement parental requis
      if (this.consentData.needsParentalConsent && this.consentData.parentEmail) {
        await this.handleParentalConsentRequired(this.consentData.parentEmail, displayName);

        // Le compte sera completé plus tard après validation parentale
        // Pour l'instant, on laisse l'inscription partielle
        const toast = await this.toastController.create({
          message: `Un email de validation a été envoyé à ${this.consentData.parentEmail}. Le compte sera activé après autorisation parentale.`,
          duration: 5000,
          color: 'warning'
        });
        await toast.present();

        // Ne pas rediriger vers l'app, rester sur la page de login
        this.router.navigate(['/auth/login']);
        return;
      }

      // Étape 4: Finaliser l'inscription pour les adultes
      try {
        await this.authService.completeRegistration(legalConsent, ageVerification);

        const toast = await this.toastController.create({
          message: 'Inscription réussie ! Bienvenue dans FailDaily 🎉',
          duration: 3000,
          color: 'success',
          cssClass: 'toast-encourage'
        });
        await toast.present();

        this.router.navigate(['/home']);
      } catch (completeError) {
        console.error('Erreur lors de la finalisation:', completeError);

        // Le compte de base est créé mais pas finalisé
        const toast = await this.toastController.create({
          message: 'Compte créé mais finalisation incomplète. Veuillez vous reconnecter.',
          duration: 5000,
          color: 'warning'
        });
        await toast.present();

        this.router.navigate(['/auth/login']);
      }

    } catch (error: any) {
      console.error('Erreur lors de l\'inscription:', error);

      let errorMessage = 'Erreur lors de l\'inscription. Réessayez.';

      if (error.message?.includes('User already registered')) {
        errorMessage = 'Un compte avec cet email existe déjà.';
      } else if (error.message?.includes('Password')) {
        errorMessage = 'Le mot de passe ne respecte pas les critères requis.';
      } else if (error.message?.includes('Email')) {
        errorMessage = 'Format d\'email invalide.';
      }

      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 4000,
        color: 'danger'
      });
      await toast.present();
    }

    this.isLoading = false;
  }

  /**
   * Gère l'inscription avec consentement parental requis
   */
  async handleParentalConsentRequired(parentEmail: string, childName: string) {
    const childAge = this.calculateAge(new Date(this.consentData!.birthDate));

    // Générer l'email de consentement parental
    const emailContent = this.consentService.generateParentalConsentEmail(
      parentEmail,
      childName,
      childAge
    );

    console.log('Email de consentement parental à envoyer:', emailContent);

    // TODO: Intégrer avec votre service d'email (ex: SendGrid, Mailgun)
    // await this.emailService.sendParentalConsentEmail(parentEmail, emailContent);
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
