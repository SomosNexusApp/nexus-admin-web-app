import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./admin/login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'forbidden',
    loadComponent: () =>
      import('./errors/forbidden/forbidden.component').then((m) => m.ForbiddenComponent),
  },
  {
    path: 'not-found',
    loadComponent: () =>
      import('./errors/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
  {
    path: '',
    canActivate: [adminGuard],
    loadChildren: () => import('./admin/admin.routes'),
  },
  {
    path: '**',
    redirectTo: 'not-found'
  }
];
