import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Observable, from } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { RoleService } from '../services/role.service';

@Injectable({ providedIn: 'root' })
export class ModerationGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private roleService: RoleService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    console.log('🛡️ ModerationGuard: Checking moderation permission...');
    return from(this.checkModerationAccess());
  }

  private async checkModerationAccess(): Promise<boolean> {
    try {
      const user = await this.authService.ensureInitialized();

      if (!user) {
        console.log('🛡️ ModerationGuard: No user, redirecting to login');
        this.router.navigate(['/auth/login']);
        return false;
      }

      const allowed = this.roleService.hasPermission(user, 'canModerateComments');
      if (allowed) {
        console.log('🛡️ ModerationGuard: Moderation access granted');
        return true;
      }

      console.warn('🛡️ ModerationGuard: Access denied - redirecting to /tabs/home');
      this.router.navigate(['/tabs/home']);
      return false;
    } catch (error) {
      console.error('🛡️ ModerationGuard: Error during check:', error);
      this.router.navigate(['/tabs/home']);
      return false;
    }
  }
}

