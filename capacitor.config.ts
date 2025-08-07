import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.faildaily.app',
  appName: 'FailDaily',
  webDir: 'dist/fail-daily',
  bundledWebRuntime: false,

  plugins: {
    // Configuration des notifications push
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    },

    // Configuration des notifications locales
    LocalNotifications: {
      smallIcon: 'ic_stat_heart_courage',
      iconColor: '#FF6B9D',
      sound: 'encouragement.wav'
    },

    // Configuration de l'appareil photo
    Camera: {
      iosImageWillSave: false,
      iosImageSaveToGallery: true,
      androidImageSaveToGallery: true
    },

    // Configuration du stockage des préférences
    Preferences: {
      group: 'FailDailyPrefs'
    },

    // Configuration des vibrations encourageantes
    Haptics: {
      selectionStart: true,
      selectionChanged: true,
      selectionEnd: true
    }
  },

  // Configuration iOS spécifique
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#FFF8F5' // Couleur de fond douce
  },

  // Configuration Android spécifique
  android: {
    backgroundColor: '#FFF8F5',
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false // true en dev, false en prod
  },

  // Configuration serveur pour développement
  server: {
    androidScheme: 'https',
    iosScheme: 'https'
  }
};

export default config;
