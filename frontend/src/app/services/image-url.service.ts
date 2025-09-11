import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ImageUrlService {

  /**
   * Convertit un chemin d'image relatif en URL complète vers le backend
   * @param imagePath Chemin relatif (ex: 'uploads/avatars/avatar-123.png' ou '/uploads/avatars/avatar-123.png')
   * @returns URL complète (ex: 'http://localhost:3000/uploads/avatars/avatar-123.png')
   */
  getFullImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return '/assets/profil/base.png'; // Avatar par défaut
    }

    // Si c'est déjà une URL complète, on la retourne telle quelle
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('/assets/')) {
      return imagePath;
    }

    // Si c'est un chemin relatif, on ajoute l'URL du backend
    const backendUrl = environment.api.baseUrl.replace('/api', ''); // Remove /api from baseUrl
    
    // Éviter les doubles slashes - si imagePath commence par /, ne pas ajouter de /
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    
    return `${backendUrl}${cleanPath}`;
  }

  /**
   * Même chose spécifiquement pour les avatars avec fallback
   */
  getAvatarUrl(avatarPath: string | null | undefined): string {
    if (!avatarPath) {
      return '/assets/profil/base.png';
    }
    return this.getFullImageUrl(avatarPath);
  }

  /**
   * Même chose spécifiquement pour les images de fails
   */
  getFailImageUrl(imagePath: string | null | undefined): string {
    if (!imagePath) {
      return '';
    }
    return this.getFullImageUrl(imagePath);
  }
}
