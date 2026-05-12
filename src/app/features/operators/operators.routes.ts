import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { OperatorsService } from './services/operators.service';
import { OperatorsStore } from './state/operators.store';

export const OPERATORS_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPER_ADMIN', 'DEPARTMENT_ADMIN'])],
    providers: [OperatorsService, OperatorsStore],
    loadComponent: () => import('./pages/operators-page.component').then((m) => m.OperatorsPageComponent),
  },
];
