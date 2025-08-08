import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonButton, IonIcon,
  IonRefresher, IonRefresherContent, IonSpinner, IonFab, IonFabButton,
  RefresherCustomEvent, ViewWillEnter
} from '@ionic/angular/standalone';
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
    this.fails$ = this.failService.getFails();
  }

  ngOnInit() {
    this.loadInitialData();
  }

  ionViewWillEnter() {
    // Recharger les fails chaque fois que la page devient active
    this.loadInitialData();
  }

  async loadInitialData() {
    this.isLoading = true;

    // Charger les fails depuis Supabase
    try {
      await this.failService.refreshFails();
    } catch (error) {
      console.error('Error loading fails:', error);
    }

    this.isLoading = false;
  }

  async handleRefresh(event: RefresherCustomEvent) {
    try {
      await this.failService.refreshFails();
      event.target.complete();
    } catch (error) {
      console.error('Error refreshing fails:', error);
      event.target.complete();
    }
  }

  goToPostFail() {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/post-fail']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  trackByFailId(index: number, fail: Fail): string {
    return fail.id;
  }
}
