import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { BranchAdminBranchService } from './branch/services/branch-admin-branch.service';
import { BranchAdminBranchStore } from './branch/state/branch-admin-branch.store';
import { BranchUsersService } from './branch-users/services/branch-users.service';
import { BranchUsersStore } from './branch-users/state/branch-users.store';
import { questionGroupsAccessGuard } from './question-groups/guards/question-groups-access.guard';
import { QuestionGroupsService } from './question-groups/services/question-groups.service';
import { QuestionGroupsStore } from './question-groups/state/question-groups.store';
import { questionsAccessGuard } from './questions/guards/questions-access.guard';
import { QuestionsService } from './questions/services/questions.service';
import { QuestionsStore } from './questions/state/questions.store';
import { branchTemplateAccessGuard } from './templates/guards/branch-template-access.guard';
import { BranchTemplatesService } from './templates/services/branch-templates.service';
import { BranchTemplatesStore } from './templates/state/branch-templates.store';

export const BRANCH_ADMIN_ROUTES: Routes = [
  {
    path: '',
    providers: [BranchAdminBranchService, BranchAdminBranchStore, BranchUsersService, BranchUsersStore],
    children: [
      {
        path: '',
        canActivate: [roleGuard(['BRANCH_ADMIN'])],
        loadComponent: () =>
          import('./pages/branch-admin-overview-page.component').then(
            (m) => m.BranchAdminOverviewPageComponent,
          ),
      },
      {
        path: 'users',
        canActivate: [roleGuard(['BRANCH_ADMIN'])],
        loadComponent: () =>
          import('./branch-users/pages/branch-users-page.component').then(
            (m) => m.BranchUsersPageComponent,
          ),
      },
      {
        path: 'questions',
        canActivate: [questionsAccessGuard],
        providers: [QuestionGroupsService, QuestionsService, QuestionsStore],
        loadComponent: () =>
          import('./questions/pages/questions-page.component').then(
            (m) => m.QuestionsPageComponent,
          ),
      },
      {
        path: 'question-groups',
        canActivate: [questionGroupsAccessGuard],
        providers: [QuestionGroupsService, QuestionGroupsStore],
        loadComponent: () =>
          import('./question-groups/pages/question-groups-page.component').then(
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
              import('./templates/pages/branch-templates-page.component').then(
                (m) => m.BranchTemplatesPageComponent,
              ),
          },
          {
            path: ':templateId',
            loadComponent: () =>
              import('./templates/pages/branch-template-details-page.component').then(
                (m) => m.BranchTemplateDetailsPageComponent,
              ),
          },
        ],
      },
    ],
  },
];
