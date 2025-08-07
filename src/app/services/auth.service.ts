import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { User } from '../models/user.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  async loadUserFromStorage() {
    const { value } = await Preferences.get({ key: 'currentUser' });
    if (value) {
      const user = JSON.parse(value);
      this.currentUserSubject.next(user);
    }
  }

  login(email: string, password: string): Observable<User> {
    // Simulation - à remplacer par Firebase/API
    const user: User = {
      id: Date.now().toString(),
      email,
      displayName: email.split('@')[0],
      avatar: 'assets/images/default-avatar.png',
      joinDate: new Date(),
      totalFails: 0,
      couragePoints: 0,
      badges: []
    };

    this.setCurrentUser(user);
    return of(user);
  }

  register(displayName: string, email: string, password: string): Observable<User> {
    // Simulation - à remplacer par Firebase/API
    const user: User = {
      id: Date.now().toString(),
      email,
      displayName,
      avatar: 'assets/images/default-avatar.png',
      joinDate: new Date(),
      totalFails: 0,
      couragePoints: 0,
      badges: []
    };

    this.setCurrentUser(user);
    return of(user);
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: 'currentUser' });
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  private async setCurrentUser(user: User): Promise<void> {
    await Preferences.set({
      key: 'currentUser',
      value: JSON.stringify(user)
    });
    this.currentUserSubject.next(user);
  }
}
