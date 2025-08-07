import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Badge } from '../models/badge.model';

@Injectable({ providedIn: 'root' })
export class BadgeService {
  private badges: Badge[] = [];

  getBadges(): Observable<Badge[]> {
    return of(this.badges);
  }

  addBadge(badge: Badge): void {
    this.badges.push(badge);
  }
}

