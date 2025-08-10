import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  addCircleOutline,
  ribbonOutline,
  personOutline,
  settingsOutline,
  addCircle,
  add,
  person,
  chevronDownCircleOutline,
  heart,
  happy,
  handLeft,
  camera,
  appsOutline,
  trophyOutline,
  shareOutline,
  lockClosedOutline,
  checkmarkCircle,
  shieldOutline,
  peopleOutline,
  people,
  happyOutline,
  fitnessOutline,
  starOutline,
  heartOutline,
  footstepsOutline,
  calendarOutline,
  flagOutline,
  flameOutline,
  close,
  openOutline,
  medical,
  call,
  warning,
  informationCircle,
  mailOutline
} from 'ionicons/icons';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { AuthService } from './app/services/auth.service';
import { SupabaseService } from './app/services/supabase.service';

// Enregistrer toutes les icônes utilisées dans l'application
addIcons({
  'home-outline': homeOutline,
  'add-circle-outline': addCircleOutline,
  'ribbon-outline': ribbonOutline,
  'person-outline': personOutline,
  'settings-outline': settingsOutline,
  'add-circle': addCircle,
  'add': add,
  'person': person,
  'chevron-down-circle-outline': chevronDownCircleOutline,
  'heart': heart,
  'happy': happy,
  'hand-left': handLeft,
  'camera': camera,
  'apps-outline': appsOutline,
  'trophy-outline': trophyOutline,
  'share-outline': shareOutline,
  'lock-closed-outline': lockClosedOutline,
  'checkmark-circle': checkmarkCircle,
  'shield-outline': shieldOutline,
  'people-outline': peopleOutline,
  'people': people,
  'happy-outline': happyOutline,
  'fitness-outline': fitnessOutline,
  'star-outline': starOutline,
  'heart-outline': heartOutline,
  'footsteps-outline': footstepsOutline,
  'calendar-outline': calendarOutline,
  'flag-outline': flagOutline,
  'flame-outline': flameOutline,
  'close': close,
  'open-outline': openOutline,
  'medical': medical,
  'call': call,
  'warning': warning,
  'information-circle': informationCircle,
  'mail-outline': mailOutline
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    importProvidersFrom(BrowserModule),
    AuthService,
    SupabaseService,
  ],
}).then(() => {
  console.log('FailDaily application started');
}).catch(err => {
  console.error('Error starting FailDaily application:', err);
});
