import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PushService {
  // Simule l'envoi d'une notification push
  sendPushNotification(title: string, message: string): Observable<boolean> {
    // À remplacer par l'intégration Capacitor/Firebase
    return of(true);
  }
}

