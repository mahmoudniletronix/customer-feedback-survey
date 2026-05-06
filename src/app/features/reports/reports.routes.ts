import { Routes } from '@angular/router';
import { ReportsService } from './services/reports.service';
import { ReportsStore } from './state/reports.store';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    providers: [ReportsService, ReportsStore],
    loadComponent: () => import('./pages/reports-page.component').then((m) => m.ReportsPageComponent)
  }
];
