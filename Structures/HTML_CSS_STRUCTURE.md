# Structure HTML/CSS et Interface FailDaily

## Philosophy Design
FailDaily adopte une approche "imperfection intentionnelle" - des éléments légèrement asymétriques, des polices manuscrites, et une esthétique chaleureuse qui reflète l'acceptation de l'imperfection.

## Polices Utilisées

### Polices Principales (via Fontsource)
```scss
@import "@fontsource/caveat/400.css";      // Police manuscrite titre
@import "@fontsource/caveat/600.css";      // Police manuscrite bold
@import "@fontsource/caveat/700.css";      // Police manuscrite très bold
@import "@fontsource/comfortaa/300.css";   // Police moderne light
@import "@fontsource/comfortaa/400.css";   // Police moderne regular
@import "@fontsource/comfortaa/600.css";   // Police moderne semi-bold
@import "@fontsource/kalam/400.css";       // Police décontractée
@import "@fontsource/kalam/700.css";       // Police décontractée bold
```

### Usage des Polices
- **Caveat** : Titres principaux, messages d'encouragement
- **Comfortaa** : Interface utilisateur, boutons, navigation
- **Kalam** : Textes décontractés, descriptions

## Système de Couleurs

### Palette Principale
```scss
:root {
    // Couleurs primaires
    --fail-primary: #6366f1;              // Indigo principal
    --fail-accent: #f7a4a4;               // Rose accent
    --fail-gradient: linear-gradient(135deg, #6366f1, #8b5cf6); // Dégradé principal
    --fail-success: #10b981;              // Vert succès
    --fail-warning: #f59e0b;              // Orange avertissement
    
    // Arrière-plans
    --background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 100%);
    
    // Ombres cohérentes
    --fail-shadow-light: 0 4px 12px rgba(99, 102, 241, 0.08);
    --fail-shadow-medium: 0 8px 25px rgba(99, 102, 241, 0.12);
    --fail-shadow-strong: 0 12px 35px rgba(99, 102, 241, 0.15);
    
    // Transitions
    --fail-transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    --fail-bounce: cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
```

### Couleurs par Rareté des Badges
```scss
.rarity-chip {
    &.common { --color: #64748b; }    // Gris
    &.rare { --color: #3b82f6; }      // Bleu
    &.epic { --color: #a855f7; }      // Violet
    &.legendary { --color: #f59e0b; } // Orange/Or
}
```

## Structure HTML Type

### Header Standard
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
```

### Content avec Refresher
```html
<ion-content [fullscreen]="true" class="ion-padding">
    <!-- Pull to refresh -->
    <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content 
            pullingIcon="chevron-down-circle-outline" 
            pullingText="Tirez pour actualiser"
            refreshingSpinner="circles" 
            refreshingText="Actualisation...">
        </ion-refresher-content>
    </ion-refresher>
    
    <!-- Contenu principal -->
    <div class="page-container">
        <!-- Contenu ici -->
    </div>
</ion-content>
```

## Composants Interface

### Cards Fail (fail-card.component)
```html
<ion-card class="fail-card imperfect-element fade-in">
    <ion-card-header>
        <div class="card-header-content">
            <ion-avatar class="user-avatar">
                <img [src]="fail.userAvatar || '/assets/imgs/default-avatar.png'" 
                     [alt]="fail.userName">
            </ion-avatar>
            <div class="user-info">
                <h3 class="user-name">{{ fail.userName }}</h3>
                <p class="post-time">{{ fail.createdAt | timeAgo }}</p>
            </div>
            <ion-badge [color]="getCategoryColor(fail.category)" class="category-badge">
                {{ fail.category }}
            </ion-badge>
        </div>
        
        <ion-card-title class="fail-title">{{ fail.title }}</ion-card-title>
    </ion-card-header>
    
    <ion-card-content>
        <p class="fail-description">{{ fail.description }}</p>
        
        @if (fail.imageUrl) {
            <div class="fail-image-container">
                <img [src]="fail.imageUrl" [alt]="fail.title" class="fail-image">
            </div>
        }
        
        <!-- Boutons de réaction -->
        <div class="reactions-container">
            <ion-button 
                fill="clear" 
                size="small" 
                (click)="toggleReaction(fail.id, 'laugh')"
                class="reaction-button"
                [class.active]="hasUserReacted(fail.id, 'laugh')">
                <ion-icon name="happy-outline" slot="start"></ion-icon>
                {{ fail.reactions.laugh }}
            </ion-button>
            
            <ion-button 
                fill="clear" 
                size="small" 
                (click)="toggleReaction(fail.id, 'courage')"
                class="reaction-button courage"
                [class.active]="hasUserReacted(fail.id, 'courage')">
                <ion-icon name="heart-outline" slot="start"></ion-icon>
                {{ fail.reactions.courage }}
            </ion-button>
            
            <ion-button 
                fill="clear" 
                size="small" 
                (click)="toggleReaction(fail.id, 'empathy')"
                class="reaction-button empathy"
                [class.active]="hasUserReacted(fail.id, 'empathy')">
                <ion-icon name="sad-outline" slot="start"></ion-icon>
                {{ fail.reactions.empathy }}
            </ion-button>
            
            <ion-button 
                fill="clear" 
                size="small" 
                (click)="toggleReaction(fail.id, 'support')"
                class="reaction-button support"
                [class.active]="hasUserReacted(fail.id, 'support')">
                <ion-icon name="thumbs-up-outline" slot="start"></ion-icon>
                {{ fail.reactions.support }}
            </ion-button>
        </div>
    </ion-card-content>
</ion-card>
```

### Badge Card
```html
<div class="badge-item" 
     [class.unlocked]="badge.unlocked"
     [class.locked]="!badge.unlocked"
     [class.recent]="badge.isRecent">
     
    <div class="badge-content">
        <div class="badge-icon-container">
            <ion-icon 
                [name]="badge.icon" 
                class="badge-icon"
                [class]="'rarity-' + badge.rarity">
            </ion-icon>
            
            @if (badge.isRecent) {
                <div class="recent-indicator">
                    <ion-icon name="sparkles"></ion-icon>
                </div>
            }
        </div>
        
        <div class="badge-info">
            <h3 class="badge-name">{{ badge.name }}</h3>
            <p class="badge-description">{{ badge.description }}</p>
            
            <div class="badge-meta">
                <ion-badge [color]="getRarityColor(badge.rarity)" class="rarity-badge">
                    {{ badge.rarity }}
                </ion-badge>
                
                @if (badge.unlocked) {
                    <span class="unlock-date">
                        Débloqué {{ badge.unlockedAt | timeAgo }}
                    </span>
                } @else {
                    <div class="progress-info">
                        <span class="progress-text">
                            {{ badge.currentProgress }} / {{ badge.requiredProgress }}
                        </span>
                        <ion-progress-bar 
                            [value]="badge.progressPercentage / 100"
                            class="badge-progress">
                        </ion-progress-bar>
                    </div>
                }
            </div>
        </div>
    </div>
</div>
```

### Navigation Tabs
```html
<ion-tabs>
    <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home">
            <ion-icon name="home-outline"></ion-icon>
            <ion-label>Accueil</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="post-fail">
            <ion-icon name="add-circle"></ion-icon>
            <ion-label>Publier</ion-label>
        </ion-tab-button>
        
        <ion-tab-button tab="badges">
            <ion-icon name="ribbon-outline"></ion-icon>
            <ion-label>Badges</ion-label>
            @if (newBadgesCount > 0) {
                <ion-badge color="danger">{{ newBadgesCount }}</ion-badge>
            }
        </ion-tab-button>
        
        <ion-tab-button tab="profile">
            <ion-icon name="person-outline"></ion-icon>
            <ion-label>Profil</ion-label>
        </ion-tab-button>
        
        @if (isAdmin) {
            <ion-tab-button tab="admin">
                <ion-icon name="settings-outline"></ion-icon>
                <ion-label>Admin</ion-label>
            </ion-tab-button>
        }
    </ion-tab-bar>
</ion-tabs>
```

## Styles Principaux

### Éléments Imperfection
```scss
.imperfect-element {
    transform: rotate(-0.5deg);
    transition: var(--fail-transition);
    
    &:hover {
        transform: rotate(0deg) scale(1.02);
    }
    
    &:nth-child(even) {
        transform: rotate(0.3deg);
        
        &:hover {
            transform: rotate(0deg) scale(1.02);
        }
    }
}
```

### Typographie
```scss
.handwriting {
    font-family: 'Caveat', cursive;
    font-weight: 600;
    font-size: 1.4rem;
    color: var(--fail-primary);
    letter-spacing: 0.5px;
}

.comfort-text {
    font-family: 'Comfortaa', sans-serif;
    font-weight: 400;
    line-height: 1.6;
    color: var(--ion-color-medium);
}

.encouragement-text {
    font-family: 'Caveat', cursive;
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--fail-accent);
    text-align: center;
    font-style: italic;
    line-height: 1.3;
}
```

### Cards
```scss
ion-card {
    border-radius: 16px !important;
    box-shadow: var(--fail-shadow-light) !important;
    border: 1px solid rgba(99, 102, 241, 0.05) !important;
    transition: var(--fail-transition) !important;
    overflow: visible;

    &:hover {
        transform: translateY(-2px);
        box-shadow: var(--fail-shadow-medium) !important;
    }

    ion-card-header {
        ion-card-title {
            color: var(--fail-primary) !important;
            font-weight: 600;
            font-family: 'Comfortaa', sans-serif;

            ion-icon {
                color: var(--fail-accent) !important;
            }
        }
    }
}

.fail-card {
    margin-bottom: 16px;
    
    .card-header-content {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        
        .user-avatar {
            width: 40px;
            height: 40px;
        }
        
        .user-info {
            flex: 1;
            
            .user-name {
                font-family: 'Comfortaa', sans-serif;
                font-weight: 600;
                font-size: 0.9rem;
                margin: 0;
                color: var(--fail-primary);
            }
            
            .post-time {
                font-size: 0.8rem;
                color: var(--ion-color-medium);
                margin: 2px 0 0 0;
            }
        }
        
        .category-badge {
            font-size: 0.7rem;
            padding: 4px 8px;
        }
    }
    
    .fail-title {
        font-family: 'Caveat', cursive;
        font-size: 1.3rem;
        font-weight: 600;
        color: var(--ion-color-dark);
        margin-bottom: 8px;
    }
    
    .fail-description {
        font-family: 'Kalam', cursive;
        line-height: 1.5;
        color: var(--ion-color-medium-shade);
        margin-bottom: 16px;
    }
    
    .fail-image {
        width: 100%;
        border-radius: 12px;
        margin: 12px 0;
    }
    
    .reactions-container {
        display: flex;
        gap: 8px;
        margin-top: 16px;
        
        .reaction-button {
            --border-radius: 20px;
            font-size: 0.8rem;
            font-family: 'Comfortaa', sans-serif;
            
            &.active {
                --background: rgba(99, 102, 241, 0.1);
                --color: var(--fail-primary);
            }
            
            &.courage.active {
                --background: rgba(239, 68, 68, 0.1);
                --color: #ef4444;
            }
            
            &.empathy.active {
                --background: rgba(168, 85, 247, 0.1);
                --color: #a855f7;
            }
            
            &.support.active {
                --background: rgba(16, 185, 129, 0.1);
                --color: #10b981;
            }
        }
    }
}
```

### Badges
```scss
.badge-item {
    background: white;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
    box-shadow: var(--fail-shadow-light);
    border: 1px solid rgba(99, 102, 241, 0.05);
    transition: var(--fail-transition);
    position: relative;
    
    &.unlocked {
        border-color: rgba(16, 185, 129, 0.2);
        background: linear-gradient(135deg, 
            rgba(16, 185, 129, 0.02) 0%, 
            rgba(99, 102, 241, 0.02) 100%);
    }
    
    &.locked {
        opacity: 0.6;
        filter: grayscale(0.3);
    }
    
    &.recent {
        animation: badge-glow 2s ease-in-out infinite;
        
        .recent-indicator {
            position: absolute;
            top: -5px;
            right: -5px;
            background: linear-gradient(45deg, #ffd700, #ffed4e);
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            z-index: 5;
            animation: sparkle 1.5s ease-in-out infinite;
        }
    }
    
    .badge-content {
        display: flex;
        gap: 16px;
        align-items: center;
        
        .badge-icon-container {
            position: relative;
            
            .badge-icon {
                font-size: 2.5rem;
                
                &.rarity-common { color: #64748b; }
                &.rarity-rare { color: #3b82f6; }
                &.rarity-epic { color: #a855f7; }
                &.rarity-legendary { 
                    color: #f59e0b;
                    filter: drop-shadow(0 0 8px rgba(245, 158, 11, 0.3));
                }
            }
        }
        
        .badge-info {
            flex: 1;
            
            .badge-name {
                font-family: 'Comfortaa', sans-serif;
                font-weight: 600;
                font-size: 1.1rem;
                color: var(--fail-primary);
                margin: 0 0 4px 0;
            }
            
            .badge-description {
                font-family: 'Kalam', cursive;
                font-size: 0.9rem;
                color: var(--ion-color-medium);
                margin: 0 0 8px 0;
                line-height: 1.4;
            }
            
            .badge-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                
                .rarity-badge {
                    font-size: 0.7rem;
                    padding: 2px 6px;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                
                .unlock-date {
                    font-size: 0.8rem;
                    color: var(--ion-color-success);
                    font-family: 'Comfortaa', sans-serif;
                }
                
                .progress-info {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    flex: 1;
                    
                    .progress-text {
                        font-size: 0.8rem;
                        color: var(--ion-color-medium);
                        font-family: 'Comfortaa', sans-serif;
                    }
                    
                    .badge-progress {
                        height: 4px;
                        border-radius: 2px;
                    }
                }
            }
        }
    }
}
```

### Animations et Effets

#### Animations d'Apparition
```scss
.fade-in {
    opacity: 0;
    transform: translateY(20px);
    animation: fadeInUp 0.6s ease forwards;
    
    &:nth-child(1) { animation-delay: 0.1s; }
    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.3s; }
    &:nth-child(4) { animation-delay: 0.4s; }
    &:nth-child(5) { animation-delay: 0.5s; }
}

@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
```

#### Animations de Badges
```scss
@keyframes badge-glow {
    0%, 100% {
        box-shadow: 0 0 15px rgba(74, 222, 128, 0.4);
        transform: scale(1.02);
    }
    50% {
        box-shadow: 0 0 25px rgba(74, 222, 128, 0.8);
        transform: scale(1.08);
    }
}

@keyframes sparkle {
    0%, 100% {
        transform: rotate(0deg) scale(1);
        opacity: 0.8;
    }
    25% {
        transform: rotate(90deg) scale(1.1);
        opacity: 1;
    }
    50% {
        transform: rotate(180deg) scale(1.2);
        opacity: 0.9;
    }
    75% {
        transform: rotate(270deg) scale(1.1);
        opacity: 1;
    }
}
```

#### Animations de Réactions
```scss
@keyframes authPulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.2); }
    100% { transform: scale(1); }
}

@keyframes pulse {
    0% { transform: scale(1); }
    50% { transform: scale(1.1); }
    100% { transform: scale(1); }
}
```

## Toasts de Notification

### Toast de Badge Débloqué
```scss
.badge-toast {
    --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    --color: white;
    --border-radius: 12px;
    --box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
    animation: slideInFromTop 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    
    .toast-header {
        font-weight: 600;
        font-size: 1.1rem;
        font-family: 'Comfortaa', sans-serif;
    }
    
    .toast-message {
        font-size: 0.95rem;
        opacity: 0.9;
        font-family: 'Kalam', cursive;
    }
}

.multiple-badges-toast {
    --background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    --color: white;
    --border-radius: 12px;
    --box-shadow: 0 8px 32px rgba(240, 147, 251, 0.3);
    
    .toast-header {
        font-weight: 600;
        font-size: 1.2rem;
        font-family: 'Comfortaa', sans-serif;
    }
}

@keyframes slideInFromTop {
    0% {
        transform: translateY(-100px);
        opacity: 0;
    }
    100% {
        transform: translateY(0);
        opacity: 1;
    }
}
```

## Responsive Design

### Points de Rupture
```scss
// Mobile
@media (max-width: 768px) {
    .hide-mobile { display: none !important; }
    
    .fail-card {
        margin: 8px;
        
        .reactions-container {
            flex-wrap: wrap;
            gap: 6px;
            
            .reaction-button {
                font-size: 0.7rem;
                --padding-start: 8px;
                --padding-end: 8px;
            }
        }
    }
    
    .badge-item {
        padding: 12px;
        
        .badge-content {
            flex-direction: column;
            text-align: center;
            gap: 12px;
        }
    }
}

// Desktop
@media (min-width: 769px) {
    .hide-desktop { display: none !important; }
    
    .badges-container {
        max-width: 800px;
        margin: 0 auto;
    }
    
    .fail-card {
        max-width: 600px;
        margin: 16px auto;
    }
}

// Tablette
@media (min-width: 768px) and (max-width: 1024px) {
    .badge-item {
        .badge-content {
            .badge-icon-container .badge-icon {
                font-size: 2rem;
            }
        }
    }
}
```

## Accessibilité

### Focus et Navigation Clavier
```scss
*:focus-visible {
    outline: 2px solid var(--fail-accent);
    outline-offset: 2px;
    border-radius: 4px;
}

.auth-required {
    position: relative;
    cursor: pointer;
    
    &::after {
        content: '🔒';
        position: absolute;
        top: -5px;
        right: -5px;
        font-size: 12px;
        background: #ff6b6b;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
    }
    
    &:hover::after {
        animation: authPulse 0.5s infinite;
    }
}
```

## Theming Dark/Light

### Variables CSS Dynamiques
```scss
@media (prefers-color-scheme: dark) {
    :root {
        --background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
        --fail-primary: #818cf8;
        --fail-accent: #fca5a5;
    }
    
    ion-card {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(129, 140, 248, 0.1);
    }
    
    .badge-item {
        background: rgba(30, 41, 59, 0.8);
        border-color: rgba(129, 140, 248, 0.1);
        
        &.unlocked {
            background: linear-gradient(135deg, 
                rgba(16, 185, 129, 0.05) 0%, 
                rgba(129, 140, 248, 0.05) 100%);
        }
    }
}
```

Cette structure HTML/CSS crée une interface cohérente, accessible et esthétiquement plaisante qui reflète l'esprit bienveillant et l'acceptation de l'imperfection de FailDaily.
