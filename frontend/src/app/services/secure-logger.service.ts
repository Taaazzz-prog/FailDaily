/**
 * Service de logging sécurisé pour FailDaily
 * Masque automatiquement les données sensibles en production
 */
import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SecureLoggerService {
  
  private readonly isDevelopment = !environment.production;
  
  // Mots-clés sensibles à masquer
  private readonly sensitiveKeys = [
    'token', 'password', 'secret', 'key', 'auth', 
    'authorization', 'jwt', 'session', 'cookie'
  ];

  /**
   * Masque les données sensibles dans un objet
   */
  private maskSensitiveData(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }
    
    const masked = { ...data };
    for (const key in masked) {
      const lowerKey = key.toLowerCase();
      if (this.sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        masked[key] = '[MASQUÉ]';
      } else if (typeof masked[key] === 'object') {
        masked[key] = this.maskSensitiveData(masked[key]);
      }
    }
    return masked;
  }

  /**
   * Log sécurisé - masque automatiquement les données sensibles
   */
  log(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(message, data);
    } else {
      console.log(message, data ? this.maskSensitiveData(data) : undefined);
    }
  }

  /**
   * Log d'erreur sécurisé
   */
  error(message: string, error?: any): void {
    if (this.isDevelopment) {
      console.error(message, error);
    } else {
      // En production, on masque les détails techniques sensibles
      const safeError = error?.message || 'Erreur inconnue';
      console.error(message, safeError);
    }
  }

  /**
   * Log d'avertissement sécurisé
   */
  warn(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.warn(message, data);
    } else {
      console.warn(message, data ? this.maskSensitiveData(data) : undefined);
    }
  }

  /**
   * Log de debug - uniquement en développement
   */
  debug(message: string, data?: any): void {
    if (this.isDevelopment) {
      console.log(`🔍 DEBUG: ${message}`, data);
    }
    // Pas de logs de debug en production
  }

  /**
   * Log spécial pour les tokens - toujours masqué en production
   */
  logToken(message: string, token: string): void {
    if (this.isDevelopment) {
      console.log(`🔐 ${message}:`, token);
    } else {
      console.log(`🔐 ${message}: [TOKEN MASQUÉ]`);
    }
  }

  /**
   * Log pour localStorage - masque les valeurs sensibles
   */
  logStorage(description: string, storageData: { [key: string]: any }): void {
    if (this.isDevelopment) {
      console.log(`📦 ${description}:`, storageData);
    } else {
      const maskedStorage = this.maskSensitiveData(storageData);
      console.log(`📦 ${description}:`, maskedStorage);
    }
  }
}