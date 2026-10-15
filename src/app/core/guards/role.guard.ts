import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (authService.isBlocked()) {
      authService.clearSession();
      return router.createUrlTree(['/login'], {
        queryParams: { error: 'blocked' }
      });
    }

    const currentRole = authService.getUserRole();
    if (currentRole && allowedRoles.includes(currentRole)) {
      if (currentRole === 'owner' && authService.currentUserValue?.must_change_password) {
        return router.createUrlTree(['/update-password']);
      }
      return true;
    }

    // Role mismatch: redirect to appropriate destination
    if (currentRole === 'admin') {
      return router.createUrlTree(['/admin/dashboard']);
    } else if (currentRole === 'owner') {
      return router.createUrlTree(['/dashboard']);
    }

    return router.createUrlTree(['/login']);
  };
};
