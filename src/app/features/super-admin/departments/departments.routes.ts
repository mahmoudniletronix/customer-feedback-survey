import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/guards/role.guard';
import { DepartmentAdminsService } from '../department-admins/services/department-admins.service';
import { DepartmentAdminsStore } from '../department-admins/state/department-admins.store';
import { DepartmentsService } from './services/departments.service';
import { DepartmentsStore } from './state/departments.store';

export const DEPARTMENTS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [DepartmentsService, DepartmentsStore],
    loadComponent: () =>
      import('./pages/departments-page.component').then((m) => m.DepartmentsPageComponent),
  },
  {
    path: ':departmentId',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [DepartmentsService, DepartmentsStore, DepartmentAdminsService, DepartmentAdminsStore],
    loadComponent: () =>
      import('./pages/department-details-page.component').then((m) => m.DepartmentDetailsPageComponent),
  },
];
