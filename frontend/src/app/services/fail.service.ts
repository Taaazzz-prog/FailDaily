import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of, BehaviorSubject } from 'rxjs';
import { MysqlService } from './mysql.service';
import { AuthService } from './auth.service';
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
  is_anonyme: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FailService {
  private failsSubject = new BehaviorSubject<Fail[]>([]);
  public fails$ = this.failsSubject.asObservable();

  constructor(
    private mysqlService: MysqlService,
    private authService: AuthService,
    private eventBus: EventBusService,
    private logger: ComprehensiveLoggerService
  ) {
    console.log('FailService: Constructor called - initializing fail service with MySQL backend');
    
    // Écouter les changements d'authentification pour charger/décharger les fails
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        console.log('FailService: User authenticated, loading fails...');
        this.loadFails();
      } else {
        console.log('FailService: User not authenticated, clearing fails');
        this.failsSubject.next([]);
      }
    });
  }

  async createFail(failData: CreateFailData): Promise<{ imageUploaded: boolean; failId?: string }> {
    // Utiliser AuthService pour vérifier l'authentification
    const user = this.authService.getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    let imageUrl: string | null = null;
    if (failData.image) {
      try {
        imageUrl = await this.mysqlService.uploadImage(failData.image);
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
      is_anonyme: Boolean(failData.is_anonyme),
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
      const created = await this.mysqlService.createFail(failToCreate);

      // Logger la création du fail
      await this.logger.logFail('create', failToCreate.title, undefined, {
        category: failToCreate.category,
        is_anonyme: failToCreate.is_anonyme,
        hasImage: !!imageUrl
      });

      // Recharger les fails après création
      await this.loadFails();

      // Émettre un événement pour notifier la création du fail
      this.eventBus.emit(AppEvents.FAIL_POSTED, {
        userId: user.id,
        failData: failData
      });
      return { imageUploaded: !!imageUrl, failId: created?.id };
    } catch (error) {
      console.error('Erreur lors de la création du fail:', error);

      // Logger l'erreur de création
      await this.logger.logFail('create_error', failToCreate.title, undefined, {
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      }, false);

      throw error;
    }
  }

  async reportFail(failId: string, reason?: string): Promise<boolean> {
    try {
      const res: any = await this.mysqlService.reportFail(failId, reason);
      return !!res?.success || res === true;
    } catch {
      return false;
    }
  }

  private async loadFails(): Promise<void> {
    try {
      console.log('FailService: Loading public fails from backend...');
      const fails = await this.mysqlService.getPublicFails();
      console.log('FailService: Received public fails from backend:', fails);
      
      const formattedFails = await Promise.all(
        fails.map(fail => this.formatFailWithAuthor(fail))
      );
      console.log('FailService: Formatted fails:', formattedFails);
      
      this.failsSubject.next(formattedFails);
      console.log('FailService: Fails loaded and published to subscribers');
    } catch (error) {
      console.error('❌ FailService: Erreur lors du chargement des fails:', error);
      this.failsSubject.next([]);
    }
  }

  getAllFails(): Observable<Fail[]> {
    return this.fails$;
  }

  getFailsByCategory(category: FailCategory): Observable<Fail[]> {
    return from(this.mysqlService.getPublicFails()).pipe(
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
    console.log('🔍 formatFailWithAuthor - Input data:', {
      id: failData.id,
      title: failData.title,
      authorId: failData.authorId,
      authorName: failData.authorName,
      authorAvatar: failData.authorAvatar,
      isAnonyme: failData.is_anonyme
    });

    // ✅ UTILISER LES DONNÉES DÉJÀ CALCULÉES PAR LE BACKEND
    // Le backend nous envoie déjà authorName et authorAvatar correctement calculés
    let authorName = failData.authorName || 'Utilisateur';
    let authorAvatar = failData.authorAvatar || 'assets/profil/base.png';

    console.log('✅ formatFailWithAuthor - Using backend data:', { authorName, authorAvatar });

    // Log des données de réactions pour débugger
    console.log('📊 formatFailWithAuthor - Raw failData.reactions:', failData.reactions);
    console.log('📊 formatFailWithAuthor - Type of reactions:', typeof failData.reactions);

    // ✅ FIX: Gérer le formatage de date plus robuste
    let createdDate: Date;
    try {
      createdDate = new Date(failData.createdAt);
      // Vérifier si la date est valide
      if (isNaN(createdDate.getTime())) {
        createdDate = new Date(); // Fallback à maintenant
      }
    } catch (error) {
      createdDate = new Date(); // Fallback à maintenant
    }

    // ✅ FIX: Récupérer les réactions depuis l'endpoint dédié
    let reactions = {
      courage: 0,
      empathy: 0,
      laugh: 0,
      support: 0
    };

    try {
      // Récupérer les réactions depuis l'API
      const reactionsData = await this.mysqlService.getReactionsForFail(failData.id);
      if (reactionsData) {
        reactions = {
          courage: reactionsData.courage || 0,
          empathy: reactionsData.empathy || 0,
          laugh: reactionsData.laugh || 0,
          support: reactionsData.support || 0
        };
      }
    } catch (error) {
      console.log('FailService: Erreur lors de la récupération des réactions pour', failData.id, error);
      // Garder les valeurs par défaut
    }

    return {
      id: failData.id,
      title: failData.title,
      description: failData.description,
      category: failData.category as FailCategory,
      authorName: authorName,
      authorAvatar: authorAvatar,
      authorId: failData.user_id, // ID de l'auteur toujours présent (anonymat géré par is_anonyme)
      imageUrl: failData.imageUrl,
      createdAt: createdDate, // ✅ FIX: Date formatée correctement
      is_anonyme: failData.is_anonyme,
      commentsCount: (failData.commentsCount ?? failData.comments_count ?? 0),
      reactions: reactions, // ✅ FIX: Réactions récupérées depuis l'API
      moderationStatus: failData.moderationStatus || failData.moderation_status || 'approved'
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
    if (!this.authService.isAuthenticated()) {
      console.log('FailService: User not authenticated, cannot refresh fails');
      return;
    }
    
    await this.loadFails();
  }
}
