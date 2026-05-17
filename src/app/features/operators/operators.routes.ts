import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { OperatorsService } from './data/operators.service';
import { OperatorsStore } from './presentation/state/operators.store';

export const OPERATORS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPER_ADMIN', 'DEPARTMENT_ADMIN'])],
    providers: [OperatorsService, OperatorsStore],
    loadComponent: () => import('./presentation/pages/operators-page.component').then((m) => m.OperatorsPageComponent),
  },
];
