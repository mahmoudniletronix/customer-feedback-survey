import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES)
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard'
      },
      {
        path: 'dashboard',
        loadChildren: () =>
          import('./features/dashboard/dashboard.routes').then((m) => m.DASHBOARD_ROUTES)
      },
      {
        path: 'branches',
        loadChildren: () =>
          import('./features/super-admin/super-admin.routes').then((m) => m.SUPER_ADMIN_ROUTES)
      },
      {
        path: 'departments',
        loadChildren: () =>
          import('./features/super-admin/departments/departments.routes').then((m) => m.DEPARTMENTS_ROUTES)
      },
      {
        path: 'branch-admin',
        loadChildren: () =>
          import('./features/branch-admin/branch-admin.routes').then((m) => m.BRANCH_ADMIN_ROUTES)
      },
      {
        path: 'survey',
        loadChildren: () => import('./features/survey/survey.routes').then((m) => m.SURVEY_ROUTES)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then((m) => m.USERS_ROUTES)
      },
      {
        path: 'operators',
        loadChildren: () => import('./features/operators/operators.routes').then((m) => m.OPERATORS_ROUTES)
      },
      {
        path: 'operator',
        loadChildren: () =>
          import('./features/operator-workspace/operator-workspace.routes').then(
            (m) => m.OPERATOR_WORKSPACE_ROUTES,
          )
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/reports/reports.routes').then((m) => m.REPORTS_ROUTES)
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
