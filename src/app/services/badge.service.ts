import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { Badge } from '../models/badge.model';
import { BadgeCategory } from '../models/enums';
import { SupabaseService } from './supabase.service';
import { EventBusService, AppEvents } from './event-bus.service';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private userBadgesSubject = new BehaviorSubject<Badge[]>([]);
  public userBadges$ = this.userBadgesSubject.asObservable();

  // Système de debounce pour éviter les vérifications trop fréquentes
  private lastBadgeCheck = 0;
  private readonly BADGE_CHECK_COOLDOWN = 2000; // 2 secondes entre les vérifications

  constructor(private supabase: SupabaseService, private eventBus: EventBusService) {
    console.log('🏆 BadgeService: Constructor called - initializing badge service');

    // Charger les badges utilisateur au démarrage
    console.log('🏆 BadgeService: Calling initializeBadges');
    this.initializeBadges();

    // Écouter les événements pour vérifier les badges automatiquement
    console.log('🏆 BadgeService: Setting up event listeners');
    this.setupEventListeners();
  }

  /**
   * Configure les écouteurs d'événements pour le déblocage automatique des badges
   */
  private setupEventListeners(): void {
    // Écouter les événements de création de fail
    this.eventBus.on(AppEvents.FAIL_POSTED).subscribe(async (payload) => {
      console.log('🎯 Événement FAIL_POSTED reçu:', payload);
      try {
        const user = await this.supabase.getCurrentUser();
        if (user) {
          const newBadges = await this.checkAndUnlockBadgesWithCooldown(user.id, 'FAIL_POSTED');
          if (newBadges.length > 0) {
            this.eventBus.emit(AppEvents.BADGE_UNLOCKED, { badges: newBadges });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des badges après création de fail:', error);
      }
    });

    // Écouter les événements de réaction
    this.eventBus.on(AppEvents.REACTION_GIVEN).subscribe(async (payload) => {
      console.log('🎯 Événement REACTION_GIVEN reçu:', payload);
      try {
        const user = await this.supabase.getCurrentUser();
        if (user) {
          const newBadges = await this.checkAndUnlockBadgesWithCooldown(user.id, 'REACTION_GIVEN');
          if (newBadges.length > 0) {
            this.eventBus.emit(AppEvents.BADGE_UNLOCKED, { badges: newBadges });
          }
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des badges après réaction:', error);
      }
    });
  }

  /**
   * Vérifie les badges avec un système de cooldown pour éviter les appels trop fréquents
   */
  private async checkAndUnlockBadgesWithCooldown(userId: string, eventType: string): Promise<Badge[]> {
    const now = Date.now();

    // Si la dernière vérification était il y a moins de 2 secondes, ignorer
    if (now - this.lastBadgeCheck < this.BADGE_CHECK_COOLDOWN) {
      console.log(`⏰ Cooldown actif, vérification ignorée (${eventType})`);
      return [];
    }

    this.lastBadgeCheck = now;
    console.log(`🔍 Vérification des badges déclenchée par: ${eventType}`);

    return await this.checkAndUnlockBadges(userId);
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
   * Récupère tous les badges disponibles UNIQUEMENT depuis la base de données
   */
  async getAllAvailableBadges(): Promise<Badge[]> {
    try {
      // Récupérer depuis la base de données
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

      // Plus de fallback - si pas de badges en BDD, retourner tableau vide
      console.log(`❌ Aucun badge trouvé en base de données`);
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des badges depuis la BDD:', error);
      return [];
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
      return []; // Plus de fallback hardcodé
    }
  }

  /**
   * Version synchrone pour compatibilité - retourne un tableau vide car on n'utilise plus les badges hardcodés
   */
  getAllAvailableBadgesSync(): Badge[] {
    console.warn('getAllAvailableBadgesSync est dépréciée - utilisez getAllAvailableBadges() à la place');
    return []; // Plus de badges hardcodés
  }

  /**
   * Récupère les badges de l'utilisateur
   */
  getUserBadges(): Observable<Badge[]> {
    return this.userBadges$;
  }

  /**
   * Récupère les badges d'un utilisateur spécifique (pour admin)
   */
  async getUserBadgesForUser(userId: string): Promise<Badge[]> {
    try {
      console.log('🏆 BadgeService: Getting badges for user:', userId);

      // Récupérer les IDs des badges de l'utilisateur
      const badgeIds = await this.supabase.getUserBadgesNew(userId);
      console.log('🏆 BadgeService: User badge IDs:', badgeIds);

      // Récupérer tous les badges disponibles
      const allAvailableBadges = await this.getAllAvailableBadges();
      console.log('🏆 BadgeService: Total available badges:', allAvailableBadges.length);

      // Filtrer les badges débloqués avec dates
      const userBadges = allAvailableBadges
        .filter(badge => badgeIds.includes(badge.id))
        .map(badge => ({ ...badge, unlockedDate: new Date() }));

      console.log('🏆 BadgeService: User unlocked badges:', userBadges.length);
      return userBadges;
    } catch (error) {
      console.error('❌ Error getting user badges:', error);
      return [];
    }
  }

  /**
   * Vérifie et déverrouille automatiquement les badges basés sur les statistiques utilisateur
   */
  async checkAndUnlockBadges(userId: string): Promise<Badge[]> {
    console.log('🏆 BadgeService: checkAndUnlockBadges called for user:', userId);

    try {
      console.log('🏆 BadgeService: Getting user stats');
      const userStats = await this.getUserStats(userId);
      console.log('🏆 BadgeService: User stats retrieved:', userStats);

      // CORRECTION: Récupérer les badges depuis la BDD, pas depuis le cache local
      console.log('🏆 BadgeService: Getting current user badges from database');
      const currentBadgeIds = await this.supabase.getUserBadgesNew(userId);
      console.log('🏆 BadgeService: Current user badges:', currentBadgeIds);

      console.log('🏆 BadgeService: Getting all available badges');
      const allAvailableBadges = await this.getAllAvailableBadges();
      console.log('🏆 BadgeService: Total available badges:', allAvailableBadges.length);

      const newBadges: Badge[] = [];

      console.log(`� BadgeService: Vérification des badges pour ${allAvailableBadges.length} badges disponibles`);
      console.log(`🏆 BadgeService: Badges actuels en BDD: [${currentBadgeIds.join(', ')}]`);
      console.log('🏆 BadgeService: Stats utilisateur:', userStats);

      // Vérifier chaque badge avec le nouveau système
      for (const badge of allAvailableBadges) {
        console.log('🏆 BadgeService: Checking badge:', badge.id, 'already has?', currentBadgeIds.includes(badge.id));
        if (!currentBadgeIds.includes(badge.id)) {
          console.log('🏆 BadgeService: Badge not unlocked yet, checking requirements for:', badge.id);
          if (this.checkBadgeRequirementsNew(badge, userStats)) {
            console.log('🏆 BadgeService: Requirements met, unlocking badge:', badge.id);
            const unlocked = await this.unlockBadge(badge.id);
            if (unlocked) {
              newBadges.push(badge);
              console.log(`🏆 Nouveau badge débloqué: ${badge.name}`);
            }
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
   * 🚀 MÉTHODE DEBUG - Pour tester les badges de bruno manuellement
   */
  async debugBadgeCheck(userId: string): Promise<any> {
    console.log('🚀 DEBUG: Vérification complète des badges pour:', userId);

    try {
      // 1. Stats utilisateur
      const userStats = await this.getUserStats(userId);
      console.log('📊 Stats utilisateur:', userStats);

      // 2. Badges actuels en BDD
      const currentBadgeIds = await this.supabase.getUserBadgesNew(userId);
      console.log('✅ Badges actuellement possédés:', currentBadgeIds);

      // 3. Tous les badges disponibles
      const allBadges = await this.getAllAvailableBadges();
      console.log('🏆 Total badges disponibles:', allBadges.length);

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
          status: alreadyHas ? '✅ Possédé' : (meetsReqs ? '🎯 Éligible' : '❌ Pas encore')
        });

        console.log(`🏆 ${badge.id}: ${results[results.length - 1].status}`);
      }

      return {
        userStats,
        currentBadgeIds,
        totalBadges: allBadges.length,
        badgeAnalysis: results
      };

    } catch (error) {
      console.error('❌ Erreur debug badges:', error);
      return null;
    }
  }

  /**
   * Nouvelle méthode qui utilise requirement_type et requirement_value de la BDD
   */
  private checkBadgeRequirementsNew(badge: Badge, userStats: any): boolean {
    if (!badge.requirementType || !badge.requirementValue) {
      console.warn(`⚠️ Badge ${badge.id} n'a pas de requirements définis en BDD - ignoré`);
      return false; // Plus de fallback vers les badges hardcodés
    }

    const requiredValue = parseInt(badge.requirementValue, 10);
    console.log(`🔍 Vérification badge ${badge.id}: requirement ${badge.requirementType} >= ${requiredValue}`);

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

  private getUserStats(userId: string): Promise<any> {
    // Récupérer les statistiques utilisateur depuis Supabase
    return this.supabase.getUserStats(userId);
  }

  /**
   * Déverrouille un badge spécifique
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
      console.error('Erreur lors du déverrouillage du badge:', error);
      return false;
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
   * Affiche seulement 3-4 badges déjà entamés (progress > 0) - les autres restent "secrets"
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

        // SEULEMENT inclure les badges déjà entamés (progress > 0)
        // Les badges non commencés restent "secrets"
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

      // Trier par progression décroissante (les plus proches d'être débloqués en premier)
      // et limiter à 4 badges maximum pour garder le focus
      return challenges
        .sort((a, b) => b.progress - a.progress)
        .slice(0, 4);
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
   * @deprecated Utiliser EventBus à la place
   */
  async checkBadgesAfterAction(action: 'fail_posted' | 'reaction_given'): Promise<Badge[]> {
    console.log('🏆 BadgeService: checkBadgesAfterAction called with action:', action);
    console.warn('🏆 BadgeService: checkBadgesAfterAction est déprécié, utiliser EventBus à la place');

    const user = await this.supabase.getCurrentUser();
    if (!user) {
      console.log('🏆 BadgeService: No user found, returning empty badges array');
      return [];
    }

    console.log('🏆 BadgeService: User found, checking and unlocking badges for user:', user.id);
    const result = await this.checkAndUnlockBadges(user.id);
    console.log('🏆 BadgeService: Badge check completed, found', result.length, 'new badges');
    return result;
  }

  /**
   * Force la vérification manuelle des badges pour l'utilisateur actuel
   * Utile pour les tests et le débogage
   */
  async forceCheckBadges(): Promise<Badge[]> {
    try {
      const user = await this.supabase.getCurrentUser();
      if (!user) {
        console.warn('Aucun utilisateur connecté pour la vérification des badges');
        return [];
      }

      console.log('🔍 Vérification forcée des badges pour:', user.email);
      const newBadges = await this.checkAndUnlockBadges(user.id);

      if (newBadges.length > 0) {
        console.log(`🏆 ${newBadges.length} nouveaux badges débloqués:`, newBadges.map(b => b.name));
        // Émettre l'événement pour les notifications
        this.eventBus.emit(AppEvents.BADGE_UNLOCKED, { badges: newBadges });
        // Recharger les badges utilisateur
        await this.refreshUserBadges();
      } else {
        console.log('✅ Aucun nouveau badge à débloquer');
      }

      return newBadges;
    } catch (error) {
      console.error('Erreur lors de la vérification forcée des badges:', error);
      return [];
    }
  }
}

