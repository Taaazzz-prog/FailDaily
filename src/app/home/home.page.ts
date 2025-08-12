import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner, IonFab, IonFabButton,
  RefresherCustomEvent, ViewWillEnter
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { person, addCircle, documentOutline, add, chevronDownCircleOutline } from 'ionicons/icons';
import { FailService } from '../services/fail.service';
import { AuthService } from '../services/auth.service';
import { Fail } from '../models/fail.model';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { FailCardComponent } from '../components/fail-card/fail-card.component';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  imports: [
    CommonModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
    IonRefresher, IonRefresherContent, IonSpinner, IonFab, IonFabButton,
    FailCardComponent
  ],
})
export class HomePage implements OnInit, ViewWillEnter {
  fails$: Observable<Fail[]>;
  isLoading = false;
  currentUser$ = this.authService.currentUser$;

  constructor(
    private failService: FailService,
    private authService: AuthService,
    private router: Router
  ) {
    // Configuration des icônes
    addIcons({
      person, addCircle, documentOutline, add, chevronDownCircleOutline
    });

    console.log('🏠 HomePage - Constructor called');
    this.fails$ = this.failService.getFails();
    console.log('🏠 HomePage - Fails observable initialized');
  }

  ngOnInit() {
    console.log('🏠 HomePage - ngOnInit called');
    this.loadInitialData();
  }

  ionViewWillEnter() {
    console.log('🏠 HomePage - ionViewWillEnter called');
    // Recharger les fails chaque fois que la page devient active
    this.loadInitialData();
  }

  async loadInitialData() {
    console.log('🏠 HomePage - loadInitialData called');
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
    const isAuth = this.authService.isAuthenticated();
    console.log('🏠 HomePage - User authenticated:', isAuth);

    if (isAuth) {
      console.log('🏠 HomePage - Navigating to post-fail');
      this.router.navigate(['/post-fail']);
    } else {
      console.log('🏠 HomePage - Not authenticated, redirecting to login');
      this.router.navigate(['/auth/login']);
    }
  }

  goToLogin() {
    console.log('🏠 HomePage - goToLogin called');
    this.router.navigate(['/auth/login']);
  }

  trackByFailId(index: number, fail: Fail): string {
    return fail.id;
  }
}
