import { Routes } from '@angular/router';

export const SUPER_ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadChildren: () => import('./branches/branches.routes').then((m) => m.BRANCHES_ROUTES)
  }
];
