import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export type PermissionGuardMode = 'any' | 'all';

/**
 * Route guard de permissions (Inspiré de rightGuard dans Eyassur)
 * Masque et bloque l'accès direct par URL si l'utilisateur n'a pas les droits requis.
 */
export const permissionGuard = (
  permissions: string | readonly string[],
  mode: PermissionGuardMode = 'any'
): CanActivateFn => {
  const required = (Array.isArray(permissions) ? permissions : [permissions]).filter(Boolean);

  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
      return router.createUrlTree(['/login']);
    }

    if (!required.length) {
      return true;
    }

    const allowed =
      mode === 'all'
        ? authService.hasAllPermissions(required)
        : authService.hasAnyPermission(required);

    // Fail-closed : redirection immédiate vers l'accueil si non autorisé
    return allowed ? true : router.createUrlTree(['/dashboard']);
  };
};
