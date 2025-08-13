import { provideRouter, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { NoAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    canActivate: [AuthGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage),
        canActivate: [AuthGuard]
      },
      {
        path: 'post-fail',
        loadComponent: () => import('./pages/post-fail/post-fail.page').then(m => m.PostFailPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
        canActivate: [AuthGuard]
      },
      {
        path: 'badges',
        loadComponent: () => import('./pages/badges/badges.page').then(m => m.BadgesPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'badge-migration',
        loadComponent: () => import('./pages/badge-migration/badge-migration.page').then(m => m.BadgeMigrationPage),
        canActivate: [AuthGuard]
      },
      {
        path: 'privacy-settings',
        loadComponent: () => import('./pages/privacy-settings/privacy-settings.page').then(m => {
          console.log('Chargement du composant PrivacySettings...', m);
          return m.PrivacySettingsPage;
        }),
        canActivate: [AuthGuard]
      },
      {
        path: 'edit-profile',
        loadComponent: () => import('./pages/edit-profile/edit-profile.page').then(m => m.EditProfilePage),
        canActivate: [AuthGuard]
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  // Pages légales
  {
    path: 'legal',
    loadComponent: () => import('./pages/legal/legal.page').then(m => m.LegalPage)
  },
  {
    path: 'legal-document/:id',
    loadComponent: () => import('./pages/legal-document/legal-document.page').then(m => m.LegalDocumentPage)
  },
  {
    path: 'auth',
    canActivate: [NoAuthGuard],
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login.page').then(m => m.LoginPage),
        canActivate: [NoAuthGuard]
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register.page').then(m => m.RegisterPage),
        canActivate: [NoAuthGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  }
];
