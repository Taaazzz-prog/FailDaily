import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    console.log('🛡️ AuthGuard: Checking authentication...');

    // ✅ SOLUTION ROBUSTE : Utiliser la méthode garantie d'initialisation
    return from(this.checkAuthStatus());
  }

  private async checkAuthStatus(): Promise<boolean> {
    try {
      console.log('🛡️ AuthGuard: Ensuring auth service is initialized...');

      // Garantir que l'AuthService est complètement initialisé
      const user = await this.authService.ensureInitialized();

      if (user) {
        console.log('🛡️ AuthGuard: User authenticated, access granted');
        return true;
      } else {
        console.log('🛡️ AuthGuard: No authenticated user, redirecting to login');
        this.router.navigate(['/auth/login']);
        return false;
      }
    } catch (error) {
      console.error('🛡️ AuthGuard: Error during auth check:', error);
      this.router.navigate(['/auth/login']);
      return false;
    }
  }
}

