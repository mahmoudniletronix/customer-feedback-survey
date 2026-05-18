import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';

export const globalQuestionsAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.canAccessGlobalQuestions()) {
    return true;
  }

  return router.createUrlTree(['/dashboard']);
};
