import { Routes } from '@angular/router';
import { BranchesService } from '../super-admin/branches/data/branches.service';
import { AnonymousTemplatesService } from './data/anonymous-templates.service';
import { anonymousResponsesReportAccessGuard } from './presentation/guards/anonymous-responses-report-access.guard';
import { anonymousTemplateAccessGuard } from './presentation/guards/anonymous-template-access.guard';
import { anonymousTemplateDashboardAccessGuard } from './presentation/guards/anonymous-template-dashboard-access.guard';
import { AnonymousBranchResponsesStore } from './presentation/state/anonymous-branch-responses.store';
import { AnonymousTemplateDashboardStore } from './presentation/state/anonymous-template-dashboard.store';
import { AnonymousTemplatesStore } from './presentation/state/anonymous-templates.store';

export const ANONYMOUS_TEMPLATES_ROUTES: Routes = [
  {
    path: 'dashboard',
    canActivate: [anonymousTemplateDashboardAccessGuard],
    providers: [AnonymousTemplatesService, AnonymousTemplateDashboardStore],
    loadComponent: () =>
      import('./presentation/pages/anonymous-template-dashboard-page.component').then(
        (m) => m.AnonymousTemplateDashboardPageComponent,
      ),
  },
  {
    path: 'responses',
    canActivate: [anonymousResponsesReportAccessGuard],
    providers: [AnonymousTemplatesService, AnonymousTemplatesStore, AnonymousBranchResponsesStore],
    loadComponent: () =>
      import('./presentation/pages/anonymous-branch-responses-page.component').then(
        (m) => m.AnonymousBranchResponsesPageComponent,
      ),
  },
  {
    path: ':anonymousTemplateId/responses/:responseId',
    canActivate: [anonymousTemplateAccessGuard],
    providers: [AnonymousTemplatesService, AnonymousTemplatesStore, BranchesService],
    loadComponent: () =>
      import('./presentation/pages/anonymous-template-response-details-page.component').then(
        (m) => m.AnonymousTemplateResponseDetailsPageComponent,
      ),
  },
  {
    path: ':anonymousTemplateId/responses',
    canActivate: [anonymousTemplateAccessGuard],
    providers: [AnonymousTemplatesService, AnonymousTemplatesStore, BranchesService],
    loadComponent: () =>
      import('./presentation/pages/anonymous-template-responses-page.component').then(
        (m) => m.AnonymousTemplateResponsesPageComponent,
      ),
  },
  {
    path: ':anonymousTemplateId/questions',
    canActivate: [anonymousTemplateAccessGuard],
    providers: [AnonymousTemplatesService, AnonymousTemplatesStore, BranchesService],
    loadComponent: () =>
      import('./presentation/pages/anonymous-template-questions-page.component').then(
        (m) => m.AnonymousTemplateQuestionsPageComponent,
      ),
  },
  {
    path: ':anonymousTemplateId/conditions',
    canActivate: [anonymousTemplateAccessGuard],
    providers: [AnonymousTemplatesService, AnonymousTemplatesStore, BranchesService],
    loadComponent: () =>
      import('./presentation/pages/anonymous-template-questions-page.component').then(
        (m) => m.AnonymousTemplateQuestionsPageComponent,
      ),
  },
  {
    path: ':anonymousTemplateId',
    canActivate: [anonymousTemplateAccessGuard],
    providers: [AnonymousTemplatesService, AnonymousTemplatesStore, BranchesService],
    loadComponent: () =>
      import('./presentation/pages/anonymous-template-details-page.component').then(
        (m) => m.AnonymousTemplateDetailsPageComponent,
      ),
  },
  {
    path: '',
    canActivate: [anonymousTemplateAccessGuard],
    providers: [AnonymousTemplatesService, AnonymousTemplatesStore, BranchesService],
    loadComponent: () =>
      import('./presentation/pages/anonymous-templates-page.component').then(
        (m) => m.AnonymousTemplatesPageComponent,
      ),
  },
];
