import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../features/auth/presentation/state/auth.store';

export const passwordChangeGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (!authStore.isAuthenticated()) {
    return router.createUrlTree(['/auth/login']);
  }

  if (authStore.branchSelectionRequired() && !authStore.passwordChangeRequired()) {
    return router.createUrlTree(['/auth/login']);
  }

  return true;
};
