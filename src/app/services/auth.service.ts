import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, from, map, catchError } from 'rxjs';
import { User } from '../models/user.model';
import { SupabaseService } from './supabase.service';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    // Écouter les changements d'authentification Supabase
    this.supabase.currentUser$.subscribe(async (supabaseUser: any) => {
      if (supabaseUser) {
        try {
          // Récupérer le profil complet depuis Supabase
          const profile = await this.supabase.getProfile(supabaseUser.id);

          // Convertir en format User de l'app
          const user: User = {
            id: supabaseUser.id,
            email: supabaseUser.email!,
            displayName: profile.display_name || profile.username,
            username: profile.username,
            avatar: profile.avatar_url || 'assets/anonymous-avatar.svg',
            joinDate: new Date(profile.created_at),
            totalFails: profile.stats?.totalFails || 0,
            couragePoints: profile.stats?.couragePoints || 0,
            badges: profile.stats?.badges || []
          };

          this.currentUserSubject.next(user);
        } catch (error) {
          console.error('Error loading user profile:', error);
          // Créer un profil par défaut si pas trouvé
          if ((error as any)?.message?.includes('No rows returned')) {
            await this.createDefaultProfile(supabaseUser);
          } else {
            this.currentUserSubject.next(null);
          }
        }
      } else {
        this.currentUserSubject.next(null);
      }
    });
  }

  private async createDefaultProfile(supabaseUser: any) {
    try {
      const username = supabaseUser.user_metadata?.username ||
        supabaseUser.email?.split('@')[0] ||
        'user_' + Date.now();

      const profileData = {
        id: supabaseUser.id,
        username,
        email: supabaseUser.email!,
        display_name: supabaseUser.user_metadata?.display_name || username,
        stats: {
          totalFails: 0,
          couragePoints: 0,
          badges: []
        },
        preferences: {}
      };

      // Insérer le profil dans Supabase
      const profile = await this.supabase.updateProfile(supabaseUser.id, profileData);

      const user: User = {
        id: supabaseUser.id,
        email: supabaseUser.email!,
        displayName: profile.display_name || username,
        username: profile.username,
        avatar: 'assets/anonymous-avatar.svg',
        joinDate: new Date(),
        totalFails: 0,
        couragePoints: 0,
        badges: []
      };

      this.currentUserSubject.next(user);
    } catch (error) {
      console.error('Error creating default profile:', error);
      this.currentUserSubject.next(null);
    }
  }

  login(credentials: LoginCredentials): Observable<User | null> {
    return from(this.supabase.signIn(credentials.email, credentials.password))
      .pipe(
        map(() => {
          // L'utilisateur sera mis à jour via l'observable supabase.currentUser$
          return this.currentUserSubject.value;
        }),
        catchError((error) => {
          console.error('Login error:', error);

          if (error.message?.includes('Email not confirmed')) {
            throw new Error('Votre compte doit être confirmé par email avant de pouvoir vous connecter. Vérifiez votre boîte mail et cliquez sur le lien de confirmation.');
          }

          if (error.message?.includes('Invalid credentials')) {
            throw new Error('Email ou mot de passe incorrect.');
          }

          throw new Error(error.message || 'Erreur de connexion inconnue.');
        })
      );
  }

  register(data: RegisterData): Observable<User | null> {
    return from(this.supabase.signUp(data.email, data.password, data.username))
      .pipe(
        map(() => {
          // L'utilisateur sera créé via l'observable supabase.currentUser$
          return this.currentUserSubject.value;
        }),
        catchError((error) => {
          console.error('Registration error:', error);
          throw error;
        })
      );
  }

  async logout(): Promise<void> {
    try {
      await this.supabase.signOut();
      this.currentUserSubject.next(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.currentUserSubject.value;
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await this.supabase.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
}
