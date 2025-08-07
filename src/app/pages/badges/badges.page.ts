import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton,
    IonBadge, IonProgressBar,
    IonRefresher, IonRefresherContent,
    RefresherCustomEvent
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { BadgeService } from '../../services/badge.service';
import { FailService } from '../../services/fail.service';
import { Badge } from '../../models/badge.model';
import { BadgeCategory } from '../../models/enums';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';
import { Observable, combineLatest, map } from 'rxjs';

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
}

@Component({
    selector: 'app-badges',
    templateUrl: './badges.page.html',
    styleUrls: ['./badges.page.scss'],
    imports: [
        CommonModule,
        IonHeader, IonToolbar, IonTitle, IonContent, IonIcon, IonButton,
        IonBadge, IonProgressBar,
        IonRefresher, IonRefresherContent
    ]
})
export class BadgesPage implements OnInit {
    currentUser$ = this.authService.currentUser$;
    allBadges$: Observable<Badge[]>;
    userBadges$: Observable<Badge[]>;
    badgeStats$: Observable<BadgeStats>;

    // Filtres et UI
    selectedCategory: BadgeCategory | 'all' = 'all';
    availableCategories = Object.values(BadgeCategory);
    isDropdownOpen = false;    // Messages d'encouragement pour les badges
    private encouragementMessages = [
        "Chaque badge raconte une histoire de courage ! 🌟",
        "Ta collection grandit, comme ta confiance ! 💪",
        "Les badges les plus beaux sont ceux qu'on gagne ensemble ! 🤝",
        "Ton parcours inspire la communauté ! ✨",
        "Continue, tu débloqueras bientôt des badges rares ! 🏆"
    ];

    // Message d'encouragement fixe
    encouragementMessage = '';

    constructor(
        private authService: AuthService,
        private badgeService: BadgeService,
        private failService: FailService,
        private router: Router
    ) {
        // Utilisation des vraies données de la base
        this.allBadges$ = this.badgeService.getAllAvailableBadges();

        this.userBadges$ = combineLatest([this.currentUser$, this.allBadges$]).pipe(
            map(([user, badges]) => badges.filter(badge => badge.unlockedDate))
        );

        this.badgeStats$ = combineLatest([this.allBadges$, this.userBadges$]).pipe(
            map(([allBadges, userBadges]) => this.calculateBadgeStats(allBadges, userBadges))
        );
    }

    ngOnInit() {
        // Générer le message d'encouragement une seule fois
        this.encouragementMessage = this.getRandomEncouragement();

        // Initialiser les observables
        this.initializeObservables();
    }

    private initializeObservables() { }

    async handleRefresh(event: RefresherCustomEvent) {
        // Simulation du rechargement des badges
        setTimeout(() => {
            event.target.complete();
        }, 1500);
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

        return {
            totalBadges,
            unlockedBadges,
            completionPercentage,
            rareCount,
            epicCount,
            legendaryCount,
            favoriteCategory
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

    getCategoryDisplayName(category: string): string {
        switch (category) {
            case BadgeCategory.COURAGE: return 'Courage';
            case BadgeCategory.HUMOUR: return 'Humour';
            case BadgeCategory.ENTRAIDE: return 'Entraide';
            case BadgeCategory.PERSEVERANCE: return 'Persévérance';
            case BadgeCategory.SPECIAL: return 'Spécial';
            default: return category;
        }
    }

    getRarityDisplayName(rarity: string): string {
        switch (rarity) {
            case 'common': return 'Commun';
            case 'rare': return 'Rare';
            case 'epic': return 'Épique';
            case 'legendary': return 'Légendaire';
            default: return rarity;
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

        // TODO: Implémenter la logique pour trouver le prochain badge à débloquer
        // dans la catégorie donnée et récupérer sa progression réelle
        return defaultProgress;
    }

    // Méthodes pour le dropdown de catégories
    toggleDropdown() {
        this.isDropdownOpen = !this.isDropdownOpen;
    }

    selectCategory(category: BadgeCategory | 'all') {
        this.selectedCategory = category;
        this.isDropdownOpen = false; // Fermer le dropdown après sélection
    }

    getSelectedCategoryIcon(): string {
        if (this.selectedCategory === 'all') {
            return 'apps';
        }
        return this.getCategoryIcon(this.selectedCategory as BadgeCategory);
    }

    getSelectedCategoryDisplayName(): string {
        if (this.selectedCategory === 'all') {
            return 'Tous les badges';
        }
        return this.getCategoryDisplayName(this.selectedCategory as BadgeCategory);
    }

    getSelectedCategoryBadgeCount(): number {
        if (this.selectedCategory === 'all') {
            return this.getAllBadgesCount();
        }
        return this.getCategorySpecificBadgeCount(this.selectedCategory as BadgeCategory);
    }

    getAllBadgesCount(): number {
        // Utilise userBadges$ pour compter les badges débloqués
        let count = 0;
        this.userBadges$.subscribe(badges => count = badges.length).unsubscribe();
        return count;
    }

    getCategorySpecificBadgeCount(category: BadgeCategory): number {
        // Utilise userBadges$ filtrés par catégorie
        let count = 0;
        this.userBadges$.subscribe(badges =>
            count = badges.filter(badge => badge.category === category).length
        ).unsubscribe();
        return count;
    }

    shareBadgeCollection() {
        // Logique de partage de la collection
        console.log('Partager la collection de badges');
    }
}
