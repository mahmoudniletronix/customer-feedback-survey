import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthStore } from '../../auth/presentation/state/auth.store';
import { DepartmentReportsService } from './data/department-reports.service';
import { DepartmentDashboardStore } from './presentation/state/department-dashboard.store';
import { DepartmentOperatorResponsesStore } from './presentation/state/department-operator-responses.store';
import { DepartmentResponseDetailsStore } from './presentation/state/department-response-details.store';

const departmentReportsAccessGuard = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return authStore.canAccessDepartmentReports()
    ? true
    : router.createUrlTree(['/dashboard']);
};

export const DEPARTMENT_REPORTS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [departmentReportsAccessGuard],
    providers: [
      DepartmentReportsService,
      DepartmentDashboardStore,
      DepartmentOperatorResponsesStore,
      DepartmentResponseDetailsStore,
    ],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./presentation/pages/department-dashboard-page.component').then(
            (m) => m.DepartmentDashboardPageComponent,
          ),
      },
      {
        path: 'operators/:operatorId/responses',
        loadComponent: () =>
          import('./presentation/pages/department-operator-responses-page.component').then(
            (m) => m.DepartmentOperatorResponsesPageComponent,
          ),
      },
      {
        path: 'operators/:operatorId/responses/:surveyResponseId',
        loadComponent: () =>
          import('./presentation/pages/department-response-details-page.component').then(
            (m) => m.DepartmentResponseDetailsPageComponent,
          ),
      },
    ],
  },
];
