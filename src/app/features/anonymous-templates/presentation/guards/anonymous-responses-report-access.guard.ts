import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthStore } from '../../../auth/presentation/state/auth.store';

export const anonymousResponsesReportAccessGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  return authStore.isAuthenticated() && authStore.canAccessBranchDashboard()
    ? true
    : router.createUrlTree(['/dashboard']);
};
