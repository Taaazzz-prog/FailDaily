import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap, catchError, of } from 'rxjs';
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
  constructor(private supabaseService: SupabaseService) { }

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
  }

  getAllFails(): Observable<Fail[]> {
    return from(this.supabaseService.getFails()).pipe(
      map((fails: any[]) => {
        return fails.map(fail => this.formatFail(fail));
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des fails:', error);
        return of([]);
      })
    );
  }

  getFailsByCategory(category: FailCategory): Observable<Fail[]> {
    return from(this.supabaseService.getFails()).pipe(
      map((fails: any[]) => {
        return fails
          .filter(fail => fail.category === category)
          .map(fail => this.formatFail(fail));
      }),
      catchError(error => {
        console.error('Erreur lors de la récupération des fails par catégorie:', error);
        return of([]);
      })
    );
  }

  private formatFail(failData: any): Fail {
    // Déterminer le nom de l'auteur selon si c'est public ou anonyme
    let authorName = 'Utilisateur courageux'; // PAR DÉFAUT: PUBLIC
    if (!failData.is_public) {
      // Seulement si explicitement marqué comme non-public, alors anonyme
      authorName = 'Utilisateur anonyme';
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

    return this.supabaseService.addReaction(failId, reactionType);
  }

  async removeReaction(failId: string, reactionType: 'courage' | 'empathy' | 'laugh' | 'support'): Promise<void> {
    const user = await this.supabaseService.getCurrentUser();
    if (!user) {
      throw new Error('Utilisateur non connecté');
    }

    return this.supabaseService.removeReaction(failId, reactionType);
  }

  // Méthodes de compatibilité pour les pages existantes
  getFails(): Observable<Fail[]> {
    return this.getAllFails();
  }

  async refreshFails(): Promise<void> {
    // Cette méthode n'est plus nécessaire avec les Observables
    // mais on la garde pour la compatibilité
    return Promise.resolve();
  }
}
