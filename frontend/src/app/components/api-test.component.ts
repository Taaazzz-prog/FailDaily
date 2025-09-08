import { Component, OnInit, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastController, LoadingController } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
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
  status: 'success' | 'error' | 'pending' | 'skipped';
  response?: any;
  error?: string;
  duration?: number;
  timestamp: Date;
}

interface ApiError {
  message: string;
  status?: number;
  error?: any;
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
          <ion-button (click)="clearResults()" [disabled]="isRunning">
            <ion-icon name="trash" slot="start"></ion-icon>
            Effacer
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <!-- Configuration -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>🔧 Configuration</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-label>URL API:</ion-label>
            <ion-input 
              [(ngModel)]="apiUrl" 
              placeholder="http://localhost:3001/api"
              [readonly]="isRunning">
            </ion-input>
          </ion-item>
          <ion-item>
            <ion-label>Token:</ion-label>
            <ion-input 
              [(ngModel)]="authToken" 
              type="password" 
              placeholder="Bearer token..."
              [readonly]="isRunning">
            </ion-input>
          </ion-item>
          <ion-button expand="block" (click)="testConnection()" [disabled]="isRunning">
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
            Test Profil (avec token)
          </ion-button>
        </ion-card-content>
      </ion-card>

      <!-- Statistiques -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>📈 Statistiques</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <ion-item>
            <ion-badge color="success" slot="start">{{getSuccessCount()}}</ion-badge>
            <ion-label>Tests réussis</ion-label>
          </ion-item>
          <ion-item>
            <ion-badge color="danger" slot="start">{{getErrorCount()}}</ion-badge>
            <ion-label>Tests échoués</ion-label>
          </ion-item>
          <ion-item>
            <ion-badge color="medium" slot="start">{{getTotalDuration()}}ms</ion-badge>
            <ion-label>Temps total</ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>

      <!-- Résultats -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>📊 Résultats des tests</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div *ngFor="let result of testResults; trackBy: trackByFn">
            <ion-item>
              <ion-badge 
                [color]="getBadgeColor(result.status)"
                slot="start">
                {{result.status}}
              </ion-badge>
              <ion-label>
                <h3>{{result.method}} {{result.endpoint}}</h3>
                <p><small>{{result.timestamp | date:'HH:mm:ss'}} - {{result.duration}}ms</small></p>
                <p *ngIf="result.response && result.status === 'success'" style="color: green;">
                  ✅ {{getResponseSummary(result.response)}}
                </p>
                <p *ngIf="result.error" style="color: red;">
                  ❌ {{result.error}}
                </p>
              </ion-label>
            </ion-item>
          </div>
          <ion-item *ngIf="testResults.length === 0">
            <ion-label>
              <p>Aucun test exécuté</p>
            </ion-label>
          </ion-item>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class ApiTestComponent implements OnInit {
  apiUrl: string = environment.api?.baseUrl || 'http://localhost:3001/api';
  authToken: string = '';
  testResults: TestResult[] = [];
  isRunning: boolean = false;
  private registeredUser: { username: string; email: string; password: string } | null = null;

  private http = inject(HttpClient);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {}

  ngOnInit() {
    console.log('🧪 ApiTestComponent: Composant de test API initialisé');
    this.authToken = localStorage.getItem('auth_token') || '';
    this.loadTestResults();
  }

  private loadTestResults() {
    const saved = localStorage.getItem('api_test_results');
    if (saved) {
      try {
        this.testResults = JSON.parse(saved).map((r: any) => ({
          ...r,
          timestamp: new Date(r.timestamp)
        }));
      } catch (e) {
        console.warn('Impossible de charger les résultats sauvegardés');
      }
    }
  }

  private saveTestResults() {
    localStorage.setItem('api_test_results', JSON.stringify(this.testResults));
  }

  private getHeaders(): HttpHeaders {
    const headers: any = {
      'Content-Type': 'application/json'
    };
    
    if (this.authToken.trim()) {
      headers['Authorization'] = this.authToken.startsWith('Bearer ') 
        ? this.authToken 
        : `Bearer ${this.authToken}`;
    }
    
    return new HttpHeaders(headers);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private handleError(error: any): ApiError {
    if (error instanceof HttpErrorResponse) {
      return {
        message: error.error?.message || error.message || 'Erreur HTTP',
        status: error.status,
        error: error.error
      };
    }
    return {
      message: error.message || 'Erreur inconnue',
      error: error
    };
  }

  private addTestResult(result: TestResult) {
    this.testResults.unshift(result); // Ajouter en début pour avoir les plus récents en premier
    this.saveTestResults();
  }

  trackByFn(index: number, item: TestResult) {
    return `${item.endpoint}-${item.method}-${item.timestamp.getTime()}`;
  }

  getBadgeColor(status: string): string {
    switch (status) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'pending': return 'warning';
      case 'skipped': return 'medium';
      default: return 'medium';
    }
  }

  getResponseSummary(response: any): string {
    if (!response) return 'Réponse vide';
    if (response.token) return 'Token reçu';
    if (response.message) return response.message;
    if (response.user) return `Utilisateur: ${response.user.username || response.user.email}`;
    return 'Réponse OK';
  }

  getSuccessCount(): number {
    return this.testResults.filter(r => r.status === 'success').length;
  }

  getErrorCount(): number {
    return this.testResults.filter(r => r.status === 'error').length;
  }

  getTotalDuration(): number {
    return this.testResults.reduce((total, r) => total + (r.duration || 0), 0);
  }

  clearResults() {
    this.testResults = [];
    localStorage.removeItem('api_test_results');
  }

  async runAllTests() {
    if (!this.isValidUrl(this.apiUrl)) {
      const toast = await this.toastController.create({
        message: '❌ URL API invalide',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
      return;
    }

    this.isRunning = true;
    const loading = await this.loadingController.create({
      message: 'Exécution des tests...',
      duration: 0
    });
    await loading.present();

    try {
      // Tests séquentiels pour éviter les race conditions
      const connectionOk = await this.testConnection();
      
      if (connectionOk) {
        await this.testRegister();
        await this.testLogin();
        await this.testProfile();
      } else {
        // Skip les autres tests si la connexion échoue
        this.addTestResult({
          endpoint: '/auth/*',
          method: 'SKIP',
          status: 'skipped',
          error: 'Tests ignorés suite à l\'échec de connexion',
          timestamp: new Date()
        });
      }

      const toast = await this.toastController.create({
        message: `✅ Tests terminés: ${this.getSuccessCount()} réussis, ${this.getErrorCount()} échoués`,
        duration: 4000,
        color: this.getErrorCount() === 0 ? 'success' : 'warning'
      });
      await toast.present();

    } catch (error) {
      console.error('Erreur lors des tests:', error);
      
      const toast = await this.toastController.create({
        message: '❌ Erreur inattendue lors des tests',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.isRunning = false;
      await loading.dismiss();
    }
  }

  async testConnection(): Promise<boolean> {
    const start = Date.now();
    const result: TestResult = {
      endpoint: '/health',
      method: 'GET',
      status: 'pending',
      timestamp: new Date()
    };

    try {
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}/health`, { headers: this.getHeaders() })
      );
      
      result.status = 'success';
      result.response = response;
      result.duration = Date.now() - start;
      
      this.addTestResult(result);
      return true;

    } catch (error: any) {
      const apiError = this.handleError(error);
      result.status = 'error';
      result.error = apiError.message;
      result.duration = Date.now() - start;
      
      this.addTestResult(result);
      return false;
    }
  }

  async testRegister(): Promise<boolean> {
    const start = Date.now();
    const result: TestResult = {
      endpoint: '/auth/register',
      method: 'POST',
      status: 'pending',
      timestamp: new Date()
    };

    // Créer un utilisateur unique
    this.registeredUser = {
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'TestPassword123!'
    };

    try {
      const response = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/register`, this.registeredUser, { headers: this.getHeaders() })
      );
      
      result.status = 'success';
      result.response = response;
      result.duration = Date.now() - start;
      
      this.addTestResult(result);
      return true;

    } catch (error: any) {
      const apiError = this.handleError(error);
      result.status = 'error';
      result.error = apiError.message;
      result.duration = Date.now() - start;
      
      this.addTestResult(result);
      return false;
    }
  }

  async testLogin(): Promise<boolean> {
    const start = Date.now();
    const result: TestResult = {
      endpoint: '/auth/login',
      method: 'POST',
      status: 'pending',
      timestamp: new Date()
    };

    // Utiliser l'utilisateur créé lors du test d'inscription
    const testData = this.registeredUser ? {
      username: this.registeredUser.username,
      password: this.registeredUser.password
    } : {
      username: 'test_user',
      password: 'testpassword123'
    };

    try {
      const response: any = await firstValueFrom(
        this.http.post(`${this.apiUrl}/auth/login`, testData, { headers: this.getHeaders() })
      );
      
      result.status = 'success';
      result.response = response;
      result.duration = Date.now() - start;
      
      // Sauvegarder le token reçu pour les tests suivants
      if (response?.token) {
        this.authToken = response.token;
        localStorage.setItem('auth_token', this.authToken);
      }
      
      this.addTestResult(result);
      return true;

    } catch (error: any) {
      const apiError = this.handleError(error);
      result.status = 'error';
      result.error = apiError.message;
      result.duration = Date.now() - start;
      
      this.addTestResult(result);
      return false;
    }
  }

  async testProfile(): Promise<boolean> {
    if (!this.authToken) {
      this.addTestResult({
        endpoint: '/auth/profile',
        method: 'GET',
        status: 'skipped',
        error: 'Aucun token disponible',
        timestamp: new Date()
      });
      return false;
    }

    const start = Date.now();
    const result: TestResult = {
      endpoint: '/auth/profile',
      method: 'GET',
      status: 'pending',
      timestamp: new Date()
    };

    try {
      const response = await firstValueFrom(
        this.http.get(`${this.apiUrl}/auth/profile`, { headers: this.getHeaders() })
      );
      
      result.status = 'success';
      result.response = response;
      result.duration = Date.now() - start;
      
      this.addTestResult(result);
      return true;

    } catch (error: any) {
      const apiError = this.handleError(error);
      result.status = 'error';
      result.error = apiError.message;
      result.duration = Date.now() - start;
      
      this.addTestResult(result);
      return false;
    }
  }
}