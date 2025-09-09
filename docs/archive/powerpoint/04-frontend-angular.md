# 📱 Frontend Angular - FailDaily

## 📋 **INFORMATIONS GÉNÉRALES**

| Propriété | Valeur |
|-----------|--------|
| **Framework** | Angular 20.0.0 |
| **UI Library** | Ionic 8.0.0 |
| **Langage** | TypeScript 5.8.0 |
| **Build Tool** | Angular CLI 20.2.0 |
| **Port** | 4200 |
| **URL** | http://localhost:4200 |
| **Status** | ✅ 100% Fonctionnel |

---

## 🏗️ **ARCHITECTURE DU FRONTEND**

### **Structure des Dossiers**
```
frontend/src/
├── 📁 app/
│   ├── 📁 components/         # Composants réutilisables (6 composants)
│   ├── 📁 pages/              # Pages de l'application (14 pages)
│   ├── 📁 services/           # Services Angular (35 services)
│   ├── 📁 models/             # Modèles TypeScript
│   ├── 📁 guards/             # Guards de navigation
│   ├── 📁 pipes/              # Pipes personnalisés
│   ├── 📁 utils/              # Utilitaires et constantes
│   └── 📁 styles/             # Styles globaux
├── 📁 assets/                 # Images, icons, fonts
├── 📁 environments/           # Configuration par environnement
└── 📁 theme/                  # Thème Ionic personnalisé
```

---

## 🎯 **CONFIGURATION PRINCIPALE**

### **app.routes.ts - Routing Principal**
```typescript
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadChildren: () => import('./pages/tabs/tabs.routes').then(m => m.routes),
    canActivate: [AuthGuard]
  },
  {
    path: 'auth',
    loadChildren: () => import('./pages/auth/auth.routes').then(m => m.routes)
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'profile',
    loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
    canActivate: [AuthGuard]
  },
  {
    path: 'post-fail',
    loadComponent: () => import('./pages/post-fail/post-fail.page').then(m => m.PostFailPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'badges',
    loadComponent: () => import('./pages/badges/badges.page').then(m => m.BadgesPage),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
    canActivate: [AuthGuard]
  }
];
```

### **environment.ts - Configuration**
```typescript
export const environment = {
  production: false,

  // Configuration MySQL Database (développement local)
  database: {
    host: 'localhost',
    port: 3306,
    name: 'faildaily_dev',
    charset: 'utf8mb4'
  },

  // APIs backend MySQL et externes
  api: {
    baseUrl: 'http://localhost:3000/api',
    moderationUrl: 'https://api.openai.com/v1',
    moderationKey: 'your-openai-dev-key',
    uploadMaxSize: 5 * 1024 * 1024, // 5MB max
    imageQuality: 80,
    timeout: 30000,
    retryAttempts: 3
  },

  // Configuration authentification JWT
  auth: {
    tokenKey: 'auth_token',
    refreshTokenKey: 'refresh_token',
    tokenExpiry: 24 * 60 * 60 * 1000, // 24h
    autoRefresh: true,
    sessionTimeout: 30 * 60 * 1000 // 30 min inactivité
  },

  // Configuration upload et médias
  upload: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    imageQuality: 80,
    maxWidth: 1920,
    maxHeight: 1080
  },

  // Features flags
  features: {
    notifications: true,
    darkMode: true,
    offline: true,
    analytics: false,
    debugging: true
  }
};
```

---

## 🔧 **SERVICES PRINCIPAUX**

### **1. 🔐 AuthService - Authentification**

```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { User } from '../models/user.model';
import { MysqlService } from './mysql.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  legalConsent: {
    documentsAccepted: string[];
    consentDate: string;
    consentVersion: string;
    marketingOptIn: boolean;
  };
  ageVerification: {
    birthDate: Date;
    isMinor: boolean;
    needsParentalConsent: boolean;
    parentEmail?: string;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  // Protection contre les race conditions
  private sessionInitialized = false;
  private initPromise: Promise<void> | null = null;

  // Auto-déconnexion après inactivité
  private inactivityTimer: any = null;
  private readonly INACTIVITY_TIMEOUT = 10 * 60 * 1000; // 10 minutes

  constructor(
    private mysqlService: MysqlService,
    private eventBus: EventBusService
  ) {
    this.initializeSession();
    this.setupInactivityDetection();
  }

  // Initialisation de la session
  private async initializeSession(): Promise<void> {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const user = await this.validateToken(token);
          if (user) {
            this.setCurrentUser(user);
            this.resetInactivityTimer();
          } else {
            this.clearAuthData();
          }
        }
      } catch (error) {
        console.error('Erreur initialisation session:', error);
        this.clearAuthData();
      } finally {
        this.sessionInitialized = true;
      }
    })();

    return this.initPromise;
  }

  // Connexion utilisateur
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await this.mysqlService.login(credentials.email, credentials.password);
      
      if (result.success && result.token && result.user) {
        localStorage.setItem('auth_token', result.token);
        this.setCurrentUser(result.user);
        this.resetInactivityTimer();
        
        // Log de l'événement
        this.eventBus.emit(AppEvents.UserLoggedIn, { user: result.user });
        
        return { success: true, user: result.user };
      } else {
        return { success: false, error: result.message || 'Erreur de connexion' };
      }
    } catch (error: any) {
      console.error('Erreur login:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  // Inscription utilisateur
  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const result = await this.mysqlService.register(data);
      
      if (result.success) {
        // Auto-connexion après inscription
        return await this.login({ email: data.email, password: data.password });
      } else {
        return { success: false, error: result.message || 'Erreur d\'inscription' };
      }
    } catch (error: any) {
      console.error('Erreur register:', error);
      return { success: false, error: 'Erreur d\'inscription' };
    }
  }

  // Déconnexion
  async logout(): Promise<void> {
    try {
      await this.mysqlService.logout();
    } catch (error) {
      console.error('Erreur logout:', error);
    } finally {
      this.clearAuthData();
      this.clearInactivityTimer();
      this.eventBus.emit(AppEvents.UserLoggedOut);
    }
  }

  // Validation du token
  private async validateToken(token: string): Promise<User | null> {
    try {
      const result = await this.mysqlService.getUserProfile();
      return result.success ? result.user : null;
    } catch (error) {
      console.error('Token invalide:', error);
      return null;
    }
  }

  // Gestion de l'utilisateur actuel
  private setCurrentUser(user: User): void {
    this.currentUserSubject.next(user);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser() && !!localStorage.getItem('auth_token');
  }

  // Gestion de l'inactivité
  private setupInactivityDetection(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (this.isAuthenticated()) {
          this.resetInactivityTimer();
        }
      }, true);
    });
  }

  private resetInactivityTimer(): void {
    this.clearInactivityTimer();
    this.inactivityTimer = setTimeout(() => {
      console.log('Session expirée par inactivité');
      this.logout();
    }, this.INACTIVITY_TIMEOUT);
  }

  private clearInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }

  // Nettoyage des données d'authentification
  private clearAuthData(): void {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    this.setCurrentUser(null);
  }
}
```

### **2. 🗄️ MysqlService - Communication Backend**

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';
import { Fail } from '../models/fail.model';

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  error?: string;
}

@Injectable({ providedIn: 'root' })
export class MysqlService {
  private apiUrl = environment.api.baseUrl;

  constructor(private http: HttpClient) {}

  // Headers d'authentification
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  // === AUTHENTIFICATION ===

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/auth/login`, {
        email,
        password
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur login:', error);
      return { 
        success: false, 
        error: error.error?.error || 'Erreur de connexion' 
      };
    }
  }

  async register(data: any): Promise<AuthResponse> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/registration/register`, {
        email: data.email,
        password: data.password,
        displayName: data.displayName,
        legalConsent: data.legalConsent,
        ageVerification: data.ageVerification
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur register:', error);
      return { 
        success: false, 
        error: error.error?.error || 'Erreur d\'inscription' 
      };
    }
  }

  async getUserProfile(): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/auth/profile`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur profil:', error);
      return { success: false, error: 'Erreur de récupération du profil' };
    }
  }

  async logout(): Promise<void> {
    try {
      await this.http.post(`${this.apiUrl}/auth/logout`, {}, {
        headers: this.getAuthHeaders()
      }).toPromise();
    } catch (error) {
      console.error('Erreur logout:', error);
    }
  }

  // === GESTION DES FAILS ===

  async createFail(failData: any): Promise<any> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/fails`, failData, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur création fail:', error);
      return { 
        success: false, 
        error: error.error?.error || 'Erreur de création' 
      };
    }
  }

  async getPublicFails(page: number = 1, limit: number = 10): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());

      const response: any = await this.http.get(`${this.apiUrl}/fails/public?${params.toString()}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur récupération fails:', error);
      return { 
        success: false, 
        error: 'Erreur de récupération des fails',
        fails: []
      };
    }
  }

  async getFailById(failId: string): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur récupération fail:', error);
      return { success: false, error: 'Fail non trouvé' };
    }
  }

  // === SYSTÈME DE RÉACTIONS ===

  async addReaction(failId: string, reactionType: string): Promise<any> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/reactions`, {
        fail_id: failId,
        reaction_type: reactionType
      }, { headers: this.getAuthHeaders() }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur réaction:', error);
      return { 
        success: false, 
        error: 'Erreur lors de la réaction' 
      };
    }
  }

  async getReactionsSummary(failId: string): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/reactions/${failId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur récupération réactions:', error);
      return { success: false, reactions: {} };
    }
  }

  // === SYSTÈME DE BADGES ===

  async getAvailableBadges(): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/badges/available`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur badges:', error);
      return { success: false, badges: [] };
    }
  }

  // === COMMENTAIRES ===

  async addComment(failId: string, content: string): Promise<any> {
    try {
      const response: any = await this.http.post(`${this.apiUrl}/comments`, {
        fail_id: failId,
        content
      }, { headers: this.getAuthHeaders() }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur commentaire:', error);
      return { 
        success: false, 
        error: 'Erreur lors de l\'ajout du commentaire' 
      };
    }
  }

  async getComments(failId: string): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/comments/${failId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      return response;
    } catch (error: any) {
      console.error('Erreur récupération commentaires:', error);
      return { success: false, comments: [] };
    }
  }
}
```

---

## 📄 **PAGES PRINCIPALES**

### **1. 🏠 HomePage - Accueil**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Fail } from '../../models/fail.model';
import { MysqlService } from '../../services/mysql.service';
import { FailCardComponent } from '../../components/fail-card/fail-card.component';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [CommonModule, IonicModule, FailCardComponent]
})
export class HomePage implements OnInit, OnDestroy {
  fails: Fail[] = [];
  loading = false;
  currentPage = 1;
  hasMore = true;

  constructor(private mysqlService: MysqlService) {}

  async ngOnInit() {
    await this.loadFails();
  }

  // Chargement des fails
  async loadFails(refresh = false) {
    if (this.loading) return;

    this.loading = true;
    
    try {
      if (refresh) {
        this.currentPage = 1;
        this.fails = [];
        this.hasMore = true;
      }

      const result = await this.mysqlService.getPublicFails(this.currentPage, 10);
      
      if (result.success) {
        if (refresh) {
          this.fails = result.fails;
        } else {
          this.fails = [...this.fails, ...result.fails];
        }
        
        this.hasMore = result.pagination?.hasMore || false;
        this.currentPage++;
      }
    } catch (error) {
      console.error('Erreur chargement fails:', error);
    } finally {
      this.loading = false;
    }
  }

  // Pull-to-refresh
  async onRefresh(event: any) {
    await this.loadFails(true);
    event.target.complete();
  }

  // Infinite scroll
  async onInfiniteScroll(event: any) {
    if (this.hasMore) {
      await this.loadFails();
    }
    event.target.complete();
  }

  // Gestion des réactions depuis les composants enfants
  onReactionAdded(event: { failId: string; reactionType: string }) {
    const fail = this.fails.find(f => f.id === event.failId);
    if (fail) {
      // Mise à jour optimiste
      if (!fail.reactions) fail.reactions = {};
      fail.reactions[event.reactionType] = (fail.reactions[event.reactionType] || 0) + 1;
    }
  }

  ngOnDestroy() {
    // Cleanup si nécessaire
  }
}
```

### **2. 📝 PostFailPage - Publication de Fail**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router } from '@angular/router';
import { MysqlService } from '../../services/mysql.service';
import { FailCategory } from '../../models/enums';

@Component({
  selector: 'app-post-fail',
  templateUrl: './post-fail.page.html',
  styleUrls: ['./post-fail.page.scss'],
  imports: [CommonModule, IonicModule, ReactiveFormsModule]
})
export class PostFailPage implements OnInit {
  failForm: FormGroup;
  loading = false;
  categories = Object.values(FailCategory);

  constructor(
    private fb: FormBuilder,
    private mysqlService: MysqlService,
    private router: Router
  ) {
    this.failForm = this.fb.group({
      title: ['', [Validators.required, Validators.maxLength(255)]],
      description: ['', [Validators.required, Validators.maxLength(2000)]],
      category: ['', Validators.required],
      is_anonyme: [true]
    });
  }

  ngOnInit() {}

  // Soumission du formulaire
  async onSubmit() {
    if (this.failForm.valid && !this.loading) {
      this.loading = true;

      try {
        const formData = this.failForm.value;
        const result = await this.mysqlService.createFail(formData);

        if (result.success) {
          // Redirection vers l'accueil avec message de succès
          this.router.navigate(['/tabs/home'], {
            state: { 
              message: 'Votre fail a été publié avec succès !' 
            }
          });
        } else {
          // Affichage de l'erreur
          console.error('Erreur création fail:', result.error);
        }
      } catch (error) {
        console.error('Erreur soumission:', error);
      } finally {
        this.loading = false;
      }
    }
  }

  // Validation en temps réel
  getFieldError(fieldName: string): string {
    const field = this.failForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName} est requis`;
      }
      if (field.errors['maxlength']) {
        return `${fieldName} trop long`;
      }
    }
    return '';
  }
}
```

### **3. 🏆 BadgesPage - Système de Badges**

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { MysqlService } from '../../services/mysql.service';

interface Badge {
  id: number;
  name: string;
  description: string;
  icon: string;
  category: string;
  xp_reward: number;
  unlocked: boolean;
  unlocked_at?: string;
}

@Component({
  selector: 'app-badges',
  templateUrl: './badges.page.html',
  styleUrls: ['./badges.page.scss'],
  imports: [CommonModule, IonicModule]
})
export class BadgesPage implements OnInit {
  badgesByCategory: { [key: string]: Badge[] } = {};
  totalBadges = 0;
  unlockedBadges = 0;
  loading = true;

  constructor(private mysqlService: MysqlService) {}

  async ngOnInit() {
    await this.loadBadges();
  }

  async loadBadges() {
    try {
      const result = await this.mysqlService.getAvailableBadges();
      
      if (result.success) {
        this.badgesByCategory = result.badges;
        this.totalBadges = result.total;
        this.unlockedBadges = result.unlocked;
      }
    } catch (error) {
      console.error('Erreur chargement badges:', error);
    } finally {
      this.loading = false;
    }
  }

  // Calcul du pourcentage de progression
  get progressPercentage(): number {
    return this.totalBadges > 0 ? (this.unlockedBadges / this.totalBadges) * 100 : 0;
  }

  // Obtenir les catégories triées
  get sortedCategories(): string[] {
    return Object.keys(this.badgesByCategory).sort();
  }

  // Formatage de la date de déblocage
  formatUnlockDate(date: string): string {
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
```

---

## 🧩 **COMPOSANTS RÉUTILISABLES**

### **1. 📋 FailCardComponent - Carte de Fail**

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { Fail } from '../../models/fail.model';
import { MysqlService } from '../../services/mysql.service';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

@Component({
  selector: 'app-fail-card',
  templateUrl: './fail-card.component.html',
  styleUrls: ['./fail-card.component.scss'],
  imports: [CommonModule, IonicModule, TimeAgoPipe]
})
export class FailCardComponent {
  @Input() fail!: Fail;
  @Output() reactionAdded = new EventEmitter<{failId: string; reactionType: string}>();

  userReactions: string[] = [];
  showComments = false;
  pulseFlags: Record<string, boolean> = { 
    courage: false, 
    laugh: false, 
    empathy: false, 
    support: false 
  };

  constructor(private mysqlService: MysqlService) {}

  // Gestion des réactions
  async onCourage() {
    await this.addReaction('courage');
  }

  async onLaugh() {
    await this.addReaction('laugh');
  }

  async onEmpathy() {
    await this.addReaction('empathy');
  }

  async onSupport() {
    await this.addReaction('support');
  }

  private async addReaction(reactionType: string) {
    try {
      // Animation de pulse
      this.pulseFlags[reactionType] = true;
      setTimeout(() => this.pulseFlags[reactionType] = false, 600);

      const result = await this.mysqlService.addReaction(this.fail.id, reactionType);
      
      if (result.success) {
        // Mise à jour locale
        if (result.action === 'added') {
          this.fail.reactions[reactionType]++;
        } else {
          this.fail.reactions[reactionType]--;
        }
        
        // Émission de l'événement pour le parent
        this.reactionAdded.emit({ 
          failId: this.fail.id, 
          reactionType 
        });
      }
    } catch (error) {
      console.error('Erreur réaction:', error);
    }
  }

  // Vérification si l'utilisateur a déjà réagi
  isReactionActive(reactionType: string): boolean {
    return this.userReactions.includes(reactionType);
  }

  // Toggle des commentaires
  toggleComments() {
    this.showComments = !this.showComments;
  }
}
```

### **2. 📄 Template FailCard**

```html
<ion-card class="fail-card">
  <!-- En-tête avec auteur -->
  <div class="card-header">
    <ion-avatar slot="start">
      <img [src]="fail.author?.avatar_url || '/assets/default-avatar.png'" 
           [alt]="fail.author?.display_name || 'Anonyme'">
    </ion-avatar>
    <div class="author-info">
      <h3>{{ fail.author?.display_name || 'Anonyme' }}</h3>
      <p>{{ fail.created_at | timeAgo }}</p>
    </div>
  </div>

  <!-- Validation banner -->
  <div class="validation-banner" *ngIf="fail.moderationStatus === 'approved'">
    <ion-chip color="success">
      <ion-icon name="shield-checkmark-outline"></ion-icon>
      <ion-label>Contenu validé</ion-label>
    </ion-chip>
  </div>

  <!-- Contenu principal -->
  <div class="card-content">
    <h2 class="fail-title">{{ fail.title }}</h2>
    <p class="fail-text">{{ fail.description }}</p>
    
    <!-- Image si présente -->
    <div class="fail-image" *ngIf="fail.image_url">
      <img [src]="fail.image_url" [alt]="fail.title">
    </div>
    
    <!-- Catégorie -->
    <ion-chip class="category-chip" [color]="getCategoryColor(fail.category)">
      <ion-label>{{ fail.category }}</ion-label>
    </ion-chip>
  </div>

  <!-- Actions de réaction -->
  <div class="card-actions">
    <ion-button fill="clear" size="small" (click)="onCourage()" 
                class="reaction-button courage"
                [class.active]="isReactionActive('courage')" 
                [class.pulse]="pulseFlags['courage']">
      <ion-icon name="heart" slot="start"></ion-icon>
      <span class="reaction-count">{{ fail.reactions['courage'] || 0 }}</span>
    </ion-button>

    <ion-button fill="clear" size="small" (click)="onLaugh()" 
                class="reaction-button laugh"
                [class.active]="isReactionActive('laugh')" 
                [class.pulse]="pulseFlags['laugh']">
      <ion-icon name="happy" slot="start"></ion-icon>
      <span class="reaction-count">{{ fail.reactions['laugh'] || 0 }}</span>
    </ion-button>

    <ion-button fill="clear" size="small" (click)="onEmpathy()" 
                class="reaction-button empathy"
                [class.active]="isReactionActive('empathy')" 
                [class.pulse]="pulseFlags['empathy']">
      <ion-icon name="people" slot="start"></ion-icon>
      <span class="reaction-count">{{ fail.reactions['empathy'] || 0 }}</span>
    </ion-button>

    <ion-button fill="clear" size="small" (click)="onSupport()" 
                class="reaction-button support"
                [class.active]="isReactionActive('support')" 
                [class.pulse]="pulseFlags['support']">
      <ion-icon name="trophy-outline" slot="start"></ion-icon>
      <span class="reaction-count">{{ fail.reactions['support'] || 0 }}</span>
    </ion-button>

    <!-- Bouton commentaires -->
    <ion-button fill="clear" size="small" (click)="toggleComments()" 
                class="comment-button">
      <ion-icon name="chatbox-outline" slot="start"></ion-icon>
      <span>{{ fail.comments_count || 0 }}</span>
    </ion-button>
  </div>

  <!-- Thread de commentaires (conditionnel) -->
  <app-comments-thread 
    *ngIf="showComments" 
    [failId]="fail.id"
    class="comments-section">
  </app-comments-thread>
</ion-card>
```

---

## 🎨 **STYLES ET THÈME**

### **Variables CSS Globales**
```scss
// theme/variables.scss
:root {
  // Couleurs principales FailDaily
  --ion-color-primary: #6366f1;
  --ion-color-primary-rgb: 99, 102, 241;
  --ion-color-primary-contrast: #ffffff;
  --ion-color-primary-contrast-rgb: 255, 255, 255;
  --ion-color-primary-shade: #5856d6;
  --ion-color-primary-tint: #7c7ce8;

  // Couleurs des réactions
  --reaction-courage: #ef4444;
  --reaction-laugh: #f59e0b;
  --reaction-empathy: #3b82f6;
  --reaction-support: #10b981;

  // Espacements
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  // Bordures
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;

  // Animations
  --animation-fast: 0.2s;
  --animation-normal: 0.3s;
  --animation-slow: 0.5s;
}

// Styles pour les réactions
.reaction-button {
  transition: all var(--animation-fast) ease;
  
  &.active {
    --ion-color-primary: var(--reaction-courage);
    transform: scale(1.1);
  }
  
  &.pulse {
    animation: pulse 0.6s ease-in-out;
  }
  
  &.courage.active {
    --ion-color-primary: var(--reaction-courage);
  }
  
  &.laugh.active {
    --ion-color-primary: var(--reaction-laugh);
  }
  
  &.empathy.active {
    --ion-color-primary: var(--reaction-empathy);
  }
  
  &.support.active {
    --ion-color-primary: var(--reaction-support);
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
```

---

## 🔒 **GUARDS ET SÉCURITÉ**

### **AuthGuard - Protection des Routes**
```typescript
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(): Promise<boolean> {
    // Attendre l'initialisation de la session
    await this.authService.initializeSession();
    
    if (this.authService.isAuthenticated()) {
      return true;
    } else {
      this.router.navigate(['/auth/login']);
      return false;
    }
  }
}
```

---

## 📊 **MODÈLES TYPESCRIPT**

### **user.model.ts**
```typescript
export interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  account_status: 'active' | 'suspended' | 'deleted';
  email_verified: boolean;
  created_at: string;
  updated_at: string;
  
  // Statistiques
  courage_points?: number;
  total_given?: number;
  total_received?: number;
  level?: number;
}
```

### **fail.model.ts**
```typescript
export interface Fail {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: FailCategory;
  image_url?: string;
  is_anonyme: boolean;
  comments_count: number;
  created_at: string;
  updated_at: string;
  
  // Relations
  author?: {
    username: string;
    display_name: string;
    avatar_url?: string;
  };
  
  reactions: {
    courage: number;
    laugh: number;
    empathy: number;
    support: number;
  };
  
  moderationStatus?: 'under_review' | 'hidden' | 'approved';
}
```

---

## 🎯 **POINTS FORTS DU FRONTEND**

### **Performance**
- ✅ **Lazy Loading** : Chargement à la demande des pages
- ✅ **OnPush Strategy** : Optimisation du change detection
- ✅ **Virtual Scrolling** : Pour les longues listes
- ✅ **Bundle Optimization** : Code splitting automatique
- ✅ **PWA Ready** : Service Worker et cache

### **Expérience Utilisateur**
- 📱 **Responsive Design** : Adaptatif mobile/desktop
- 🎨 **Design System** : Cohérence visuelle Ionic
- ⚡ **Animations Fluides** : Micro-interactions
- 🔄 **Real-time Updates** : Mise à jour optimiste
- 🎯 **Accessibility** : ARIA et navigation clavier

### **Architecture**
- 🏗️ **Modulaire** : Composants réutilisables
- 🔧 **Services Décuplés** : Séparation des responsabilités
- 🛡️ **Type Safety** : TypeScript strict
- 🧪 **Testable** : Architecture facilitant les tests
- 📝 **Documentation** : Code auto-documenté

**Le frontend FailDaily offre une expérience utilisateur moderne, performante et intuitive, parfaitement intégrée avec le backend via une architecture robuste et scalable.**
