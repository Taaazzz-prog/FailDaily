import { Component, OnInit, inject } from '@angular/core';
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
  selector: 'app-api-test-fixed',
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
      <!-- Configuration -->
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
        </ion-card-content>
      </ion-card>

      <!-- Résultats -->
      <ion-card>
        <ion-card-header>
          <ion-card-title>📊 Résultats des tests</ion-card-title>
        </ion-card-header>
        <ion-card-content>
          <div *ngFor="let result of testResults">
            <ion-item>
              <ion-badge 
                [color]="result.status === 'success' ? 'success' : result.status === 'error' ? 'danger' : 'warning'"
                slot="start">
                {{result.status}}
              </ion-badge>
              <ion-label>
                <h3>{{result.method}} {{result.endpoint}}</h3>
                <p *ngIf="result.response">Response: {{result.response | json}}</p>
                <p *ngIf="result.error" style="color: red;">Error: {{result.error}}</p>
              </ion-label>
            </ion-item>
          </div>
        </ion-card-content>
      </ion-card>
    </ion-content>
  `
})
export class ApiTestFixedComponent implements OnInit {
  apiUrl: string = environment.api.baseUrl;
  authToken: string = 'faildaily_token';
  testResults: TestResult[] = [];
  isRunning: boolean = false;

  private http = inject(HttpClient);
  private toastController = inject(ToastController);
  private loadingController = inject(LoadingController);

  constructor() {}

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

  async runAllTests() {
    this.isRunning = true;
    this.testResults = [];

    const loading = await this.loadingController.create({
      message: 'Exécution des tests...',
      duration: 0
    });
    await loading.present();

    try {
      await this.testConnection();
      await this.testRegister();
      await this.testLogin();
    } catch (error) {
      console.error('Erreur lors des tests:', error);
    } finally {
      this.isRunning = false;
      await loading.dismiss();
    }
  }

  async testConnection() {
    const start = Date.now();
    const result: TestResult = {
      endpoint: '/health',
      method: 'GET',
      status: 'pending'
    };
    this.testResults.push(result);

    try {
      const response = await this.http.get(`${this.apiUrl}/health`).toPromise();
      result.status = 'success';
      result.response = response;
      result.duration = Date.now() - start;
      
      const toast = await this.toastController.create({
        message: '✅ Connexion réussie!',
        duration: 2000,
        color: 'success'
      });
      await toast.present();
    } catch (error: any) {
      result.status = 'error';
      result.error = error.message || 'Erreur de connexion';
      result.duration = Date.now() - start;

      const toast = await this.toastController.create({
        message: '❌ Erreur de connexion',
        duration: 3000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  async testRegister() {
    const start = Date.now();
    const result: TestResult = {
      endpoint: '/auth/register',
      method: 'POST',
      status: 'pending'
    };
    this.testResults.push(result);

    const testData = {
      username: `test_${Date.now()}`,
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123'
    };

    try {
      const response = await this.http.post(`${this.apiUrl}/auth/register`, testData).toPromise();
      result.status = 'success';
      result.response = response;
      result.duration = Date.now() - start;
    } catch (error: any) {
      result.status = 'error';
      result.error = error.message || 'Erreur inscription';
      result.duration = Date.now() - start;
    }
  }

  async testLogin() {
    const start = Date.now();
    const result: TestResult = {
      endpoint: '/auth/login',
      method: 'POST',
      status: 'pending'
    };
    this.testResults.push(result);

    const testData = {
      username: 'test_user',
      password: 'testpassword123'
    };

    try {
      const response = await this.http.post(`${this.apiUrl}/auth/login`, testData).toPromise();
      result.status = 'success';
      result.response = response;
      result.duration = Date.now() - start;
    } catch (error: any) {
      result.status = 'error';
      result.error = error.message || 'Erreur connexion';
      result.duration = Date.now() - start;
    }
  }
}
