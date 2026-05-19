import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/guards/role.guard';
import { BranchAdminsService } from '../branch-admins/data/branch-admins.service';
import { BranchAdminsStore } from '../branch-admins/presentation/state/branch-admins.store';
import { DepartmentAdminsService } from '../../department-admin/department-admins/data/department-admins.service';
import { DepartmentAdminsStore } from '../../department-admin/department-admins/presentation/state/department-admins.store';
import { DepartmentsService } from '../departments/data/departments.service';
import { DepartmentsStore } from '../departments/presentation/state/departments.store';
import { BranchesService } from './data/branches.service';
import { BranchesStore } from './presentation/state/branches.store';

export const BRANCHES_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [BranchesService, BranchesStore, DepartmentsService, DepartmentsStore],
    loadComponent: () => import('./presentation/pages/branches-page.component').then((m) => m.BranchesPageComponent)
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
      import('./presentation/pages/branch-details-page.component').then((m) => m.BranchDetailsPageComponent)
  }
];
