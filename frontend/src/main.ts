import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { importProvidersFrom } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';

// ✅ Désactivation des console.* en production (doit être importé en premier)
import './app/utils/disable-console-prod';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { MysqlService } from './app/services/mysql.service';
import { FollowService } from './app/services/follow.service';
import { LoggingSetupService } from './app/services/logging-setup.service';
import { FocusManagementService } from './app/services/focus-management.service';
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
    MysqlService,
    FollowService,
    LoggingSetupService, // Service pour configurer le logging
    FocusManagementService, // Service pour gérer l'accessibilité et le focus
  ],
}).then(() => {
  console.log('FailDaily application started with MySQL backend and comprehensive logging system');
}).catch((err: any) => {
  console.error('Error starting FailDaily application:', err);
});
