/**
 * Fixes spécifiques pour les plateformes mobiles (iOS/Android)
 * Ces utilitaires résolvent les problèmes de compatibilité avec Capacitor
 */

import { Capacitor } from '@capacitor/core';

/**
 * Détecte si l'application fonctionne sur une plateforme mobile native
 */
export function isMobilePlatform(): boolean {
    return Capacitor.isNativePlatform();
}

/**
 * Détecte si l'application fonctionne sur iOS
 */
export function isIOSPlatform(): boolean {
    return Capacitor.getPlatform() === 'ios';
}

/**
 * Détecte si l'application fonctionne sur Android
 */
export function isAndroidPlatform(): boolean {
    return Capacitor.getPlatform() === 'android';
}

/**
 * Délai de sécurité pour éviter les problèmes de concurrence
 * sur mobile lors des opérations d'authentification
 */
export function mobileDelay(ms: number = 100): Promise<void> {
    return new Promise(resolve => {
        if (isMobilePlatform()) {
            setTimeout(resolve, ms);
        } else {
            resolve();
        }
    });
}

/**
 * Retry logic pour les opérations qui peuvent échouer sur mobile
 */
export async function retryOnMobile<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 500
): Promise<T> {
    let lastError: any;

    for (let i = 0; i < maxRetries; i++) {
        try {
            if (i > 0) {
                await mobileDelay(delayMs * i);
            }
            return await operation();
        } catch (error) {
            lastError = error;

            // Si c'est un NavigatorLockAcquireTimeoutError, on peut retenter
            if ((error as any)?.name === 'NavigatorLockAcquireTimeoutError' && i < maxRetries - 1) {
                console.warn(`Tentative ${i + 1}/${maxRetries} échouée, nouvelle tentative...`, error);
                continue;
            }

            // Pour d'autres erreurs, on abandonne
            if (!(error as any)?.name?.includes('NavigatorLock')) {
                throw error;
            }
        }
    }

    throw lastError;
}

/**
 * Wrapper pour les opérations Supabase auth sur mobile ET web
 * Gère maintenant les NavigatorLockAcquireTimeoutError sur toutes les plateformes
 */
export async function safeAuthOperation<T>(operation: () => Promise<T>): Promise<T> {
    // ✅ CORRECTION : Gérer les NavigatorLock sur toutes les plateformes, pas seulement mobile
    return retryOnMobile(operation, 3, 100); // Délai plus court sur web
}
