import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UsersService } from './services/users.service';
import { UsersStore } from './state/users.store';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPER_ADMIN', 'BRANCH_ADMIN'])],
    providers: [UsersService, UsersStore],
    loadComponent: () => import('./pages/users-page.component').then((m) => m.UsersPageComponent)
  }
];
