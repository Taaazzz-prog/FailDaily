import { provideRouter, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { ModerationGuard } from './guards/moderation.guard';
import { NoAuthGuard } from './guards/no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  },
  // Page de réinitialisation de mot de passe (via token dans l'URL)
  {
    path: 'reset-password',
    loadComponent: () => import('./pages/reset-password/reset-password.page').then(m => m.ResetPasswordPage)
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/tabs/tabs.page').then(m => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage)
        // Pas de guard ici - la page home doit être accessible à tous
      },
      {
        path: 'post-fail',
        loadComponent: () => import('./pages/post-fail/post-fail.page').then(m => m.PostFailPage),
        canActivate: [AuthGuard] // Protection obligatoire
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then(m => m.ProfilePage),
        canActivate: [AuthGuard] // Protection obligatoire
      },
      {
        path: 'badges',
        loadComponent: () => import('./pages/badges/badges.page').then(m => m.BadgesPage),
        canActivate: [AuthGuard] // Protection obligatoire
      },
      {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin.page').then(m => m.AdminPage),
        canActivate: [AuthGuard, AdminGuard] // Auth + Autorisation admin
      },
      {
        path: 'moderation',
        loadComponent: () => import('./pages/moderation/moderation.page').then(m => m.ModerationPage),
        canActivate: [AuthGuard, ModerationGuard] // Auth + Autorisation modération
      },
      {
        path: 'privacy-settings',
        loadComponent: () => import('./pages/privacy-settings/privacy-settings.page').then(m => {
          console.log('Chargement du composant PrivacySettings...', !!m.PrivacySettingsPage);
          return m.PrivacySettingsPage;
        }),
        canActivate: [AuthGuard] // Protection obligatoire
      },
      {
        path: 'edit-profile',
        loadComponent: () => import('./pages/edit-profile/edit-profile.page').then(m => m.EditProfilePage),
        canActivate: [AuthGuard] // Protection obligatoire
      },
      {
        path: 'change-photo',
        loadComponent: () => import('./pages/change-photo/change-photo.page').then(m => m.ChangePhotoPage),
        canActivate: [AuthGuard] // Protection obligatoire
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full'
      }
    ]
  },
  // Profil utilisateur public
  {
    path: 'user-profile/:userId',
    loadComponent: () => import('./pages/user-profile/user-profile.page').then(m => m.UserProfilePage)
  },
  // Redirection home directe vers tabs
  {
    path: 'home',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
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
  // Page de debug (développement uniquement)
  {
    path: 'debug',
    loadComponent: () => import('./pages/debug/debug.page').then(m => m.DebugPage)
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
      },
      {
        path: 'forgot-password',
        loadComponent: () => import('./pages/auth/forgot-password.page').then(m => m.ForgotPasswordPage),
        canActivate: [NoAuthGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  }
];
