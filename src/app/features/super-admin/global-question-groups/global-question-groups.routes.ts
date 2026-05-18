import { Routes } from '@angular/router';
import { GlobalQuestionGroupsService } from './data/global-question-groups.service';
import { GlobalQuestionGroupsStore } from './presentation/state/global-question-groups.store';
import { globalQuestionGroupsAccessGuard } from './presentation/guards/global-question-groups-access.guard';

export const GLOBAL_QUESTION_GROUPS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [globalQuestionGroupsAccessGuard],
    providers: [GlobalQuestionGroupsService, GlobalQuestionGroupsStore],
    loadComponent: () =>
      import('./presentation/pages/global-question-groups-page.component').then(
        (m) => m.GlobalQuestionGroupsPageComponent,
      ),
  },
];
