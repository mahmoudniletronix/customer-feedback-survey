import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/guards/role.guard';
import { DepartmentAdminsService } from '../../department-admin/department-admins/data/department-admins.service';
import { DepartmentAdminsStore } from '../../department-admin/department-admins/presentation/state/department-admins.store';
import { DepartmentsService } from './data/departments.service';
import { DepartmentsStore } from './presentation/state/departments.store';

export const DEPARTMENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [DepartmentsService, DepartmentsStore],
    loadComponent: () =>
      import('./presentation/pages/departments-page.component').then((m) => m.DepartmentsPageComponent),
  },
  {
    path: ':departmentId',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [DepartmentsService, DepartmentsStore, DepartmentAdminsService, DepartmentAdminsStore],
    loadComponent: () =>
      import('./presentation/pages/department-details-page.component').then((m) => m.DepartmentDetailsPageComponent),
  },
];
