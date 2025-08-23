# Structure Frontend FailDaily

## Architecture Générale
- **Framework** : Angular 20 (Standalone Components)
- **UI Framework** : Ionic 8
- **Mobile** : Capacitor 7 (iOS/Android)
- **État** : RxJS + Services
- **Authentification** : JWT avec guards
- **Style** : SCSS + Variables CSS Ionic

## Structure des Dossiers

```
frontend/src/
├── index.html                         # Point d'entrée HTML
├── main.ts                           # Bootstrap Angular
├── global.scss                       # Styles globaux
├── zone-flags.ts                     # Configuration Zone.js
├── polyfills.ts                      # Polyfills
├── test.ts                          # Configuration tests
├── test-anonymous-behavior.ts        # Tests comportement anonyme
└── app/
    ├── app.component.ts              # Composant racine
    ├── app.component.html            # Template racine
    ├── app.component.scss            # Styles racine
    ├── app.config.ts                 # Configuration app
    ├── app.routes.ts                 # Routing principal
    ├── components/                   # Composants réutilisables
    │   ├── fail-card/               # Carte d'affichage des fails
    │   ├── legal-consent-modal/     # Modal de consentement légal
    │   ├── user-badge/              # Badge utilisateur
    │   └── reaction-button/         # Bouton de réaction
    ├── directives/                  # Directives personnalisées
    │   └── auth-action.directive.ts # Actions nécessitant auth
    ├── guards/                      # Guards de route
    │   ├── auth.guard.ts           # Protection routes authentifiées
    │   └── no-auth.guard.ts        # Protection routes non-auth
    ├── home/                       # Page d'accueil
    │   ├── home.page.ts
    │   ├── home.page.html
    │   └── home.page.scss
    ├── models/                     # Modèles de données
    │   ├── user.model.ts
    │   ├── fail.model.ts
    │   ├── badge.model.ts
    │   ├── reaction.model.ts
    │   └── user-role.model.ts
    ├── pages/                      # Pages de l'application
    │   ├── admin/                  # Panneau d'administration
    │   ├── auth/                   # Authentification
    │   │   ├── login.page.ts
    │   │   └── register.page.ts
    │   ├── badges/                 # Page des badges
    │   ├── debug/                  # Page de debug
    │   ├── edit-profile/           # Édition profil
    │   ├── legal/                  # Documents légaux
    │   ├── legal-document/         # Document légal spécifique
    │   ├── post-fail/              # Création de fail
    │   ├── privacy-settings/       # Paramètres confidentialité
    │   ├── profile/                # Profil utilisateur
    │   ├── tabs/                   # Navigation par onglets
    │   └── user-profile/           # Profil public
    ├── pipes/                      # Pipes personnalisés
    │   └── time-ago.pipe.ts        # Formatage temps relatif
    ├── services/                   # Services
    │   ├── admin.service.ts        # Administration
    │   ├── auth.service.ts         # Authentification
    │   ├── badge.service.ts        # Gestion badges
    │   ├── consent.service.ts      # Consentements légaux
    │   ├── debug.service.ts        # Debug et logs
    │   ├── event-bus.service.ts    # Communication entre composants
    │   ├── fail.service.ts         # Gestion des fails
    │   ├── legal.service.ts        # Documents légaux
    │   ├── mysql.service.ts        # API Backend
    │   └── comprehensive-logger.service.ts # Logging complet
    ├── utils/                      # Utilitaires
    │   └── validators.ts           # Validateurs personnalisés
    ├── assets/                     # Ressources statiques
    │   ├── icon/                   # Icônes
    │   ├── imgs/                   # Images
    │   └── i18n/                   # Traductions
    ├── environments/               # Configuration environnements
    │   ├── environment.ts          # Développement
    │   └── environment.prod.ts     # Production
    └── theme/                      # Thème et variables
        └── variables.scss          # Variables CSS Ionic
```

## Dépendances

### Dépendances de Production
```json
{
  "@angular/animations": "^20.0.0",           // Animations Angular
  "@angular/common": "^20.0.0",               // Modules communs Angular
  "@angular/compiler": "^20.0.0",             // Compilateur Angular
  "@angular/core": "^20.0.0",                 // Core Angular
  "@angular/forms": "^20.0.0",                // Formulaires Angular
  "@angular/platform-browser": "^20.0.0",     // Platform Browser
  "@angular/platform-browser-dynamic": "^20.0.0", // Dynamic Platform
  "@angular/router": "^20.0.0",               // Router Angular
  
  "@capacitor-community/media": "^8.0.1",     // Plugins média
  "@capacitor/android": "7.4.2",              // Platform Android
  "@capacitor/app": "7.0.2",                  // API App native
  "@capacitor/camera": "^7.0.2",              // Appareil photo
  "@capacitor/core": "7.4.2",                 // Core Capacitor
  "@capacitor/filesystem": "^7.1.4",          // Système de fichiers
  "@capacitor/haptics": "^7.0.2",             // Vibrations
  "@capacitor/ios": "7.4.2",                  // Platform iOS
  "@capacitor/keyboard": "7.0.2",             // Clavier natif
  "@capacitor/local-notifications": "^7.0.2", // Notifications locales
  "@capacitor/preferences": "^7.0.2",         // Préférences locales
  "@capacitor/push-notifications": "^7.0.2",  // Notifications push
  "@capacitor/status-bar": "7.0.2",           // Barre de statut
  
  "@fontsource/caveat": "^5.2.6",             // Police Caveat
  "@fontsource/comfortaa": "^5.2.6",          // Police Comfortaa
  "@fontsource/inter": "^5.2.6",              // Police Inter
  "@fontsource/kalam": "^5.2.6",              // Police Kalam
  
  "@ionic/angular": "^8.0.0",                 // Framework Ionic
  "ionicons": "^7.4.0",                       // Icônes Ionic
  
  "lodash": "^4.17.21",                       // Utilitaires
  "moment": "^2.30.1",                        // Manipulation dates
  "rxjs": "~7.8.0",                           // Programmation réactive
  "tslib": "^2.3.0",                          // Runtime TypeScript
  "zone.js": "~0.15.0"                        // Zone.js pour Angular
}
```

### Dépendances de Développement
```json
{
  "@angular-devkit/build-angular": "^20.0.0", // Build tools Angular
  "@angular-eslint/builder": "^20.0.0",       // ESLint pour Angular
  "@angular-eslint/eslint-plugin": "^20.0.0", // Plugin ESLint Angular
  "@angular-eslint/eslint-plugin-template": "^20.0.0", // Template ESLint
  "@angular-eslint/schematics": "^20.0.0",    // Schematics ESLint
  "@angular-eslint/template-parser": "^20.0.0", // Parser template
  "@angular/cli": "^20.2.0",                  // CLI Angular
  "@angular/compiler-cli": "^20.0.0",         // Compilateur CLI
  "@angular/language-service": "^20.0.0",     // Service de langage
  "@capacitor/cli": "^7.4.2",                 // CLI Capacitor
  "@ionic/angular-toolkit": "^12.0.0",        // Toolkit Ionic
  "@types/jasmine": "~5.1.0",                 // Types Jasmine
  "@typescript-eslint/eslint-plugin": "^8.18.0", // ESLint TypeScript
  "@typescript-eslint/parser": "^8.18.0",     // Parser TypeScript
  "cross-env": "^10.0.0",                     // Variables env cross-platform
  "eslint": "^9.16.0",                        // Linter
  "eslint-plugin-import": "^2.29.1",          // Plugin import ESLint
  "eslint-plugin-jsdoc": "^48.2.1",           // Plugin JSDoc
  "eslint-plugin-prefer-arrow": "1.2.2",      // Plugin arrow functions
  "jasmine-core": "~5.1.0",                   // Framework de test
  "jasmine-spec-reporter": "~5.0.0",          // Reporter Jasmine
  "karma": "~6.4.0",                          // Test runner
  "karma-chrome-launcher": "~3.2.0",          // Chrome launcher
  "karma-coverage": "~2.2.0",                 // Coverage Karma
  "karma-jasmine": "~5.1.0",                  // Jasmine pour Karma
  "karma-jasmine-html-reporter": "~2.1.0",    // Reporter HTML
  "typescript": "~5.8.0"                      // TypeScript
}
```

## Configuration Angular (app.config.ts)

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    provideIonicAngular(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    // Services personnalisés
    AuthService,
    FailService,
    BadgeService,
    MysqlService,
    // Guards
    AuthGuard,
    NoAuthGuard,
    // Interceptors
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ]
};
```

## Routing (app.routes.ts)

### Routes Principales
```typescript
export const routes: Routes = [
  // Redirection vers tabs
  { path: '', redirectTo: '/tabs/home', pathMatch: 'full' },
  
  // Tabs navigation
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage)
      },
      {
        path: 'post-fail',
        loadComponent: () => import('./pages/post-fail/post-fail.page').then(m => m.PostFailPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
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
    ]
  },
  
  // Authentification
  {
    path: 'auth',
    canActivate: [NoAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login.page').then(m => m.LoginPage)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register.page').then(m => m.RegisterPage)
      }
    ]
  },
  
  // Pages légales
  {
    path: 'legal',
    loadComponent: () => import('./pages/legal/legal.page').then(m => m.LegalPage)
  },
  {
    path: 'legal-document/:id',
    loadComponent: () => import('./pages/legal-document/legal-document.page').then(m => m.LegalDocumentPage)
  },
  
  // Profil public
  {
    path: 'user-profile/:userId',
    loadComponent: () => import('./pages/user-profile/user-profile.page').then(m => m.UserProfilePage)
  },
  
  // Debug (développement)
  {
    path: 'debug',
    loadComponent: () => import('./pages/debug/debug.page').then(m => m.DebugPage)
  },
  
  // Wildcard
  { path: '**', redirectTo: '/tabs/home', pathMatch: 'full' }
];
```

## Services Principaux

### AuthService
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  
  async login(email: string, password: string): Promise<User>
  async register(userData: RegisterData): Promise<User>
  async logout(): Promise<void>
  async getCurrentUser(): Promise<User | null>
  isAuthenticated(): boolean
}
```

### FailService
```typescript
@Injectable({ providedIn: 'root' })
export class FailService {
  async getFails(filters?: FailFilters): Promise<Fail[]>
  async createFail(fail: CreateFailData): Promise<Fail>
  async updateFail(id: string, updates: Partial<Fail>): Promise<Fail>
  async deleteFail(id: string): Promise<boolean>
  async addReaction(failId: string, reactionType: ReactionType): Promise<void>
  async addComment(failId: string, content: string): Promise<Comment>
}
```

### BadgeService
```typescript
@Injectable({ providedIn: 'root' })
export class BadgeService {
  async getAvailableBadges(): Promise<Badge[]>
  async getUserBadges(userId: string): Promise<Badge[]>
  async checkAndUnlockBadges(userId: string): Promise<Badge[]>
  async getNextChallengesStats(): Promise<BadgeStats>
}
```

### MysqlService (API Client)
```typescript
@Injectable({ providedIn: 'root' })
export class MysqlService {
  private apiUrl = environment.apiUrl;
  
  async get<T>(endpoint: string): Promise<T>
  async post<T>(endpoint: string, data: any): Promise<T>
  async put<T>(endpoint: string, data: any): Promise<T>
  async delete<T>(endpoint: string): Promise<T>
  
  // Méthodes spécialisées
  async getUserStats(userId: string): Promise<UserStats>
  async getUserBadgesNew(userId: string): Promise<string[]>
}
```

## Composants Principaux

### Composants Standalone
Tous les composants utilisent l'architecture Standalone d'Angular 20 :

```typescript
@Component({
  selector: 'app-example',
  templateUrl: './example.component.html',
  styleUrls: ['./example.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonButton,
    IonIcon,
    // ... autres imports nécessaires
  ]
})
export class ExampleComponent { }
```

### FailCardComponent
Composant de carte pour afficher les fails :
- Affichage du contenu
- Boutons de réaction
- Gestion des commentaires
- Actions utilisateur (édition/suppression)

### LegalConsentModalComponent
Modal pour les consentements légaux :
- Affichage des documents
- Validation des acceptations
- Gestion de l'âge (COPPA)

### UserBadgeComponent
Affichage des badges utilisateur :
- Icônes et descriptions
- Niveaux de rareté
- Animation de déblocage

## Guards et Sécurité

### AuthGuard
```typescript
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/auth/login']);
    return false;
  }
}
```

### NoAuthGuard
```typescript
@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
  canActivate(): boolean {
    if (!this.authService.isAuthenticated()) {
      return true;
    }
    this.router.navigate(['/tabs/home']);
    return false;
  }
}
```

## Modèles de Données

### User Model
```typescript
export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  role: UserRole;
  registrationCompleted: boolean;
  stats?: UserStats;
}
```

### Fail Model
```typescript
export interface Fail {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  isPublic: boolean;
  reactions: ReactionCounts;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}
```

### Badge Model
```typescript
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  rarity: BadgeRarity;
  requirementType: string;
  requirementValue: number;
  unlockedAt?: Date;
}
```

## Scripts Package.json
```json
{
  "ng": "ng",                                   // CLI Angular
  "start": "ng serve",                          // Serveur de développement
  "build": "ng build",                          // Build production
  "watch": "ng build --watch --configuration development", // Build continu
  "test": "ng test",                            // Tests unitaires
  "lint": "ng lint",                            // Linter
  "dev:mobile": "npx cap run android --live-reload --host 192.168.1.207 --port 8100", // Dev mobile
  "dev:external": "ionic serve --external",     // Serveur externe
  "build:mobile": "ionic build && npx cap sync && npx cap run android" // Build mobile
}
```

## Configuration Capacitor

### capacitor.config.ts
```typescript
export default {
  appId: 'com.faildaily.app',
  appName: 'FailDaily',
  webDir: 'dist/faildaily',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Camera: {
      permissions: ['camera', 'photos']
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#488AFF'
    }
  }
};
```

## Thème et Styles

### Variables CSS (theme/variables.scss)
```scss
:root {
  // Couleurs principales
  --ion-color-primary: #3880ff;
  --ion-color-secondary: #3dc2ff;
  --ion-color-tertiary: #5260ff;
  --ion-color-success: #2dd36f;
  --ion-color-warning: #ffc409;
  --ion-color-danger: #eb445a;
  
  // Polices personnalisées
  --ion-font-family-caveat: 'Caveat', cursive;
  --ion-font-family-comfortaa: 'Comfortaa', sans-serif;
  --ion-font-family-inter: 'Inter', sans-serif;
  --ion-font-family-kalam: 'Kalam', cursive;
}
```

## Configuration Environnements

### environment.ts (dev)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  enableDebugMode: true,
  enableMockData: false
};
```

### environment.prod.ts
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.faildaily.com/api',
  enableDebugMode: false,
  enableMockData: false
};
```

## Fonctionnalités Clés

### Navigation par Onglets
- **Home** : Feed des fails publics
- **Post-Fail** : Création de nouveau fail
- **Profile** : Profil utilisateur avec statistiques
- **Badges** : Système de récompenses
- **Admin** : Panneau d'administration (admins seulement)

### Système d'Authentification
- Inscription avec vérification d'âge
- Connexion JWT
- Guards de protection des routes
- Gestion des rôles (user/admin)

### Système de Badges
- 70 badges avec différentes raretés
- Déblocage automatique basé sur les actions
- Affichage des statistiques et défis

### Interface Adaptive
- Design responsive
- Mode sombre/clair automatique
- Optimisé mobile-first
- Support iOS et Android via Capacitor
