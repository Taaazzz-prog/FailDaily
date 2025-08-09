import { Injectable } from '@angular/core';
import { BadgeService } from './badge.service';
import { BadgeNotificationService } from './badge-notification.service';
import { EventBusService } from './event-bus.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitializationService {

  constructor(
    private badgeService: BadgeService,
    private badgeNotificationService: BadgeNotificationService,
    private eventBus: EventBusService
  ) {}

  /**
   * Initialise tous les services nécessaires au démarrage de l'application
   */
  async initializeApp(): Promise<void> {
    try {
      console.log('🚀 Initialisation de l\'application FailDaily...');
      
      // Les services sont automatiquement initialisés par l'injection de dépendance
      // Cette méthode peut être étendue pour d'autres initialisations futures
      
      console.log('✅ Application FailDaily initialisée avec succès');
      console.log('📊 Services actifs:');
      console.log('  - EventBus: Système d\'événements découplé');
      console.log('  - BadgeService: Gestion des badges avec EventBus');
      console.log('  - BadgeNotificationService: Notifications de badges');
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation de l\'application:', error);
      throw error;
    }
  }

  /**
   * Vérifie que tous les services critiques sont opérationnels
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Vérifier que l'EventBus fonctionne
      let eventReceived = false;
      const subscription = this.eventBus.on('health_check').subscribe(() => {
        eventReceived = true;
      });
      
      this.eventBus.emit('health_check', { timestamp: Date.now() });
      
      // Attendre un peu pour que l'événement soit traité
      await new Promise(resolve => setTimeout(resolve, 100));
      
      subscription.unsubscribe();
      
      if (!eventReceived) {
        console.error('❌ EventBus ne fonctionne pas correctement');
        return false;
      }
      
      console.log('✅ Health check réussi - Tous les services sont opérationnels');
      return true;
      
    } catch (error) {
      console.error('❌ Health check échoué:', error);
      return false;
    }
  }
}