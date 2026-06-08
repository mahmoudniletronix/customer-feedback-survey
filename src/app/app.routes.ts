import { inject } from '@angular/core';
import { CanActivateFn, Router, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { AuthLayoutComponent } from './layout/auth-layout/auth-layout.component';
import { AuthStore } from './features/auth/presentation/state/auth.store';

const dashboardRedirectGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  if (authStore.passwordChangeRequired()) {
    return router.createUrlTree(['/auth/change-password']);
  }

  if (authStore.branchSelectionRequired()) {
    return router.createUrlTree(['/auth/login']);
  }

  const targetPath = authStore.redirectPath();

  if (targetPath !== '/dashboard') {
    return router.createUrlTree([targetPath]);
  }

  if (authStore.role() === 'SUPER_ADMIN') {
    return router.createUrlTree(['/branches']);
  }

  return router.createUrlTree(['/auth/login']);
};

export const routes: Routes = [
  {
    path: 'survey/:anonymousTemplateId',
    loadChildren: () =>
      import('./features/public-anonymous-survey/public-anonymous-survey.routes').then(
        (m) => m.PUBLIC_ANONYMOUS_SURVEY_ROUTES,
      ),
  },
  {
    path: 'auth',
    component: AuthLayoutComponent,
    canActivate: [guestGuard],
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'dashboard',
      },
      {
        path: 'dashboard',
        canActivate: [dashboardRedirectGuard],
        children: [],
      },
      {
        path: 'branches',
        loadChildren: () =>
          import('./features/super-admin/super-admin.routes').then((m) => m.SUPER_ADMIN_ROUTES),
      },
      {
        path: 'branch-areas',
        loadChildren: () =>
          import('./features/super-admin/branch-areas/branch-areas.routes').then(
            (m) => m.BRANCH_AREAS_ROUTES,
          ),
      },
      {
        path: 'departments',
        loadChildren: () =>
          import('./features/super-admin/departments/departments.routes').then(
            (m) => m.DEPARTMENTS_ROUTES,
          ),
      },
      {
        path: 'templates',
        loadChildren: () =>
          import('./features/super-admin/templates/templates.routes').then(
            (m) => m.SUPER_ADMIN_TEMPLATES_ROUTES,
          ),
      },
      {
        path: 'global-question-groups',
        loadChildren: () =>
          import('./features/super-admin/global-question-groups/global-question-groups.routes').then(
            (m) => m.GLOBAL_QUESTION_GROUPS_ROUTES,
          ),
      },
      {
        path: 'global-questions',
        loadChildren: () =>
          import('./features/super-admin/global-questions/global-questions.routes').then(
            (m) => m.GLOBAL_QUESTIONS_ROUTES,
          ),
      },
      {
        path: 'anonymous-templates',
        loadChildren: () =>
          import('./features/anonymous-templates/anonymous-templates.routes').then(
            (m) => m.ANONYMOUS_TEMPLATES_ROUTES,
          ),
      },
      {
        path: 'branch-admin',
        loadChildren: () =>
          import('./features/branch-admin/branch-admin.routes').then((m) => m.BRANCH_ADMIN_ROUTES),
      },
      {
        path: 'survey',
        loadChildren: () =>
          import('./features/branch-user/survey/survey.routes').then((m) => m.SURVEY_ROUTES),
      },
      {
        path: 'users',
        loadChildren: () =>
          import('./features/super-admin/users/users.routes').then((m) => m.USERS_ROUTES),
      },
      {
        path: 'operators',
        loadChildren: () =>
          import('./features/department-admin/operators/operators.routes').then(
            (m) => m.OPERATORS_ROUTES,
          ),
      },
      {
        path: 'operator',
        loadChildren: () =>
          import('./features/operator/workspace/operator-workspace.routes').then(
            (m) => m.OPERATOR_WORKSPACE_ROUTES,
          ),
      },
      {
        path: 'reports/department',
        loadChildren: () =>
          import('./features/department-admin/reports/department-reports.routes').then(
            (m) => m.DEPARTMENT_REPORTS_ROUTES,
          ),
      },
      {
        path: 'reports/survey-dashboard',
        loadChildren: () =>
          import('./features/reports/survey-dashboard/survey-dashboard.routes').then(
            (m) => m.SURVEY_DASHBOARD_ROUTES,
          ),
      },
      {
        path: 'reports',
        loadChildren: () =>
          import('./features/super-admin/reports/reports.routes').then((m) => m.REPORTS_ROUTES),
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'dashboard',
  },
];
