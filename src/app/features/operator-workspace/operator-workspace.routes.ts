import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { OperatorTemplatesService } from './services/operator-templates.service';
import { OperatorTemplatesStore } from './state/operator-templates.store';

export const OPERATOR_WORKSPACE_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'templates',
  },
  {
    path: 'templates',
    canActivate: [roleGuard(['OPERATOR'])],
    providers: [OperatorTemplatesService, OperatorTemplatesStore],
    loadComponent: () =>
      import('./pages/operator-my-templates-page.component').then(
        (m) => m.OperatorMyTemplatesPageComponent,
      ),
  },
];
