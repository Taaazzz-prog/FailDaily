import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { Badge } from '../models/badge.model';
import { BadgeCategory } from '../models/enums';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class BadgeService {

  constructor(private supabase: SupabaseService) { }

  /**
   * Récupère tous les badges de l'utilisateur actuel
   */
  getBadges(): Observable<Badge[]> {
    return from(this.supabase.getCurrentUser().then(async (user) => {
      if (!user) return [];
      return await this.supabase.getUserBadges(user.id);
    }));
  }

  /**
   * Récupère tous les badges disponibles (unlocked + locked)
   */
  getAllAvailableBadges(): Observable<Badge[]> {
    return from(this.supabase.getAllBadges());
  }

  /**
   * Débloque un badge pour l'utilisateur actuel
   */
  unlockBadge(badgeId: string): Observable<Badge | null> {
    return from(this.supabase.getCurrentUser().then(async (user) => {
      if (!user) return null;
      const badgeData = { badge_id: badgeId, unlocked_at: new Date() };
      return await this.supabase.unlockBadge(user.id, badgeData);
    }));
  }

  /**
   * Vérifie si l'utilisateur peut débloquer de nouveaux badges
   * basé sur ses statistiques
   */
  checkAndUnlockBadges(userStats: any): Observable<Badge[]> {
    return from(this.supabase.checkAndUnlockBadges(userStats));
  }

  /**
   * Récupère les statistiques de progression pour un badge
   */
  getBadgeProgress(badgeId: string): Observable<{ current: number, required: number, progress: number }> {
    return from(this.supabase.getBadgeProgress(badgeId));
  }
}

