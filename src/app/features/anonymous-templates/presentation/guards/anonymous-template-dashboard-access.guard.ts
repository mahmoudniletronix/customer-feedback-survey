import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../auth/presentation/state/auth.store';

export const anonymousTemplateDashboardAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const canAccess =
    authStore.isAuthenticated() &&
    (authStore.role() === 'BRANCH_ADMIN' || authStore.role() === 'BRANCH_USER') &&
    authStore.hasPermission('AnonymousTemplates.ViewResponses');

  return canAccess ? true : router.createUrlTree(['/dashboard']);
};
