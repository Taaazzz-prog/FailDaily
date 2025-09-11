import { Component, OnInit } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner,
  RefresherCustomEvent, ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, addCircle, documentOutline, add, chevronDownCircleOutline, heart, people, trophy, personAddOutline, logInOutline } from 'ionicons/icons';
import { FailService } from '../services/fail.service';
import { AuthService } from '../services/auth.service';
import { Fail } from '../models/fail.model';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FailCardComponent } from '../components/fail-card/fail-card.component';
import { AuthActionDirective } from '../directives/auth-action.directive';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule, AsyncPipe,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonRefresher, IonRefresherContent, IonSpinner,
    FailCardComponent,
    AuthActionDirective
  ],
})
export class HomePage implements OnInit, ViewWillEnter {
  currentUser$ = this.authService.currentUser$;
  fails$: Observable<Fail[]> | null = null;
  isLoading = false;

  constructor(
    private failService: FailService,
    private authService: AuthService,
    private router: Router
  ) {
    // Configuration des icônes
    addIcons({
      person, addCircle, documentOutline, add, chevronDownCircleOutline,
      heart, people, trophy, personAddOutline, logInOutline
    });

    console.log('🏠 HomePage - Constructor called');

    // Ne charger les fails que si l'utilisateur est connecté
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.fails$ = this.failService.getFails();
        console.log('🏠 HomePage - Fails observable initialized for logged user');
      } else {
        console.log('🏠 HomePage - User not logged in, showing welcome screen');
      }
    });
  }

  ngOnInit() {
    console.log('🏠 HomePage - ngOnInit called');
    // Ne pas charger ici car ionViewWillEnter sera appelé juste après
  }

  ionViewWillEnter() {
    console.log('🏠 HomePage - ionViewWillEnter called');
    // Charger les données seulement si connecté
    if (this.authService.isAuthenticated()) {
      this.loadInitialData();
    } else {
      console.log('🏠 HomePage - User not authenticated, skipping data load');
    }
  }

  async loadInitialData() {
    console.log('🏠 HomePage - loadInitialData called');
    
    // Vérification supplémentaire de l'authentification
    if (!this.authService.isAuthenticated()) {
      console.log('🏠 HomePage - User not authenticated, aborting data load');
      return;
    }

    this.isLoading = true;

    // Charger les fails depuis Supabase
    try {
      console.log('🏠 HomePage - Refreshing fails...');
      await this.failService.refreshFails();
      console.log('🏠 HomePage - Fails loaded successfully');
    } catch (error) {
      console.error('🏠 HomePage - Error loading fails:', error);
    }

    this.isLoading = false;
    console.log('🏠 HomePage - Loading finished');
  }

  async handleRefresh(event: RefresherCustomEvent) {
    console.log('🏠 HomePage - handleRefresh called');
    
    // Vérifier l'authentification avant de rafraîchir
    if (!this.authService.isAuthenticated()) {
      console.log('🏠 HomePage - User not authenticated, aborting refresh');
      event.target.complete();
      return;
    }

    try {
      console.log('🏠 HomePage - Refreshing fails via pull-to-refresh...');
      await this.failService.refreshFails();
      console.log('🏠 HomePage - Pull-to-refresh completed successfully');
      event.target.complete();
    } catch (error) {
      console.error('🏠 HomePage - Error refreshing fails:', error);
      event.target.complete();
    }
  }

  goToPostFail() {
    console.log('🏠 HomePage - goToPostFail called');
    console.log('🏠 HomePage - Navigating to post-fail');
    this.router.navigate(['/tabs/post-fail']);
  }

  goToRegister() {
    console.log('🏠 HomePage - goToRegister called');
    this.router.navigate(['/auth/register']);
  }

  goToLogin() {
    console.log('🏠 HomePage - goToLogin called');
    this.router.navigate(['/auth/login']);
  }

  trackByFailId(index: number, fail: Fail): string {
    return fail.id;
  }
}
