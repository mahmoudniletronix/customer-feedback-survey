import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';

export const branchTemplateAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.canAccessTemplates()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
