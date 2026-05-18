import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';

export const globalQuestionGroupsAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.canAccessGlobalQuestionGroups()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
