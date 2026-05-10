import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { BranchAdminBranchService } from './branch/services/branch-admin-branch.service';
import { BranchAdminBranchStore } from './branch/state/branch-admin-branch.store';
import { BranchUsersService } from './branch-users/services/branch-users.service';
import { BranchUsersStore } from './branch-users/state/branch-users.store';

export const BRANCH_ADMIN_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['BRANCH_ADMIN'])],
    providers: [BranchAdminBranchService, BranchAdminBranchStore, BranchUsersService, BranchUsersStore],
    loadComponent: () =>
      import('./pages/branch-admin-overview-page.component').then(
        (m) => m.BranchAdminOverviewPageComponent,
      ),
  },
];
