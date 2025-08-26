import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonButtons, 
  IonButton, 
  IonIcon, 
  IonContent,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonInput
} from '@ionic/angular/standalone';

interface TestResult {
  endpoint: string;
  method: string;
  status: 'success' | 'error' | 'pending';
  response?: any;
  error?: string;
  duration?: number;
}

@Component({
  selector: 'app-api-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonLabel,
    IonBadge,
    IonInput
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>🧪 Test API MySQL</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="runAllTests()" [disabled]="isRunning">
            <ion-icon name="play-circle" slot="start"></ion-icon>
            Lancer tous les tests
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div class="test-container">
        <!-- Configuration API -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>🔧 Configuration</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-item>
              <ion-label>URL API:</ion-label>
              <ion-input [(ngModel)]="apiUrl" placeholder="http://localhost:3001/api"></ion-input>
            </ion-item>
            <ion-item>
              <ion-label>Token:</ion-label>
              <ion-input [(ngModel)]="authToken" type="password" placeholder="Bearer token..."></ion-input>
            </ion-item>
            <ion-button expand="block" (click)="testConnection()">
              <ion-icon name="wifi" slot="start"></ion-icon>
              Tester la connexion
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Tests Authentication -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>🔐 Tests Authentification</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" (click)="testRegister()" [disabled]="isRunning">
              <ion-icon name="person-add" slot="start"></ion-icon>
              Test Inscription
            </ion-button>
            <ion-button expand="block" (click)="testLogin()" [disabled]="isRunning">
              <ion-icon name="log-in" slot="start"></ion-icon>
              Test Connexion
            </ion-button>
            <ion-button expand="block" (click)="testProfile()" [disabled]="isRunning">
              <ion-icon name="person" slot="start"></ion-icon>
              Test Profil
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Tests Fails -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>📝 Tests Fails</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" (click)="testCreateFail()" [disabled]="isRunning">
              <ion-icon name="add-circle" slot="start"></ion-icon>
              Test Créer Fail
            </ion-button>
            <ion-button expand="block" (click)="testGetFails()" [disabled]="isRunning">
              <ion-icon name="list" slot="start"></ion-icon>
              Test Lister Fails
            </ion-button>
            <ion-button expand="block" (click)="testUpdateFail()" [disabled]="isRunning">
              <ion-icon name="create" slot="start"></ion-icon>
              Test Modifier Fail
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Tests Admin -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>👑 Tests Admin</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-button expand="block" (click)="testAdminStats()" [disabled]="isRunning">
              <ion-icon name="analytics" slot="start"></ion-icon>
              Test Statistiques
            </ion-button>
            <ion-button expand="block" (click)="testUserManagement()" [disabled]="isRunning">
              <ion-icon name="people" slot="start"></ion-icon>
              Test Gestion Utilisateurs
            </ion-button>
            <ion-button expand="block" (click)="testBadgeManagement()" [disabled]="isRunning">
              <ion-icon name="medal" slot="start"></ion-icon>
              Test Gestion Badges
            </ion-button>
          </ion-card-content>
        </ion-card>

        <!-- Résultats des tests -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>📊 Résultats des tests</ion-card-title>
            <ion-badge [color]="getOverallStatusColor()">
              {{ getTestSummary() }}
            </ion-badge>
          </ion-card-header>
          <ion-card-content>
            <div *ngFor="let result of testResults" class="test-result">
              <ion-item>
                <ion-icon [name]="getStatusIcon(result.status)" [color]="getStatusColor(result.status)" slot="start"></ion-icon>
                <ion-label>
                  <h3>{{ result.method }} {{ result.endpoint }}</h3>
                  <p *ngIf="result.duration">Durée: {{ result.duration }}ms</p>
                  <p *ngIf="result.error" class="error-text">{{ result.error }}</p>
                </ion-label>
                <ion-button fill="clear" (click)="showResponseDetails(result)">
                  <ion-icon name="eye"></ion-icon>
                </ion-button>
              </ion-item>
            </div>
          </ion-card-content>
        </ion-card>
      </div>
    </ion-content>
  `,
  styles: [`
    .test-container {
      padding: 16px;
    }

    .test-result {
      margin-bottom: 8px;
    }

    .error-text {
      color: var(--ion-color-danger);
      font-size: 0.9em;
    }

    ion-button {
      margin: 4px 0;
    }
  `]
})
export class ApiTestComponent implements OnInit {
  apiUrl: string = environment.api.baseUrl;
  authToken: string = 'faildaily_token';
  testResults: TestResult[] = [];
  isRunning: boolean = false;

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    console.log('🧪 ApiTestComponent: Composant de test API initialisé');
    this.authToken = localStorage.getItem('auth_token') || 'faildaily_token';
    this.testResults = [];
  }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.authToken}`
    });
  }

  private async addTestResult(endpoint: string, method: string, status: 'success' | 'error', response?: any, error?: string, duration?: number): Promise<void> {
    this.testResults.push({
      endpoint,
      method,
      status,
      response,
      error,
      duration
    });
  }

  // Test de connexion basique
  async testConnection(): Promise<void> {
    const startTime = performance.now();
    try {
      const response = await this.http.get(`${this.apiUrl}/health`).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      await this.addTestResult('/health', 'GET', 'success', response, undefined, duration);
      await this.showToast('✅ Connexion API réussie', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/health', 'GET', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec connexion API', 'danger');
    }
  }

  // Tests Authentication
  async testRegister(): Promise<void> {
    const startTime = performance.now();
    const testData = {
      email: `test-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      displayName: `TestUser${Date.now()}`
    };

    try {
      const response = await this.http.post(`${this.apiUrl}/auth/register`, testData).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      await this.addTestResult('/auth/register', 'POST', 'success', response, undefined, duration);
      await this.showToast('✅ Test inscription réussi', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/auth/register', 'POST', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test inscription', 'danger');
    }
  }

  async testLogin(): Promise<void> {
    const startTime = performance.now();
    const testData = {
      email: 'test@example.com',
      password: 'password123'
    };

    try {
      const response: any = await this.http.post(`${this.apiUrl}/auth/login`, testData).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      if (response.token) {
        this.authToken = response.token;
        localStorage.setItem('auth_token', this.authToken);
      }

      await this.addTestResult('/auth/login', 'POST', 'success', response, undefined, duration);
      await this.showToast('✅ Test connexion réussi', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/auth/login', 'POST', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test connexion', 'danger');
    }
  }

  async testProfile(): Promise<void> {
    const startTime = performance.now();
    try {
      const response = await this.http.get(`${this.apiUrl}/auth/profile`, { headers: this.getHeaders() }).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      await this.addTestResult('/auth/profile', 'GET', 'success', response, undefined, duration);
      await this.showToast('✅ Test profil réussi', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/auth/profile', 'GET', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test profil', 'danger');
    }
  }

  // Tests Fails
  async testCreateFail(): Promise<void> {
    const startTime = performance.now();
    const testData = {
      title: `Test Fail ${Date.now()}`,
      description: 'Ceci est un fail de test',
      category: 'Général',
      tags: ['test', 'api'],
      is_anonyme: false
    };

    try {
      const response = await this.http.post(`${this.apiUrl}/fails`, testData, { headers: this.getHeaders() }).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      await this.addTestResult('/fails', 'POST', 'success', response, undefined, duration);
      await this.showToast('✅ Test création fail réussi', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/fails', 'POST', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test création fail', 'danger');
    }
  }

  async testGetFails(): Promise<void> {
    const startTime = performance.now();
    try {
      const response = await this.http.get(`${this.apiUrl}/fails`, { headers: this.getHeaders() }).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      await this.addTestResult('/fails', 'GET', 'success', response, undefined, duration);
      await this.showToast('✅ Test récupération fails réussi', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/fails', 'GET', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test récupération fails', 'danger');
    }
  }

  async testUpdateFail(): Promise<void> {
    const startTime = performance.now();
    const testData = {
      title: `Test Fail Updated ${Date.now()}`,
      description: 'Description mise à jour'
    };

    try {
      // D'abord récupérer un fail existant
      const fails: any = await this.http.get(`${this.apiUrl}/fails?limit=1`, { headers: this.getHeaders() }).toPromise();
      
      if (fails.fails && fails.fails.length > 0) {
        const failId = fails.fails[0].id;
        const response = await this.http.put(`${this.apiUrl}/fails/${failId}`, testData, { headers: this.getHeaders() }).toPromise();
        const duration = Math.round(performance.now() - startTime);
        
        await this.addTestResult(`/fails/${failId}`, 'PUT', 'success', response, undefined, duration);
        await this.showToast('✅ Test mise à jour fail réussi', 'success');
      } else {
        throw new Error('Aucun fail disponible pour le test de mise à jour');
      }
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/fails/:id', 'PUT', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test mise à jour fail', 'danger');
    }
  }

  // Tests Admin
  async testAdminStats(): Promise<void> {
    const startTime = performance.now();
    try {
      const response = await this.http.get(`${this.apiUrl}/admin/stats`, { headers: this.getHeaders() }).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      await this.addTestResult('/admin/stats', 'GET', 'success', response, undefined, duration);
      await this.showToast('✅ Test stats admin réussi', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/admin/stats', 'GET', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test stats admin', 'danger');
    }
  }

  async testUserManagement(): Promise<void> {
    const startTime = performance.now();
    try {
      const response = await this.http.get(`${this.apiUrl}/admin/users`, { headers: this.getHeaders() }).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      await this.addTestResult('/admin/users', 'GET', 'success', response, undefined, duration);
      await this.showToast('✅ Test gestion utilisateurs réussi', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/admin/users', 'GET', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test gestion utilisateurs', 'danger');
    }
  }

  async testBadgeManagement(): Promise<void> {
    const startTime = performance.now();
    try {
      const response = await this.http.get(`${this.apiUrl}/admin/badges`, { headers: this.getHeaders() }).toPromise();
      const duration = Math.round(performance.now() - startTime);
      
      await this.addTestResult('/admin/badges', 'GET', 'success', response, undefined, duration);
      await this.showToast('✅ Test gestion badges réussi', 'success');
    } catch (error: any) {
      const duration = Math.round(performance.now() - startTime);
      await this.addTestResult('/admin/badges', 'GET', 'error', undefined, error.message, duration);
      await this.showToast('❌ Échec test gestion badges', 'danger');
    }
  }

  // Lancer tous les tests
  async runAllTests(): Promise<void> {
    this.isRunning = true;
    this.testResults = [];
    
    const loading = await this.loadingController.create({
      message: 'Exécution des tests...',
      spinner: 'circular'
    });
    await loading.present();

    try {
      await this.testConnection();
      await this.testLogin();
      await this.testProfile();
      await this.testGetFails();
      await this.testCreateFail();
      await this.testAdminStats();
      await this.testUserManagement();
      await this.testBadgeManagement();

      await this.showToast('🎉 Tous les tests terminés', 'success');
    } catch (error) {
      await this.showToast('❌ Erreur lors des tests', 'danger');
    } finally {
      this.isRunning = false;
      await loading.dismiss();
    }
  }

  // Utilitaires UI
  getStatusIcon(status: string): string {
    switch (status) {
      case 'success': return 'checkmark-circle';
      case 'error': return 'close-circle';
      case 'pending': return 'time';
      default: return 'help-circle';
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'pending': return 'warning';
      default: return 'medium';
    }
  }

  getOverallStatusColor(): string {
    if (this.testResults.length === 0) return 'medium';
    
    const hasErrors = this.testResults.some(r => r.status === 'error');
    const hasPending = this.testResults.some(r => r.status === 'pending');
    
    if (hasErrors) return 'danger';
    if (hasPending) return 'warning';
    return 'success';
  }

  getTestSummary(): string {
    const total = this.testResults.length;
    const success = this.testResults.filter(r => r.status === 'success').length;
    const errors = this.testResults.filter(r => r.status === 'error').length;
    
    return `${success}/${total} réussis (${errors} erreurs)`;
  }

  async showResponseDetails(result: TestResult): Promise<void> {
    console.log('📊 Détails du test:', result);
    
    const message = result.response 
      ? `<pre>${JSON.stringify(result.response, null, 2)}</pre>`
      : result.error || 'Aucun détail disponible';
    
    const toast = await this.toastController.create({
      header: `${result.method} ${result.endpoint}`,
      message,
      duration: 5000,
      position: 'middle',
      buttons: ['OK']
    });
    
    await toast.present();
  }

  private async showToast(message: string, color: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'bottom'
    });
    
    await toast.present();
  }
}
