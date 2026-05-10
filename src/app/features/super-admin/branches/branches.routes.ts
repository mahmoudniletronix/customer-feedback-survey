import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/guards/role.guard';
import { BranchAdminsService } from '../branch-admins/services/branch-admins.service';
import { BranchAdminsStore } from '../branch-admins/state/branch-admins.store';
import { DepartmentAdminsService } from '../department-admins/services/department-admins.service';
import { DepartmentAdminsStore } from '../department-admins/state/department-admins.store';
import { DepartmentsService } from '../departments/services/departments.service';
import { DepartmentsStore } from '../departments/state/departments.store';
import { BranchesService } from './services/branches.service';
import { BranchesStore } from './state/branches.store';

export const BRANCHES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [BranchesService, BranchesStore, DepartmentsService, DepartmentsStore],
    loadComponent: () => import('./pages/branches-page.component').then((m) => m.BranchesPageComponent)
  },
  {
    path: ':branchId',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [
      BranchesService,
      BranchesStore,
      BranchAdminsService,
      BranchAdminsStore,
      DepartmentsService,
      DepartmentsStore,
      DepartmentAdminsService,
      DepartmentAdminsStore,
    ],
    loadComponent: () =>
      import('./pages/branch-details-page.component').then((m) => m.BranchDetailsPageComponent)
  }
];
