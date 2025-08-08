import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of, BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { Fail } from '../models/fail.model';
import { User } from '@supabase/supabase-js';
import { FailCategory } from '../models/enums';

export interface CreateFailData {
  title: string;
  description: string;
  category: FailCategory;
  image?: File;
  isPublic: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FailService {
  private failsSubject = new BehaviorSubject<Fail[]>([]);
  public fails$ = this.failsSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    // Charger les fails au démarrage
    this.loadFails();
  }

  async createFail(failData: CreateFailData): Promise<void> {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    let imageUrl = null;
    if (failData.image) {
      imageUrl = await this.supabaseService.uploadFile(
        'fails',
        `${user.id}/${Date.now()}`,
        failData.image
      );
    }

    await this.supabaseService.createFail({
      title: failData.title,
      description: failData.description,
      category: failData.category,
      image_url: imageUrl,
      is_public: failData.isPublic,
      user_id: user.id
    });

    // Recharger les fails après création
    await this.loadFails();

    // Vérifier les badges après création d'un fail
    try {
      const { BadgeService } = await import('./badge.service');
      const badgeService = new (BadgeService as any)(this.supabaseService, this);
      await badgeService.checkBadgesAfterAction('fail_posted');
    } catch (error) {
      console.error('Erreur lors de la vérification des badges après création de fail:', error);
    }
  }

  private async loadFails(): Promise<void> {
    try {
      const fails = await this.supabaseService.getFails();
      const formattedFails = await Promise.all(
        fails.map(fail => this.formatFailWithAuthor(fail))
      );
      this.failsSubject.next(formattedFails);
    } catch (error) {
      console.error('Erreur lors du chargement des fails:', error);
      this.failsSubject.next([]);
    }
  }

  getAllFails(): Observable<Fail[]> {
    return this.fails$;
  }

  getFailsByCategory(category: FailCategory): Observable<Fail[]> {
    return from(this.supabaseService.getFails()).pipe(
      switchMap((fails: any[]) => {
        if (!fails || fails.length === 0) {
          return of([]);
        }

        const filteredFails = fails.filter(fail => fail.category === category);
        const failsWithAuthors = filteredFails.map(async (fail) => {
          return await this.formatFailWithAuthor(fail);
        });

        return from(Promise.all(failsWithAuthors));
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des fails par catégorie:', error);
        return of([]);
      })
    );
  }

  private async formatFailWithAuthor(failData: any): Promise<Fail> {
    // Déterminer le nom de l'auteur selon si c'est public ou anonyme
    let authorName = 'Utilisateur anonyme';

    if (failData.is_public) {
      try {
        // Récupérer le profil de l'utilisateur pour avoir son vrai nom
        const profile = await this.supabaseService.getProfile(failData.user_id);
        if (profile && (profile.username || profile.display_name)) {
          authorName = profile.username || profile.display_name;
        } else {
          authorName = 'Utilisateur courageux'; // Fallback si pas de profil
        }
      } catch (error) {
        // Ne pas logger l'erreur pour éviter le spam dans la console
        authorName = 'Utilisateur courageux'; // Fallback
      }
    }

    return {
      id: failData.id,
      title: failData.title,
      description: failData.description,
      category: failData.category as FailCategory,
      authorName: authorName,
      authorAvatar: '', // À implémenter plus tard
      imageUrl: failData.image_url,
      createdAt: new Date(failData.created_at),
      isPublic: failData.is_public,
      commentsCount: 0, // À implémenter plus tard
      reactions: {
        courage: failData.reactions?.courage || 0,
        empathy: failData.reactions?.empathy || 0,
        laugh: failData.reactions?.laugh || 0,
        support: failData.reactions?.support || 0
      }
    };
  }

  async addReaction(failId: string, reactionType: 'courage' | 'empathy' | 'laugh' | 'support'): Promise<void> {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    const result = await this.supabaseService.addReaction(failId, reactionType);

    // Vérifier les badges après une réaction
    try {
      // Import dynamique pour éviter la dépendance circulaire
      const { BadgeService } = await import('./badge.service');
      const badgeService = new (BadgeService as any)(this.supabaseService, this);
      await badgeService.checkBadgesAfterAction('reaction_given');
    } catch (error) {
      console.error('Erreur lors de la vérification des badges après réaction:', error);
    }

    return result;
  }

  async removeReaction(failId: string, reactionType: 'courage' | 'empathy' | 'laugh' | 'support'): Promise<void> {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    return this.supabaseService.removeReaction(failId, reactionType);
  }

  async getUserReactionForFail(failId: string): Promise<string | null> {
    return this.supabaseService.getUserReactionForFail(failId);
  }

  async getUserReactionsForFail(failId: string): Promise<string[]> {
    return this.supabaseService.getUserReactionsForFail(failId);
  }

  async getFailById(failId: string): Promise<Fail | null> {
    try {
      const failData = await this.supabaseService.getFailById(failId);
      if (!failData) return null;

      return await this.formatFailWithAuthor(failData);
    } catch (error) {
      console.error('Erreur lors de la récupération du fail:', error);
      return null;
    }
  }

  // Méthodes de compatibilité pour les pages existantes
  getFails(): Observable<Fail[]> {
    return this.fails$;
  }

  async refreshFails(): Promise<void> {
    await this.loadFails();
  }
}
