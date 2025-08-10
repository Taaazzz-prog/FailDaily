export interface NotificationPreferences {
  encouragement: boolean;
  reminderFrequency: 'daily' | 'weekly' | 'monthly' | 'never';
}

export interface UserPreferences {
  notificationsEnabled: boolean;
  reminderTime: string; // Format "HH:mm"
  anonymousMode: boolean;
  shareLocation: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  darkMode: boolean;
  theme: 'light' | 'dark' | 'auto';
  bio?: string;
  notifications?: NotificationPreferences;
}

