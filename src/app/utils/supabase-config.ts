// Configuration avancée pour Supabase pour éviter les timeouts et locks
export const SUPABASE_CONFIG = {
    global: {
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    },
    auth: {
        persistSession: true,
        detectSessionInUrl: false,
        autoRefreshToken: true,
        storage: window.localStorage,
        storageKey: 'faildaily-supabase-auth'
    }
};

// Fonction utilitaire pour gérer les timeouts Supabase
export const withTimeout = async <T>(
    promise: Promise<T>,
    timeoutMs: number = 10000,
    timeoutMessage: string = 'Opération interrompue par timeout'
): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs)
        )
    ]);
};

// Configuration de retry avec backoff exponentiel
export const retryWithBackoff = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelayMs: number = 1000
): Promise<T> => {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error: any) {
            if (i === maxRetries - 1) throw error;

            // Si c'est une erreur récupérable (406, timeout, lock)
            if (
                error.code === 406 ||
                error.message?.includes('timeout') ||
                error.message?.includes('lock') ||
                error.message?.includes('NavigatorLockAcquireTimeoutError')
            ) {
                const delay = baseDelayMs * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }

            // Pour les autres erreurs, on ne retry pas
            throw error;
        }
    }
    throw new Error('Maximum retry attempts reached');
};
