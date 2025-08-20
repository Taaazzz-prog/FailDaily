import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModerationService {
  // Simule la modération automatique d'un texte
  moderateText(text: string): Observable<{ allowed: boolean; reason?: string }> {
    // À remplacer par un appel à une API d'IA/modération
    if (text.includes('banni')) {
      return of({ allowed: false, reason: 'Contenu inapproprié détecté.' });
    }
    return of({ allowed: true });
  }
}

