import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../auth/presentation/state/auth.store';

export const anonymousTemplateAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.canAccessAnonymousTemplates()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
