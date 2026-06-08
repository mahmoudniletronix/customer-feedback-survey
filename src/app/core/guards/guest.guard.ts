import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../features/auth/presentation/state/auth.store';

export const guestGuard: CanActivateFn = (_route, state) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);
  const isChangePasswordRoute = state.url.startsWith('/auth/change-password');
  const isLoginRoute = state.url.startsWith('/auth/login');

  if (!authStore.isAuthenticated()) {
    return true;
  }

  if (authStore.passwordChangeRequired()) {
    return isChangePasswordRoute ? true : router.createUrlTree(['/auth/change-password']);
  }

  if (authStore.branchSelectionRequired()) {
    return isLoginRoute ? true : router.createUrlTree(['/auth/login']);
  }

  if (isChangePasswordRoute) {
    return true;
  }

  return router.createUrlTree([authStore.redirectPath()]);
};
