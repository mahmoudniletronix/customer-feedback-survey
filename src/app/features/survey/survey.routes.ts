import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { SurveyService } from './services/survey.service';
import { SurveyStore } from './state/survey.store';

export const SURVEY_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['BRANCH_ADMIN', 'DEPARTMENT_ADMIN'])],
    providers: [SurveyService, SurveyStore],
    loadComponent: () => import('./pages/survey-page.component').then((m) => m.SurveyPageComponent)
  }
];
