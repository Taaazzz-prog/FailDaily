import { addIcons } from 'ionicons';
import * as allIcons from 'ionicons/icons';

/**
 * Initialise TOUTES les icônes Ionicons disponibles
 * Cette approche évite les erreurs d'icônes manquantes mais augmente légèrement la taille du bundle
 */
export function initializeIcons() {
    // Enregistre automatiquement toutes les icônes disponibles
    addIcons(allIcons);
    
    console.log('✅ Toutes les icônes Ionicons ont été initialisées automatiquement');
    console.log(`📊 ${Object.keys(allIcons).length} icônes disponibles`);
}

/**
 * Fonction utilitaire pour vérifier si une icône existe
 */
export function isValidIcon(iconName: string): boolean {
    return iconName in allIcons;
}

/**
 * Fonction utilitaire pour lister toutes les icônes disponibles (debug)
 */
export function getAllAvailableIcons(): string[] {
    return Object.keys(allIcons);
}
