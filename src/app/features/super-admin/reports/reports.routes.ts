import { Routes } from '@angular/router';
import { ReportsService } from './data/reports.service';
import { ReportsStore } from './presentation/state/reports.store';

export const REPORTS_ROUTES: Routes = [
  {
    path: '',
    providers: [ReportsService, ReportsStore],
    loadComponent: () => import('./presentation/pages/reports-page.component').then((m) => m.ReportsPageComponent)
  }
];
