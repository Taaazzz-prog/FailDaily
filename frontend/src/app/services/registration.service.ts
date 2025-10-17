import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService, RegisterData as AuthRegisterData } from './auth.service';

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
  birthDate: string;
  agreeToTerms: boolean;
  agreeToNewsletter?: boolean;
  referralCode?: string;
}

interface RegistrationStep {
  step: number;
  completed: boolean;
  data?: any;
}

interface RegistrationValidation {
  field: string;
  valid: boolean;
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {
  private currentStep = new BehaviorSubject<number>(1);
  public currentStep$ = this.currentStep.asObservable();

  private registrationData = new BehaviorSubject<Partial<RegistrationData>>({});
  public registrationData$ = this.registrationData.asObservable();

  private validationErrors = new BehaviorSubject<RegistrationValidation[]>([]);
  public validationErrors$ = this.validationErrors.asObservable();

  private isLoading = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoading.asObservable();

  private readonly MAX_STEPS = 4;
  private readonly MIN_PASSWORD_LENGTH = 8;
  private readonly MIN_AGE = 13;

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    console.log('📝 RegistrationService: Service d\'inscription initialisé');
    this.loadSavedRegistrationData();
  }

  // Navigation entre les étapes
  nextStep(): boolean {
    const current = this.currentStep.value;
    if (current < this.MAX_STEPS && this.validateCurrentStep()) {
      this.currentStep.next(current + 1);
      this.saveRegistrationProgress();
      return true;
    }
    return false;
  }

  previousStep(): boolean {
    const current = this.currentStep.value;
    if (current > 1) {
      this.currentStep.next(current - 1);
      return true;
    }
    return false;
  }

  goToStep(step: number): boolean {
    if (step >= 1 && step <= this.MAX_STEPS) {
      this.currentStep.next(step);
      return true;
    }
    return false;
  }

  getCurrentStep(): number {
    return this.currentStep.value;
  }

  // Gestion des données d'inscription
  updateRegistrationData(data: Partial<RegistrationData>): void {
    const current = this.registrationData.value;
    const updated = { ...current, ...data };
    this.registrationData.next(updated);
    this.saveRegistrationProgress();
  }

  getRegistrationData(): Partial<RegistrationData> {
    return this.registrationData.value;
  }

  clearRegistrationData(): void {
    this.registrationData.next({});
    this.currentStep.next(1);
    this.clearSavedRegistrationData();
  }

  // Validation des données
  private validateCurrentStep(): boolean {
    const step = this.currentStep.value;
    const data = this.registrationData.value;
    const errors: RegistrationValidation[] = [];

    switch (step) {
      case 1:
        errors.push(...this.validateBasicInfo(data));
        break;
      case 2:
        errors.push(...this.validateAccountInfo(data));
        break;
      case 3:
        errors.push(...this.validateAgeVerification(data));
        break;
      case 4:
        errors.push(...this.validateTermsAndConditions(data));
        break;
    }

    this.validationErrors.next(errors);
    return errors.length === 0;
  }

  private validateBasicInfo(data: Partial<RegistrationData>): RegistrationValidation[] {
    const errors: RegistrationValidation[] = [];

    // Validation email
    if (!data.email) {
      errors.push({
        field: 'email',
        valid: false,
        message: 'L\'email est obligatoire'
      });
    } else if (!this.isValidEmail(data.email)) {
      errors.push({
        field: 'email',
        valid: false,
        message: 'Format d\'email invalide'
      });
    }

    // Validation nom d'affichage
    if (!data.displayName) {
      errors.push({
        field: 'displayName',
        valid: false,
        message: 'Le nom d\'affichage est obligatoire'
      });
    } else if (data.displayName.length < 2) {
      errors.push({
        field: 'displayName',
        valid: false,
        message: 'Le nom d\'affichage doit contenir au moins 2 caractères'
      });
    } else if (data.displayName.length > 30) {
      errors.push({
        field: 'displayName',
        valid: false,
        message: 'Le nom d\'affichage ne peut pas dépasser 30 caractères'
      });
    }

    return errors;
  }

  private validateAccountInfo(data: Partial<RegistrationData>): RegistrationValidation[] {
    const errors: RegistrationValidation[] = [];

    // Validation mot de passe
    if (!data.password) {
      errors.push({
        field: 'password',
        valid: false,
        message: 'Le mot de passe est obligatoire'
      });
    } else {
      const passwordValidation = this.validatePassword(data.password);
      if (!passwordValidation.valid) {
        errors.push({
          field: 'password',
          valid: false,
          message: passwordValidation.message
        });
      }
    }

    // Validation confirmation mot de passe
    if (!data.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        valid: false,
        message: 'La confirmation du mot de passe est obligatoire'
      });
    } else if (data.password !== data.confirmPassword) {
      errors.push({
        field: 'confirmPassword',
        valid: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    return errors;
  }

  private validateAgeVerification(data: Partial<RegistrationData>): RegistrationValidation[] {
    const errors: RegistrationValidation[] = [];

    if (!data.birthDate) {
      errors.push({
        field: 'birthDate',
        valid: false,
        message: 'La date de naissance est obligatoire'
      });
    } else {
      const age = this.calculateAge(new Date(data.birthDate));
      if (age < this.MIN_AGE) {
        errors.push({
          field: 'birthDate',
          valid: false,
          message: `Vous devez avoir au moins ${this.MIN_AGE} ans pour vous inscrire`
        });
      }
    }

    return errors;
  }

  private validateTermsAndConditions(data: Partial<RegistrationData>): RegistrationValidation[] {
    const errors: RegistrationValidation[] = [];

    if (!data.agreeToTerms) {
      errors.push({
        field: 'agreeToTerms',
        valid: false,
        message: 'Vous devez accepter les conditions d\'utilisation'
      });
    }

    return errors;
  }

  // Validation individuelle des champs
  async validateEmail(email: string): Promise<RegistrationValidation> {
    if (!email) {
      return { field: 'email', valid: false, message: 'L\'email est obligatoire' };
    }

    if (!this.isValidEmail(email)) {
      return { field: 'email', valid: false, message: 'Format d\'email invalide' };
    }

    // Vérifier si l'email existe déjà
    try {
      const exists = await this.checkEmailExists(email);
      if (exists) {
        return { field: 'email', valid: false, message: 'Cet email est déjà utilisé' };
      }
    } catch (error) {
      console.warn('⚠️ Erreur vérification email:', error);
    }

    return { field: 'email', valid: true };
  }

  validatePassword(password: string): RegistrationValidation {
    if (!password) {
      return { field: 'password', valid: false, message: 'Le mot de passe est obligatoire' };
    }

    if (password.length < this.MIN_PASSWORD_LENGTH) {
      return { field: 'password', valid: false, message: `Le mot de passe doit contenir au moins ${this.MIN_PASSWORD_LENGTH} caractères` };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return { field: 'password', valid: false, message: 'Le mot de passe doit contenir au moins une minuscule' };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return { field: 'password', valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
    }

    if (!/(?=.*\d)/.test(password)) {
      return { field: 'password', valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
    }

    return { field: 'password', valid: true };
  }

  async validateDisplayName(displayName: string): Promise<RegistrationValidation> {
    if (!displayName) {
      return { field: 'displayName', valid: false, message: 'Le nom d\'affichage est obligatoire' };
    }

    if (displayName.length < 2) {
      return { field: 'displayName', valid: false, message: 'Le nom d\'affichage doit contenir au moins 2 caractères' };
    }

    if (displayName.length > 30) {
      return { field: 'displayName', valid: false, message: 'Le nom d\'affichage ne peut pas dépasser 30 caractères' };
    }

    // Vérifier si le nom d'affichage existe déjà
    try {
      const exists = await this.checkDisplayNameExists(displayName);
      if (exists) {
        return { field: 'displayName', valid: false, message: 'Ce nom d\'affichage est déjà utilisé' };
      }
    } catch (error) {
      console.warn('⚠️ Erreur vérification nom d\'affichage:', error);
    }

    return { field: 'displayName', valid: true };
  }

  // Vérifications backend
  private async checkEmailExists(email: string): Promise<boolean> {
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/auth/check-email`,
        { params: { email } }
      ).toPromise();

      return response.exists === true;
    } catch (error) {
      console.error('❌ Erreur vérification email:', error);
      throw error;
    }
  }

  private async checkDisplayNameExists(displayName: string): Promise<boolean> {
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/auth/check-display-name`,
        { params: { displayName } }
      ).toPromise();

      return response.exists === true;
    } catch (error) {
      console.error('❌ Erreur vérification nom d\'affichage:', error);
      throw error;
    }
  }

  // Inscription finale
  async register(): Promise<{ success: boolean; message?: string; user?: any }> {
    this.isLoading.next(true);

    try {
      const data = this.registrationData.value;

      // Validation finale
      if (!this.validateCurrentStep()) {
        this.isLoading.next(false);
        return { success: false, message: 'Données d\'inscription invalides' };
      }

      // Préparer les données pour l'API
      const registrationPayload = {
        email: data.email!,
        password: data.password!,
        displayName: data.displayName!,
        birthDate: data.birthDate!,
        agreeToTerms: data.agreeToTerms!,
        agreeToNewsletter: data.agreeToNewsletter || false,
        referralCode: data.referralCode || null
      };

      const age = this.calculateAge(new Date(data.birthDate!));
      const registerPayload: AuthRegisterData = {
        email: registrationPayload.email,
        password: registrationPayload.password,
        displayName: registrationPayload.displayName,
        legalConsent: {
          documentsAccepted: registrationPayload.agreeToTerms ? ['terms_of_service'] : [],
          consentDate: new Date().toISOString(),
          consentVersion: '1.0',
          marketingOptIn: registrationPayload.agreeToNewsletter ?? false
        },
        ageVerification: {
          birthDate: new Date(registrationPayload.birthDate),
          isMinor: age < 18,
          needsParentalConsent: age >= 13 && age < 17,
          parentEmail: undefined,
          parentConsentDate: undefined
        }
      };

      const user = await firstValueFrom(this.authService.register(registerPayload));

      this.clearRegistrationData();
      console.log('✅ Inscription réussie');

      this.isLoading.next(false);
      return {
        success: true,
        user,
        message: user?.registrationCompleted === false
          ? 'Inscription en attente de validation parentale'
          : 'Inscription réussie'
      };

    } catch (error: any) {
      this.isLoading.next(false);
      console.error('❌ Erreur lors de l\'inscription:', error);
      return {
        success: false,
        message: error.message || 'Erreur lors de l\'inscription'
      };
    }
  }

  // Utilitaires
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return age;
  }

  // Sauvegarde temporaire
  private saveRegistrationProgress(): void {
    try {
      const data = {
        step: this.currentStep.value,
        registrationData: this.registrationData.value
      };
      localStorage.setItem('registration_progress', JSON.stringify(data));
    } catch (error) {
      console.warn('⚠️ Erreur sauvegarde progression inscription:', error);
    }
  }

  private loadSavedRegistrationData(): void {
    try {
      const saved = localStorage.getItem('registration_progress');
      if (saved) {
        const data = JSON.parse(saved);
        this.currentStep.next(data.step || 1);
        this.registrationData.next(data.registrationData || {});
      }
    } catch (error) {
      console.warn('⚠️ Erreur chargement progression inscription:', error);
    }
  }

  private clearSavedRegistrationData(): void {
    try {
      localStorage.removeItem('registration_progress');
    } catch (error) {
      console.warn('⚠️ Erreur suppression progression inscription:', error);
    }
  }

  // Code de parrainage
  async validateReferralCode(code: string): Promise<boolean> {
    if (!code) return true; // Code optionnel

    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/auth/validate-referral`,
        { params: { code } }
      ).toPromise();

      return response.valid === true;
    } catch (error) {
      console.error('❌ Erreur validation code parrainage:', error);
      return false;
    }
  }

  // Statistiques d'inscription
  async getRegistrationStats(): Promise<any> {
    try {
      const response: any = await this.http.get(
        `${environment.api.baseUrl}/auth/registration-stats`
      ).toPromise();

      return response.success ? response.stats : null;
    } catch (error) {
      console.error('❌ Erreur récupération stats inscription:', error);
      return null;
    }
  }
}
