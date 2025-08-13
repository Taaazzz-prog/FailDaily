/**
 * Configuration des logs pour l'application FailDaily
 * Permet de contrôler facilement le niveau de verbosité des logs
 */

export interface LogConfig {
    auth: boolean;
    supabase: boolean;
    fails: boolean;
    badges: boolean;
    profile: boolean;
    navigation: boolean;
}

/**
 * Configuration actuelle des logs
 * Mettez à false les catégories dont vous ne voulez pas voir les logs
 */
export const LOG_CONFIG: LogConfig = {
    auth: false,        // 🔐 Logs d'authentification
    supabase: true,     // 🔐 Logs Supabase - Activé temporairement
    fails: true,        // 💣 Logs du service Fail - Activé temporairement
    badges: false,      // 🏆 Logs du service Badge  
    profile: false,     // 👤 Logs de profil
    navigation: false   // 🛡️ Logs de navigation/guards
};

/**
 * Logger conditionnel pour l'authentification
 */
export const authLog = (message: string, ...args: any[]) => {
    if (LOG_CONFIG.auth) {
        console.log(`🔐 ${message}`, ...args);
    }
};

/**
 * Logger conditionnel pour Supabase
 */
export const supabaseLog = (message: string, ...args: any[]) => {
    if (LOG_CONFIG.supabase) {
        console.log(`🔐 ${message}`, ...args);
    }
};

/**
 * Logger conditionnel pour les fails
 */
export const failLog = (message: string, ...args: any[]) => {
    if (LOG_CONFIG.fails) {
        console.log(`💣 ${message}`, ...args);
    }
};

/**
 * Logger conditionnel pour les badges
 */
export const badgeLog = (message: string, ...args: any[]) => {
    if (LOG_CONFIG.badges) {
        console.log(`🏆 ${message}`, ...args);
    }
};

/**
 * Logger conditionnel pour le profil
 */
export const profileLog = (message: string, ...args: any[]) => {
    if (LOG_CONFIG.profile) {
        console.log(`👤 ${message}`, ...args);
    }
};

/**
 * Logger conditionnel pour la navigation
 */
export const navigationLog = (message: string, ...args: any[]) => {
    if (LOG_CONFIG.navigation) {
        console.log(`🛡️ ${message}`, ...args);
    }
};

/**
 * Active tous les logs (pour debugging intensif)
 */
export const enableAllLogs = () => {
    Object.keys(LOG_CONFIG).forEach(key => {
        (LOG_CONFIG as any)[key] = true;
    });
    console.log('🔍 Tous les logs ont été activés');
};

/**
 * Désactive tous les logs (pour une console propre)
 */
export const disableAllLogs = () => {
    Object.keys(LOG_CONFIG).forEach(key => {
        (LOG_CONFIG as any)[key] = false;
    });
    console.log('🔇 Tous les logs ont été désactivés');
};
