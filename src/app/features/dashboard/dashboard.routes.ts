import { Routes } from '@angular/router';
import { DashboardService } from './services/dashboard.service';
import { DashboardStore } from './state/dashboard.store';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    providers: [DashboardService, DashboardStore],
    loadComponent: () =>
      import('./pages/dashboard-page.component').then((m) => m.DashboardPageComponent)
  }
];
