import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UsersService } from './data/users.service';
import { UsersStore } from './presentation/state/users.store';

export const USERS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPER_ADMIN', 'BRANCH_ADMIN'])],
    providers: [UsersService, UsersStore],
    loadComponent: () => import('./presentation/pages/users-page.component').then((m) => m.UsersPageComponent)
  }
];
