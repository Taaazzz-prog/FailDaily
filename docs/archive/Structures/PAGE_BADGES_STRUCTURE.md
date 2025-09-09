
# FailDaily - Page Badges Structure Complète

## 🏆 Page Badges (badges.page.html + badges.page.scss)

### Structure HTML Complète - Page Badges
```html
<ion-header [translucent]="true">
    <ion-toolbar>
        <ion-title class="handwriting">Ma Collection de Badges</ion-title>
    </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true" class="ion-padding">
    <!-- Rafraîchissement -->
    <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content pullingIcon="chevron-down-circle-outline" pullingText="Tirer pour rafraîchir"
            refreshingSpinner="circles" refreshingText="Actualisation...">
        </ion-refresher-content>
    </ion-refresher>

    <div class="badges-container">
        <!-- EN-TÊTE AVEC STATISTIQUES -->
        @if (badgeStats$ | async; as stats) {
        <div class="welcome-section">
            <h1 class="handwriting">Tes trophées ! 🏆</h1>
            <p class="comfort-text">Tu as débloqué {{ stats.unlockedBadges }} badges sur {{ stats.totalBadges }}</p>

            <!-- Progression principale -->
            <div class="progress-section imperfect-element">
                <div class="progress-display">
                    <ion-progress-bar [value]="stats.completionPercentage / 100"
                        class="main-progress-bar"></ion-progress-bar>
                    <div class="progress-text">
                        <span class="percentage handwriting">{{ stats.completionPercentage }}%</span>
                        <span class="label comfort-text">de ta collection</span>
                    </div>
                </div>

                <!-- Stats par rareté -->
                <div class="rarity-chips">
                    <div class="rarity-chip rare">
                        <div class="rarity-name">Rares</div>
                        <div class="rarity-count">
                            <ion-icon name="star-outline"></ion-icon>{{ formatRarityStats(stats.rarityStats.rare) }}
                        </div>
                    </div>
                    <div class="rarity-chip epic">
                        <div class="rarity-name">Épiques</div>
                        <div class="rarity-count">
                            <ion-icon name="diamond-outline"></ion-icon>{{ formatRarityStats(stats.rarityStats.epic) }}
                        </div>
                    </div>
                    <div class="rarity-chip legendary">
                        <div class="rarity-name">Légendaires</div>
                        <div class="rarity-count">
                            <ion-icon name="trophy-outline"></ion-icon>{{ formatRarityStats(stats.rarityStats.legendary) }}
                        </div>
                    </div>
                </div>
            </div>

            <div class="encouragement-text">
                <p class="comfort-text">{{ encouragementMessage }}</p>
                <ion-button fill="clear" size="small" (click)="shareBadgeCollection()" class="share-btn">
                    <ion-icon name="share-outline" slot="start"></ion-icon>
                    Partager ma collection
                </ion-button>
            </div>
        </div>
        }

        <!-- SÉLECTEUR DE MODE D'AFFICHAGE -->
        <div class="view-mode-section">
            <div class="view-mode-buttons">
                <ion-button fill="outline" size="small"
                    (click)="setViewMode('overview')"
                    class="view-mode-btn imperfect-element"
                    [color]="viewMode === 'overview' ? 'primary' : 'medium'">
                    <ion-icon name="apps-outline" slot="start"></ion-icon>
                    Vue d'ensemble
                </ion-button>
                
                <ion-button fill="outline" size="small"
                    (click)="setViewMode('unlocked')"
                    class="view-mode-btn imperfect-element"
                    [color]="viewMode === 'unlocked' ? 'primary' : 'medium'">
                    <ion-icon name="trophy-outline" slot="start"></ion-icon>
                    Mes badges
                    <ion-badge color="success" slot="end">{{ (userBadges$ | async)?.length || 0 }}</ion-badge>
                </ion-button>
                
                <ion-button fill="outline" size="small"
                    (click)="setViewMode('category')"
                    class="view-mode-btn imperfect-element"
                    [color]="viewMode === 'category' ? 'primary' : 'medium'">
                    <ion-icon name="funnel-outline" slot="start"></ion-icon>
                    Par catégorie
                </ion-button>
            </div>

            <!-- Sélecteur de catégorie (visible seulement en mode catégorie) -->
            @if (viewMode === 'category') {
            <div class="category-selector">
                <ion-button fill="clear" size="small" (click)="toggleDropdown()" class="category-dropdown-btn">
                    <ion-icon [name]="getSelectedCategoryIcon()" slot="start"></ion-icon>
                    {{ getSelectedCategoryDisplayName() }}
                    <ion-icon name="chevron-down-outline" slot="end"></ion-icon>
                </ion-button>
                
                @if (isDropdownOpen) {
                <div class="category-dropdown">
                    <ion-button fill="clear" size="small" (click)="selectCategory('all')"
                        [color]="selectedCategory === 'all' ? 'primary' : 'medium'">
                        <ion-icon name="apps" slot="start"></ion-icon>
                        Toutes les catégories
                    </ion-button>
                    @for (category of availableCategories; track category) {
                    <ion-button fill="clear" size="small" (click)="selectCategory(category)"
                        [color]="selectedCategory === category ? 'primary' : 'medium'">
                        <ion-icon [name]="getCategoryIcon(category)" slot="start"></ion-icon>
                        {{ getCategoryDisplayName(category) }}
                    </ion-button>
                    }
                </div>
                }
            </div>
            }

            <!-- Info sur le mode actuel -->
            <p class="comfort-text mode-info">
                <ion-icon name="information-outline"></ion-icon>
                @if (viewMode === 'overview') {
                    Vue d'ensemble • 2-3 badges par catégorie
                } @else if (viewMode === 'unlocked') {
                    Vos badges débloqués • Faciles à retrouver
                } @else {
                    Filtrage par catégorie • Navigation ciblée
                }
            </p>
        </div>

        <!-- COLLECTION DE BADGES -->
        <div class="badges-collection">
            @if (viewMode === 'unlocked') {
            <!-- Mode "Mes badges" - Seulement les badges débloqués -->
            <div class="unlocked-badges-section">
                <div class="section-header">
                    <h3 class="handwriting">
                        <ion-icon name="trophy-outline"></ion-icon>
                        Vos badges débloqués
                    </h3>
                    <ion-badge color="success" class="count-badge">{{ (userBadges$ | async)?.length || 0 }}</ion-badge>
                </div>
                
                @if (userBadges$ | async; as unlockedBadges) {
                    @if (unlockedBadges.length > 0) {
                    <div class="badges-grid">
                        @for (badge of unlockedBadges; track badge.id) {
                        <div class="badge-card imperfect-element unlocked"
                            [class]="'rarity-' + badge.rarity + ' category-' + badge.category.toLowerCase()">

                            <!-- Fond coloré selon la catégorie -->
                            <div class="badge-background" [class]="'bg-' + badge.category.toLowerCase()"></div>

                            <!-- Icône du badge avec style "imparfait" -->
                            <div class="badge-icon-container">
                                <div class="icon-circle imperfect-element" [class]="'circle-' + badge.rarity">
                                    <ion-icon [name]="badge.icon"
                                        [class]="'badge-icon-' + badge.rarity + ' icon-wobble'"></ion-icon>
                                </div>
                                <div class="unlock-star">✨</div>
                            </div>

                            <!-- Informations du badge -->
                            <div class="badge-content">
                                <h4 class="badge-name handwriting">{{ badge.name }}</h4>
                                <p class="badge-description comfort-text">{{ badge.description }}</p>
                                <div class="badge-meta unlocked">
                                    <div class="rarity-tag imperfect-element" [class]="'tag-' + badge.rarity">
                                        <span class="comfort-text">{{ getRarityDisplayName(badge.rarity) }}</span>
                                    </div>
                                    <span class="unlock-date comfort-text">{{ badge.unlockedDate | date:'dd/MM/yy' }}</span>
                                </div>
                            </div>
                        </div>
                        }
                    </div>
                    } @else {
                    <div class="empty-state">
                        <ion-icon name="trophy-outline" class="empty-icon"></ion-icon>
                        <p class="comfort-text">Aucun badge débloqué pour le moment</p>
                        <p class="comfort-text">Commencez à partager vos fails pour débloquer vos premiers badges !</p>
                    </div>
                    }
                }
            </div>
            } @else {
            <!-- Mode overview ou catégorie -->
            @if (getBadgesToDisplay() | async; as displayBadges) {
            <div class="all-categories">
                @for (categoryGroup of getBadgesByCategory(displayBadges) | keyvalue; track categoryGroup.key) {
                <div class="category-section">
                    <div class="category-header">
                        <h3 class="handwriting">
                            <ion-icon [name]="getCategoryIcon(categoryGroup.key)"></ion-icon>
                            {{ getCategoryDisplayName(categoryGroup.key) }}
                        </h3>
                        <ion-badge color="medium" class="count-badge">{{ categoryGroup.value.length }}</ion-badge>
                    </div>

                    <div class="badges-grid">
                        @for (badge of categoryGroup.value; track badge.id) {
                        <div class="badge-card imperfect-element"
                            [class]="'rarity-' + badge.rarity + ' category-' + badge.category.toLowerCase()"
                            [class.unlocked]="badge.unlockedDate" [class.locked]="!badge.unlockedDate">

                            <!-- Fond coloré selon la catégorie -->
                            <div class="badge-background" [class]="'bg-' + badge.category.toLowerCase()"></div>

                            <!-- Icône du badge -->
                            <div class="badge-icon-container">
                                <div class="icon-circle imperfect-element" [class]="'circle-' + badge.rarity">
                                    <ion-icon [name]="badge.icon"
                                        [class]="'badge-icon-' + badge.rarity + ' icon-wobble'"></ion-icon>
                                </div>

                                <!-- Indicateur de débloquage -->
                                @if (badge.unlockedDate) {
                                <div class="unlock-star">✨</div>
                                } @else {
                                <div class="lock-overlay">
                                    <ion-icon name="lock-closed" class="lock-icon"></ion-icon>
                                </div>
                                }
                            </div>

                            <!-- Informations du badge -->
                            <div class="badge-content">
                                <h4 class="badge-name handwriting">{{ badge.name }}</h4>
                                <p class="badge-description comfort-text">{{ badge.description }}</p>

                                @if (badge.unlockedDate) {
                                <div class="badge-meta unlocked">
                                    <div class="rarity-tag imperfect-element" [class]="'tag-' + badge.rarity">
                                        <span class="comfort-text">{{ getRarityDisplayName(badge.rarity) }}</span>
                                    </div>
                                    <span class="unlock-date comfort-text">{{ badge.unlockedDate | date:'dd/MM/yy' }}</span>
                                </div>
                                } @else {
                                <div class="badge-meta locked">
                                    <div class="progress-hint comfort-text">
                                        <ion-icon name="hourglass-outline"></ion-icon>
                                        À débloquer
                                    </div>
                                </div>
                                }
                            </div>
                        </div>
                        }
                    </div>
                </div>
                }
            </div>
            }
            }
        </div>

        <!-- PROGRESSION VERS LES PROCHAINS BADGES -->
        <div class="next-objectives">
            <h3 class="handwriting">Prochains défis ! 🎯</h3>
            <div class="objectives-list">
                @for (challenge of nextChallenges$ | async; track challenge.name) {
                <div class="objective-item imperfect-element">
                    <div class="objective-info">
                        <h4>{{challenge.description}}</h4>
                        <p class="comfort-text">Badge "{{challenge.name}}" ({{getRarityDisplayName(challenge.rarity)}})</p>
                    </div>
                    <div class="objective-progress">
                        <ion-progress-bar [value]="challenge.progress" class="progress-bar"></ion-progress-bar>
                        <span class="progress-text comfort-text">{{challenge.current}}/{{challenge.required}}</span>
                    </div>
                </div>
                } @empty {
                <div class="objective-item imperfect-element">
                    <div class="objective-info">
                        <h4>Tous les badges débloqués !</h4>
                        <p class="comfort-text">Félicitations ! 🎉</p>
                    </div>
                </div>
                }
            </div>
        </div>
    </div>
</ion-content>
```

### Styles SCSS Complets - Page Badges
```scss
// Variables pour le design "imparfait" avec couleurs douces et pastel
:root {
    --pastel-pink: #fde2e7;
    --pastel-peach: #fed7aa;
    --pastel-lavender: #e0e7ff;
    --pastel-mint: #d1fae5;
    --pastel-yellow: #fef3c7;
    --pastel-blue: #dbeafe;

    --courage-color: #fecaca;
    --humour-color: #fed7aa;
    --entraide-color: #d1fae5;
    --perseverance-color: #e0e7ff;
    --special-color: #fef3c7;

    --common-color: #f3f4f6;
    --rare-color: #dbeafe;
    --epic-color: #e0e7ff;
    --legendary-color: #fef3c7;

    --soft-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    --gentle-glow: 0 0 12px rgba(0, 0, 0, 0.1);
}

.badges-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 1rem;

    // Section d'accueil
    .welcome-section {
        text-align: center;
        margin-bottom: 2rem;
        background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
        border-radius: 16px;
        padding: 1.5rem;
        border: 1px solid rgba(99, 102, 241, 0.1);

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
            margin-bottom: 1.5rem;
            font-family: 'Comfortaa', sans-serif;
        }

        .progress-section {
            background: white;
            border-radius: 12px;
            padding: 1rem;
            margin: 1rem 0;
            box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
            transform: rotate(-0.5deg);

            .progress-display {
                margin-bottom: 1rem;

                .main-progress-bar {
                    --background: rgba(99, 102, 241, 0.1);
                    --progress-background: linear-gradient(135deg, #6366f1, #8b5cf6);
                    border-radius: 6px;
                    height: 12px;
                    margin-bottom: 0.5rem;
                }

                .progress-text {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;

                    .percentage {
                        font-size: 1.5rem;
                        color: #6366f1;
                        font-family: 'Caveat', cursive;
                        font-weight: 600;
                    }

                    .label {
                        font-size: 0.9rem;
                        color: #64748b;
                        font-family: 'Comfortaa', sans-serif;
                    }
                }
            }

            .rarity-chips {
                display: flex;
                gap: 0.5rem;
                justify-content: space-around;

                .rarity-chip {
                    text-align: center;
                    padding: 0.5rem;
                    border-radius: 8px;
                    flex: 1;
                    
                    &.rare {
                        background: var(--rare-color);
                        color: #3b82f6;
                    }

                    &.epic {
                        background: var(--epic-color);
                        color: #8b5cf6;
                    }

                    &.legendary {
                        background: var(--legendary-color);
                        color: #f59e0b;
                    }

                    .rarity-name {
                        font-size: 0.7rem;
                        font-weight: 600;
                        margin-bottom: 0.25rem;
                        font-family: 'Comfortaa', sans-serif;
                        text-transform: uppercase;
                        letter-spacing: 0.5px;
                    }

                    .rarity-count {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.25rem;
                        font-size: 0.8rem;
                        font-weight: 500;
                        font-family: 'Comfortaa', sans-serif;

                        ion-icon {
                            font-size: 0.9rem;
                        }
                    }
                }
            }
        }

        .encouragement-text {
            .comfort-text {
                font-style: italic;
                color: #6366f1;
                margin-bottom: 1rem;
            }

            .share-btn {
                --color: #6366f1;
                font-family: 'Comfortaa', sans-serif;
                font-weight: 500;
            }
        }
    }

    // Section des modes d'affichage
    .view-mode-section {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(99, 102, 241, 0.1);

        .view-mode-buttons {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            flex-wrap: wrap;
            justify-content: center;

            .view-mode-btn {
                --border-radius: 20px;
                --padding-start: 12px;
                --padding-end: 12px;
                height: 38px;
                font-weight: 600;
                font-size: 13px;
                flex: 1;
                min-width: 100px;
                transition: all 0.3s ease;
                font-family: 'Comfortaa', sans-serif;

                &.imperfect-element {
                    transform: rotate(-0.5deg);

                    &:nth-child(2) {
                        transform: rotate(0.3deg);
                    }

                    &:nth-child(3) {
                        transform: rotate(-0.2deg);
                    }

                    &:hover {
                        transform: rotate(0deg) scale(1.02);
                    }
                }

                ion-badge {
                    --background: #10b981;
                    --color: white;
                    font-size: 10px;
                    border-radius: 8px;
                    margin-left: 6px;
                }
            }
        }

        .category-selector {
            margin-top: 12px;
            position: relative;

            .category-dropdown-btn {
                --color: #64748b;
                font-size: 0.9rem;
                margin: 0;
                width: 100%;
                justify-content: space-between;
                background: rgba(255, 255, 255, 0.3);
                border-radius: 12px;
                padding: 8px 12px;
                font-family: 'Comfortaa', sans-serif;
            }

            .category-dropdown {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 100;
                padding: 8px;
                margin-top: 4px;
                border: 1px solid rgba(0, 0, 0, 0.1);

                ion-button {
                    --color: #64748b;
                    font-size: 0.85rem;
                    height: 36px;
                    margin: 2px 0;
                    width: 100%;
                    justify-content: flex-start;
                    text-align: left;
                    font-family: 'Comfortaa', sans-serif;

                    &[color="primary"] {
                        --background: var(--pastel-lavender);
                        --color: #6366f1;
                        font-weight: 600;
                    }
                }
            }
        }

        .mode-info {
            margin: 8px 0 0 0;
            font-size: 0.8rem;
            color: #6b7280;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            font-family: 'Comfortaa', sans-serif;

            ion-icon {
                font-size: 0.9rem;
                color: #94a3b8;
            }
        }
    }

    // Collection de badges
    .badges-collection {
        .unlocked-badges-section,
        .all-categories {
            .section-header,
            .category-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 1rem;
                padding: 0 4px;

                h3 {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin: 0;
                    color: #6366f1;
                    font-size: 1.3rem;
                    font-family: 'Caveat', cursive;
                    font-weight: 600;

                    ion-icon {
                        color: #6366f1;
                        font-size: 1.2rem;
                    }
                }

                .count-badge {
                    --background: #64748b;
                    --color: white;
                    font-size: 0.8rem;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-family: 'Comfortaa', sans-serif;
                    font-weight: 500;
                }
            }
        }

        .category-section {
            margin-bottom: 2rem;
            background: white;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            border: 1px solid rgba(99, 102, 241, 0.1);
        }

        .badges-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 1rem;

            .badge-card {
                position: relative;
                background: white;
                border-radius: 12px;
                padding: 1rem;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                border: 1px solid rgba(99, 102, 241, 0.1);
                transition: all 0.3s ease;
                overflow: hidden;

                &.imperfect-element {
                    transform: rotate(-0.5deg);

                    &:nth-child(even) {
                        transform: rotate(0.3deg);
                    }

                    &:hover {
                        transform: rotate(0deg) scale(1.02);
                        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
                    }
                }

                .badge-background {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 40px;
                    opacity: 0.1;

                    &.bg-courage { background: var(--courage-color); }
                    &.bg-humour { background: var(--humour-color); }
                    &.bg-entraide { background: var(--entraide-color); }
                    &.bg-perseverance { background: var(--perseverance-color); }
                    &.bg-special { background: var(--special-color); }
                }

                .badge-icon-container {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    margin-bottom: 1rem;

                    .icon-circle {
                        width: 60px;
                        height: 60px;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        position: relative;
                        transform: rotate(-2deg);

                        &.circle-common {
                            background: var(--common-color);
                            border: 2px solid #9ca3af;
                        }

                        &.circle-rare {
                            background: var(--rare-color);
                            border: 2px solid #3b82f6;
                        }

                        &.circle-epic {
                            background: var(--epic-color);
                            border: 2px solid #8b5cf6;
                        }

                        &.circle-legendary {
                            background: var(--legendary-color);
                            border: 2px solid #f59e0b;
                            box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
                        }

                        ion-icon {
                            font-size: 2rem;

                            &.badge-icon-common { color: #6b7280; }
                            &.badge-icon-rare { color: #3b82f6; }
                            &.badge-icon-epic { color: #8b5cf6; }
                            &.badge-icon-legendary { 
                                color: #f59e0b;
                                filter: drop-shadow(0 0 4px rgba(245, 158, 11, 0.5));
                            }

                            &.icon-wobble {
                                animation: iconWobble 2s ease-in-out infinite;
                            }
                        }
                    }

                    .unlock-star {
                        position: absolute;
                        top: -5px;
                        right: -5px;
                        font-size: 1.2rem;
                        animation: sparkle 1.5s ease-in-out infinite;
                    }

                    .lock-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.3);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;

                        .lock-icon {
                            color: white;
                            font-size: 1.5rem;
                        }
                    }
                }

                .badge-content {
                    text-align: center;

                    .badge-name {
                        font-size: 1.1rem;
                        color: #1e293b;
                        margin: 0 0 0.5rem 0;
                        font-family: 'Caveat', cursive;
                        font-weight: 600;
                    }

                    .badge-description {
                        font-size: 0.85rem;
                        color: #64748b;
                        line-height: 1.4;
                        margin: 0 0 1rem 0;
                        font-family: 'Kalam', cursive;
                    }

                    .badge-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        font-size: 0.75rem;

                        &.unlocked {
                            .rarity-tag {
                                background: rgba(16, 185, 129, 0.1);
                                color: #10b981;
                                padding: 2px 6px;
                                border-radius: 8px;
                                font-weight: 500;
                                font-family: 'Comfortaa', sans-serif;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                transform: rotate(-1deg);

                                &.tag-rare {
                                    background: var(--rare-color);
                                    color: #3b82f6;
                                }

                                &.tag-epic {
                                    background: var(--epic-color);
                                    color: #8b5cf6;
                                }

                                &.tag-legendary {
                                    background: var(--legendary-color);
                                    color: #f59e0b;
                                }
                            }

                            .unlock-date {
                                color: #10b981;
                                font-weight: 500;
                                font-family: 'Comfortaa', sans-serif;
                            }
                        }

                        &.locked {
                            justify-content: center;

                            .progress-hint {
                                display: flex;
                                align-items: center;
                                gap: 0.25rem;
                                color: #94a3b8;
                                font-family: 'Comfortaa', sans-serif;

                                ion-icon {
                                    font-size: 0.8rem;
                                }
                            }
                        }
                    }
                }

                &.locked {
                    opacity: 0.6;
                    filter: grayscale(0.3);

                    .badge-content {
                        .badge-name,
                        .badge-description {
                            color: #94a3b8;
                        }
                    }
                }
            }
        }

        .empty-state {
            text-align: center;
            padding: 3rem 1rem;
            background: rgba(99, 102, 241, 0.05);
            border-radius: 12px;
            border: 1px solid rgba(99, 102, 241, 0.1);

            .empty-icon {
                font-size: 3rem;
                color: #94a3b8;
                margin-bottom: 1rem;
            }

            .comfort-text {
                font-size: 0.9rem;
                color: #64748b;
                margin-bottom: 0.5rem;
                font-family: 'Comfortaa', sans-serif;

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }
    }

    // Prochains objectifs
    .next-objectives {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        margin-top: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
        border: 1px solid rgba(99, 102, 241, 0.1);

        h3 {
            color: #6366f1;
            margin-bottom: 1rem;
            font-family: 'Caveat', cursive;
            font-weight: 600;
            font-size: 1.3rem;
        }

        .objectives-list {
            .objective-item {
                background: rgba(99, 102, 241, 0.05);
                border-radius: 8px;
                padding: 1rem;
                margin-bottom: 0.5rem;
                transform: rotate(-0.3deg);

                &:nth-child(even) {
                    transform: rotate(0.2deg);
                }

                .objective-info {
                    margin-bottom: 0.5rem;

                    h4 {
                        font-size: 0.9rem;
                        color: #1e293b;
                        margin: 0 0 0.25rem 0;
                        font-family: 'Comfortaa', sans-serif;
                        font-weight: 600;
                    }

                    .comfort-text {
                        font-size: 0.8rem;
                        color: #64748b;
                        margin: 0;
                        font-family: 'Kalam', cursive;
                    }
                }

                .objective-progress {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;

                    .progress-bar {
                        flex: 1;
                        --background: rgba(99, 102, 241, 0.2);
                        --progress-background: #6366f1;
                        border-radius: 4px;
                        height: 6px;
                    }

                    .progress-text {
                        font-size: 0.75rem;
                        color: #6366f1;
                        font-weight: 500;
                        font-family: 'Comfortaa', sans-serif;
                        min-width: 40px;
                        text-align: right;
                    }
                }
            }
        }
    }
}

// Animations
@keyframes sparkle {
    0%, 100% {
        opacity: 1;
        transform: scale(1) rotate(0deg);
    }
    25% {
        opacity: 0.7;
        transform: scale(1.1) rotate(90deg);
    }
    50% {
        opacity: 1;
        transform: scale(1.2) rotate(180deg);
    }
    75% {
        opacity: 0.8;
        transform: scale(1.1) rotate(270deg);
    }
}

@keyframes iconWobble {
    0%, 100% {
        transform: rotate(0deg);
    }
    25% {
        transform: rotate(5deg);
    }
    75% {
        transform: rotate(-5deg);
    }
}

// Responsive
@media (max-width: 480px) {
    .badges-container {
        padding: 0.5rem;

        .badges-grid {
            grid-template-columns: 1fr;
            gap: 0.75rem;

            .badge-card {
                padding: 0.75rem;
            }
        }

        .view-mode-buttons {
            flex-direction: column;
            gap: 0.5rem;

            .view-mode-btn {
                min-width: auto;
                width: 100%;
            }
        }
    }
}

@media (min-width: 768px) {
    .badges-container {
        max-width: 800px;

        .badges-grid {
            grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        }

        .view-mode-buttons {
            justify-content: center;
            max-width: 600px;
            margin: 0 auto 12px auto;
        }
    }
}
```
