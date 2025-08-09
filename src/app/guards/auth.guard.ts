import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take, filter, timeout, catchError } from 'rxjs';
import { of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) { }

  canActivate(): Observable<boolean> {
    return this.authService.currentUser$.pipe(
      filter(user => user !== undefined), // Attendre que l'état soit défini (null ou User)
      take(1), // Prendre seulement la première valeur définie
      timeout(5000), // Timeout après 5 secondes
      map(user => {
        if (user) {
          return true; // Utilisateur connecté
        } else {
          this.router.navigate(['/auth/login']); // Redirection vers login
          return false;
        }
      }),
      catchError(() => {
        // En cas de timeout ou erreur, rediriger vers login
        this.router.navigate(['/auth/login']);
        return of(false);
      })
    );
  }
}
