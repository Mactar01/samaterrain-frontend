import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    const role = authService.getUserRole();
    if (role === 'admin') {
      return router.createUrlTree(['/admin/dashboard']);
    } else if (role === 'owner') {
      return router.createUrlTree(['/dashboard']);
    }
  }

  return true;
};
