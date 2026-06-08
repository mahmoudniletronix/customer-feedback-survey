import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../features/auth/presentation/state/auth.store';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.isAuthenticated()) {
    if (authStore.passwordChangeRequired()) {
      return router.createUrlTree(['/auth/change-password']);
    }

    if (authStore.branchSelectionRequired()) {
      return router.createUrlTree(['/auth/login']);
    }

    return true;
  }

  return router.createUrlTree(['/auth/login']);
};
