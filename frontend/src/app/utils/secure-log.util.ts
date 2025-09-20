/**
 * Utilitaire de logging sécurisé pour le frontend FailDaily
 * Remplace console.log en masquant les données sensibles en production
 */
import { environment } from '../../environments/environment';

/**
 * Masque les tokens et données sensibles
 */
function maskSensitiveData(data: any): any {
  if (!data) return data;
  
  if (typeof data === 'string') {
    // Masquer les tokens longs
    if (data.length > 20 && (data.includes('Bearer') || data.includes('eyJ'))) {
      return '[TOKEN_MASQUÉ]';
    }
    return data;
  }
  
  if (typeof data === 'object') {
    const masked = { ...data };
    const sensitiveKeys = ['token', 'password', 'auth', 'authorization', 'jwt'];
    
    for (const key in masked) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        masked[key] = '[MASQUÉ]';
      }
    }
    return masked;
  }
  
  return data;
}

/**
 * Console.log sécurisé qui masque automatiquement les données sensibles
 */
export function secureLog(message: string, data?: any): void {
  if (environment.enableDebugLogs) {
    // En développement : logs complets
    console.log(message, data);
  } else {
    // En production : logs masqués ou réduits
    if (data) {
      console.log(message, maskSensitiveData(data));
    } else {
      console.log(message);
    }
  }
}

/**
 * Console.log pour tokens - toujours masqué en production
 */
export function secureLogToken(message: string, token: string): void {
  if (environment.enableDebugLogs) {
    console.log(`🔐 ${message}:`, token);
  } else {
    console.log(`🔐 ${message}: [TOKEN_MASQUÉ]`);
  }
}

/**
 * Console.log pour localStorage - masque les valeurs sensibles
 */
export function secureLogStorage(description: string, storageData: { [key: string]: any }): void {
  if (environment.enableDebugLogs) {
    console.log(`📦 ${description}:`, storageData);
  } else {
    console.log(`📦 ${description}:`, maskSensitiveData(storageData));
  }
}

/**
 * Console.log de debug - uniquement en développement
 */
export function secureDebug(message: string, data?: any): void {
  if (environment.enableDebugLogs) {
    console.log(`🔍 DEBUG: ${message}`, data);
  }
  // Pas de logs de debug en production
}

/**
 * Console.error sécurisé
 */
export function secureError(message: string, error?: any): void {
  if (environment.enableDebugLogs) {
    console.error(message, error);
  } else {
    // En production, masquer les détails techniques
    console.error(message, error?.message || 'Erreur inconnue');
  }
}