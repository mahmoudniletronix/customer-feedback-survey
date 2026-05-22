import { Routes } from '@angular/router';
import { SurveyDashboardService } from './data/survey-dashboard.service';
import { surveyDashboardAccessGuard } from './presentation/guards/survey-dashboard-access.guard';
import { SurveyDashboardStore } from './presentation/state/survey-dashboard.store';

export const SURVEY_DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    canActivate: [surveyDashboardAccessGuard],
    providers: [SurveyDashboardService, SurveyDashboardStore],
    loadComponent: () =>
      import('./presentation/pages/survey-dashboard-page.component').then(
        (m) => m.SurveyDashboardPageComponent,
      ),
  },
];
