import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { environment } from '../../environments/environment';
import { Fail } from '../models/fail.model';
import { FailCategory } from '../models/enums';

export interface CreateFailData {
  title: string;
  description: string;
  category: FailCategory;
  image?: File;
  is_public: boolean;
}

export interface FailsResponse {
  success: boolean;
  fails: Fail[];
  total: number;
  page: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class HttpFailService {
  private apiUrl = environment.api.baseUrl || 'http://localhost:3000/api';
  private failsSubject = new BehaviorSubject<Fail[]>([]);
  public fails$ = this.failsSubject.asObservable();

  constructor(private http: HttpClient) {
    console.log('📝 HttpFailService: Initialisation du service fails HTTP');
    this.loadFails();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('faildaily_token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    });
  }

  private getMultipartHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token') || localStorage.getItem('faildaily_token') || '';
    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
      // Pas de Content-Type pour multipart, le navigateur le gère automatiquement
    });
  }

  async createFail(failData: CreateFailData): Promise<Fail> {
    try {
      console.log('📝 Création d\'un nouveau fail:', failData.title);

      let imageUrl = null;
      
      // Upload de l'image si présente
      if (failData.image) {
        try {
          imageUrl = await this.uploadImage(failData.image);
          console.log('📷 Image uploadée:', imageUrl);
        } catch (error) {
          console.warn('⚠️ Erreur upload image, création du fail sans image:', error);
        }
      }

      // Créer le fail
      const failToCreate = {
        title: failData.title.trim(),
        description: failData.description.trim(),
        category: failData.category,
        image_url: imageUrl,
        is_public: failData.is_public
      };

      const response: any = await this.http.post(`${this.apiUrl}/fails`, failToCreate, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.fail) {
        console.log('✅ Fail créé avec succès:', response.fail.id);
        
        // Recharger les fails
        await this.loadFails();
        
        return response.fail;
      } else {
        throw new Error(response.message || 'Erreur lors de la création du fail');
      }
    } catch (error: any) {
      console.error('❌ Erreur création fail:', error);
      throw new Error(error.error?.message || error.message || 'Erreur lors de la création du fail');
    }
  }

  async uploadImage(file: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response: any = await this.http.post(`${this.apiUrl}/upload/image`, formData, {
        headers: this.getMultipartHeaders()
      }).toPromise();

      if (response.success && response.url) {
        return response.url;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'upload de l\'image');
      }
    } catch (error: any) {
      console.error('❌ Erreur upload image:', error);
      throw new Error(error.error?.message || error.message || 'Erreur lors de l\'upload de l\'image');
    }
  }

  async loadFails(page: number = 1, limit: number = 20): Promise<Fail[]> {
    try {
      console.log(`📋 Chargement des fails (page ${page})`);

      const response: any = await this.http.get(`${this.apiUrl}/fails?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.fails) {
        const fails = response.fails.map((f: any) => ({ ...f, is_public: !!f.is_public }));

        // Mettre à jour le BehaviorSubject
        this.failsSubject.next(fails);
        
        console.log(`✅ ${fails.length} fails chargés`);
        return fails;
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des fails');
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement fails:', error);
      this.failsSubject.next([]);
      return [];
    }
  }

  async getFailById(failId: string): Promise<Fail | null> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.fail) {
        return response.fail;
      } else {
        throw new Error(response.message || 'Fail non trouvé');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération fail:', error);
      return null;
    }
  }

  async updateFail(failId: string, updateData: Partial<CreateFailData>): Promise<Fail | null> {
    try {
      console.log('✏️ Mise à jour du fail:', failId);

      let imageUrl = undefined;
      
      // Upload de la nouvelle image si présente
      if (updateData.image) {
        try {
          imageUrl = await this.uploadImage(updateData.image);
        } catch (error) {
          console.warn('⚠️ Erreur upload nouvelle image:', error);
        }
      }

      const failToUpdate: any = {};
      if (updateData.title) failToUpdate.title = updateData.title.trim();
      if (updateData.description) failToUpdate.description = updateData.description.trim();
      if (updateData.category) failToUpdate.category = updateData.category;
      if (imageUrl) failToUpdate.image_url = imageUrl;
      if (updateData.is_public !== undefined) failToUpdate.is_public = updateData.is_public;

      const response: any = await this.http.put(`${this.apiUrl}/fails/${failId}`, failToUpdate, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.fail) {
        console.log('✅ Fail mis à jour avec succès');
        
        // Recharger les fails
        await this.loadFails();
        
        return response.fail;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour du fail');
      }
    } catch (error: any) {
      console.error('❌ Erreur mise à jour fail:', error);
      throw new Error(error.error?.message || error.message || 'Erreur lors de la mise à jour du fail');
    }
  }

  async deleteFail(failId: string): Promise<boolean> {
    try {
      console.log('🗑️ Suppression du fail:', failId);

      const response: any = await this.http.delete(`${this.apiUrl}/fails/${failId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log('✅ Fail supprimé avec succès');
        
        // Recharger les fails
        await this.loadFails();
        
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression du fail');
      }
    } catch (error: any) {
      console.error('❌ Erreur suppression fail:', error);
      throw new Error(error.error?.message || error.message || 'Erreur lors de la suppression du fail');
    }
  }

  async getFailsByUser(userId: string, page: number = 1, limit: number = 20): Promise<Fail[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails?page=${page}&limit=${limit}&userId=${userId}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.fails) {
        return response.fails.map((f: any) => ({ ...f, is_public: !!f.is_public }));
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des fails utilisateur');
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement fails utilisateur:', error);
      return [];
    }
  }

  async getPublicFails(page: number = 1, limit: number = 20): Promise<Fail[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails/public?page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      const fails: Fail[] = Array.isArray(response)
        ? response.map((f: any) => ({ ...f, is_public: !!f.is_public }))
        : [];

      return fails;
    } catch (error: any) {
      console.error('❌ Erreur chargement fails publics:', error);
      return [];
    }
  }

  async getFailsByCategory(category: FailCategory, page: number = 1, limit: number = 20): Promise<Fail[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails?page=${page}&limit=${limit}&category=${encodeURIComponent(String(category))}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.fails) {
        return response.fails.map((f: any) => ({ ...f, is_public: !!f.is_public }));
      } else {
        throw new Error(response.message || 'Erreur lors du chargement des fails par catégorie');
      }
    } catch (error: any) {
      console.error('❌ Erreur chargement fails par catégorie:', error);
      return [];
    }
  }

  async searchFails(query: string, page: number = 1, limit: number = 20): Promise<Fail[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails/search?q=${encodeURIComponent(query)}&page=${page}&limit=${limit}`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success && response.fails) {
        return response.fails.map((f: any) => ({ ...f, is_public: !!f.is_public }));
      } else {
        throw new Error(response.message || 'Erreur lors de la recherche de fails');
      }
    } catch (error: any) {
      console.error('❌ Erreur recherche fails:', error);
      return [];
    }
  }

  async addCourageHeart(failId: string): Promise<boolean> {
    try {
      console.log('❤️ Ajout d\'un cœur de courage:', failId);

      const response: any = await this.http.post(`${this.apiUrl}/fails/${failId}/reactions`, {
        reactionType: 'courage'
      }, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log('✅ Cœur de courage ajouté');
        
        // Recharger les fails pour mettre à jour les compteurs
        await this.loadFails();
        
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de l\'ajout du cœur de courage');
      }
    } catch (error: any) {
      console.error('❌ Erreur ajout cœur de courage:', error);
      throw new Error(error.error?.message || error.message || 'Erreur lors de l\'ajout du cœur de courage');
    }
  }

  async removeCourageHeart(failId: string): Promise<boolean> {
    try {
      console.log('💔 Suppression d\'un cœur de courage:', failId);

      const response: any = await this.http.delete(`${this.apiUrl}/fails/${failId}/reactions`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log('✅ Cœur de courage supprimé');
        
        // Recharger les fails pour mettre à jour les compteurs
        await this.loadFails();
        
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression du cœur de courage');
      }
    } catch (error: any) {
      console.error('❌ Erreur suppression cœur de courage:', error);
      throw new Error(error.error?.message || error.message || 'Erreur lors de la suppression du cœur de courage');
    }
  }

  async getFailReactions(failId: string): Promise<any[]> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails/${failId}/reactions`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response?.success && response?.data?.reactions) {
        return response.data.reactions;
      }
      if (Array.isArray(response?.reactions)) {
        return response.reactions;
      }
      return [];
    } catch (error: any) {
      console.error('❌ Erreur récupération réactions:', error);
      return [];
    }
  }

  async reportFail(failId: string, reason: string, details?: string): Promise<boolean> {
    try {
      console.log('🚨 Signalement d\'un fail:', failId);

      const response: any = await this.http.post(`${this.apiUrl}/fails/${failId}/report`, {
        reason,
        details
      }, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        console.log('✅ Fail signalé avec succès');
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors du signalement du fail');
      }
    } catch (error: any) {
      console.error('❌ Erreur signalement fail:', error);
      throw new Error(error.error?.message || error.message || 'Erreur lors du signalement du fail');
    }
  }

  async getFailStats(): Promise<any> {
    try {
      const response: any = await this.http.get(`${this.apiUrl}/fails/stats`, {
        headers: this.getAuthHeaders()
      }).toPromise();

      if (response.success) {
        return response.stats;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des statistiques');
      }
    } catch (error: any) {
      console.error('❌ Erreur récupération stats fails:', error);
      return null;
    }
  }

  // Méthodes de compatibilité avec l'ancien service
  getCurrentUserFails(): Observable<Fail[]> {
    return this.fails$;
  }

  getFails(): Observable<Fail[]> {
    return this.fails$;
  }

  async refreshFails(): Promise<void> {
    await this.loadFails();
  }

  // Méthodes utilitaires
  getFailsByCurrentUser(): Promise<Fail[]> {
    const currentUser = this.getCurrentUser();
    if (currentUser) {
      return this.getFailsByUser(currentUser.id);
    }
    return Promise.resolve([]);
  }

  private getCurrentUser(): any {
    const userData = localStorage.getItem('current_user');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch (error) {
        return null;
      }
    }
    return null;
  }
}
