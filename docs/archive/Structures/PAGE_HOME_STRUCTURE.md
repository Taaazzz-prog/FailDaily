# FailDaily - Structures HTML/CSS Pages Spécifiques

## 🏠 Page d'Accueil (home.page.html + home.page.scss)

### Structure HTML Complète
```html
<ion-header [translucent]="true">
  <ion-toolbar>
    <ion-title class="handwriting">FailDaily</ion-title>
    <ion-buttons slot="end">
      @if (!(currentUser$ | async)) {
      <ion-button (click)="goToLogin()" color="primary">
        <ion-icon name="person" slot="start"></ion-icon>
        Connexion
      </ion-button>
      } @else {
      <ion-button (click)="goToPostFail()" color="primary">
        <ion-icon name="add-circle" slot="start"></ion-icon>
        Publier
      </ion-button>
      }
    </ion-buttons>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <!-- Pull to refresh -->
  <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
    <ion-refresher-content pullingIcon="chevron-down-circle-outline" pullingText="Tirez pour actualiser"
      refreshingSpinner="circles" refreshingText="Actualisation...">
    </ion-refresher-content>
  </ion-refresher>

  <div class="home-container">
    <!-- ÉCRAN VISITEUR NON CONNECTÉ -->
    @if (!(currentUser$ | async)) {
    <div class="welcome-guest-section">
      <div class="app-preview">
        <h1 class="handwriting main-title">FailDaily 🌟</h1>
        <p class="app-description">
          La communauté qui célèbre l'imperfection et transforme chaque échec en apprentissage
        </p>

        <!-- Preview des fonctionnalités -->
        <div class="features-preview">
          <div class="feature-card">
            <ion-icon name="heart" size="large" class="feature-icon"></ion-icon>
            <h3>Partage authentique</h3>
            <p>Racontez vos échecs sans jugement dans une communauté bienveillante</p>
            <ion-button 
              fill="outline" 
              size="small" 
              [appAuthAction]="true"
              authMessage="Connectez-vous pour partager vos fails"
              authRedirect="/auth/login">
              Essayer maintenant
            </ion-button>
          </div>

          <div class="feature-card">
            <ion-icon name="people" size="large" class="feature-icon"></ion-icon>
            <h3>Soutien communautaire</h3>
            <p>Recevez des encouragements et partagez vos expériences</p>
            <ion-button 
              fill="outline" 
              size="small"
              [appAuthAction]="true"
              authMessage="Rejoignez la communauté pour recevoir du soutien"
              authRedirect="/auth/register">
              Rejoindre
            </ion-button>
          </div>

          <div class="feature-card">
            <ion-icon name="trophy" size="large" class="feature-icon"></ion-icon>
            <h3>Badges de courage</h3>
            <p>Gagnez des récompenses pour votre authenticité et votre courage</p>
            <ion-button 
              fill="outline" 
              size="small"
              [appAuthAction]="true"
              authMessage="Créez un compte pour débloquer des badges"
              authRedirect="/auth/register">
              Découvrir
            </ion-button>
          </div>
        </div>

        <div class="cta-section">
          <h2 class="handwriting">Prêt à commencer votre aventure ?</h2>
          <div class="cta-buttons">
            <ion-button expand="block" (click)="goToRegister()" class="primary-cta" size="large">
              <ion-icon name="person-add-outline" slot="start"></ion-icon>
              Créer un compte gratuit
            </ion-button>
            <ion-button expand="block" fill="outline" (click)="goToLogin()" class="secondary-cta">
              <ion-icon name="log-in-outline" slot="start"></ion-icon>
              J'ai déjà un compte
            </ion-button>
          </div>
        </div>

        <!-- Témoignages -->
        <div class="testimonials-section">
          <h3 class="handwriting">Ce que disent nos membres</h3>
          <div class="testimonial">
            <p>"FailDaily m'a aidé à voir mes échecs comme des opportunités d'apprentissage"</p>
            <span>- Alex, membre depuis 6 mois</span>
          </div>
          <div class="testimonial">
            <p>"Une communauté bienveillante où je peux être authentique"</p>
            <span>- Marie, membre depuis 1 an</span>
          </div>
        </div>
      </div>
    </div>
    } @else {
    <!-- ÉCRAN UTILISATEUR CONNECTÉ -->
    <div class="welcome-section">
      <h1 class="handwriting">Salut {{ (currentUser$ | async)?.displayName }} ! 👋</h1>
      <p class="comfort-text">Prêt(e) à partager ton fail du jour ?</p>
    </div>

    <!-- Loading spinner -->
    @if (isLoading) {
    <div class="loading-section">
      <ion-spinner name="crescent"></ion-spinner>
      <p class="comfort-text">Chargement des fails...</p>
    </div>
    }

    <!-- Feed de fails -->
    @if (!isLoading && fails$) {
    <div class="fails-feed">
      @if (fails$ | async; as fails) {
      @if (fails.length === 0) {
      <div class="empty-state">
        <h2 class="handwriting">Pas encore de fails ! 🤔</h2>
        <p class="comfort-text">Soyez le premier à partager votre histoire</p>
        <ion-button (click)="goToPostFail()" class="imperfect-element">
          Publier mon premier fail
        </ion-button>
      </div>
      } @else {
      @for (fail of fails; track fail.id) {
      <div class="fail-item">
        <app-fail-card [fail]="fail"></app-fail-card>
      </div>
      }
      }
      }
    </div>
    }
    }
  </div>
</ion-content>
```

### Styles SCSS Complets
```scss
// Page d'accueil - Styles principaux
.home-container {
  min-height: 100vh;
}

// STYLES VISITEUR NON CONNECTÉ
.welcome-guest-section {
  padding: 2rem 1rem;
  text-align: center;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;

  .app-preview {
    max-width: 500px;
    margin: 0 auto;

    .main-title {
      font-size: 3rem;
      color: #6366f1;
      margin-bottom: 1rem;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
      font-family: 'Caveat', cursive;
      font-weight: 700;
    }

    .app-description {
      font-size: 1.1rem;
      color: #64748b;
      line-height: 1.6;
      margin-bottom: 2rem;
      padding: 0 1rem;
      font-family: 'Comfortaa', sans-serif;
    }
  }
}

// Cards de fonctionnalités
.features-preview {
  display: grid;
  gap: 1.5rem;
  margin: 2rem 0;

  .feature-card {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 16px;
    padding: 1.5rem;
    box-shadow: 0 4px 15px rgba(99, 102, 241, 0.1);
    border: 1px solid rgba(99, 102, 241, 0.1);
    transform: rotate(-0.5deg);
    transition: all 0.3s ease;

    &:nth-child(even) {
      transform: rotate(0.3deg);
    }

    &:hover {
      transform: rotate(0deg) scale(1.02);
      box-shadow: 0 8px 25px rgba(99, 102, 241, 0.15);
    }

    .feature-icon {
      color: #6366f1;
      margin-bottom: 1rem;
    }

    h3 {
      color: #1e293b;
      font-weight: 600;
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
      font-family: 'Comfortaa', sans-serif;
    }

    p {
      color: #64748b;
      font-size: 0.9rem;
      line-height: 1.4;
      margin: 0 0 1rem 0;
      font-family: 'Kalam', cursive;
    }

    ion-button {
      --border-radius: 12px;
      --color: #6366f1;
      --border-color: #6366f1;
      font-family: 'Comfortaa', sans-serif;
      font-weight: 500;
    }
  }
}

// Call to action
.cta-section {
  margin: 3rem 0 2rem 0;

  h2 {
    font-size: 1.8rem;
    color: #6366f1;
    margin-bottom: 1.5rem;
    font-family: 'Caveat', cursive;
    font-weight: 600;
  }

  .cta-buttons {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 300px;
    margin: 0 auto;

    .primary-cta {
      --background: linear-gradient(135deg, #6366f1, #8b5cf6);
      --color: white;
      height: 48px;
      font-weight: 600;
      border-radius: 12px;
      font-family: 'Comfortaa', sans-serif;
      letter-spacing: 0.3px;
    }

    .secondary-cta {
      --color: #6366f1;
      --border-color: #6366f1;
      height: 48px;
      font-weight: 600;
      border-radius: 12px;
      font-family: 'Comfortaa', sans-serif;
    }
  }
}

// Témoignages
.testimonials-section {
  margin-top: 3rem;
  padding: 2rem 1rem;
  background: rgba(99, 102, 241, 0.05);
  border-radius: 16px;

  h3 {
    font-size: 1.5rem;
    color: #6366f1;
    margin-bottom: 1.5rem;
    font-family: 'Caveat', cursive;
    font-weight: 600;
  }

  .testimonial {
    background: white;
    padding: 1rem;
    border-radius: 12px;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
    transform: rotate(-0.3deg);

    &:nth-child(even) {
      transform: rotate(0.2deg);
    }

    p {
      font-style: italic;
      color: #475569;
      margin: 0 0 0.5rem 0;
      font-family: 'Kalam', cursive;
    }

    span {
      font-size: 0.8rem;
      color: #6366f1;
      font-weight: 500;
      font-family: 'Comfortaa', sans-serif;
    }
  }
}

// STYLES UTILISATEUR CONNECTÉ
.welcome-section {
  padding: 2rem 1rem 1rem 1rem;
  text-align: center;

  h1 {
    font-size: 2rem;
    color: #6366f1;
    margin-bottom: 0.5rem;
    font-family: 'Caveat', cursive;
    font-weight: 600;
  }

  .comfort-text {
    font-size: 1rem;
    color: #64748b;
    font-family: 'Comfortaa', sans-serif;
  }
}

.loading-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;

  ion-spinner {
    margin-bottom: 1rem;
    --color: #6366f1;
  }

  .comfort-text {
    color: #64748b;
    font-family: 'Comfortaa', sans-serif;
  }
}

.fails-feed {
  padding: 1rem;

  .fail-item {
    margin-bottom: 1rem;
  }
}

.empty-state {
  text-align: center;
  padding: 3rem 1rem;

  h2 {
    font-size: 1.8rem;
    color: #6366f1;
    margin-bottom: 1rem;
    font-family: 'Caveat', cursive;
    font-weight: 600;
  }

  .comfort-text {
    font-size: 1rem;
    color: #64748b;
    margin-bottom: 2rem;
    font-family: 'Comfortaa', sans-serif;
  }

  ion-button {
    --background: linear-gradient(135deg, #6366f1, #8b5cf6);
    --color: white;
    --border-radius: 12px;
    font-family: 'Comfortaa', sans-serif;
    font-weight: 500;
    transform: rotate(-0.5deg);
    transition: all 0.3s ease;

    &:hover {
      transform: rotate(0deg) scale(1.05);
    }
  }
}

// Responsive
@media (min-width: 768px) {
  .features-preview {
    grid-template-columns: repeat(3, 1fr);
  }

  .cta-buttons {
    flex-direction: row;
    max-width: 500px;
  }

  .testimonials-section {
    .testimonial {
      display: inline-block;
      width: calc(50% - 0.5rem);
      margin: 0 0.25rem 1rem 0.25rem;
      vertical-align: top;
    }
  }
}

@media (max-width: 480px) {
  .welcome-guest-section {
    padding: 1rem 0.5rem;

    .main-title {
      font-size: 2.5rem;
    }

    .app-description {
      font-size: 1rem;
      padding: 0 0.5rem;
    }
  }

  .features-preview {
    gap: 1rem;

    .feature-card {
      padding: 1rem;
    }
  }
}
```
