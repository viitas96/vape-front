import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    return router.createUrlTree(['/authentication/login']);
  }

  const allowedRoles = route.data['roles'] as readonly string[] | undefined;
  if (!allowedRoles?.length || authService.hasAnyRole(allowedRoles)) {
    return true;
  }

  return router.createUrlTree([authService.getRedirectPath()]);
};