import { addIcons } from 'ionicons';
import {
    // Icônes utilisées dans l'application
    calendarOutline,
    createOutline,
    shareOutline,
    settingsOutline,
    chevronForwardOutline,
    shieldCheckmarkOutline,
    lockClosedOutline,
    documentTextOutline,
    logOutOutline,
    trophyOutline,
    flameOutline,
    analyticsOutline,
    arrowForwardOutline,
    cameraOutline,
    chevronDownCircleOutline,
    checkmarkCircleOutline,
    alertCircleOutline,
    homeOutline,
    addOutline,
    personOutline,
    heartOutline,
    chatbubbleOutline,
    bookmarkOutline,
    thumbsUpOutline,
    sparklesOutline,
    happyOutline,
    starOutline,
    ribbonOutline,
    addCircleOutline,
    peopleOutline,
    // Icônes pour l'onglet navigation
    addCircle,
    add,
    person,
    people,
    heart,
    happy,
    camera,
    // Icônes spécifiques manquantes pour l'admin panel
    refreshOutline,
    statsChartOutline,
    bugOutline,
    eyeOutline,
    trashOutline,
    informationCircleOutline,
    // Icônes manquantes identifiées dans les logs
    warningOutline,
    chatbubblesOutline,
    medalOutline,
    constructOutline,
    terminalOutline,
    listOutline,
    pulseOutline,
    cogOutline,
    radioOutline,
    layersOutline,
    folderOutline,
    archiveOutline,
    shieldOutline,
    keyOutline,
    timeOutline,
    refreshCircleOutline,
    nuclearOutline,
    skullOutline,
    trashBinOutline,

    // Icônes spécifiques manquantes
    calendar,
    create,
    chevronForward,
    shieldCheckmark,
    lockClosed,
    documentText,
    logOut,
    trophy,
    flame,
    analytics,
    arrowForward
} from 'ionicons/icons';

/**
 * Initialise toutes les icônes utilisées dans l'application
 * Cette fonction doit être appelée une seule fois au démarrage de l'application
 */
export function initializeIcons() {
    addIcons({
        // Navigation et actions de base
        'calendar-outline': calendarOutline,
        'create-outline': createOutline,
        'share-outline': shareOutline,
        'settings-outline': settingsOutline,
        'chevron-forward-outline': chevronForwardOutline,
        'arrow-forward-outline': arrowForwardOutline,
        'home-outline': homeOutline,
        'add-outline': addOutline,
        'person-outline': personOutline,
        'people-outline': peopleOutline,
        'ribbon-outline': ribbonOutline,
        'add-circle-outline': addCircleOutline,

        // Sécurité et authentification
        'shield-checkmark-outline': shieldCheckmarkOutline,
        'lock-closed-outline': lockClosedOutline,
        'log-out-outline': logOutOutline,

        // Documents et contenu
        'document-text-outline': documentTextOutline,
        'camera-outline': cameraOutline,

        // Statistiques et achievements
        'trophy-outline': trophyOutline,
        'flame-outline': flameOutline,
        'analytics-outline': analyticsOutline,
        'star-outline': starOutline,

        // Interface utilisateur
        'chevron-down-circle-outline': chevronDownCircleOutline,
        'checkmark-circle-outline': checkmarkCircleOutline,
        'alert-circle-outline': alertCircleOutline,

        // Admin Panel - Icônes manquantes
        'refresh-outline': refreshOutline,
        'stats-chart-outline': statsChartOutline,
        'bug-outline': bugOutline,
        'eye-outline': eyeOutline,
        'trash-outline': trashOutline,
        'information-circle-outline': informationCircleOutline,

        // Icônes manquantes identifiées dans les logs
        'warning-outline': warningOutline,
        'chatbubbles-outline': chatbubblesOutline,
        'medal-outline': medalOutline,
        'construct-outline': constructOutline,
        'terminal-outline': terminalOutline,
        'list-outline': listOutline,
        'pulse-outline': pulseOutline,
        'cog-outline': cogOutline,
        'radio-outline': radioOutline,
        'layers-outline': layersOutline,
        'folder-outline': folderOutline,
        'archive-outline': archiveOutline,
        'shield-outline': shieldOutline,
        'key-outline': keyOutline,
        'time-outline': timeOutline,
        'refresh-circle-outline': refreshCircleOutline,
        'nuclear-outline': nuclearOutline,
        'skull-outline': skullOutline,
        'trash-bin-outline': trashBinOutline,

        // Réactions et social
        'heart-outline': heartOutline,
        'chatbubble-outline': chatbubbleOutline,
        'bookmark-outline': bookmarkOutline,
        'thumbs-up-outline': thumbsUpOutline,
        'sparkles-outline': sparklesOutline,
        'happy-outline': happyOutline,

        // Versions sans outline pour compatibilité (celles qui causent les warnings)
        'calendar': calendar,
        'create': create,
        'share': shareOutline, // pas de version filled pour share
        'settings': settingsOutline, // pas de version filled pour settings
        'chevron-forward': chevronForward,
        'arrow-forward': arrowForward,
        'shield-checkmark': shieldCheckmark,
        'lock-closed': lockClosed,
        'document-text': documentText,
        'log-out': logOut,
        'trophy': trophy,
        'flame': flame,
        'analytics': analytics,
        'camera': camera,
        'heart': heart,
        'chatbubble': chatbubbleOutline, // pas de version filled
        'bookmark': bookmarkOutline, // pas de version filled
        'thumbs-up': thumbsUpOutline, // pas de version filled
        'sparkles': sparklesOutline, // pas de version filled
        'happy': happy,
        'star': starOutline, // pas de version filled
        'home': homeOutline, // pas de version filled
        'add': add,
        'add-circle': addCircle,
        'person': person,
        'people': people
    });

    console.log('✅ Toutes les icônes Ionicons ont été initialisées');
}

/**
 * Liste des icônes valides pour validation
 */
export const VALID_ICONS = [
    'calendar-outline', 'calendar',
    'create-outline', 'create',
    'share-outline', 'share',
    'settings-outline', 'settings',
    'chevron-forward-outline', 'chevron-forward',
    'arrow-forward-outline', 'arrow-forward',
    'shield-checkmark-outline', 'shield-checkmark',
    'lock-closed-outline', 'lock-closed',
    'document-text-outline', 'document-text',
    'log-out-outline', 'log-out',
    'trophy-outline', 'trophy',
    'flame-outline', 'flame',
    'analytics-outline', 'analytics',
    'camera-outline', 'camera',
    'heart-outline', 'heart',
    'chatbubble-outline', 'chatbubble',
    'bookmark-outline', 'bookmark',
    'thumbs-up-outline', 'thumbs-up',
    'sparkles-outline', 'sparkles',
    'happy-outline', 'happy',
    'star-outline', 'star',
    'home-outline', 'home',
    'add-outline', 'add',
    'person-outline', 'person',
    'people-outline', 'people',
    'chevron-down-circle-outline',
    'checkmark-circle-outline',
    'alert-circle-outline',
    // Admin Panel icons
    'refresh-outline',
    'stats-chart-outline',
    'bug-outline',
    'eye-outline',
    'trash-outline',
    'information-circle-outline'
] as const;

export type ValidIconName = typeof VALID_ICONS[number];
