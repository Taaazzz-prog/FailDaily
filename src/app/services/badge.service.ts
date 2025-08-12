﻿import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Badge } from '../models/badge.model';
import { BadgeCategory } from '../models/enums';
import { SupabaseService } from './supabase.service';
import { EventBusService, AppEvents } from './event-bus.service';
import { badgeLog } from '../utils/logger';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private userBadgesSubject = new BehaviorSubject<Badge[]>([]);
  public userBadges$ = this.userBadgesSubject.asObservable();

  // SystÃ¨me de debounce pour Ã©viter les vÃ©rifications trop frÃ©quentes
  private lastBadgeCheck = 0;
  private readonly BADGE_CHECK_COOLDOWN = 2000; // 2 secondes entre les vÃ©rifications

  constructor(private supabase: SupabaseService, private eventBus: EventBusService) {
    badgeLog('BadgeService: Constructor called - initializing badge service');

    // Charger les badges utilisateur au dÃ©marrage
    badgeLog('BadgeService: Calling initializeBadges');
    this.initializeBadges();

    // Ã‰couter les Ã©vÃ©nements pour vÃ©rifier les badges automatiquement
    badgeLog('BadgeService: Setting up event listeners');
    this.setupEventListeners();
  }

  /**
   * Configure les Ã©couteurs d'Ã©vÃ©nements pour le dÃ©blocage automatique des badges
   */
  private setupEventListeners(): void {
    // Ã‰couter les Ã©vÃ©nements de crÃ©ation de fail
    this.eventBus.on(AppEvents.FAIL_POSTED).subscribe(async (payload) => {
      badgeLog('Ã‰vÃ©nement FAIL_POSTED reÃ§u:', payload);
      try {
        const user = await this.supabase.getCurrentUser();
        if (user) {
          const newBadges = await this.checkAndUnlockBadgesWithCooldown(user.id, 'FAIL_POSTED');
          if (newBadges.length > 0) {
            this.eventBus.emit(AppEvents.BADGE_UNLOCKED, { badges: newBadges });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vÃ©rification des badges aprÃ¨s crÃ©ation de fail:', error);
      }
    });

    // Ã‰couter les Ã©vÃ©nements de rÃ©action
    this.eventBus.on(AppEvents.REACTION_GIVEN).subscribe(async (payload) => {
      badgeLog('Ã‰vÃ©nement REACTION_GIVEN reÃ§u:', payload);
      try {
        const user = await this.supabase.getCurrentUser();
        if (user) {
          const newBadges = await this.checkAndUnlockBadgesWithCooldown(user.id, 'REACTION_GIVEN');
          if (newBadges.length > 0) {
            this.eventBus.emit(AppEvents.BADGE_UNLOCKED, { badges: newBadges });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vÃ©rification des badges aprÃ¨s rÃ©action:', error);
      }
    });
  }

  /**
   * VÃ©rifie les badges avec un systÃ¨me de cooldown pour Ã©viter les appels trop frÃ©quents
   */
  private async checkAndUnlockBadgesWithCooldown(userId: string, eventType: string): Promise<Badge[]> {
    const now = Date.now();

    // Si la derniÃ¨re vÃ©rification Ã©tait il y a moins de 2 secondes, ignorer
    if (now - this.lastBadgeCheck < this.BADGE_CHECK_COOLDOWN) {
      badgeLog(`â° Cooldown actif, vÃ©rification ignorÃ©e (${eventType})`);
      return [];
    }

    this.lastBadgeCheck = now;
    badgeLog(`ðŸ” VÃ©rification des badges dÃ©clenchÃ©e par: ${eventType}`);

    return await this.checkAndUnlockBadges(userId);
  }

  private async initializeBadges(): Promise<void> {
    try {
      // Attendre que l'utilisateur soit connectÃ©
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
      badgeLog('Badges rÃ©cupÃ©rÃ©s de la DB:', badgeIds);

      // RÃ©cupÃ©rer TOUS les badges disponibles (BDD + fallback)
      const allAvailableBadges = await this.getAllAvailableBadges();

      const userBadges = allAvailableBadges.filter(badge =>
        badgeIds.includes(badge.id)
      );
      badgeLog('Badges filtrÃ©s:', userBadges);

      this.userBadgesSubject.next(userBadges);
    } catch (error) {
      console.error('Erreur lors du chargement des badges utilisateur:', error);
    }
  }  /**
   * Force le rechargement des badges utilisateur depuis la base de donnÃ©es
   */
  async refreshUserBadges(): Promise<void> {
    const user = await this.supabase.getCurrentUser();
    if (user) {
      await this.loadUserBadges(user.id);
    }
  }

  /**
   * RÃ©cupÃ¨re tous les badges disponibles UNIQUEMENT depuis la base de donnÃ©es
   */
  async getAllAvailableBadges(): Promise<Badge[]> {
    try {
      // RÃ©cupÃ©rer depuis la base de donnÃ©es
      const dbBadges = await this.supabase.getAllAvailableBadges();

      if (dbBadges && dbBadges.length > 0) {
        badgeLog(`âœ¨ Badges chargÃ©s depuis la BDD: ${dbBadges.length} badges trouvÃ©s`);

        // Mapper les badges de la BDD vers le format Badge
        return dbBadges.map(dbBadge => ({
          id: dbBadge.id || dbBadge.badge_id,
          name: dbBadge.name || dbBadge.badge_name,
          description: dbBadge.description || dbBadge.badge_description,
          icon: dbBadge.icon || dbBadge.badge_icon || 'trophy-outline',
          category: dbBadge.category || dbBadge.badge_category || BadgeCategory.SPECIAL,
          rarity: dbBadge.rarity || dbBadge.badge_rarity || 'common',
          // Ajouter les infos de requirement pour le nouveau systÃ¨me
          requirementType: dbBadge.requirement_type,
          requirementValue: dbBadge.requirement_value
        } as Badge));
      }

      // Plus de fallback - si pas de badges en BDD, retourner tableau vide
      badgeLog(`âŒ Aucun badge trouvÃ© en base de donnÃ©es`);
      return [];
    } catch (error) {
      console.error('Erreur lors de la rÃ©cupÃ©ration des badges depuis la BDD:', error);
      return [];
    }
  }

  /**
   * RÃ©cupÃ¨re une version filtrÃ©e des badges pour l'affichage par dÃ©faut
   * Seulement 2-3 badges par catÃ©gorie, pas de legendaires
   */
  async getFilteredBadgesForDisplay(): Promise<Badge[]> {
    try {
      const allBadges = await this.getAllAvailableBadges();

      // Grouper les badges par catÃ©gorie
      const badgesByCategory = allBadges.reduce((acc, badge) => {
        if (!acc[badge.category]) {
          acc[badge.category] = [];
        }
        acc[badge.category].push(badge);
        return acc;
      }, {} as { [key: string]: Badge[] });

      const filteredBadges: Badge[] = [];

      // Pour chaque catÃ©gorie, prendre 2-3 badges (pas de legendaires)
      Object.keys(badgesByCategory).forEach(category => {
        const categoryBadges = badgesByCategory[category]
          .filter(badge => badge.rarity !== 'legendary') // Exclure les legendaires
          .sort((a, b) => {
            // Trier par raretÃ© (common -> rare -> epic)
            const rarityOrder = { 'common': 1, 'rare': 2, 'epic': 3 };
            return rarityOrder[a.rarity as keyof typeof rarityOrder] - rarityOrder[b.rarity as keyof typeof rarityOrder];
          });

        // Prendre les 3 premiers badges de chaque catÃ©gorie
        filteredBadges.push(...categoryBadges.slice(0, 3));
      });

      badgeLog(`ðŸŽ¯ Badges filtrÃ©s pour affichage: ${filteredBadges.length}/${allBadges.length} badges`);
      return filteredBadges;
    } catch (error) {
      console.error('Erreur lors du filtrage des badges:', error);
      return []; // Plus de fallback hardcodÃ©
    }
  }

  /**
   * Version synchrone pour compatibilitÃ© - retourne un tableau vide car on n'utilise plus les badges hardcodÃ©s
   */
  getAllAvailableBadgesSync(): Badge[] {
    badgeLog('getAllAvailableBadgesSync est dÃ©prÃ©ciÃ©e - utilisez getAllAvailableBadges() Ã  la place');
    return []; // Plus de badges hardcodÃ©s
  }

  /**
   * RÃ©cupÃ¨re les badges de l'utilisateur
   */
  getUserBadges(): Observable<Badge[]> {
    return this.userBadges$;
  }

  /**
   * RÃ©cupÃ¨re les badges d'un utilisateur spÃ©cifique (pour admin)
   */
  async getUserBadgesForUser(userId: string): Promise<Badge[]> {
    try {
      badgeLog('ðŸ† BadgeService: Getting badges for user:', userId);

      // RÃ©cupÃ©rer les IDs des badges de l'utilisateur
      const badgeIds = await this.supabase.getUserBadgesNew(userId);
      badgeLog('ðŸ† BadgeService: User badge IDs:', badgeIds);

      // RÃ©cupÃ©rer tous les badges disponibles
      const allAvailableBadges = await this.getAllAvailableBadges();
      badgeLog('ðŸ† BadgeService: Total available badges:', allAvailableBadges.length);

      // Filtrer les badges dÃ©bloquÃ©s avec dates
      const userBadges = allAvailableBadges
        .filter(badge => badgeIds.includes(badge.id))
        .map(badge => ({ ...badge, unlockedDate: new Date() }));

      badgeLog('ðŸ† BadgeService: User unlocked badges:', userBadges.length);
      return userBadges;
    } catch (error) {
      console.error('âŒ Error getting user badges:', error);
      return [];
    }
  }

  /**
   * VÃ©rifie et dÃ©verrouille automatiquement les badges basÃ©s sur les statistiques utilisateur
   */
  async checkAndUnlockBadges(userId: string): Promise<Badge[]> {
    badgeLog('ðŸ† BadgeService: checkAndUnlockBadges called for user:', userId);

    try {
      badgeLog('ðŸ† BadgeService: Getting user stats');
      const userStats = await this.getUserStats(userId);
      badgeLog('ðŸ† BadgeService: User stats retrieved:', userStats);

      // CORRECTION: RÃ©cupÃ©rer les badges depuis la BDD, pas depuis le cache local
      badgeLog('ðŸ† BadgeService: Getting current user badges from database');
      const currentBadgeIds = await this.supabase.getUserBadgesNew(userId);
      badgeLog('ðŸ† BadgeService: Current user badges:', currentBadgeIds);

      badgeLog('ðŸ† BadgeService: Getting all available badges');
      const allAvailableBadges = await this.getAllAvailableBadges();
      badgeLog('ðŸ† BadgeService: Total available badges:', allAvailableBadges.length);

      const newBadges: Badge[] = [];

      badgeLog(`ðŸ† BadgeService: VÃ©rification des badges pour ${allAvailableBadges.length} badges disponibles`);
      badgeLog(`ðŸ† BadgeService: Badges actuels en BDD: [${currentBadgeIds.join(', ')}]`);
      badgeLog('ðŸ† BadgeService: Stats utilisateur:', userStats);

      // VÃ©rifier chaque badge avec le nouveau systÃ¨me
      for (const badge of allAvailableBadges) {
        badgeLog('ðŸ† BadgeService: Checking badge:', badge.id, 'already has?', currentBadgeIds.includes(badge.id));
        if (!currentBadgeIds.includes(badge.id)) {
          badgeLog('ðŸ† BadgeService: Badge not unlocked yet, checking requirements for:', badge.id);
          if (this.checkBadgeRequirementsNew(badge, userStats)) {
            badgeLog('ðŸ† BadgeService: Requirements met, unlocking badge:', badge.id);
            const unlocked = await this.unlockBadge(badge.id);
            if (unlocked) {
              newBadges.push(badge);
              badgeLog(`ðŸ† Nouveau badge dÃ©bloquÃ©: ${badge.name}`);
            }
          }
        }
      }

      badgeLog(`âœ¨ ${newBadges.length} nouveaux badges dÃ©bloquÃ©s`);
      return newBadges;
    } catch (error) {
      console.error('Erreur lors de la vÃ©rification des badges:', error);
      return [];
    }
  }

  /**
   * ðŸš€ MÃ‰THODE DEBUG - Pour tester les badges de bruno manuellement
   */
  async debugBadgeCheck(userId: string): Promise<any> {
    badgeLog('ðŸš€ DEBUG: VÃ©rification complÃ¨te des badges pour:', userId);

    try {
      // 1. Stats utilisateur
      const userStats = await this.getUserStats(userId);
      badgeLog('ðŸ“Š Stats utilisateur:', userStats);

      // 2. Badges actuels en BDD
      const currentBadgeIds = await this.supabase.getUserBadgesNew(userId);
      badgeLog('âœ… Badges actuellement possÃ©dÃ©s:', currentBadgeIds);

      // 3. Tous les badges disponibles
      const allBadges = await this.getAllAvailableBadges();
      badgeLog('ðŸ† Total badges disponibles:', allBadges.length);

      // 4. Test de chaque badge
      const results = [];
      for (const badge of allBadges) {
        const alreadyHas = currentBadgeIds.includes(badge.id);
        const meetsReqs = this.checkBadgeRequirementsNew(badge, userStats);

        results.push({
          id: badge.id,
          name: badge.name,
          requirementType: badge.requirementType,
          requirementValue: badge.requirementValue,
          alreadyHas,
          meetsRequirements: meetsReqs,
          status: alreadyHas ? 'âœ… PossÃ©dÃ©' : (meetsReqs ? 'ðŸŽ¯ Ã‰ligible' : 'âŒ Pas encore')
        });

        badgeLog(`ðŸ† ${badge.id}: ${results[results.length - 1].status}`);
      }

      return {
        userStats,
        currentBadgeIds,
        totalBadges: allBadges.length,
        badgeAnalysis: results
      };

    } catch (error) {
      console.error('âŒ Erreur debug badges:', error);
      return null;
    }
  }

  /**
   * Nouvelle mÃ©thode qui utilise requirement_type et requirement_value de la BDD
   */
  private checkBadgeRequirementsNew(badge: Badge, userStats: any): boolean {
    if (!badge.requirementType || !badge.requirementValue) {
      badgeLog(`âš ï¸ Badge ${badge.id} n'a pas de requirements dÃ©finis en BDD - ignorÃ©`);
      return false; // Plus de fallback vers les badges hardcodÃ©s
    }

    const requiredValue = parseInt(badge.requirementValue, 10);
    badgeLog(`ðŸ” VÃ©rification badge ${badge.id}: requirement ${badge.requirementType} >= ${requiredValue}`);

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
        badgeLog(`âš ï¸ Type de requirement inconnu: ${badge.requirementType}`);
        return false;
    }
  }

  private getUserStats(userId: string): Promise<any> {
    // RÃ©cupÃ©rer les statistiques utilisateur depuis Supabase
    return this.supabase.getUserStats(userId);
  }

  /**
   * DÃ©verrouille un badge spÃ©cifique
   */
  private async unlockBadge(badgeId: string): Promise<boolean> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) return false;

      const success = await this.supabase.unlockBadge(user.id, badgeId);

      if (success) {
        // Recharger les badges utilisateur avec TOUS les badges disponibles
        await this.loadUserBadges(user.id);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors du dÃ©verrouillage du badge:', error);
      return false;
    }
  }

  /**
   * RÃ©cupÃ¨re tous les badges de l'utilisateur actuel (obsolÃ¨te - utiliser getUserBadges)
   */
  getBadges(): Observable<Badge[]> {
    return this.userBadges$;
  }

  /**
   * RÃ©cupÃ¨re les statistiques dÃ©taillÃ©es pour les "Prochains dÃ©fis"
   * Affiche seulement 3-4 badges dÃ©jÃ  entamÃ©s (progress > 0) - les autres restent "secrets"
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

      // Trouver les badges non dÃ©bloquÃ©s et leurs statistiques
      const unlockedBadges = allAvailableBadges.filter(badge =>
        !userBadgeIds.includes(badge.id)
      );

      const challenges: Array<{
        name: string;
        description: string;
        rarity: string;
        current: number;
        required: number;
        progress: number;
      }> = [];

      for (const badge of unlockedBadges) {
        const progress = await this.getBadgeProgressNew(badge, userStats);

        // SEULEMENT inclure les badges dÃ©jÃ  entamÃ©s (progress > 0)
        // Les badges non commencÃ©s restent "secrets"
        if (progress.current > 0) {
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

      // Trier par progression dÃ©croissante (les plus proches d'Ãªtre dÃ©bloquÃ©s en premier)
      // et limiter Ã  4 badges maximum pour garder le focus
      return challenges
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 4);
    } catch (error) {
      console.error('Erreur lors de la rÃ©cupÃ©ration des challenges:', error);
      return [];
    }
  }

  /**
   * Nouvelle mÃ©thode pour calculer le progress d'un badge avec le systÃ¨me requirement_type/requirement_value
   */
  private async getBadgeProgressNew(badge: Badge, userStats: any): Promise<{ current: number, required: number, progress: number }> {
    if (!badge.requirementType || !badge.requirementValue) {
      // Fallback vers l'ancien systÃ¨me
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
   * MÃ©thode utilitaire pour vÃ©rifier les badges aprÃ¨s une action utilisateur
   * @deprecated Utiliser EventBus Ã  la place
   */
  async checkBadgesAfterAction(action: 'fail_posted' | 'reaction_given'): Promise<Badge[]> {
    badgeLog('ðŸ† BadgeService: checkBadgesAfterAction called with action:', action);
    badgeLog('ðŸ† BadgeService: checkBadgesAfterAction est dÃ©prÃ©ciÃ©, utiliser EventBus Ã  la place');

    const user = await this.supabase.getCurrentUser();
    if (!user) {
      badgeLog('ðŸ† BadgeService: No user found, returning empty badges array');
      return [];
    }

    badgeLog('ðŸ† BadgeService: User found, checking and unlocking badges for user:', user.id);
    const result = await this.checkAndUnlockBadges(user.id);
    badgeLog('ðŸ† BadgeService: Badge check completed, found', result.length, 'new badges');
    return result;
  }

  /**
   * Force la vÃ©rification manuelle des badges pour l'utilisateur actuel
   * Utile pour les tests et le dÃ©bogage
   */
  async forceCheckBadges(): Promise<Badge[]> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) {
        badgeLog('Aucun utilisateur connectÃ© pour la vÃ©rification des badges');
        return [];
      }

      badgeLog('ðŸ” VÃ©rification forcÃ©e des badges pour:', user.email);
      const newBadges = await this.checkAndUnlockBadges(user.id);

      if (newBadges.length > 0) {
        badgeLog(`ðŸ† ${newBadges.length} nouveaux badges dÃ©bloquÃ©s:`, newBadges.map(b => b.name));
        // Ã‰mettre l'Ã©vÃ©nement pour les notifications
        this.eventBus.emit(AppEvents.BADGE_UNLOCKED, { badges: newBadges });
        // Recharger les badges utilisateur
        await this.refreshUserBadges();
      } else {
        badgeLog('âœ… Aucun nouveau badge Ã  dÃ©bloquer');
      }

      return newBadges;
    } catch (error) {
      console.error('Erreur lors de la vÃ©rification forcÃ©e des badges:', error);
      return [];
    }
  }
}


