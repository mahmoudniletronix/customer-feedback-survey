import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { BranchDashboardService } from './dashboard/data/branch-dashboard.service';
import { branchDashboardAccessGuard } from './dashboard/presentation/guards/branch-dashboard-access.guard';
import { BranchResponsesHistoryStore } from './dashboard/presentation/state/branch-responses-history.store';
import { BranchDashboardStore } from './dashboard/presentation/state/branch-dashboard.store';
import { BranchAdminBranchService } from './branch/data/branch-admin-branch.service';
import { BranchAdminBranchStore } from './branch/presentation/state/branch-admin-branch.store';
import { BranchUsersService } from '../branch-user/branch-users/data/branch-users.service';
import { BranchUsersStore } from '../branch-user/branch-users/presentation/state/branch-users.store';
import { questionGroupsAccessGuard } from './question-groups/presentation/guards/question-groups-access.guard';
import { QuestionGroupsService } from './question-groups/data/question-groups.service';
import { QuestionGroupsStore } from './question-groups/presentation/state/question-groups.store';
import { questionsAccessGuard } from './questions/presentation/guards/questions-access.guard';
import { QuestionsService } from './questions/data/questions.service';
import { QuestionsStore } from './questions/presentation/state/questions.store';
import { BranchSatisfactionReportService } from './reports/data/branch-satisfaction-report.service';
import { BranchTemplatesPdfReportService } from './reports/data/branch-templates-pdf-report.service';
import { BranchSatisfactionReportStore } from './reports/presentation/state/branch-satisfaction-report.store';
import { BranchTemplatesPdfReportStore } from './reports/presentation/state/branch-templates-pdf-report.store';
import { branchTemplateAccessGuard } from './templates/presentation/guards/branch-template-access.guard';
import { BranchTemplatesService } from './templates/data/branch-templates.service';
import { BranchTemplatesStore } from './templates/presentation/state/branch-templates.store';
import { AnonymousTemplatesService } from '../anonymous-templates/data/anonymous-templates.service';

export const BRANCH_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [
      BranchAdminBranchService,
      BranchAdminBranchStore,
      BranchDashboardService,
      BranchDashboardStore,
      BranchUsersService,
      BranchUsersStore,
      BranchSatisfactionReportService,
      BranchSatisfactionReportStore,
    ],
    children: [
      {
        path: '',
        canActivate: [branchDashboardAccessGuard],
        loadComponent: () =>
          import('./dashboard/presentation/pages/branch-dashboard-page.component').then(
            (m) => m.BranchDashboardPageComponent,
          ),
      },
      {
        path: 'responses',
        canActivate: [branchDashboardAccessGuard],
        providers: [BranchResponsesHistoryStore],
        loadComponent: () =>
          import('./dashboard/presentation/pages/branch-responses-history-page.component').then(
            (m) => m.BranchResponsesHistoryPageComponent,
          ),
      },
      {
        path: 'templates/dashboard',
        canActivate: [branchDashboardAccessGuard],
        loadComponent: () =>
          import('./templates/presentation/pages/branch-template-dashboard-page.component').then(
            (m) => m.BranchTemplateDashboardPageComponent,
          ),
      },
      {
        path: 'templates/responses',
        canActivate: [branchDashboardAccessGuard],
        providers: [BranchResponsesHistoryStore],
        loadComponent: () =>
          import('./templates/presentation/pages/branch-template-responses-page.component').then(
            (m) => m.BranchTemplateResponsesPageComponent,
          ),
      },
      {
        path: 'reports/templates-pdf',
        canActivate: [branchDashboardAccessGuard],
        providers: [
          AnonymousTemplatesService,
          BranchTemplatesPdfReportService,
          BranchTemplatesPdfReportStore,
        ],
        loadComponent: () =>
          import(
            './reports/presentation/pages/branch-templates-pdf-report-page.component'
          ).then((m) => m.BranchTemplatesPdfReportPageComponent),
      },
      {
        path: 'users',
        canActivate: [roleGuard(['BRANCH_ADMIN'])],
        loadComponent: () =>
          import('../branch-user/branch-users/presentation/pages/branch-users-page.component').then(
            (m) => m.BranchUsersPageComponent,
          ),
      },
      {
        path: 'questions',
        canActivate: [questionsAccessGuard],
        providers: [QuestionGroupsService, QuestionsService, QuestionsStore],
        loadComponent: () =>
          import('./questions/presentation/pages/questions-page.component').then(
            (m) => m.QuestionsPageComponent,
          ),
      },
      {
        path: 'question-groups/:groupId/questions',
        canActivate: [questionGroupsAccessGuard, questionsAccessGuard],
        providers: [QuestionGroupsService, QuestionsService, QuestionsStore],
        loadComponent: () =>
          import('./questions/presentation/pages/questions-page.component').then(
            (m) => m.QuestionsPageComponent,
          ),
      },
      {
        path: 'question-groups',
        canActivate: [questionGroupsAccessGuard],
        providers: [QuestionGroupsService, QuestionGroupsStore],
        loadComponent: () =>
          import('./question-groups/presentation/pages/question-groups-page.component').then(
            (m) => m.QuestionGroupsPageComponent,
          ),
      },
      {
        path: 'templates',
        canActivate: [branchTemplateAccessGuard],
        providers: [BranchTemplatesService, BranchTemplatesStore],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./templates/presentation/pages/branch-templates-page.component').then(
                (m) => m.BranchTemplatesPageComponent,
              ),
          },
          {
            path: ':templateId/questions',
            loadComponent: () =>
              import('./templates/presentation/pages/branch-template-questions-page.component').then(
                (m) => m.BranchTemplateQuestionsPageComponent,
              ),
          },
          {
            path: ':templateId',
            providers: [BranchResponsesHistoryStore],
            loadComponent: () =>
              import('./templates/presentation/pages/branch-template-details-page.component').then(
                (m) => m.BranchTemplateDetailsPageComponent,
              ),
          },
        ],
      },
    ],
  },
];
