import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { RegistrationService } from './registration.service';

interface WizardStep {
  id: string;
  title: string;
  subtitle?: string;
  component?: string;
  completed: boolean;
  valid: boolean;
  optional?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class RegistrationWizardService {
  private steps: WizardStep[] = [
    {
      id: 'basic-info',
      title: 'Informations de base',
      subtitle: 'Email et nom d\'affichage',
      component: 'BasicInfoComponent',
      completed: false,
      valid: false
    },
    {
      id: 'account-security',
      title: 'Sécurité du compte',
      subtitle: 'Mot de passe et vérification',
      component: 'AccountSecurityComponent',
      completed: false,
      valid: false
    },
    {
      id: 'age-verification',
      title: 'Vérification d\'âge',
      subtitle: 'Date de naissance',
      component: 'AgeVerificationComponent',
      completed: false,
      valid: false
    },
    {
      id: 'terms-and-conditions',
      title: 'Conditions d\'utilisation',
      subtitle: 'Acceptation des CGU',
      component: 'TermsConditionsComponent',
      completed: false,
      valid: false
    }
  ];

  private currentStepIndex = new BehaviorSubject<number>(0);
  public currentStepIndex$ = this.currentStepIndex.asObservable();

  private wizardSteps = new BehaviorSubject<WizardStep[]>(this.steps);
  public wizardSteps$ = this.wizardSteps.asObservable();

  constructor(private registrationService: RegistrationService) {
    console.log('🧙‍♂️ RegistrationWizardService: Assistant d\'inscription initialisé');
    this.initializeWizard();
  }

  private initializeWizard(): void {
    // Synchroniser avec le service de registration
    this.registrationService.currentStep$.subscribe(step => {
      this.currentStepIndex.next(step - 1); // Convert to 0-based index
      this.updateStepValidation();
    });
  }

  // Navigation
  nextStep(): boolean {
    const currentIndex = this.currentStepIndex.value;
    if (currentIndex < this.steps.length - 1 && this.canProceedToNext()) {
      const nextIndex = currentIndex + 1;
      this.currentStepIndex.next(nextIndex);
      this.registrationService.goToStep(nextIndex + 1);
      return true;
    }
    return false;
  }

  previousStep(): boolean {
    const currentIndex = this.currentStepIndex.value;
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      this.currentStepIndex.next(prevIndex);
      this.registrationService.goToStep(prevIndex + 1);
      return true;
    }
    return false;
  }

  goToStep(stepId: string): boolean {
    const stepIndex = this.steps.findIndex(step => step.id === stepId);
    if (stepIndex !== -1 && this.canAccessStep(stepIndex)) {
      this.currentStepIndex.next(stepIndex);
      this.registrationService.goToStep(stepIndex + 1);
      return true;
    }
    return false;
  }

  // Validation
  private canProceedToNext(): boolean {
    const currentStep = this.getCurrentStep();
    return currentStep ? currentStep.valid : false;
  }

  private canAccessStep(stepIndex: number): boolean {
    // On peut accéder à un step si tous les steps précédents sont valides
    for (let i = 0; i < stepIndex; i++) {
      if (!this.steps[i].valid && !this.steps[i].optional) {
        return false;
      }
    }
    return true;
  }

  private updateStepValidation(): void {
    const data = this.registrationService.getRegistrationData();
    
    // Validation step 1: Basic Info
    this.steps[0].valid = !!(data.email && data.displayName);
    this.steps[0].completed = this.steps[0].valid;

    // Validation step 2: Account Security
    this.steps[1].valid = !!(data.password && data.confirmPassword && data.password === data.confirmPassword);
    this.steps[1].completed = this.steps[1].valid;

    // Validation step 3: Age Verification
    this.steps[2].valid = !!data.birthDate;
    this.steps[2].completed = this.steps[2].valid;

    // Validation step 4: Terms and Conditions
    this.steps[3].valid = !!data.agreeToTerms;
    this.steps[3].completed = this.steps[3].valid;

    this.wizardSteps.next([...this.steps]);
  }

  // Getters
  getCurrentStep(): WizardStep | null {
    const index = this.currentStepIndex.value;
    return this.steps[index] || null;
  }

  getCurrentStepIndex(): number {
    return this.currentStepIndex.value;
  }

  getSteps(): WizardStep[] {
    return [...this.steps];
  }

  getProgress(): number {
    const completedSteps = this.steps.filter(step => step.completed).length;
    return (completedSteps / this.steps.length) * 100;
  }

  isFirstStep(): boolean {
    return this.currentStepIndex.value === 0;
  }

  isLastStep(): boolean {
    return this.currentStepIndex.value === this.steps.length - 1;
  }

  canFinish(): boolean {
    return this.steps.every(step => step.completed || step.optional);
  }
}