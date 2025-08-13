import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

export interface AppEvent {
  type: string;
  payload?: any;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService {
  private eventSubject = new Subject<AppEvent>();

  constructor() { }

  /**
   * Émet un événement dans le bus
   */
  emit(type: string, payload?: any): void {
    this.eventSubject.next({ type, payload });
  }

  /**
   * Écoute un type d'événement spécifique
   */
  on(eventType: string): Observable<any> {
    return this.eventSubject.asObservable().pipe(
      filter(event => event.type === eventType),
      map(event => event.payload)
    );
  }

  /**
   * Écoute tous les événements
   */
  onAll(): Observable<AppEvent> {
    return this.eventSubject.asObservable();
  }
}

// Types d'événements pour l'application
export const AppEvents = {
  FAIL_POSTED: 'fail_posted',
  REACTION_GIVEN: 'reaction_given',
  BADGE_UNLOCKED: 'badge_unlocked',
  USER_STATS_UPDATED: 'user_stats_updated',
  USER_PROFILE_UPDATED: 'user_profile_updated'
} as const;