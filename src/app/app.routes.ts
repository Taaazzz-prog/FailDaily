import { provideRouter, Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage)
      },
      {
        path: 'post-fail',
        loadComponent: () => import('./pages/post-fail/post-fail.page').then(m => m.PostFailPage)
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage)
      },
      {
        path: 'badges',
        loadComponent: () => import('./pages/badges/badges.page').then(m => m.BadgesPage)
      },
      // Ajoute ici les autres pages (settings) si besoin
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
    children: [
      {
        path: 'login',
        loadComponent: () => import('./pages/auth/login.page').then(m => m.LoginPage)
      },
      {
        path: 'register',
        loadComponent: () => import('./pages/auth/register.page').then(m => m.RegisterPage)
      }
    ]
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];
