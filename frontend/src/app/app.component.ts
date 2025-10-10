import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AuthService } from './services/auth.service';
import { ThemeService } from './services/theme.service';
import { FocusManagementService } from './services/focus-management.service';
import { DebugService } from './services/debug.service';
import { FocusManagementDirective } from './directives/focus-management.directive';
import { environment } from '../environments/environment';
import { AppInitializationService } from './services/app-initialization.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, FocusManagementDirective],
})
export class AppComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private themeService: ThemeService,
    private focusManagementService: FocusManagementService,
    private debugService: DebugService,
    private appInitializationService: AppInitializationService
  ) { }

  ngOnInit() {
    // ⚠️ FORCE LE THÈME CLAIR au démarrage pour éviter collision VS Code
    document.body.classList.add('force-light-theme');
    document.body.style.backgroundColor = '#dbeafe';
    
    // Initialiser l'authentification au démarrage
    console.log('AppComponent initialized');

    // ✅ Initialiser le service de thème dès le démarrage (en mode clair forcé)
    this.themeService.setDarkMode(false); // Force thème clair
    console.log('🌙 ThemeService initialized - Force thème clair');

    // S'assurer que l'AuthService est bien initialisé
    this.authService.currentUser$.subscribe(user => {
      console.log('Auth state changed:', user ? 'logged in' : 'logged out');
      
      // ✅ Activer le DebugService pour les admins même en production
      if (user && (user.role === 'admin' || user.role === 'super_admin')) {
        this.debugService.setEnabled(true);
        console.log('🔧 DebugService activé pour l\'admin en production');
      } else if (environment.production) {
        this.debugService.setEnabled(false);
      }
    });

    // Nettoyer le focus des pages cachées toutes les 5 secondes (solution de sécurité)
    setInterval(() => {
      this.focusManagementService.clearFocusFromHiddenPages();
    }, 5000);

    // Initialiser les services transverses (badges, notifications, etc.)
    this.appInitializationService.initializeApp().catch((error) => {
      console.error('Erreur lors de l\'initialisation de l\'application:', error);
    });
  }
}
