import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../../auth/presentation/state/auth.store';

export const branchDashboardAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.canAccessBranchDashboard()) {
    return true;
  }

  return router.createUrlTree([authStore.redirectPath()]);
};

