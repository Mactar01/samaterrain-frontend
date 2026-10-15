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

    const currentRole = authService.getUserRole();
    if (currentRole && allowedRoles.includes(currentRole)) {
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
