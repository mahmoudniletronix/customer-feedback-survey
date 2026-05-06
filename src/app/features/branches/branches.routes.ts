import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { BranchesService } from './services/branches.service';
import { BranchesStore } from './state/branches.store';

export const BRANCHES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [BranchesService, BranchesStore],
    loadComponent: () => import('./pages/branches-page.component').then((m) => m.BranchesPageComponent)
  }
];
