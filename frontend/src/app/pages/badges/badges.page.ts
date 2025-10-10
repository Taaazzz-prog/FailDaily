import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton,
    IonBadge, IonProgressBar,
    IonRefresher, IonRefresherContent,
    IonAccordionGroup, IonAccordion, IonItem, IonLabel,
    RefresherCustomEvent
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { apps, appsOutline, buildOutline, chevronDownCircleOutline, chevronDownOutline, diamondOutline, funnelOutline, hourglassOutline, informationOutline, lockClosed, shareOutline, starOutline, trophyOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { BadgeService } from '../../services/badge.service';
import { FailService } from '../../services/fail.service';
import { Badge } from '../../models/badge.model';
import { BadgeCategory } from '../../models/enums';
import { User } from '../../models/user.model';
import { Router, ActivatedRoute } from '@angular/router';
import { Observable, combineLatest, map, BehaviorSubject, from, shareReplay } from 'rxjs';

interface BadgeProgress {
    current: number;
    required: number;
    progress: number;
    nextBadge?: Badge;
}

interface BadgeStats {
    totalBadges: number;
    unlockedBadges: number;
    completionPercentage: number;
    rareCount: number;
    epicCount: number;
    legendaryCount: number;
    favoriteCategory: string;
    rarityStats: {
        common: { unlocked: number; total: number; };
        rare: { unlocked: number; total: number; };
        epic: { unlocked: number; total: number; };
        legendary: { unlocked: number; total: number; };
    };
}

@Component({
    selector: 'app-badges',
    templateUrl: './badges.page.html',
    styleUrls: ['./badges.page.scss'],
    imports: [
        CommonModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton,
        IonBadge, IonProgressBar,
        IonRefresher, IonRefresherContent,
        IonAccordionGroup, IonAccordion, IonItem, IonLabel
    ]
})
export class BadgesPage implements OnInit {
    currentUser$ = this.authService.currentUser$;
    allBadges$: Observable<Badge[]>;
    userBadges$: Observable<Badge[]>;
    badgeStats$: Observable<BadgeStats>;
    nextChallenges$ = new BehaviorSubject<any[]>([]);

    // Filtres et UI
    viewMode: 'overview' | 'category' | 'unlocked' = 'overview'; // Mode d'affichage
    selectedCategory: string = 'all'; // Catégorie sélectionnée pour le filtrage

    // Messages d'encouragement pour les badges
    private encouragementMessages = [
        "Chaque badge raconte une histoire de courage ! 🌟",
        "Ta collection grandit, comme ta confiance ! 💪",
        "Les badges les plus beaux sont ceux qu'on gagne ensemble ! 🤝",
        "Ton parcours inspire la communauté ! ✨",
        "Continue, tu débloqueras bientôt des badges rares ! 🏆"
    ];

    // Message d'encouragement fixe
    encouragementMessage = '';

    // Paramètre de mise en surbrillance
    highlightMode = false;

    constructor(
        private authService: AuthService,
        private badgeService: BadgeService,
        private failService: FailService,
        private router: Router,
        private route: ActivatedRoute
    ) {
        // Configuration des icônes
        addIcons({
            apps, appsOutline, buildOutline, chevronDownCircleOutline, chevronDownOutline, diamondOutline, funnelOutline, hourglassOutline, informationOutline, lockClosed, shareOutline, starOutline, trophyOutline
        });

        console.log('🏆 BadgesPage - Constructor called');
        
        // Utiliser shareReplay pour éviter les re-créations d'observables
        this.allBadges$ = from(this.badgeService.getAllAvailableBadges()).pipe(
            shareReplay(1)
        );
        
        this.userBadges$ = this.badgeService.getUserBadges().pipe(
            shareReplay(1)
        );
        
        console.log('🏆 BadgesPage - Observables initialized with shareReplay');

        this.badgeStats$ = combineLatest([this.allBadges$, this.userBadges$]).pipe(
            map(([allBadges, userBadges]) => this.calculateBadgeStats(allBadges, userBadges))
        );
        console.log('🏆 BadgesPage - BadgeStats observable initialized');
    }

    ngOnInit() {
        console.log('🏆 BadgesPage - ngOnInit called');

        // Vérifier si on arrive depuis une notification de badge
        this.route.queryParams.subscribe(params => {
            if (params['highlight'] === 'recent') {
                this.highlightMode = true;
                this.viewMode = 'unlocked';
                console.log('🏆 Mode surbrillance activé - Affichage des badges récents');

                // Désactiver le mode après quelques secondes
                setTimeout(() => {
                    this.highlightMode = false;
                }, 5000);
            }
        });

        // Générer le message d'encouragement une seule fois
        this.encouragementMessage = this.getRandomEncouragement();
        console.log('🏆 BadgesPage - Encouragement message:', this.encouragementMessage);

        // Initialiser les observables
        this.initializeObservables();

        // Charger les challenges
        this.loadNextChallenges();
    }

    private async loadNextChallenges() {
        try {
            const challenges = await this.badgeService.getNextChallengesStats();
            this.nextChallenges$.next(challenges);
        } catch (error) {
            console.error('Erreur lors du chargement des challenges:', error);
        }
    }

    private initializeObservables() { }

    async handleRefresh(event: RefresherCustomEvent) {
        try {
            // Forcer le rechargement des badges utilisateur
            await this.badgeService.refreshUserBadges();

            // Recharger les challenges
            await this.loadNextChallenges();

            event.target.complete();
        } catch (error) {
            console.error('Erreur lors du rafraîchissement des badges:', error);
            event.target.complete();
        }
    }

    getFilteredBadges(badges: Badge[]): Badge[] {
        if (this.selectedCategory === 'all') {
            return badges;
        }
        return badges.filter(badge => badge.category === this.selectedCategory);
    }

    getBadgesByCategory(badges: Badge[]): { [key: string]: Badge[] } {
        const grouped = badges.reduce((acc, badge) => {
            const category = badge.category;
            if (!acc[category]) {
                acc[category] = [];
            }
            acc[category].push(badge);
            return acc;
        }, {} as { [key: string]: Badge[] });

        // Trier les badges par rareté dans chaque catégorie
        Object.keys(grouped).forEach(category => {
            grouped[category].sort((a, b) => this.getRarityWeight(b.rarity) - this.getRarityWeight(a.rarity));
        });

        return grouped;
    }

    private calculateBadgeStats(allBadges: Badge[], userBadges: Badge[]): BadgeStats {
        const totalBadges = allBadges.length;
        const unlockedBadges = userBadges.length;
        const completionPercentage = totalBadges > 0 ? Math.round((unlockedBadges / totalBadges) * 100) : 0;

        const rareCount = userBadges.filter(b => b.rarity === 'rare').length;
        const epicCount = userBadges.filter(b => b.rarity === 'epic').length;
        const legendaryCount = userBadges.filter(b => b.rarity === 'legendary').length;

        // Catégorie favorite (plus de badges débloqués)
        const categoryCount = userBadges.reduce((acc, badge) => {
            acc[badge.category] = (acc[badge.category] || 0) + 1;
            return acc;
        }, {} as { [key: string]: number });

        const favoriteCategory = Object.keys(categoryCount).reduce((a, b) =>
            categoryCount[a] > categoryCount[b] ? a : b, Object.keys(categoryCount)[0] || 'courage'
        );

        // Calculer les statistiques par rareté
        const rarityStats = {
            common: {
                unlocked: userBadges.filter(b => b.rarity === 'common').length,
                total: allBadges.filter(b => b.rarity === 'common').length
            },
            rare: {
                unlocked: userBadges.filter(b => b.rarity === 'rare').length,
                total: allBadges.filter(b => b.rarity === 'rare').length
            },
            epic: {
                unlocked: userBadges.filter(b => b.rarity === 'epic').length,
                total: allBadges.filter(b => b.rarity === 'epic').length
            },
            legendary: {
                unlocked: userBadges.filter(b => b.rarity === 'legendary').length,
                total: allBadges.filter(b => b.rarity === 'legendary').length
            }
        };

        return {
            totalBadges,
            unlockedBadges,
            completionPercentage,
            rareCount,
            epicCount,
            legendaryCount,
            favoriteCategory,
            rarityStats
        };
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

    getRarityWeight(rarity: string): number {
        switch (rarity) {
            case 'legendary': return 4;
            case 'epic': return 3;
            case 'rare': return 2;
            case 'common': return 1;
            default: return 0;
        }
    }

    getCategoryIcon(category: string): string {
        switch (category) {
            case BadgeCategory.COURAGE: return 'shield-outline';
            case BadgeCategory.HUMOUR: return 'happy-outline';
            case BadgeCategory.ENTRAIDE: return 'people-outline';
            case BadgeCategory.PERSEVERANCE: return 'fitness-outline';
            case BadgeCategory.SPECIAL: return 'star-outline';
            default: return 'ribbon-outline';
        }
    }

    formatRarityStats(stats: { unlocked: number; total: number }): string {
        return `${stats.unlocked}/${stats.total}`;
    }

    getCategoryDisplayName(category: string): string {
        switch (category) {
            case BadgeCategory.COURAGE: return 'Courage';
            case BadgeCategory.HUMOUR: return 'Humour';
            case BadgeCategory.ENTRAIDE: return 'Entraide';
            case BadgeCategory.PERSEVERANCE: return 'Persévérance';
            case BadgeCategory.SPECIAL: return 'Spécial';
            default: return 'Autre';
        }
    }

    getRarityDisplayName(rarity: string): string {
        switch (rarity) {
            case 'common': return 'Commun';
            case 'rare': return 'Rare';
            case 'epic': return 'Épique';
            case 'legendary': return 'Légendaire';
            default: return 'Inconnu';
        }
    }

    private getRandomEncouragement(): string {
        const randomIndex = Math.floor(Math.random() * this.encouragementMessages.length);
        return this.encouragementMessages[randomIndex];
    }

    getNextBadgeProgress(category: BadgeCategory): BadgeProgress {
        // Récupérer la progression réelle depuis le service Badge
        // Pour l'instant, on renvoie un objet par défaut
        // À améliorer en fonction des badges disponibles dans cette catégorie
        const defaultProgress = {
            current: 0,
            required: 1,
            progress: 0
        };

        return defaultProgress;
    }

    /**
     * Change le mode d'affichage des badges
     */
    setViewMode(mode: 'overview' | 'category' | 'unlocked') {
        this.viewMode = mode;
        console.log(`🔄 Mode d'affichage: ${mode}`);
    }

    /**
     * Récupère les badges à afficher selon le mode et filtre actuels
     */
    /**
     * Récupère les badges débloqués pour l'affichage
     */
    getUnlockedBadges(): Observable<Badge[]> {
        return this.userBadges$;
    }

    /**
     * Récupère les badges par catégorie pour l'affichage filtré
     */
    // Méthodes pour le dropdown de catégories
    shareBadgeCollection() {
        // Logique de partage de la collection
        console.log('Partager la collection de badges');
    }

    /**
     * Obtient un message de félicitation pour les nouveaux badges
     */
    getWelcomeMessage(): string {
        if (this.highlightMode) {
            return "🎉 Félicitations pour ton nouveau badge ! Regarde comme ta collection s'enrichit !";
        }
        return this.encouragementMessage;
    }

    /**
     * Vérifie si un badge a été récemment débloqué (dans les dernières 24h)
     */
    isBadgeRecent(badge: Badge): boolean {
        if (!badge.unlockedDate) return false;

        const badgeDate = new Date(badge.unlockedDate);
        const now = new Date();
        const diffHours = (now.getTime() - badgeDate.getTime()) / (1000 * 60 * 60);

        return diffHours <= 24;
    }
}

