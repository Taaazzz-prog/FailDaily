import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of, BehaviorSubject } from 'rxjs';
import { MysqlService } from './mysql.service';
import { EventBusService, AppEvents } from './event-bus.service';
import { Fail } from '../models/fail.model';
import { User } from '../models/user.model';
import { FailCategory } from '../models/enums';
import { ComprehensiveLoggerService } from './comprehensive-logger.service';

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
    private mysqlService: MysqlService,
    private eventBus: EventBusService,
    private logger: ComprehensiveLoggerService
  ) {
    console.log('FailService: Constructor called - initializing fail service with MySQL backend');
    // Ne charger les fails que si l'utilisateur est connecté
    if (this.mysqlService.getCurrentUserSync()) {
      this.loadFails();
    } else {
      console.log('FailService: User not authenticated, skipping initial load');
    }
  }

  async createFail(failData: CreateFailData): Promise<void> {
    // Utiliser la méthode synchrone pour éviter les problèmes de concurrence
    const user = this.mysqlService.getCurrentUserSync();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    let imageUrl = null;
    if (failData.image) {
      try {
        imageUrl = await this.mysqlService.uploadFile(
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
      await this.mysqlService.createFail(failToCreate);

      // Logger la création du fail
      await this.logger.logFail('create', failToCreate.title, undefined, {
        category: failToCreate.category,
        isPublic: failToCreate.is_public,
        hasImage: !!imageUrl
      });

      // Recharger les fails après création
      await this.loadFails();

      // Émettre un événement pour notifier la création du fail
      this.eventBus.emit(AppEvents.FAIL_POSTED, {
        userId: user.id,
        failData: failData
      });
    } catch (error) {
      console.error('Erreur lors de la création du fail:', error);

      // Logger l'erreur de création
      await this.logger.logFail('create_error', failToCreate.title, undefined, {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }, false);

      throw error;
    }
  }

  private async loadFails(): Promise<void> {
    try {
      // Vérifier l'authentification avant de charger
      if (!this.mysqlService.getCurrentUserSync()) {
        console.log('FailService: User not authenticated, cannot load fails');
        this.failsSubject.next([]);
        return;
      }

      const fails = await this.mysqlService.getFails();
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
    return from(this.mysqlService.getFails()).pipe(
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
    let authorAvatar = 'assets/profil/anonymous.png'; // Avatar par défaut pour anonyme

    if (failData.is_public) {
      try {
        // Récupérer le profil de l'utilisateur pour avoir son vrai nom et avatar
        const profile = await this.mysqlService.getProfile(failData.user_id);
        if (profile && profile.display_name) {
          authorName = profile.display_name;
          // Récupérer l'avatar du profil s'il existe
          authorAvatar = profile.avatar_url || 'assets/profil/base.png'; // Avatar par défaut si pas d'avatar
        } else {
          authorName = 'Utilisateur courageux'; // Fallback si pas de profil
          authorAvatar = 'assets/profil/base.png'; // Avatar par défaut
        }
      } catch (error) {
        // Ne pas logger l'erreur pour éviter le spam dans la console
        authorName = 'Utilisateur courageux'; // Fallback
        authorAvatar = 'assets/profil/base.png'; // Avatar par défaut
      }
    }

    // Log des données de réactions pour débugger
    console.log('📊 formatFailWithAuthor - Raw failData.reactions:', failData.reactions);
    console.log('📊 formatFailWithAuthor - Type of reactions:', typeof failData.reactions);

    return {
      id: failData.id,
      title: failData.title,
      description: failData.description,
      category: failData.category as FailCategory,
      authorName: authorName,
      authorAvatar: authorAvatar,
      authorId: failData.user_id, // ID de l'auteur toujours présent (anonymat géré par is_public)
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
    console.log('FailService: addReaction called for fail:', failId, 'type:', reactionType);

    const user = await this.mysqlService.getCurrentUser();
    if (!user) {
      console.log('FailService: No user connected for addReaction');
      throw new Error('Utilisateur non connecté');
    }

    console.log('FailService: User found for reaction:', user.id);

    try {
      const result = await this.mysqlService.addReaction(failId, reactionType);
      console.log('FailService: mysqlService.addReaction completed successfully');

      // Émettre un événement pour notifier la réaction
      console.log('FailService: Emitting REACTION_GIVEN event');
      this.eventBus.emit(AppEvents.REACTION_GIVEN, {
        userId: user.id,
        failId: failId,
        reactionType: reactionType
      });
      console.log('FailService: REACTION_GIVEN event emitted successfully');

      return result;
    } catch (error) {
      console.error('❌ FailService: Error in addReaction:', error);
      throw error;
    }
  }

  async removeReaction(failId: string, reactionType: 'courage' | 'empathy' | 'laugh' | 'support'): Promise<void> {
    const user = await this.mysqlService.getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    return this.mysqlService.removeReaction(failId, reactionType);
  }

  async getUserReactionForFail(failId: string): Promise<string | null> {
    return this.mysqlService.getUserReactionForFail(failId);
  }

  async getUserReactionsForFail(failId: string): Promise<string[]> {
    console.log('FailService: getUserReactionsForFail called for fail:', failId);
    const result = await this.mysqlService.getUserReactionsForFail(failId);
    console.log('FailService: getUserReactionsForFail result:', result);
    return result;
  }

  async getFailById(failId: string): Promise<Fail | null> {
    console.log('FailService: getFailById called for fail:', failId);

    try {
      const failData = await this.mysqlService.getFailById(failId);
      if (!failData) {
        console.log('FailService: No fail data found for ID:', failId);
        return null;
      }

      console.log('FailService: Fail data found, formatting with author');
      const result = await this.formatFailWithAuthor(failData);
      console.log('FailService: Fail formatted successfully');
      return result;
    } catch (error) {
      console.error('❌ FailService: Erreur lors de la récupération du fail:', error);
      return null;
    }
  }

  // Méthodes de compatibilité pour les pages existantes
  getFails(): Observable<Fail[]> {
    return this.fails$;
  }

  async refreshFails(): Promise<void> {
    // Vérifier l'authentification avant de rafraîchir
    if (!this.mysqlService.getCurrentUserSync()) {
      console.log('FailService: User not authenticated, cannot refresh fails');
      return;
    }
    
    await this.loadFails();
  }
}
