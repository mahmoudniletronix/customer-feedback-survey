import { Routes } from '@angular/router';
import { passwordChangeGuard } from '../../core/guards/password-change.guard';

export const AUTH_ROUTES: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./presentation/pages/login-page.component').then((m) => m.LoginPageComponent),
  },
  {
    path: 'change-password',
    canActivate: [passwordChangeGuard],
    loadComponent: () =>
      import('./presentation/pages/change-password-page.component').then(
        (m) => m.ChangePasswordPageComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
];
