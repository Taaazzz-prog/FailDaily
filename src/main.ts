import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { AuthService } from './app/services/auth.service';
import { SupabaseService } from './app/services/supabase.service';
import { initializeIcons } from './app/utils/icons';

// Initialiser toutes les icônes au démarrage de l'application
initializeIcons();

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
