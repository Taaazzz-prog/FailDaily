import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RoleService } from '../services/role.service';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('🛡️ AdminGuard: Checking admin authorization...');
    return from(this.checkAdminAccess());
  }

  private async checkAdminAccess(): Promise<boolean> {
    try {
      // S'assurer que l'auth est initialisée et récupérer l'utilisateur courant
      const user = await this.authService.ensureInitialized();

      if (!user) {
        console.log('🛡️ AdminGuard: No user authenticated, redirecting to login');
        this.router.navigate(['/auth/login']);
        return false;
      }

      // Vérifier la permission d'accès admin via RoleService
      const canAccess = this.roleService.canAccessAdmin(user);
      if (canAccess) {
        console.log('🛡️ AdminGuard: Admin access granted');
        return true;
      }

      console.warn('🛡️ AdminGuard: Access denied - redirecting to /tabs/home');
      this.router.navigate(['/tabs/home']);
      return false;
    } catch (error) {
      console.error('🛡️ AdminGuard: Error during admin check:', error);
      this.router.navigate(['/tabs/home']);
      return false;
    }
  }
}

