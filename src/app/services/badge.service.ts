import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Badge } from '../models/badge.model';
import { BadgeCategory } from '../models/enums';
import { SupabaseService } from './supabase.service';
import { FailService } from './fail.service';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private userBadgesSubject = new BehaviorSubject<Badge[]>([]);
  public userBadges$ = this.userBadgesSubject.asObservable();

  // Définition des badges disponibles
  private availableBadges: Badge[] = [
    // Badges de début
    {
      id: 'first-fail',
      name: 'Premier Courage',
      description: 'Poster votre premier fail',
      icon: 'heart-outline',
      category: BadgeCategory.COURAGE,
      rarity: 'common'
    },
    {
      id: 'first-reaction',
      name: 'Première Réaction',
      description: 'Donner votre première réaction à un fail',
      icon: 'happy-outline',
      category: BadgeCategory.ENTRAIDE,
      rarity: 'common'
    },

    // Badges de volume
    {
      id: 'fails-5',
      name: 'Apprenti Courage',
      description: 'Poster 5 fails',
      icon: 'ribbon-outline',
      category: BadgeCategory.COURAGE,
      rarity: 'common'
    },
    {
      id: 'fails-10',
      name: 'Courageux',
      description: 'Poster 10 fails',
      icon: 'trophy-outline',
      category: BadgeCategory.COURAGE,
      rarity: 'rare'
    },
    {
      id: 'fails-25',
      name: 'Maître du Courage',
      description: 'Poster 25 fails',
      icon: 'star-outline',
      category: BadgeCategory.COURAGE,
      rarity: 'epic'
    },

    // Badges de réactions
    {
      id: 'reactions-10',
      name: 'Supporteur',
      description: 'Donner 10 réactions',
      icon: 'people-outline',
      category: BadgeCategory.ENTRAIDE,
      rarity: 'common'
    },
    {
      id: 'reactions-50',
      name: 'Grand Supporteur',
      description: 'Donner 50 réactions',
      icon: 'heart',
      category: BadgeCategory.ENTRAIDE,
      rarity: 'rare'
    },

    // Badges de diversité
    {
      id: 'all-categories',
      name: 'Touche-à-tout',
      description: 'Poster un fail dans chaque catégorie',
      icon: 'apps-outline',
      category: BadgeCategory.SPECIAL,
      rarity: 'epic'
    },

    // Badges de temps
    {
      id: 'week-streak',
      name: 'Semaine de Courage',
      description: 'Poster au moins un fail par jour pendant 7 jours',
      icon: 'calendar-outline',
      category: BadgeCategory.PERSEVERANCE,
      rarity: 'rare'
    },

    // Badges sociaux
    {
      id: 'popular-fail',
      name: 'Populaire',
      description: 'Recevoir 10 réactions sur un seul fail',
      icon: 'flame-outline',
      category: BadgeCategory.SPECIAL,
      rarity: 'rare'
    }
  ];

  constructor(private supabase: SupabaseService, private failService: FailService) {
    // Charger les badges utilisateur au démarrage
    this.initializeBadges();
  }

  private async initializeBadges(): Promise<void> {
    try {
      // Attendre que l'utilisateur soit connecté
      const user = await this.supabase.getCurrentUser();
      if (user) {
        await this.loadUserBadges(user.id);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des badges:', error);
    }
  }

  private async loadUserBadges(userId: string): Promise<void> {
    try {
      const badgeIds = await this.supabase.getUserBadgesNew(userId);
      console.log('Badges récupérés de la DB:', badgeIds);

      // Récupérer TOUS les badges disponibles (BDD + fallback)
      const allAvailableBadges = await this.getAllAvailableBadges();

      const userBadges = allAvailableBadges.filter(badge =>
        badgeIds.includes(badge.id)
      );
      console.log('Badges filtrés:', userBadges);

      this.userBadgesSubject.next(userBadges);
    } catch (error) {
      console.error('Erreur lors du chargement des badges utilisateur:', error);
    }
  }  /**
   * Force le rechargement des badges utilisateur depuis la base de données
   */
  async refreshUserBadges(): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (user) {
      await this.loadUserBadges(user.id);
    }
  }

  /**
   * Récupère tous les badges disponibles (BDD + fallback hardcodé)
   */
  async getAllAvailableBadges(): Promise<Badge[]> {
    try {
      // D'abord essayer de récupérer depuis la base de données
      const dbBadges = await this.supabase.getAllAvailableBadges();

      if (dbBadges && dbBadges.length > 0) {
        console.log(`✨ Badges chargés depuis la BDD: ${dbBadges.length} badges trouvés`);

        // Mapper les badges de la BDD vers le format Badge
        return dbBadges.map(dbBadge => ({
          id: dbBadge.id || dbBadge.badge_id,
          name: dbBadge.name || dbBadge.badge_name,
          description: dbBadge.description || dbBadge.badge_description,
          icon: dbBadge.icon || dbBadge.badge_icon || 'trophy-outline',
          category: dbBadge.category || dbBadge.badge_category || BadgeCategory.SPECIAL,
          rarity: dbBadge.rarity || dbBadge.badge_rarity || 'common',
          // Ajouter les infos de requirement pour le nouveau système
          requirementType: dbBadge.requirement_type,
          requirementValue: dbBadge.requirement_value
        } as Badge));
      }

      // Fallback: utiliser les badges codés en dur
      console.log(`⚠️ Utilisation du fallback: ${this.availableBadges.length} badges hardcodés`);
      return this.availableBadges;
    } catch (error) {
      console.error('Erreur lors de la récupération des badges, utilisation du fallback:', error);
      return this.availableBadges;
    }
  }

  /**
   * Récupère une version filtrée des badges pour l'affichage par défaut
   * Seulement 2-3 badges par catégorie, pas de legendaires
   */
  async getFilteredBadgesForDisplay(): Promise<Badge[]> {
    try {
      const allBadges = await this.getAllAvailableBadges();

      // Grouper les badges par catégorie
      const badgesByCategory = allBadges.reduce((acc, badge) => {
        if (!acc[badge.category]) {
          acc[badge.category] = [];
        }
        acc[badge.category].push(badge);
        return acc;
      }, {} as { [key: string]: Badge[] });

      const filteredBadges: Badge[] = [];

      // Pour chaque catégorie, prendre 2-3 badges (pas de legendaires)
      Object.keys(badgesByCategory).forEach(category => {
        const categoryBadges = badgesByCategory[category]
          .filter(badge => badge.rarity !== 'legendary') // Exclure les legendaires
          .sort((a, b) => {
            // Trier par rareté (common -> rare -> epic)
            const rarityOrder = { 'common': 1, 'rare': 2, 'epic': 3 };
            return rarityOrder[a.rarity as keyof typeof rarityOrder] - rarityOrder[b.rarity as keyof typeof rarityOrder];
          });

        // Prendre les 3 premiers badges de chaque catégorie
        filteredBadges.push(...categoryBadges.slice(0, 3));
      });

      console.log(`🎯 Badges filtrés pour affichage: ${filteredBadges.length}/${allBadges.length} badges`);
      return filteredBadges;
    } catch (error) {
      console.error('Erreur lors du filtrage des badges:', error);
      return this.availableBadges.slice(0, 15); // Fallback avec les 15 premiers hardcodés
    }
  }

  /**
   * Version synchrone pour compatibilité (utilise les badges codés en dur)
   */
  getAllAvailableBadgesSync(): Badge[] {
    return this.availableBadges;
  }

  /**
   * Récupère les badges de l'utilisateur
   */
  getUserBadges(): Observable<Badge[]> {
    return this.userBadges$;
  }

  /**
   * Vérifie et déverrouille automatiquement les badges basés sur les statistiques utilisateur
   */
  async checkAndUnlockBadges(userId: string): Promise<Badge[]> {
    try {
      const userStats = await this.getUserStats(userId);
      const currentBadges = this.userBadgesSubject.value.map(b => b.id);
      const allAvailableBadges = await this.getAllAvailableBadges(); // Utilise TOUS les badges BDD
      const newBadges: Badge[] = [];

      console.log(`🎯 Vérification des badges pour ${allAvailableBadges.length} badges disponibles`);
      console.log('📊 Stats utilisateur:', userStats);

      // Vérifier chaque badge avec le nouveau système
      for (const badge of allAvailableBadges) {
        if (!currentBadges.includes(badge.id)) {
          if (this.checkBadgeRequirementsNew(badge, userStats)) {
            await this.unlockBadge(badge.id);
            newBadges.push(badge);
            console.log(`🏆 Nouveau badge débloqué: ${badge.name}`);
          }
        }
      }

      console.log(`✨ ${newBadges.length} nouveaux badges débloqués`);
      return newBadges;
    } catch (error) {
      console.error('Erreur lors de la vérification des badges:', error);
      return [];
    }
  }

  /**
   * Nouvelle méthode qui utilise requirement_type et requirement_value de ta BDD
   */
  private checkBadgeRequirementsNew(badge: Badge, userStats: any): boolean {
    if (!badge.requirementType || !badge.requirementValue) {
      // Fallback vers l'ancien système pour les badges hardcodés
      return this.checkBadgeRequirements(badge, userStats);
    }

    const requiredValue = parseInt(badge.requirementValue, 10);

    switch (badge.requirementType) {
      case 'fail_count':
        return (userStats.totalFails || 0) >= requiredValue;

      case 'reaction_given':
      case 'like_given':
        return (userStats.totalReactions || 0) >= requiredValue;

      case 'comment_count':
        return (userStats.totalComments || 0) >= requiredValue;

      case 'courage_reactions':
        return (userStats.courageReactions || 0) >= requiredValue;

      case 'support_reactions':
        return (userStats.supportReactions || 0) >= requiredValue;

      case 'empathy_reactions':
        return (userStats.empathyReactions || 0) >= requiredValue;

      case 'laugh_reactions':
        return (userStats.laughReactions || 0) >= requiredValue;

      case 'streak_days':
        return (userStats.currentStreak || 0) >= requiredValue;

      case 'login_days':
        return (userStats.totalLoginDays || 0) >= requiredValue;

      case 'active_days':
        return (userStats.activeDays || 0) >= requiredValue;

      case 'categories_used':
        return (userStats.categoriesUsed || 0) >= requiredValue;

      case 'help_count':
        return (userStats.helpCount || 0) >= requiredValue;

      case 'helpful_comments':
        return (userStats.helpfulComments || 0) >= requiredValue;

      case 'unique_interactions':
        return (userStats.uniqueInteractions || 0) >= requiredValue;

      case 'positive_reactions':
        return (userStats.positiveReactions || 0) >= requiredValue;

      case 'total_laugh_reactions':
        return (userStats.totalLaughReactions || 0) >= requiredValue;

      case 'funny_fails':
        return (userStats.funnyFails || 0) >= requiredValue;

      case 'resilience_fails':
        return (userStats.resilienceFails || 0) >= requiredValue;

      case 'bounce_back_count':
        return (userStats.bounceBackCount || 0) >= requiredValue;

      case 'major_comebacks':
        return (userStats.majorComebacks || 0) >= requiredValue;

      case 'positive_days':
        return (userStats.positiveDays || 0) >= requiredValue;

      case 'challenges_overcome':
        return (userStats.challengesOvercome || 0) >= requiredValue;

      case 'inspired_users':
        return (userStats.inspiredUsers || 0) >= requiredValue;

      case 'comeback_count':
        return (userStats.comebackCount || 0) >= requiredValue;

      case 'midnight_fails':
        return (userStats.midnightFails || 0) >= requiredValue;

      case 'early_morning_fails':
        return (userStats.earlyMorningFails || 0) >= requiredValue;

      case 'weekend_fails':
        return (userStats.weekendFails || 0) >= requiredValue;

      case 'holiday_fails':
        return (userStats.holidayFails || 0) >= requiredValue;

      case 'new_year_fails':
        return (userStats.newYearFails || 0) >= requiredValue;

      case 'max_reactions_single':
        return (userStats.maxReactionsOnFail || 0) >= requiredValue;

      case 'badges_unlocked':
        return (userStats.badgesUnlocked || 0) >= requiredValue;

      case 'badges_percentage':
        const totalBadges = userStats.totalAvailableBadges || 100;
        const percentage = ((userStats.badgesUnlocked || 0) / totalBadges) * 100;
        return percentage >= requiredValue;

      default:
        console.warn(`⚠️ Type de requirement inconnu: ${badge.requirementType}`);
        return false;
    }
  }

  private checkBadgeRequirements(badge: Badge, userStats: any): boolean {
    switch (badge.id) {
      // Badges de base
      case 'first-fail':
        return userStats.totalFails >= 1;
      case 'first-reaction':
        return userStats.totalReactions >= 1;

      // Badges de volume - Fails  
      case 'fails-5':
        return userStats.totalFails >= 5;
      case 'fails-10':
        return userStats.totalFails >= 10;
      case 'fails-25':
        return userStats.totalFails >= 25;
      case 'fails-50':
        return userStats.totalFails >= 50;
      case 'fails-100':
        return userStats.totalFails >= 100;

      // Badges de réactions
      case 'reactions-10':
        return userStats.totalReactions >= 10;
      case 'reactions-25':
        return userStats.totalReactions >= 25;
      case 'reactions-50':
        return userStats.totalReactions >= 50;
      case 'reactions-100':
        return userStats.totalReactions >= 100;
      case 'reactions-250':
        return userStats.totalReactions >= 250;

      // Badges de diversité
      case 'all-categories':
        return userStats.categoriesUsed >= 5;
      case 'master-explorer':
        return userStats.categoriesUsed >= 10;

      // Badges de popularité
      case 'popular-fail':
        return userStats.maxReactionsOnFail >= 10;
      case 'viral-fail':
        return userStats.maxReactionsOnFail >= 25;
      case 'legendary-fail':
        return userStats.maxReactionsOnFail >= 50;

      // Autres badges (à implémenter selon les statistiques disponibles)
      case 'week-streak':
      case 'month-streak':
      case 'year-warrior':
      case 'comedian':
      case 'jester':
      case 'night-owl':
      case 'early-bird':
      case 'weekend-warrior':
      case 'helper':
      case 'empathy-master':
        return false; // Pas encore implémenté

      default:
        return false;
    }
  }

  private getUserStats(userId: string): Promise<any> {
    // Récupérer les statistiques utilisateur depuis Supabase
    return this.supabase.getUserStats(userId);
  }

  /**
   * Déverrouille un badge spécifique
   */
  private async unlockBadge(badgeId: string): Promise<void> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) return;

      const success = await this.supabase.unlockBadge(user.id, badgeId);

      if (success) {
        // Recharger les badges utilisateur avec TOUS les badges disponibles
        await this.loadUserBadges(user.id);
      }
    } catch (error) {
      console.error('Erreur lors du déverrouillage du badge:', error);
    }
  }

  /**
   * Récupère tous les badges de l'utilisateur actuel (obsolète - utiliser getUserBadges)
   */
  getBadges(): Observable<Badge[]> {
    return this.userBadges$;
  }

  /**
   * Récupère les statistiques détaillées pour les "Prochains défis"
   */
  async getNextChallengesStats(): Promise<Array<{
    name: string;
    description: string;
    rarity: string;
    current: number;
    required: number;
    progress: number;
  }>> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) return [];

      const userStats = await this.getUserStats(user.id);
      const userBadgeIds = await this.supabase.getUserBadgesNew(user.id);
      const allAvailableBadges = await this.getAllAvailableBadges();

      // Trouver les badges non débloqués et leurs statistiques
      const unlockedBadges = allAvailableBadges.filter(badge =>
        !userBadgeIds.includes(badge.id)
      );

      const challenges = [];

      for (const badge of unlockedBadges) {
        const progress = await this.getBadgeProgressNew(badge, userStats);

        // Seulement inclure si le badge a du sens (proche d'être débloqué ou requirements bas)
        if (progress.current > 0 || progress.required <= 5) {
          challenges.push({
            name: badge.name,
            description: badge.description,
            rarity: badge.rarity,
            current: Math.min(progress.current, progress.required),
            required: progress.required,
            progress: progress.progress
          });
        }
      }

      // Trier par progression décroissante et prendre les 8 premiers
      return challenges.sort((a, b) => b.progress - a.progress).slice(0, 8);
    } catch (error) {
      console.error('Erreur lors de la récupération des challenges:', error);
      return [];
    }
  }

  /**
   * Nouvelle méthode pour calculer le progress d'un badge avec le système requirement_type/requirement_value
   */
  private async getBadgeProgressNew(badge: Badge, userStats: any): Promise<{ current: number, required: number, progress: number }> {
    if (!badge.requirementType || !badge.requirementValue) {
      // Fallback vers l'ancien système
      return await this.getBadgeProgress(badge.id);
    }

    const required = parseInt(badge.requirementValue, 10);
    let current = 0;

    switch (badge.requirementType) {
      case 'fail_count':
        current = userStats.totalFails || 0;
        break;
      case 'reaction_given':
      case 'like_given':
        current = userStats.totalReactions || 0;
        break;
      case 'comment_count':
        current = userStats.totalComments || 0;
        break;
      case 'courage_reactions':
        current = userStats.courageReactions || 0;
        break;
      case 'support_reactions':
        current = userStats.supportReactions || 0;
        break;
      case 'empathy_reactions':
        current = userStats.empathyReactions || 0;
        break;
      case 'laugh_reactions':
        current = userStats.laughReactions || 0;
        break;
      case 'streak_days':
        current = userStats.currentStreak || 0;
        break;
      case 'login_days':
        current = userStats.totalLoginDays || 0;
        break;
      case 'active_days':
        current = userStats.activeDays || 0;
        break;
      case 'categories_used':
        current = userStats.categoriesUsed || 0;
        break;
      case 'max_reactions_single':
        current = userStats.maxReactionsOnFail || 0;
        break;
      case 'badges_unlocked':
        current = userStats.badgesUnlocked || 0;
        break;
      case 'badges_percentage':
        const totalBadges = userStats.totalAvailableBadges || 100;
        current = Math.round(((userStats.badgesUnlocked || 0) / totalBadges) * 100);
        break;
      default:
        current = 0;
    }

    const progress = required > 0 ? Math.min(current / required, 1) : 0;
    return { current: Math.min(current, required), required, progress };
  }
  async getBadgeProgress(badgeId: string): Promise<{ current: number, required: number, progress: number }> {
    const user = await this.supabase.getCurrentUser();
    if (!user) return { current: 0, required: 1, progress: 0 };

    const userStats = await this.getUserStats(user.id);
    let current = 0;
    let required = 1;

    switch (badgeId) {
      case 'first-fail':
        current = userStats.totalFails;
        required = 1;
        break;
      case 'first-reaction':
        current = userStats.totalReactions;
        required = 1;
        break;
      case 'fails-5':
        current = userStats.totalFails;
        required = 5;
        break;
      case 'fails-10':
        current = userStats.totalFails;
        required = 10;
        break;
      case 'fails-25':
        current = userStats.totalFails;
        required = 25;
        break;
      case 'reactions-10':
        current = userStats.totalReactions;
        required = 10;
        break;
      case 'reactions-50':
        current = userStats.totalReactions;
        required = 50;
        break;
      case 'all-categories':
        current = userStats.categoriesUsed;
        required = 5;
        break;
      case 'popular-fail':
        current = userStats.maxReactionsOnFail;
        required = 10;
        break;
      default:
        current = 0;
        required = 1;
    }

    const progress = Math.min(current / required, 1);
    return { current, required, progress };
  }

  /**
   * Méthode utilitaire pour vérifier les badges après une action utilisateur
   */
  async checkBadgesAfterAction(action: 'fail_posted' | 'reaction_given'): Promise<Badge[]> {
    const user = await this.supabase.getCurrentUser();
    if (!user) return [];

    return await this.checkAndUnlockBadges(user.id);
  }
}

