import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonIcon, IonButton,
    IonAvatar, IonBadge, IonProgressBar,
    IonRefresher, IonRefresherContent, IonActionSheet, IonAlert,
    RefresherCustomEvent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
    calendar, createOutline, shareOutline, trophy, documentText, heart,
    flame, analytics, add, ribbonOutline, arrowForward, ellipsisHorizontal,
    documentOutline, shieldCheckmark, chevronForward, settingsOutline,
    lockClosed, chevronDownCircleOutline
} from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { FailService } from '../../services/fail.service';
import { BadgeService } from '../../services/badge.service';
import { EventBusService, AppEvents } from '../../services/event-bus.service';
import { User } from '../../models/user.model';
import { Fail } from '../../models/fail.model';
import { Badge } from '../../models/badge.model';
import { Router } from '@angular/router';
import { Observable, combineLatest, map, Subscription } from 'rxjs';
import { TimeAgoPipe } from '../../pipes/time-ago.pipe';

interface ProfileStats {
    totalFails: number;
    couragePoints: number;
    totalReactions: number;
    currentStreak: number;
    joinedDaysAgo: number;
    averageReactionsPerFail: number;
}

@Component({
    selector: 'app-profile',
    templateUrl: './profile.page.html',
    styleUrls: ['./profile.page.scss'],
    imports: [
        CommonModule, RouterModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton,
        IonAvatar, IonBadge, IonProgressBar,
        IonRefresher, IonRefresherContent, IonActionSheet, IonAlert,
        TimeAgoPipe
    ]
})
export class ProfilePage implements OnInit, OnDestroy {
    currentUser$ = this.authService.currentUser$;
    userFails$: Observable<Fail[]>;
    userBadges$: Observable<Badge[]>;
    profileStats$: Observable<ProfileStats>;
    recentFails$: Observable<Fail[]>;

    private subscriptions: Subscription = new Subscription();

    // UI State
    isActionSheetOpen = false;
    isAlertOpen = false;

    // Boutons pour Action Sheet et Alert
    actionSheetButtons = [
        {
            text: 'Modifier le profil',
            icon: 'create-outline',
            handler: () => {
                this.closeActionSheet();
                setTimeout(() => {
                    console.log('Navigation vers edit-profile...');
                    this.router.navigate(['/tabs/edit-profile']).then(success => {
                        console.log('Navigation réussie:', success);
                    }).catch(error => {
                        console.error('Erreur de navigation:', error);
                    });
                }, 300);
            }
        },
        {
            text: 'Changer la photo',
            icon: 'camera-outline',
            handler: () => {
                this.closeActionSheet();
                setTimeout(() => {
                    console.log('Navigation vers change-photo...');
                    this.router.navigate(['/tabs/change-photo']).then(success => {
                        console.log('Navigation réussie:', success);
                    }).catch(error => {
                        console.error('Erreur de navigation:', error);
                    });
                }, 300);
            }
        },
        {
            text: 'Paramètres de confidentialité',
            icon: 'shield-outline',
            handler: () => {
                this.closeActionSheet();
                // Petit délai pour permettre à l'action sheet de se fermer complètement
                setTimeout(() => {
                    console.log('Navigation vers privacy-settings...');
                    this.router.navigate(['/tabs/privacy-settings']).then(success => {
                        console.log('Navigation réussie:', success);
                    }).catch(error => {
                        console.error('Erreur de navigation:', error);
                    });
                }, 300);
            }
        },
        {
            text: 'Annuler',
            role: 'cancel',
            icon: 'close',
            handler: () => this.closeActionSheet()
        }
    ];

    alertButtons = [
        {
            text: 'Annuler',
            role: 'cancel',
            handler: () => this.cancelLogout()
        },
        {
            text: 'Se déconnecter',
            handler: () => this.confirmLogout()
        }
    ];    // Messages d'encouragement rotatifs
    private encouragementMessages = [
        "Chaque échec est un pas vers la réussite ! 🌟",
        "Ton courage inspire la communauté ! 💪",
        "L'authenticité est ta plus belle force ! ✨",
        "Continue de partager, tu aides tant de gens ! ❤️",
        "Tes fails deviennent des victoires pour tous ! 🏆"
    ];

    // Message d'encouragement fixe pour éviter ExpressionChangedAfterItHasBeenCheckedError
    currentEncouragementMessage: string = '';

    constructor(
        private authService: AuthService,
        private failService: FailService,
        private badgeService: BadgeService,
        private eventBus: EventBusService,
        private router: Router
    ) {
        // Configuration des icônes
        addIcons({
            calendar, createOutline, shareOutline, trophy, documentText, heart,
            flame, analytics, add, ribbonOutline, arrowForward, ellipsisHorizontal,
            documentOutline, shieldCheckmark, chevronForward, settingsOutline,
            lockClosed, chevronDownCircleOutline
        });

        console.log('👤 ProfilePage - Constructor called');
        this.userBadges$ = this.badgeService.getBadges();
        console.log('👤 ProfilePage - UserBadges observable initialized');

        this.userFails$ = this.failService.getFails().pipe(
            map((fails: Fail[]) => fails.filter((fail: Fail) => {
                const currentUser = this.authService.getCurrentUser();
                return currentUser && fail.authorName === currentUser.displayName;
            }))
        );
        console.log('👤 ProfilePage - UserFails observable initialized');

        this.recentFails$ = this.userFails$.pipe(
            map((fails: Fail[]) => fails.slice(0, 3)) // 3 derniers fails
        );

        this.profileStats$ = combineLatest([
            this.currentUser$,
            this.userFails$,
            this.userBadges$
        ]).pipe(
            map(([user, fails, badges]) => this.calculateStats(user ?? null, fails, badges))
        );
        console.log('👤 ProfilePage - ProfileStats observable initialized');
    }

    ngOnInit() {
        console.log('👤 ProfilePage - ngOnInit called');
        // Initialiser le message d'encouragement une seule fois
        this.currentEncouragementMessage = this.getRandomEncouragement();

        // Écouter les mises à jour du profil pour rafraîchir automatiquement
        console.log('👤 ProfilePage - Setting up profile update listener...');
        this.subscriptions.add(
            this.eventBus.on(AppEvents.USER_PROFILE_UPDATED).subscribe((updatedUser) => {
                console.log('👤 ProfilePage - Profile updated event received:', updatedUser);
                console.log('👤 ProfilePage - Refreshing data...');
                // Forcer un rafraîchissement des données
                this.failService.refreshFails();
            })
        );

        // Écouter directement les changements de l'utilisateur courant
        this.subscriptions.add(
            this.currentUser$.subscribe((user) => {
                console.log('👤 ProfilePage - Current user changed:', user?.avatar);
            })
        );
    }

    ngOnDestroy() {
        this.subscriptions.unsubscribe();
    }

    async handleRefresh(event: RefresherCustomEvent) {
        console.log('👤 ProfilePage - handleRefresh called');
        // Rafraîchit les données utilisateur
        try {
            console.log('👤 ProfilePage - Refreshing fails...');
            await this.failService.refreshFails();
            console.log('👤 ProfilePage - Refresh successful');
        } catch (error) {
            console.error('👤 ProfilePage - Error refreshing data:', error);
        }

        setTimeout(() => {
            event.target.complete();
        }, 1000);
    }

    private calculateStats(user: User | null, fails: Fail[], badges: Badge[]): ProfileStats {
        if (!user) {
            return {
                totalFails: 0,
                couragePoints: 0,
                totalReactions: 0,
                currentStreak: 0,
                joinedDaysAgo: 0,
                averageReactionsPerFail: 0
            };
        }

        const totalReactions = fails.reduce((sum, fail) =>
            sum + fail.reactions.courage + fail.reactions.laugh + fail.reactions.empathy + fail.reactions.support, 0
        );

        const joinedDaysAgo = Math.floor(
            (Date.now() - user.joinDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        const averageReactionsPerFail = fails.length > 0 ?
            Math.round((totalReactions / fails.length) * 10) / 10 : 0;

        return {
            totalFails: fails.length,
            couragePoints: user.couragePoints,
            totalReactions,
            currentStreak: this.calculateCurrentStreak(fails),
            joinedDaysAgo,
            averageReactionsPerFail
        };
    }

    private calculateCurrentStreak(fails: Fail[]): number {
        // Logique simplifiée pour calculer la streak actuelle
        // Dans une vraie app, on regarderait les dates de publication
        return fails.length > 0 ? Math.min(fails.length, 7) : 0;
    }

    getRandomEncouragement(): string {
        const randomIndex = Math.floor(Math.random() * this.encouragementMessages.length);
        return this.encouragementMessages[randomIndex];
    }

    getProgressLevel(couragePoints: number): { level: number; progress: number; nextLevel: number } {
        const level = Math.floor(couragePoints / 100) + 1;
        const currentLevelPoints = couragePoints % 100;
        const nextLevelPoints = 100;
        const progress = currentLevelPoints / nextLevelPoints;

        return { level, progress, nextLevel: nextLevelPoints - currentLevelPoints };
    }

    async editProfile() {
        // Pour l'instant, on affiche juste un message
        // Dans une vraie app, on ouvrirait un modal d'édition
        this.isActionSheetOpen = true;
    }

    async shareProfile() {
        // Logique de partage du profil
        console.log('Partager le profil');
    }

    async viewAllFails() {
        // Navigation vers tous les fails de l'utilisateur
        this.router.navigate(['/profile/my-fails']);
    }

    async viewAllBadges() {
        // Navigation vers tous les badges
        this.router.navigate(['/tabs/badges']);
    }

    // Méthode pour accès direct aux paramètres de confidentialité
    goToPrivacySettings() {
        console.log('Navigation vers privacy-settings...');
        this.router.navigate(['/tabs/privacy-settings']).then(success => {
            console.log('Navigation réussie:', success);
        }).catch(error => {
            console.error('Erreur de navigation:', error);
        });
    }

    async logout() {
        this.isAlertOpen = true;
    }

    async confirmLogout() {
        await this.authService.logout();
        this.router.navigate(['/auth/login']);
        this.isAlertOpen = false;
    }

    cancelLogout() {
        this.isAlertOpen = false;
    }

    closeActionSheet() {
        this.isActionSheetOpen = false;
    }

    getBadgesByCategory(badges: Badge[]): { [key: string]: Badge[] } {
        return badges.reduce((acc, badge) => {
            const category = badge.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(badge);
            return acc;
        }, {} as { [key: string]: Badge[] });
    }

    getRarityColor(rarity: string): string {
        switch (rarity) {
            case 'common': return 'medium';
            case 'rare': return 'primary';
            case 'epic': return 'secondary';
            case 'legendary': return 'warning';
            default: return 'medium';
        }
    }

    trackByFailId(index: number, fail: Fail): string {
        return fail.id;
    }

    trackByBadgeId(index: number, badge: Badge): string {
        return badge.id;
    }

    getCategoryIcon(category: string): string {
        // Retourne une icône basée sur la catégorie du fail
        switch (category.toLowerCase()) {
            case 'work': return 'briefcase-outline';
            case 'cooking': return 'restaurant-outline';
            case 'sport': return 'fitness-outline';
            case 'relationship': return 'heart-outline';
            case 'technology': return 'laptop-outline';
            case 'travel': return 'airplane-outline';
            case 'health': return 'medical-outline';
            case 'education': return 'school-outline';
            case 'finance': return 'card-outline';
            case 'hobby': return 'color-palette-outline';
            default: return 'document-text-outline';
        }
    }
}
