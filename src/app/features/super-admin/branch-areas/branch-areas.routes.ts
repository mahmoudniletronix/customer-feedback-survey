import { Routes } from '@angular/router';
import { BranchAreasService } from './data/branch-areas.service';
import { branchAreaCreateAccessGuard } from './presentation/guards/branch-area-create-access.guard';
import { branchAreaDetailsAccessGuard } from './presentation/guards/branch-area-details-access.guard';
import { branchAreasAccessGuard } from './presentation/guards/branch-areas-access.guard';
import { BranchAreaCreateStore } from './presentation/state/branch-area-create.store';
import { BranchAreaDetailsStore } from './presentation/state/branch-area-details.store';
import { BranchAreasStore } from './presentation/state/branch-areas.store';

export const BRANCH_AREAS_ROUTES: Routes = [
  {
    path: '',
    pathMatch: 'full',
    canActivate: [branchAreasAccessGuard],
    providers: [BranchAreasService, BranchAreasStore],
    loadComponent: () =>
      import('./presentation/pages/branch-areas-page.component').then(
        (m) => m.BranchAreasPageComponent,
      ),
  },
  {
    path: 'create',
    canActivate: [branchAreaCreateAccessGuard],
    providers: [BranchAreasService, BranchAreaCreateStore],
    loadComponent: () =>
      import('./presentation/pages/branch-area-create-page.component').then(
        (m) => m.BranchAreaCreatePageComponent,
      ),
  },
  {
    path: ':branchAreaId',
    canActivate: [branchAreaDetailsAccessGuard],
    providers: [BranchAreasService, BranchAreaDetailsStore],
    loadComponent: () =>
      import('./presentation/pages/branch-area-details-page.component').then(
        (m) => m.BranchAreaDetailsPageComponent,
      ),
  },
];
