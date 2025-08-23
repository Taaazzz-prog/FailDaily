# FailDaily - Page Profile Structure Complète

## 👤 Page Profile (profile.page.html + profile.page.scss)

### Structure HTML Complète - Page Profile
```html
<ion-header [translucent]="true">
    <ion-toolbar>
        <ion-title class="handwriting">Mon Profil</ion-title>
        <ion-buttons slot="end">
            <ion-button fill="clear" (click)="openSettings()">
                <ion-icon name="settings-outline"></ion-icon>
            </ion-button>
        </ion-buttons>
    </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true" class="ion-padding">
    <!-- Rafraîchissement -->
    <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content pullingIcon="chevron-down-circle-outline" pullingText="Tirer pour rafraîchir"
            refreshingSpinner="circles" refreshingText="Actualisation...">
        </ion-refresher-content>
    </ion-refresher>

    <div class="profile-container">
        @if (userProfile$ | async; as profile) {
        <!-- EN-TÊTE DU PROFIL -->
        <div class="profile-header">
            <div class="profile-card imperfect-element">
                <!-- Avatar et informations principales -->
                <div class="profile-main">
                    <div class="avatar-section">
                        <div class="avatar-container">
                            <img [src]="profile.avatar || '/assets/default-avatar.png'" 
                                 [alt]="profile.displayName + ' avatar'"
                                 class="avatar-image imperfect-element">
                            <div class="avatar-border"></div>
                            <ion-button fill="clear" size="small" class="edit-avatar-btn" (click)="changeAvatar()">
                                <ion-icon name="camera-outline"></ion-icon>
                            </ion-button>
                        </div>
                        
                        <!-- Badge de niveau -->
                        <div class="level-badge imperfect-element">
                            <div class="level-icon">
                                <ion-icon name="trophy-outline"></ion-icon>
                            </div>
                            <div class="level-text">
                                <span class="level-number handwriting">{{ profile.level }}</span>
                                <span class="level-label comfort-text">Niveau</span>
                            </div>
                        </div>
                    </div>

                    <div class="profile-info">
                        <h1 class="display-name handwriting">{{ profile.displayName }}</h1>
                        <p class="username comfort-text">@{{ profile.username }}</p>
                        
                        @if (profile.bio) {
                        <p class="bio comfort-text">{{ profile.bio }}</p>
                        }
                        
                        <div class="join-date">
                            <ion-icon name="calendar-outline"></ion-icon>
                            <span class="comfort-text">Membre depuis {{ profile.joinDate | date:'MMMM yyyy' }}</span>
                        </div>

                        <!-- Bouton d'édition du profil -->
                        <ion-button fill="outline" size="small" (click)="editProfile()" class="edit-profile-btn imperfect-element">
                            <ion-icon name="create-outline" slot="start"></ion-icon>
                            Modifier le profil
                        </ion-button>
                    </div>
                </div>

                <!-- Statistiques du profil -->
                <div class="profile-stats">
                    <div class="stats-grid">
                        <div class="stat-item imperfect-element">
                            <div class="stat-value handwriting">{{ profile.stats.totalFails }}</div>
                            <div class="stat-label comfort-text">Fails partagés</div>
                        </div>
                        <div class="stat-item imperfect-element">
                            <div class="stat-value handwriting">{{ profile.stats.badgesCount }}</div>
                            <div class="stat-label comfort-text">Badges obtenus</div>
                        </div>
                        <div class="stat-item imperfect-element">
                            <div class="stat-value handwriting">{{ profile.stats.streakDays }}</div>
                            <div class="stat-label comfort-text">Série actuelle</div>
                        </div>
                        <div class="stat-item imperfect-element">
                            <div class="stat-value handwriting">{{ profile.stats.supportGiven }}</div>
                            <div class="stat-label comfort-text">Encouragements</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- PROGRESSION ET BADGES RÉCENTS -->
        <div class="achievements-section">
            <!-- Progression du niveau -->
            <div class="level-progress imperfect-element">
                <div class="progress-header">
                    <h3 class="handwriting">
                        <ion-icon name="trending-up-outline"></ion-icon>
                        Progression
                    </h3>
                    <span class="comfort-text">{{ profile.experience.current }}/{{ profile.experience.nextLevel }} XP</span>
                </div>
                
                <div class="progress-bar-container">
                    <ion-progress-bar [value]="profile.experience.progress" class="xp-progress-bar"></ion-progress-bar>
                    <div class="progress-text">
                        <span class="comfort-text">{{ (profile.experience.progress * 100) | number:'1.0-0' }}% vers le niveau {{ profile.level + 1 }}</span>
                    </div>
                </div>

                @if (profile.experience.untilNext <= 50) {
                <div class="level-up-hint">
                    <ion-icon name="star-outline"></ion-icon>
                    <span class="comfort-text">Encore {{ profile.experience.untilNext }} XP pour le niveau suivant !</span>
                </div>
                }
            </div>

            <!-- Badges récents -->
            <div class="recent-badges">
                <div class="section-header">
                    <h3 class="handwriting">
                        <ion-icon name="medal-outline"></ion-icon>
                        Badges récents
                    </h3>
                    <ion-button fill="clear" size="small" routerLink="/badges" class="view-all-btn">
                        <span class="comfort-text">Voir tout</span>
                        <ion-icon name="chevron-forward-outline" slot="end"></ion-icon>
                    </ion-button>
                </div>

                @if (profile.recentBadges && profile.recentBadges.length > 0) {
                <div class="badges-showcase">
                    @for (badge of profile.recentBadges; track badge.id) {
                    <div class="badge-showcase-item imperfect-element" 
                         [class]="'rarity-' + badge.rarity">
                        <div class="badge-icon-container">
                            <div class="icon-circle" [class]="'circle-' + badge.rarity">
                                <ion-icon [name]="badge.icon"></ion-icon>
                            </div>
                            <div class="unlock-sparkle">✨</div>
                        </div>
                        <div class="badge-info">
                            <h4 class="badge-name comfort-text">{{ badge.name }}</h4>
                            <p class="unlock-date comfort-text">{{ badge.unlockedDate | date:'dd/MM' }}</p>
                        </div>
                    </div>
                    }
                </div>
                } @else {
                <div class="empty-badges">
                    <ion-icon name="trophy-outline" class="empty-icon"></ion-icon>
                    <p class="comfort-text">Aucun badge récent</p>
                    <p class="comfort-text">Continuez à partager vos fails !</p>
                </div>
                }
            </div>
        </div>

        <!-- ACTIVITÉ RÉCENTE -->
        <div class="activity-section">
            <div class="section-header">
                <h3 class="handwriting">
                    <ion-icon name="time-outline"></ion-icon>
                    Activité récente
                </h3>
                <div class="activity-filter">
                    <ion-segment value="all" (ionChange)="onActivityFilterChange($event)">
                        <ion-segment-button value="all">
                            <ion-label class="comfort-text">Tout</ion-label>
                        </ion-segment-button>
                        <ion-segment-button value="fails">
                            <ion-label class="comfort-text">Fails</ion-label>
                        </ion-segment-button>
                        <ion-segment-button value="badges">
                            <ion-label class="comfort-text">Badges</ion-label>
                        </ion-segment-button>
                    </ion-segment>
                </div>
            </div>

            @if (profileActivity$ | async; as activities) {
                @if (activities.length > 0) {
                <div class="activity-timeline">
                    @for (activity of activities; track activity.id) {
                    <div class="activity-item imperfect-element" [class]="'activity-' + activity.type">
                        <div class="activity-icon">
                            <ion-icon [name]="getActivityIcon(activity.type)"></ion-icon>
                        </div>
                        
                        <div class="activity-content">
                            <div class="activity-main">
                                <h4 class="activity-title comfort-text">{{ activity.title }}</h4>
                                <p class="activity-description comfort-text">{{ activity.description }}</p>
                            </div>
                            
                            <div class="activity-meta">
                                <span class="activity-date comfort-text">{{ activity.date | date:'dd/MM/yyyy à HH:mm' }}</span>
                                @if (activity.xpGained) {
                                <span class="xp-badge">+{{ activity.xpGained }} XP</span>
                                }
                            </div>
                        </div>

                        @if (activity.type === 'fail' && activity.failData) {
                        <div class="activity-preview" (click)="viewFail(activity.failData.id)">
                            <ion-icon name="chevron-forward-outline"></ion-icon>
                        </div>
                        }
                    </div>
                    }
                </div>
                } @else {
                <div class="empty-activity">
                    <ion-icon name="hourglass-outline" class="empty-icon"></ion-icon>
                    <p class="comfort-text">Aucune activité récente</p>
                    <ion-button fill="outline" routerLink="/post-fail" class="cta-btn imperfect-element">
                        <ion-icon name="add-outline" slot="start"></ion-icon>
                        Partager un fail
                    </ion-button>
                </div>
                }
            }
        </div>

        <!-- OBJECTIFS ET DÉFIS -->
        <div class="goals-section">
            <div class="section-header">
                <h3 class="handwriting">
                    <ion-icon name="flag-outline"></ion-icon>
                    Objectifs du mois
                </h3>
            </div>

            <div class="goals-grid">
                @for (goal of profile.monthlyGoals; track goal.id) {
                <div class="goal-card imperfect-element" [class.completed]="goal.completed">
                    <div class="goal-icon">
                        <ion-icon [name]="goal.icon" [class.completed-icon]="goal.completed"></ion-icon>
                    </div>
                    
                    <div class="goal-content">
                        <h4 class="goal-title comfort-text">{{ goal.title }}</h4>
                        <div class="goal-progress">
                            <ion-progress-bar [value]="goal.progress" 
                                            [class.completed-progress]="goal.completed"></ion-progress-bar>
                            <span class="progress-text comfort-text">{{ goal.current }}/{{ goal.target }}</span>
                        </div>
                        
                        @if (goal.completed) {
                        <div class="goal-reward">
                            <ion-icon name="gift-outline"></ion-icon>
                            <span class="comfort-text">+{{ goal.rewardXP }} XP</span>
                        </div>
                        }
                    </div>
                </div>
                }
            </div>
        </div>

        <!-- PARAMÈTRES RAPIDES -->
        <div class="quick-settings">
            <h3 class="handwriting">
                <ion-icon name="settings-outline"></ion-icon>
                Paramètres rapides
            </h3>
            
            <div class="settings-list">
                <div class="setting-item imperfect-element">
                    <div class="setting-info">
                        <ion-icon name="notifications-outline"></ion-icon>
                        <div>
                            <h4 class="comfort-text">Notifications</h4>
                            <p class="comfort-text">Encouragements et nouveaux badges</p>
                        </div>
                    </div>
                    <ion-toggle [(ngModel)]="profile.settings.notifications" (ionChange)="updateNotificationSetting($event)"></ion-toggle>
                </div>

                <div class="setting-item imperfect-element">
                    <div class="setting-info">
                        <ion-icon name="eye-outline"></ion-icon>
                        <div>
                            <h4 class="comfort-text">Profil public</h4>
                            <p class="comfort-text">Visible par les autres utilisateurs</p>
                        </div>
                    </div>
                    <ion-toggle [(ngModel)]="profile.settings.publicProfile" (ionChange)="updatePrivacySetting($event)"></ion-toggle>
                </div>

                <div class="setting-item imperfect-element" (click)="openDetailedSettings()">
                    <div class="setting-info">
                        <ion-icon name="cog-outline"></ion-icon>
                        <div>
                            <h4 class="comfort-text">Paramètres avancés</h4>
                            <p class="comfort-text">Confidentialité, compte, préférences</p>
                        </div>
                    </div>
                    <ion-icon name="chevron-forward-outline" class="setting-arrow"></ion-icon>
                </div>
            </div>
        </div>
        }
    </div>
</ion-content>
```

### Styles SCSS Complets - Page Profile
```scss
// Variables pour le design "imparfait" avec couleurs douces et pastel
:root {
    --profile-primary: #6366f1;
    --profile-secondary: #8b5cf6;
    --profile-accent: #10b981;
    
    --level-bronze: #cd7f32;
    --level-silver: #c0c0c0;
    --level-gold: #ffd700;
    --level-platinum: #e5e4e2;
    
    --rare-color: #3b82f6;
    --epic-color: #8b5cf6;
    --legendary-color: #f59e0b;
    
    --soft-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    --gentle-glow: 0 0 12px rgba(0, 0, 0, 0.1);
}

.profile-container {
    max-width: 500px;
    margin: 0 auto;
    padding: 1rem;

    // En-tête du profil
    .profile-header {
        margin-bottom: 1.5rem;

        .profile-card {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.05), rgba(139, 92, 246, 0.05));
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: var(--soft-shadow);
            border: 1px solid rgba(99, 102, 241, 0.1);
            transform: rotate(-0.5deg);

            .profile-main {
                display: flex;
                gap: 1rem;
                margin-bottom: 1.5rem;
                align-items: flex-start;

                .avatar-section {
                    position: relative;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 0.5rem;

                    .avatar-container {
                        position: relative;

                        .avatar-image {
                            width: 80px;
                            height: 80px;
                            border-radius: 50%;
                            object-fit: cover;
                            border: 3px solid var(--profile-primary);
                            transform: rotate(2deg);
                            transition: all 0.3s ease;

                            &:hover {
                                transform: rotate(0deg) scale(1.05);
                            }
                        }

                        .avatar-border {
                            position: absolute;
                            top: -3px;
                            left: -3px;
                            width: calc(100% + 6px);
                            height: calc(100% + 6px);
                            border-radius: 50%;
                            background: linear-gradient(45deg, var(--profile-primary), var(--profile-secondary));
                            z-index: -1;
                            animation: borderGlow 3s ease-in-out infinite;
                        }

                        .edit-avatar-btn {
                            position: absolute;
                            bottom: -5px;
                            right: -5px;
                            --background: var(--profile-primary);
                            --color: white;
                            --border-radius: 50%;
                            width: 28px;
                            height: 28px;
                        }
                    }

                    .level-badge {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                        background: white;
                        border-radius: 12px;
                        padding: 0.25rem 0.5rem;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                        border: 1px solid var(--profile-primary);
                        transform: rotate(-2deg);

                        .level-icon {
                            color: var(--level-gold);
                            font-size: 1rem;
                        }

                        .level-text {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            line-height: 1;

                            .level-number {
                                font-size: 1rem;
                                color: var(--profile-primary);
                                font-family: 'Caveat', cursive;
                                font-weight: 600;
                            }

                            .level-label {
                                font-size: 0.6rem;
                                color: #64748b;
                                font-family: 'Comfortaa', sans-serif;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                            }
                        }
                    }
                }

                .profile-info {
                    flex: 1;

                    .display-name {
                        font-size: 1.5rem;
                        color: var(--profile-primary);
                        margin: 0 0 0.25rem 0;
                        font-family: 'Caveat', cursive;
                        font-weight: 600;
                        line-height: 1.2;
                    }

                    .username {
                        font-size: 0.9rem;
                        color: #64748b;
                        margin: 0 0 0.75rem 0;
                        font-family: 'Comfortaa', sans-serif;
                        font-weight: 500;
                    }

                    .bio {
                        font-size: 0.85rem;
                        color: #475569;
                        line-height: 1.4;
                        margin: 0 0 0.75rem 0;
                        font-family: 'Kalam', cursive;
                        font-style: italic;
                    }

                    .join-date {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                        margin-bottom: 1rem;

                        ion-icon {
                            color: #94a3b8;
                            font-size: 0.9rem;
                        }

                        .comfort-text {
                            font-size: 0.8rem;
                            color: #64748b;
                            font-family: 'Comfortaa', sans-serif;
                        }
                    }

                    .edit-profile-btn {
                        --border-color: var(--profile-primary);
                        --color: var(--profile-primary);
                        --border-radius: 20px;
                        height: 32px;
                        font-size: 0.8rem;
                        font-family: 'Comfortaa', sans-serif;
                        font-weight: 500;
                        transform: rotate(-1deg);

                        &:hover {
                            transform: rotate(0deg);
                        }
                    }
                }
            }

            .profile-stats {
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 0.75rem;

                    .stat-item {
                        text-align: center;
                        background: white;
                        border-radius: 12px;
                        padding: 1rem 0.5rem;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
                        border: 1px solid rgba(99, 102, 241, 0.1);
                        transform: rotate(-1deg);

                        &:nth-child(even) {
                            transform: rotate(1deg);
                        }

                        &:hover {
                            transform: rotate(0deg) scale(1.02);
                        }

                        .stat-value {
                            font-size: 1.5rem;
                            color: var(--profile-primary);
                            font-family: 'Caveat', cursive;
                            font-weight: 600;
                            margin-bottom: 0.25rem;
                        }

                        .stat-label {
                            font-size: 0.75rem;
                            color: #64748b;
                            font-family: 'Comfortaa', sans-serif;
                            text-transform: uppercase;
                            letter-spacing: 0.5px;
                        }
                    }
                }
            }
        }
    }

    // Section des achievements
    .achievements-section {
        margin-bottom: 1.5rem;

        .level-progress {
            background: white;
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: var(--soft-shadow);
            border: 1px solid rgba(99, 102, 241, 0.1);
            transform: rotate(0.5deg);

            .progress-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 0.75rem;

                h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--profile-primary);
                    font-size: 1.2rem;
                    margin: 0;
                    font-family: 'Caveat', cursive;
                    font-weight: 600;

                    ion-icon {
                        color: var(--profile-accent);
                    }
                }

                .comfort-text {
                    font-size: 0.8rem;
                    color: #64748b;
                    font-family: 'Comfortaa', sans-serif;
                    font-weight: 500;
                }
            }

            .progress-bar-container {
                .xp-progress-bar {
                    --background: rgba(99, 102, 241, 0.1);
                    --progress-background: linear-gradient(135deg, var(--profile-primary), var(--profile-secondary));
                    border-radius: 8px;
                    height: 12px;
                    margin-bottom: 0.5rem;
                }

                .progress-text {
                    text-align: center;

                    .comfort-text {
                        font-size: 0.8rem;
                        color: #64748b;
                        font-family: 'Comfortaa', sans-serif;
                    }
                }
            }

            .level-up-hint {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                margin-top: 0.75rem;
                padding: 0.5rem;
                background: rgba(16, 185, 129, 0.1);
                border-radius: 8px;
                border: 1px solid rgba(16, 185, 129, 0.2);

                ion-icon {
                    color: var(--profile-accent);
                    animation: sparkle 1.5s ease-in-out infinite;
                }

                .comfort-text {
                    color: var(--profile-accent);
                    font-family: 'Comfortaa', sans-serif;
                    font-weight: 500;
                    font-size: 0.8rem;
                }
            }
        }

        .recent-badges {
            background: white;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: var(--soft-shadow);
            border: 1px solid rgba(99, 102, 241, 0.1);
            transform: rotate(-0.3deg);

            .section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;

                h3 {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    color: var(--profile-primary);
                    font-size: 1.2rem;
                    margin: 0;
                    font-family: 'Caveat', cursive;
                    font-weight: 600;

                    ion-icon {
                        color: var(--level-gold);
                    }
                }

                .view-all-btn {
                    --color: #64748b;
                    font-size: 0.8rem;
                    font-family: 'Comfortaa', sans-serif;

                    .comfort-text {
                        margin-right: 0.25rem;
                    }
                }
            }

            .badges-showcase {
                display: flex;
                gap: 0.75rem;
                overflow-x: auto;
                padding-bottom: 0.5rem;

                .badge-showcase-item {
                    min-width: 80px;
                    text-align: center;
                    background: rgba(99, 102, 241, 0.05);
                    border-radius: 12px;
                    padding: 0.75rem 0.5rem;
                    border: 1px solid rgba(99, 102, 241, 0.1);
                    transform: rotate(-1deg);

                    &:nth-child(even) {
                        transform: rotate(1deg);
                    }

                    &.rarity-rare {
                        border-color: rgba(59, 130, 246, 0.3);
                        background: rgba(59, 130, 246, 0.05);
                    }

                    &.rarity-epic {
                        border-color: rgba(139, 92, 246, 0.3);
                        background: rgba(139, 92, 246, 0.05);
                    }

                    &.rarity-legendary {
                        border-color: rgba(245, 158, 11, 0.3);
                        background: rgba(245, 158, 11, 0.05);
                        box-shadow: 0 0 8px rgba(245, 158, 11, 0.2);
                    }

                    .badge-icon-container {
                        position: relative;
                        margin-bottom: 0.5rem;

                        .icon-circle {
                            width: 40px;
                            height: 40px;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto;
                            background: white;
                            border: 2px solid var(--rare-color);

                            &.circle-rare {
                                border-color: var(--rare-color);
                            }

                            &.circle-epic {
                                border-color: var(--epic-color);
                            }

                            &.circle-legendary {
                                border-color: var(--legendary-color);
                                box-shadow: 0 0 6px rgba(245, 158, 11, 0.3);
                            }

                            ion-icon {
                                font-size: 1.2rem;
                                color: var(--rare-color);
                            }
                        }

                        .unlock-sparkle {
                            position: absolute;
                            top: -2px;
                            right: -2px;
                            font-size: 0.8rem;
                            animation: sparkle 1.5s ease-in-out infinite;
                        }
                    }

                    .badge-info {
                        .badge-name {
                            font-size: 0.7rem;
                            color: #1e293b;
                            margin: 0 0 0.25rem 0;
                            font-family: 'Comfortaa', sans-serif;
                            font-weight: 600;
                            line-height: 1.2;
                        }

                        .unlock-date {
                            font-size: 0.6rem;
                            color: #64748b;
                            margin: 0;
                            font-family: 'Comfortaa', sans-serif;
                        }
                    }
                }
            }

            .empty-badges {
                text-align: center;
                padding: 2rem 1rem;

                .empty-icon {
                    font-size: 2rem;
                    color: #94a3b8;
                    margin-bottom: 0.5rem;
                }

                .comfort-text {
                    font-size: 0.8rem;
                    color: #64748b;
                    margin-bottom: 0.25rem;
                    font-family: 'Comfortaa', sans-serif;
                }
            }
        }
    }

    // Section d'activité
    .activity-section {
        margin-bottom: 1.5rem;

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;
            flex-wrap: wrap;
            gap: 0.5rem;

            h3 {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--profile-primary);
                font-size: 1.2rem;
                margin: 0;
                font-family: 'Caveat', cursive;
                font-weight: 600;

                ion-icon {
                    color: #64748b;
                }
            }

            .activity-filter {
                ion-segment {
                    --background: white;
                    border-radius: 20px;
                    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

                    ion-segment-button {
                        --indicator-color: var(--profile-primary);
                        --color: #64748b;
                        --color-checked: var(--profile-primary);
                        font-size: 0.75rem;

                        ion-label {
                            font-family: 'Comfortaa', sans-serif;
                            font-weight: 500;
                        }
                    }
                }
            }
        }

        .activity-timeline {
            background: white;
            border-radius: 12px;
            padding: 1rem;
            box-shadow: var(--soft-shadow);
            border: 1px solid rgba(99, 102, 241, 0.1);

            .activity-item {
                display: flex;
                gap: 0.75rem;
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 0.5rem;
                background: rgba(99, 102, 241, 0.02);
                border: 1px solid rgba(99, 102, 241, 0.05);
                transform: rotate(-0.2deg);

                &:nth-child(even) {
                    transform: rotate(0.2deg);
                }

                &.activity-badge {
                    background: rgba(245, 158, 11, 0.05);
                    border-color: rgba(245, 158, 11, 0.1);
                }

                &.activity-level {
                    background: rgba(16, 185, 129, 0.05);
                    border-color: rgba(16, 185, 129, 0.1);
                }

                .activity-icon {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: var(--profile-primary);
                    color: white;
                    flex-shrink: 0;

                    ion-icon {
                        font-size: 1rem;
                    }
                }

                .activity-content {
                    flex: 1;
                    min-width: 0;

                    .activity-main {
                        margin-bottom: 0.25rem;

                        .activity-title {
                            font-size: 0.9rem;
                            color: #1e293b;
                            margin: 0 0 0.25rem 0;
                            font-family: 'Comfortaa', sans-serif;
                            font-weight: 600;
                        }

                        .activity-description {
                            font-size: 0.8rem;
                            color: #64748b;
                            margin: 0;
                            font-family: 'Kalam', cursive;
                            line-height: 1.3;
                        }
                    }

                    .activity-meta {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;

                        .activity-date {
                            font-size: 0.7rem;
                            color: #94a3b8;
                            font-family: 'Comfortaa', sans-serif;
                        }

                        .xp-badge {
                            background: var(--profile-accent);
                            color: white;
                            font-size: 0.6rem;
                            padding: 2px 6px;
                            border-radius: 8px;
                            font-family: 'Comfortaa', sans-serif;
                            font-weight: 600;
                        }
                    }
                }

                .activity-preview {
                    display: flex;
                    align-items: center;
                    color: #94a3b8;
                    cursor: pointer;

                    &:hover {
                        color: var(--profile-primary);
                    }

                    ion-icon {
                        font-size: 1rem;
                    }
                }
            }
        }

        .empty-activity {
            text-align: center;
            padding: 2rem 1rem;
            background: white;
            border-radius: 12px;
            box-shadow: var(--soft-shadow);
            border: 1px solid rgba(99, 102, 241, 0.1);

            .empty-icon {
                font-size: 2.5rem;
                color: #94a3b8;
                margin-bottom: 1rem;
            }

            .comfort-text {
                font-size: 0.9rem;
                color: #64748b;
                margin-bottom: 1rem;
                font-family: 'Comfortaa', sans-serif;
            }

            .cta-btn {
                --border-color: var(--profile-primary);
                --color: var(--profile-primary);
                --border-radius: 20px;
                font-family: 'Comfortaa', sans-serif;
                font-weight: 500;
                transform: rotate(-1deg);

                &:hover {
                    transform: rotate(0deg);
                }
            }
        }
    }

    // Section des objectifs
    .goals-section {
        margin-bottom: 1.5rem;

        .section-header {
            margin-bottom: 1rem;

            h3 {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--profile-primary);
                font-size: 1.2rem;
                margin: 0;
                font-family: 'Caveat', cursive;
                font-weight: 600;

                ion-icon {
                    color: #f59e0b;
                }
            }
        }

        .goals-grid {
            display: grid;
            gap: 0.75rem;

            .goal-card {
                display: flex;
                gap: 0.75rem;
                background: white;
                border-radius: 12px;
                padding: 1rem;
                box-shadow: var(--soft-shadow);
                border: 1px solid rgba(99, 102, 241, 0.1);
                transform: rotate(-0.3deg);

                &:nth-child(even) {
                    transform: rotate(0.3deg);
                }

                &.completed {
                    background: rgba(16, 185, 129, 0.05);
                    border-color: rgba(16, 185, 129, 0.2);
                }

                .goal-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: rgba(99, 102, 241, 0.1);
                    color: var(--profile-primary);
                    flex-shrink: 0;

                    ion-icon {
                        font-size: 1.2rem;

                        &.completed-icon {
                            color: var(--profile-accent);
                        }
                    }
                }

                .goal-content {
                    flex: 1;

                    .goal-title {
                        font-size: 0.9rem;
                        color: #1e293b;
                        margin: 0 0 0.5rem 0;
                        font-family: 'Comfortaa', sans-serif;
                        font-weight: 600;
                    }

                    .goal-progress {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        margin-bottom: 0.5rem;

                        ion-progress-bar {
                            flex: 1;
                            --background: rgba(99, 102, 241, 0.1);
                            --progress-background: var(--profile-primary);
                            border-radius: 4px;
                            height: 6px;

                            &.completed-progress {
                                --progress-background: var(--profile-accent);
                            }
                        }

                        .progress-text {
                            font-size: 0.75rem;
                            color: #64748b;
                            font-family: 'Comfortaa', sans-serif;
                            font-weight: 500;
                            min-width: 40px;
                            text-align: right;
                        }
                    }

                    .goal-reward {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;

                        ion-icon {
                            color: var(--profile-accent);
                            font-size: 0.9rem;
                        }

                        .comfort-text {
                            font-size: 0.75rem;
                            color: var(--profile-accent);
                            font-family: 'Comfortaa', sans-serif;
                            font-weight: 600;
                        }
                    }
                }
            }
        }
    }

    // Paramètres rapides
    .quick-settings {
        background: white;
        border-radius: 12px;
        padding: 1rem;
        box-shadow: var(--soft-shadow);
        border: 1px solid rgba(99, 102, 241, 0.1);
        transform: rotate(0.3deg);

        h3 {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--profile-primary);
            font-size: 1.2rem;
            margin: 0 0 1rem 0;
            font-family: 'Caveat', cursive;
            font-weight: 600;

            ion-icon {
                color: #64748b;
            }
        }

        .settings-list {
            .setting-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                border-radius: 8px;
                margin-bottom: 0.5rem;
                background: rgba(99, 102, 241, 0.02);
                border: 1px solid rgba(99, 102, 241, 0.05);
                cursor: pointer;
                transform: rotate(-0.2deg);

                &:nth-child(even) {
                    transform: rotate(0.2deg);
                }

                &:hover {
                    transform: rotate(0deg);
                    background: rgba(99, 102, 241, 0.05);
                }

                .setting-info {
                    display: flex;
                    gap: 0.75rem;
                    align-items: center;
                    flex: 1;

                    ion-icon {
                        color: var(--profile-primary);
                        font-size: 1.2rem;
                    }

                    div {
                        h4 {
                            font-size: 0.9rem;
                            color: #1e293b;
                            margin: 0 0 0.25rem 0;
                            font-family: 'Comfortaa', sans-serif;
                            font-weight: 600;
                        }

                        p {
                            font-size: 0.75rem;
                            color: #64748b;
                            margin: 0;
                            font-family: 'Kalam', cursive;
                            line-height: 1.2;
                        }
                    }
                }

                .setting-arrow {
                    color: #94a3b8;
                    font-size: 1rem;
                }

                ion-toggle {
                    --track-background: #e2e8f0;
                    --track-background-checked: var(--profile-primary);
                    --handle-background: white;
                    --handle-background-checked: white;
                }
            }
        }
    }
}

// Animations
@keyframes borderGlow {
    0%, 100% {
        opacity: 0.6;
        transform: scale(1);
    }
    50% {
        opacity: 1;
        transform: scale(1.02);
    }
}

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

// Responsive
@media (max-width: 480px) {
    .profile-container {
        padding: 0.5rem;

        .profile-header .profile-card .profile-main {
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 1rem;

            .avatar-section {
                .level-badge {
                    transform: rotate(0deg);
                }
            }
        }

        .stats-grid {
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 0.5rem;

            .stat-item {
                padding: 0.75rem 0.25rem;
            }
        }

        .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.75rem;
        }

        .activity-item {
            gap: 0.5rem;

            .activity-icon {
                width: 28px;
                height: 28px;
            }
        }
    }
}

@media (min-width: 768px) {
    .profile-container {
        max-width: 600px;

        .stats-grid {
            grid-template-columns: repeat(4, 1fr);
        }

        .goals-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
}
```
