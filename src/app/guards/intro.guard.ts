import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class IntroGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // À remplacer par une vraie logique (ex: vérifier si l'utilisateur a vu l'intro)
    const hasSeenIntro = localStorage.getItem('hasSeenIntro') === 'true';
    if (hasSeenIntro) {
      return true;
    }
    this.router.navigate(['/intro']);
    return false;
  }
}

