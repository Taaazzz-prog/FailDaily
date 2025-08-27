import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { FocusManagementService } from './services/focus-management.service';
import { FocusManagementDirective } from './directives/focus-management.directive';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, FocusManagementDirective],
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private focusManagementService: FocusManagementService
  ) { }

  ngOnInit() {
    // Initialiser l'authentification au démarrage
    console.log('AppComponent initialized');

    // S'assurer que l'AuthService est bien initialisé
    this.authService.currentUser$.subscribe(user => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    });

    // Nettoyer le focus des pages cachées toutes les 5 secondes (solution de sécurité)
    setInterval(() => {
      this.focusManagementService.clearFocusFromHiddenPages();
    }, 5000);
  }
}
