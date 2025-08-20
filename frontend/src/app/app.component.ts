import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(private authService: AuthService) { }

  ngOnInit() {
    // Initialiser l'authentification au démarrage
    console.log('AppComponent initialized');

    // S'assurer que l'AuthService est bien initialisé
    this.authService.currentUser$.subscribe(user => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    });
  }
}
