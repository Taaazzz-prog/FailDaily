import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  // Simule l'envoi d'un événement analytique
  logEvent(event: string, data?: any): Observable<boolean> {
    // À remplacer par une vraie intégration analytics (Firebase, etc.)
    return of(true);
  }
}

