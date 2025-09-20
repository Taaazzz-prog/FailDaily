/**
 * Service de remplacement global des console.* pour la production
 * Remplace automatiquement tous les console.log par des fonctions vides
 */
import { environment } from '../../environments/environment';

/**
 * Désactive complètement tous les logs console en production
 */
export function disableConsoleInProduction(): void {
  if (environment.production) {
    // ✅ Remplace tous les console.* par des fonctions vides
    const noop = () => {};
    
    console.log = noop;
    console.warn = noop;
    console.error = noop;
    console.info = noop;
    console.debug = noop;
    console.trace = noop;
    console.group = noop;
    console.groupEnd = noop;
    console.table = noop;
    console.time = noop;
    console.timeEnd = noop;
    console.count = noop;
    console.clear = noop;
    
    // Garde seulement console.assert pour les erreurs critiques
    // console.assert reste actif
  }
}

/**
 * Active la désactivation des logs dès l'import du module
 */
disableConsoleInProduction();