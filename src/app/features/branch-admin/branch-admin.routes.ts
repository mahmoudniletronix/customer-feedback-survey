import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
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
import { BranchSatisfactionReportStore } from './reports/presentation/state/branch-satisfaction-report.store';
import { branchTemplateAccessGuard } from './templates/presentation/guards/branch-template-access.guard';
import { BranchTemplatesService } from './templates/data/branch-templates.service';
import { BranchTemplatesStore } from './templates/presentation/state/branch-templates.store';

export const BRANCH_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [
      BranchAdminBranchService,
      BranchAdminBranchStore,
      BranchUsersService,
      BranchUsersStore,
      BranchSatisfactionReportService,
      BranchSatisfactionReportStore,
    ],
    children: [
      {
        path: '',
        canActivate: [roleGuard(['BRANCH_ADMIN'])],
        loadComponent: () =>
          import('./presentation/pages/branch-admin-overview-page.component').then(
            (m) => m.BranchAdminOverviewPageComponent,
          ),
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
