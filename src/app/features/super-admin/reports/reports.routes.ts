import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthStore } from '../../auth/presentation/state/auth.store';
import { ReportsService } from './data/reports.service';
import { SystemReportsService } from './data/system-reports.service';
import { ReportsStore } from './presentation/state/reports.store';
import { SystemReportsStore } from './presentation/state/system-reports.store';

const systemReportsAccessGuard = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return authStore.canAccessSystemReports() ? true : router.createUrlTree(['/dashboard']);
};

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    providers: [ReportsService, ReportsStore, SystemReportsService, SystemReportsStore],
    canActivate: [systemReportsAccessGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'system-dashboard',
      },
      {
        path: 'system-dashboard',
        loadComponent: () =>
          import('./presentation/pages/system-dashboard-page.component').then(
            (m) => m.SystemDashboardPageComponent,
          ),
      },
      {
        path: 'system-responses',
        loadComponent: () =>
          import('./presentation/pages/system-responses-history-page.component').then(
            (m) => m.SystemResponsesHistoryPageComponent,
          ),
      },
    ],
  }
];
