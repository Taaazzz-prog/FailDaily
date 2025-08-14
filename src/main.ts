import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { AuthService } from './app/services/auth.service';
import { SupabaseService } from './app/services/supabase.service';
import { FollowService } from './app/services/follow.service';
import { LoggingSetupService } from './app/services/logging-setup.service';
import { initializeIcons } from './app/utils/icons';

// Initialiser toutes les icônes au démarrage de l'application
initializeIcons();

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(),
    importProvidersFrom(BrowserModule),
    AuthService,
    SupabaseService,
    FollowService,
    LoggingSetupService, // Service pour configurer le logging
  ],
}).then(() => {
  console.log('FailDaily application started with comprehensive logging system');
}).catch((err: any) => {
  console.error('Error starting FailDaily application:', err);
});
