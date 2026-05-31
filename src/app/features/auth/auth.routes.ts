import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { verifiedGuard } from '../../core/guards/verified.guard';

export const authRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('../../auth/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('../../auth/register/register.component').then(m => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () => import('./forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
  },
  {
    path: 'profile',
    loadComponent: () => import('../../auth/profile/profile.component').then(m => m.ProfileComponent),
    canActivate: [authGuard, verifiedGuard],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];