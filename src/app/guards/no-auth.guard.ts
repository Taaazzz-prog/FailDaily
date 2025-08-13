import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NoAuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(): Observable<boolean> {
        console.log('🚫 NoAuthGuard: Checking if user is NOT authenticated...');

        // ✅ SOLUTION ROBUSTE : Utiliser la méthode garantie d'initialisation
        return from(this.checkAuthStatus());
    }

    private async checkAuthStatus(): Promise<boolean> {
        try {
            console.log('🚫 NoAuthGuard: Ensuring auth service is initialized...');

            // Garantir que l'AuthService est complètement initialisé
            const user = await this.authService.ensureInitialized();

            if (!user) {
                console.log('🚫 NoAuthGuard: User NOT authenticated, access granted');
                return true; // Utilisateur NON connecté, autoriser l'accès
            } else {
                console.log('🚫 NoAuthGuard: User authenticated, redirecting to home');
                this.router.navigate(['/']); // Redirection vers home avec tabs si connecté
                return false;
            }
        } catch (error) {
            console.error('🚫 NoAuthGuard: Error during auth check:', error);
            // En cas d'erreur, autoriser l'accès (supposer non connecté)
            return true;
        }
    }
}