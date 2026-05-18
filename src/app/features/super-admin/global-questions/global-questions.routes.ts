import { Routes } from '@angular/router';
import { GlobalQuestionGroupsService } from '../global-question-groups/data/global-question-groups.service';
import { GlobalQuestionsService } from './data/global-questions.service';
import { globalQuestionsAccessGuard } from './presentation/guards/global-questions-access.guard';
import { GlobalQuestionsStore } from './presentation/state/global-questions.store';

export const GLOBAL_QUESTIONS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [globalQuestionsAccessGuard],
    providers: [GlobalQuestionGroupsService, GlobalQuestionsService, GlobalQuestionsStore],
    loadComponent: () =>
      import('./presentation/pages/global-question-create-page.component').then(
        (m) => m.GlobalQuestionCreatePageComponent,
      ),
  },
];

