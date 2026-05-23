import { Routes } from '@angular/router';
import { BranchAdminBranchService } from '../../branch-admin/branch/data/branch-admin-branch.service';
import { BranchAdminBranchStore } from '../../branch-admin/branch/presentation/state/branch-admin-branch.store';
import { BranchDashboardService } from '../../branch-admin/dashboard/data/branch-dashboard.service';
import { BranchResponsesHistoryStore } from '../../branch-admin/dashboard/presentation/state/branch-responses-history.store';
import { SurveyDashboardService } from './data/survey-dashboard.service';
import { surveyDashboardAccessGuard } from './presentation/guards/survey-dashboard-access.guard';
import { SurveyDashboardStore } from './presentation/state/survey-dashboard.store';

export const SURVEY_DASHBOARD_ROUTES: Routes = [
  {
    path: 'internal-responses',
    canActivate: [surveyDashboardAccessGuard],
    providers: [
      BranchAdminBranchService,
      BranchAdminBranchStore,
      BranchDashboardService,
      BranchResponsesHistoryStore,
    ],
    loadComponent: () =>
      import('../../branch-admin/dashboard/presentation/pages/branch-responses-history-page.component').then(
        (m) => m.BranchResponsesHistoryPageComponent,
      ),
  },
  {
    path: '',
    pathMatch: 'full',
    canActivate: [surveyDashboardAccessGuard],
    providers: [
      BranchAdminBranchService,
      BranchAdminBranchStore,
      SurveyDashboardService,
      SurveyDashboardStore,
    ],
    loadComponent: () =>
      import('./presentation/pages/survey-dashboard-page.component').then(
        (m) => m.SurveyDashboardPageComponent,
      ),
  },
];
