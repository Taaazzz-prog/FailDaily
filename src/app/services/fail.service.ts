import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of, BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { EventBusService, AppEvents } from './event-bus.service';
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

  constructor(
    private supabaseService: SupabaseService,
    private eventBus: EventBusService
  ) {
    console.log('💣 FailService: Constructor called - initializing fail service');
    // Charger les fails au démarrage
    this.loadFails();
  }

  async createFail(failData: CreateFailData): Promise<void> {
    // Utiliser la méthode synchrone pour éviter les problèmes de concurrence
    const user = this.supabaseService.getCurrentUserSync();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    let imageUrl = null;
    if (failData.image) {
      try {
        imageUrl = await this.supabaseService.uploadFile(
          'fails',
          `${user.id}/${Date.now()}`,
          failData.image
        );
      } catch (error) {
        console.error('Erreur lors de l\'upload de l\'image:', error);
        // Continuer sans image en cas d'erreur
      }
    }

    // Validation des données avant envoi
    const failToCreate = {
      title: failData.title?.trim() || 'Mon fail',
      description: failData.description?.trim() || '',
      category: failData.category, // Suppression du fallback
      image_url: imageUrl,
      is_public: Boolean(failData.isPublic),
      user_id: user.id
    };

    // Validation supplémentaire
    if (!failToCreate.description) {
      throw new Error('La description ne peut pas être vide');
    }

    if (!failToCreate.category) {
      throw new Error('La catégorie doit être sélectionnée');
    }

    try {
      await this.supabaseService.createFail(failToCreate);

      // Recharger les fails après création
      await this.loadFails();

      // Émettre un événement pour notifier la création du fail
      this.eventBus.emit(AppEvents.FAIL_POSTED, {
        userId: user.id,
        failData: failData
      });
    } catch (error) {
      console.error('Erreur lors de la création du fail:', error);
      throw error;
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
    console.log('💣 FailService: addReaction called for fail:', failId, 'type:', reactionType);

    const user = await this.supabaseService.getCurrentUser();
    if (!user) {
      console.error('💣 FailService: No user connected for addReaction');
      throw new Error('Utilisateur non connecté');
    }

    console.log('💣 FailService: User found for reaction:', user.id);
    console.log('💣 FailService: Calling supabaseService.addReaction');
    const result = await this.supabaseService.addReaction(failId, reactionType);
    console.log('💣 FailService: supabaseService.addReaction completed');

    // Émettre un événement pour notifier la réaction
    console.log('💣 FailService: Emitting REACTION_GIVEN event');
    this.eventBus.emit(AppEvents.REACTION_GIVEN, {
      userId: user.id,
      failId: failId,
      reactionType: reactionType
    });
    console.log('💣 FailService: REACTION_GIVEN event emitted successfully');

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
    console.log('💣 FailService: getUserReactionsForFail called for fail:', failId);
    const result = await this.supabaseService.getUserReactionsForFail(failId);
    console.log('💣 FailService: getUserReactionsForFail result:', result);
    return result;
  }

  async getFailById(failId: string): Promise<Fail | null> {
    console.log('💣 FailService: getFailById called for fail:', failId);

    try {
      const failData = await this.supabaseService.getFailById(failId);
      if (!failData) {
        console.log('💣 FailService: No fail data found for ID:', failId);
        return null;
      }

      console.log('💣 FailService: Fail data found, formatting with author');
      const result = await this.formatFailWithAuthor(failData);
      console.log('💣 FailService: Fail formatted successfully');
      return result;
    } catch (error) {
      console.error('💣 FailService: Erreur lors de la récupération du fail:', error);
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
