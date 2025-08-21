import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { homeOutline, addCircle, ribbonOutline, personOutline, settingsOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { UserRole } from '../../models/user-role.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel
  ]
})
export class TabsPage implements OnInit, OnDestroy {
  currentUser: User | null = null;
  isAuthenticated = false;
  isAdmin = false;
  private authSubscription: Subscription = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // Configuration des icônes pour les tabs
    addIcons({
      homeOutline, addCircle, ribbonOutline, personOutline, settingsOutline
    });
  }

  ngOnInit() {
    console.log('📱 TabsPage: Initialisation du contrôle d\'authentification');
    
    // Force une vérification initiale de l'authentification
    this.forceAuthCheck();
    
    // Écouter les changements d'état d'authentification
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      console.log('📱 TabsPage: Changement d\'utilisateur:', user ? user.email : 'non connecté');
      
      this.currentUser = user === undefined ? null : user;
      this.isAuthenticated = !!user;
      this.isAdmin = user?.role === UserRole.ADMIN;

      // Si l'utilisateur n'est pas connecté et qu'il est sur une route protégée
      if (!this.isAuthenticated) {
        this.handleUnauthenticatedAccess();
      }
    });
  }

  ngOnDestroy() {
    this.authSubscription.unsubscribe();
  }

  private handleUnauthenticatedAccess() {
    const currentUrl = this.router.url;
    console.log('📱 TabsPage: Utilisateur non connecté sur:', currentUrl);
    
    // Routes autorisées sans authentification
    const publicRoutes = ['/tabs/home'];
    
    // Si on est sur une route protégée, rediriger vers home
    if (!publicRoutes.includes(currentUrl)) {
      console.log('📱 TabsPage: Redirection vers home - accès non autorisé');
      this.router.navigate(['/tabs/home']);
    }
  }

  /**
   * ✅ Force une vérification complète de l'authentification
   */
  async forceAuthCheck(): Promise<void> {
    console.log('🔄 TabsPage: Force vérification de l\'authentification');
    
    try {
      // Vérifier la cohérence des données dans localStorage
      const token = localStorage.getItem('authToken');
      const userId = localStorage.getItem('userId');
      const currentUser = this.authService.getCurrentUser();

      if (!token || !userId || !currentUser) {
        console.log('🚨 TabsPage: Données d\'authentification incohérentes détectées');
        console.log('Token:', !!token, 'UserId:', !!userId, 'CurrentUser:', !!currentUser);
        
        // Forcer un rafraîchissement de l'authentification
        await this.authService.forceRefreshAuth();
        
        // Rediriger vers home
        this.router.navigate(['/tabs/home']);
      }
    } catch (error) {
      console.error('❌ TabsPage: Erreur lors de la vérification d\'authentification:', error);
      this.router.navigate(['/tabs/home']);
    }
  }

  // Méthodes pour contrôler l'affichage des tabs
  canShowTab(tab: string): boolean {
    switch (tab) {
      case 'home':
        return true; // Toujours accessible
      case 'post-fail':
        return this.isAuthenticated; // Nécessite une connexion
      case 'badges':
        return this.isAuthenticated; // Nécessite une connexion
      case 'profile':
        return this.isAuthenticated; // Nécessite une connexion
      case 'admin':
        return this.isAuthenticated && this.isAdmin; // Nécessite admin
      default:
        return false;
    }
  }

  // Gestion des clics sur les tabs protégés
  onTabClick(tab: string, event: Event) {
    if (!this.canShowTab(tab)) {
      event.preventDefault();
      event.stopPropagation();
      
      if (!this.isAuthenticated) {
        console.log('📱 TabsPage: Accès refusé - redirection vers login');
        this.router.navigate(['/auth/login']);
      }
      
      return false;
    }
    return true;
  }
}
