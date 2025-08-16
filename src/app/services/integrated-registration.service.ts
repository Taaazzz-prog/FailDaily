import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, combineLatest } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { RegistrationService } from './registration.service';
import { RegistrationWizardService } from './registration-wizard.service';
import { RegistrationTransitionService } from './registration-transition.service';
import { HttpAuthService } from './http-auth.service';
import { NewAuthService } from './new-auth.service';

interface IntegratedRegistrationState {
  mode: 'fresh' | 'migration' | 'resume';
  currentService: 'registration' | 'wizard' | 'transition';
  phase: 'detection' | 'preparation' | 'registration' | 'validation' | 'completed';
  canProceed: boolean;
  isLoading: boolean;
  errors: string[];
  warnings: string[];
  successMessage?: string;
}

interface RegistrationFlow {
  id: string;
  name: string;
  description: string;
  icon: string;
  available: boolean;
  recommended?: boolean;
  requirements?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class IntegratedRegistrationService {
  private state = new BehaviorSubject<IntegratedRegistrationState>({
    mode: 'fresh',
    currentService: 'registration',
    phase: 'detection',
    canProceed: false,
    isLoading: true,
    errors: [],
    warnings: []
  });

  public state$ = this.state.asObservable();

  private availableFlows = new BehaviorSubject<RegistrationFlow[]>([]);
  public availableFlows$ = this.availableFlows.asObservable();

  private selectedFlow = new BehaviorSubject<string | null>(null);
  public selectedFlow$ = this.selectedFlow.asObservable();

  constructor(
    private registrationService: RegistrationService,
    private wizardService: RegistrationWizardService,
    private transitionService: RegistrationTransitionService,
    private httpAuthService: HttpAuthService,
    private newAuthService: NewAuthService
  ) {
    console.log('🔗 IntegratedRegistrationService: Service d\'inscription intégré initialisé');
    this.initializeService();
  }

  private async initializeService(): Promise<void> {
    try {
      this.updateState({
        phase: 'detection',
        isLoading: true,
        errors: [],
        warnings: []
      });

      // Analyser l'environnement et les données existantes
      const analysis = await this.analyzeEnvironment();
      
      // Définir les flux disponibles
      const flows = this.defineAvailableFlows(analysis);
      this.availableFlows.next(flows);

      // Sélectionner automatiquement le flux recommandé
      const recommendedFlow = flows.find(f => f.recommended);
      if (recommendedFlow) {
        this.selectedFlow.next(recommendedFlow.id);
      }

      this.updateState({
        phase: 'preparation',
        isLoading: false,
        canProceed: flows.length > 0,
        mode: this.determineBestMode(analysis)
      });

      console.log(`✅ Service initialisé - Mode: ${this.state.value.mode}, Flux: ${flows.length}`);

    } catch (error: any) {
      console.error('❌ Erreur initialisation service intégré:', error);
      this.updateState({
        phase: 'detection',
        isLoading: false,
        canProceed: false,
        errors: [error.message || 'Erreur d\'initialisation']
      });
    }
  }

  /**
   * Analyser l'environnement pour déterminer les options disponibles
   */
  private async analyzeEnvironment(): Promise<any> {
    const analysis = {
      hasSupabaseData: false,
      hasSavedRegistration: false,
      mysqlAvailable: false,
      userLoggedIn: false,
      migrationPossible: false,
      currentUser: null
    };

    try {
      // Vérifier données Supabase
      analysis.hasSupabaseData = this.transitionService.isSupabaseDetected();

      // Vérifier inscription sauvegardée
      const savedData = this.registrationService.getRegistrationData();
      analysis.hasSavedRegistration = Object.keys(savedData).length > 0;

      // Vérifier MySQL
      analysis.mysqlAvailable = this.transitionService.isMysqlReady();

      // Vérifier utilisateur connecté
      analysis.currentUser = this.httpAuthService.getCurrentUser();
      analysis.userLoggedIn = !!analysis.currentUser;

      // Vérifier possibilité de migration
      analysis.migrationPossible = analysis.hasSupabaseData && analysis.mysqlAvailable && !analysis.userLoggedIn;

      console.log('🔍 Analyse environnement:', analysis);
      return analysis;

    } catch (error) {
      console.warn('⚠️ Erreur analyse environnement:', error);
      return analysis;
    }
  }

  /**
   * Définir les flux d'inscription disponibles
   */
  private defineAvailableFlows(analysis: any): RegistrationFlow[] {
    const flows: RegistrationFlow[] = [];

    // Flux migration Supabase
    if (analysis.migrationPossible) {
      flows.push({
        id: 'migration',
        name: 'Migration Supabase',
        description: 'Migrer votre compte Supabase existant vers MySQL',
        icon: '🔄',
        available: true,
        recommended: true,
        requirements: ['Compte Supabase existant', 'Connexion MySQL']
      });
    }

    // Flux reprise inscription
    if (analysis.hasSavedRegistration) {
      flows.push({
        id: 'resume',
        name: 'Reprendre inscription',
        description: 'Continuer votre inscription en cours',
        icon: '▶️',
        available: true,
        recommended: !analysis.migrationPossible,
        requirements: ['Inscription commencée']
      });
    }

    // Flux nouvelle inscription
    if (analysis.mysqlAvailable && !analysis.userLoggedIn) {
      flows.push({
        id: 'fresh',
        name: 'Nouvelle inscription',
        description: 'Créer un nouveau compte FailDaily',
        icon: '✨',
        available: true,
        recommended: flows.length === 0,
        requirements: ['Connexion MySQL']
      });
    }

    // Flux déjà connecté
    if (analysis.userLoggedIn) {
      flows.push({
        id: 'logged_in',
        name: 'Déjà connecté',
        description: `Connecté en tant que ${analysis.currentUser?.displayName}`,
        icon: '👤',
        available: false,
        requirements: []
      });
    }

    return flows;
  }

  /**
   * Déterminer le meilleur mode selon l'analyse
   */
  private determineBestMode(analysis: any): 'fresh' | 'migration' | 'resume' {
    if (analysis.migrationPossible) return 'migration';
    if (analysis.hasSavedRegistration) return 'resume';
    return 'fresh';
  }

  /**
   * Sélectionner un flux d'inscription
   */
  selectFlow(flowId: string): boolean {
    const flows = this.availableFlows.value;
    const flow = flows.find(f => f.id === flowId);

    if (!flow || !flow.available) {
      console.warn(`⚠️ Flux non disponible: ${flowId}`);
      return false;
    }

    this.selectedFlow.next(flowId);
    
    // Mettre à jour le mode et le service selon le flux
    const updates: Partial<IntegratedRegistrationState> = {
      mode: flowId as any,
      currentService: this.getServiceForFlow(flowId),
      canProceed: true
    };

    this.updateState(updates);

    console.log(`🎯 Flux sélectionné: ${flowId}`);
    return true;
  }

  /**
   * Démarrer le processus d'inscription
   */
  async startRegistrationProcess(): Promise<{ success: boolean; message: string }> {
    const currentFlow = this.selectedFlow.value;
    
    if (!currentFlow) {
      return {
        success: false,
        message: 'Aucun flux d\'inscription sélectionné'
      };
    }

    this.updateState({
      phase: 'registration',
      isLoading: true,
      errors: [],
      warnings: []
    });

    try {
      let result;

      switch (currentFlow) {
        case 'migration':
          result = await this.handleMigrationFlow();
          break;
        case 'resume':
          result = await this.handleResumeFlow();
          break;
        case 'fresh':
          result = await this.handleFreshFlow();
          break;
        default:
          throw new Error(`Flux non supporté: ${currentFlow}`);
      }

      if (result.success) {
        this.updateState({
          phase: 'completed',
          isLoading: false,
          successMessage: result.message
        });
      } else {
        this.updateState({
          phase: 'registration',
          isLoading: false,
          errors: [result.message]
        });
      }

      return result;

    } catch (error: any) {
      console.error(`❌ Erreur flux ${currentFlow}:`, error);
      
      this.updateState({
        phase: 'registration',
        isLoading: false,
        errors: [error.message || 'Erreur lors du processus d\'inscription']
      });

      return {
        success: false,
        message: error.message || 'Erreur lors du processus d\'inscription'
      };
    }
  }

  /**
   * Gérer le flux de migration
   */
  private async handleMigrationFlow(): Promise<{ success: boolean; message: string }> {
    console.log('🔄 Démarrage flux migration...');
    
    this.updateState({ currentService: 'transition' });
    return await this.transitionService.startUserMigration();
  }

  /**
   * Gérer le flux de reprise
   */
  private async handleResumeFlow(): Promise<{ success: boolean; message: string }> {
    console.log('▶️ Reprise inscription...');
    
    this.updateState({ currentService: 'wizard' });
    
    const resumed = await this.transitionService.resumeRegistration();
    if (resumed) {
      return {
        success: true,
        message: 'Inscription reprise avec succès'
      };
    } else {
      // Fallback vers nouvelle inscription
      return await this.handleFreshFlow();
    }
  }

  /**
   * Gérer le flux nouvelle inscription
   */
  private async handleFreshFlow(): Promise<{ success: boolean; message: string }> {
    console.log('✨ Nouvelle inscription...');
    
    this.updateState({ currentService: 'registration' });
    
    await this.transitionService.startFreshRegistration();
    
    return {
      success: true,
      message: 'Inscription initialisée - Veuillez remplir le formulaire'
    };
  }

  /**
   * Obtenir le service approprié pour un flux
   */
  private getServiceForFlow(flowId: string): 'registration' | 'wizard' | 'transition' {
    switch (flowId) {
      case 'migration': return 'transition';
      case 'resume': return 'wizard';
      case 'fresh': return 'registration';
      default: return 'registration';
    }
  }

  /**
   * Valider l'état actuel
   */
  async validateCurrentState(): Promise<boolean> {
    try {
      const analysis = await this.analyzeEnvironment();
      const flows = this.defineAvailableFlows(analysis);
      
      // Vérifier si le flux sélectionné est toujours valide
      const selectedFlow = this.selectedFlow.value;
      if (selectedFlow) {
        const flowStillValid = flows.some(f => f.id === selectedFlow && f.available);
        if (!flowStillValid) {
          console.warn(`⚠️ Flux sélectionné plus valide: ${selectedFlow}`);
          this.selectedFlow.next(null);
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('❌ Erreur validation état:', error);
      return false;
    }
  }

  /**
   * Réinitialiser le service
   */
  async reset(): Promise<void> {
    console.log('🔄 Réinitialisation service intégré...');
    
    this.selectedFlow.next(null);
    this.registrationService.clearRegistrationData();
    
    await this.initializeService();
  }

  /**
   * Forcer un mode spécifique
   */
  async forceMode(mode: 'fresh' | 'migration' | 'resume'): Promise<boolean> {
    try {
      console.log(`🔧 Forçage mode: ${mode}`);
      
      // Nettoyer selon le mode
      switch (mode) {
        case 'fresh':
          await this.transitionService.forceSupabaseCleanup();
          this.registrationService.clearRegistrationData();
          break;
        case 'migration':
          // Garder les données Supabase
          break;
        case 'resume':
          // Garder les données d'inscription
          break;
      }

      await this.initializeService();
      return true;

    } catch (error) {
      console.error(`❌ Erreur forçage mode ${mode}:`, error);
      return false;
    }
  }

  // Méthodes d'accès à l'état
  getCurrentState(): IntegratedRegistrationState {
    return this.state.value;
  }

  getAvailableFlows(): RegistrationFlow[] {
    return this.availableFlows.value;
  }

  getSelectedFlow(): string | null {
    return this.selectedFlow.value;
  }

  // Observables combinés pour l'interface
  get registrationStatus$(): Observable<any> {
    return combineLatest([
      this.state$,
      this.selectedFlow$,
      this.availableFlows$,
      this.registrationService.currentStep$,
      this.transitionService.transitionState$
    ]).pipe(
      map(([state, selectedFlow, flows, registrationStep, transitionState]) => ({
        integrated: state,
        selectedFlow,
        availableFlows: flows,
        registrationStep,
        transitionState
      }))
    );
  }

  private updateState(updates: Partial<IntegratedRegistrationState>): void {
    const current = this.state.value;
    this.state.next({ ...current, ...updates });
  }
}