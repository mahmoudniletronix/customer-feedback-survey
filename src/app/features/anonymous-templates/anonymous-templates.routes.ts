import { Routes } from '@angular/router';
import { BranchesService } from '../super-admin/branches/data/branches.service';
import { AnonymousTemplatesService } from './data/anonymous-templates.service';
import { anonymousTemplateAccessGuard } from './presentation/guards/anonymous-template-access.guard';
import { AnonymousTemplatesStore } from './presentation/state/anonymous-templates.store';

export const ANONYMOUS_TEMPLATES_ROUTES: Routes = [
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
