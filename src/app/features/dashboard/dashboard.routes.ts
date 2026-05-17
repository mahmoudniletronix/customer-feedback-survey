import { Routes } from '@angular/router';
import { DashboardService } from './data/dashboard.service';
import { DashboardStore } from './presentation/state/dashboard.store';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    providers: [DashboardService, DashboardStore],
    loadComponent: () =>
      import('./presentation/pages/dashboard-page.component').then((m) => m.DashboardPageComponent)
  }
];
