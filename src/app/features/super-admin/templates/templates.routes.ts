import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/guards/role.guard';
import { BranchesService } from '../branches/data/branches.service';
import { SuperAdminTemplatesService } from './data/super-admin-templates.service';
import { SuperAdminTemplatesStore } from './presentation/state/super-admin-templates.store';

export const SUPER_ADMIN_TEMPLATES_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard(['SUPER_ADMIN'])],
    providers: [BranchesService, SuperAdminTemplatesService, SuperAdminTemplatesStore],
    loadComponent: () =>
      import('./presentation/pages/super-admin-templates-page.component').then(
        (m) => m.SuperAdminTemplatesPageComponent,
      ),
  },
];
