export interface UserPrivacySettings {
    // Visibilité du profil
    publicProfile: boolean;
    showStats: boolean;
    showBadges: boolean;

    // Contenu et interactions
    anonymousFails: boolean;
    allowReactions: boolean;
    allowPrivateMessages: boolean;

    // Notifications
    pushNotifications: boolean;
    emailNotifications: boolean;
    dailyReminders: boolean;

    // Métadonnées
    userId: string;
    lastUpdated: Date;
}

export const DEFAULT_PRIVACY_SETTINGS: Omit<UserPrivacySettings, 'userId' | 'lastUpdated'> = {
    // Paramètres par défaut orientés vers la confidentialité
    publicProfile: false,
    showStats: false,
    showBadges: true, // Les badges encouragent la participation

    anonymousFails: true, // Recommandé pour débuter
    allowReactions: true,
    allowPrivateMessages: false, // Sécurité avant tout

    pushNotifications: true,
    emailNotifications: false,
    dailyReminders: true
};
