import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';
import { permissionGuard } from './core/guards/permission.guard';

export const routes: Routes = [
  // Public auth routes
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register-owner',
    loadComponent: () =>
      import('./features/owner-register/owner-register').then(
        (m) => m.OwnerRegisterComponent
      ),
  },
  {
    path: 'update-password',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/update-password/update-password.component').then(
        (m) => m.UpdatePasswordComponent
      ),
  },

  // Owner space (protected: only authenticated 'owner' can access)
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard(['owner'])],
    children: [
      {
        path: '',
        loadComponent: () =>
          import(
            './features/owner-dashboard/dashboard/dashboard.component'
          ).then((m) => m.DashboardComponent),
      },
      {
        path: 'fields/new',
        canActivate: [permissionGuard('fields:manage')],
        loadComponent: () =>
          import('./features/owner-dashboard/create-field/create-field').then(
            (m) => m.CreateFieldComponent
          ),
      },
      {
        path: 'fields/:id/slots',
        canActivate: [permissionGuard('slots:manage')],
        loadComponent: () =>
          import('./features/owner-dashboard/manage-slots/manage-slots').then(
            (m) => m.ManageSlotsComponent
          ),
      },
      {
        path: 'reservations',
        canActivate: [permissionGuard('reservations:manage')],
        loadComponent: () =>
          import(
            './features/owner-dashboard/reservations/reservations.component'
          ).then((m) => m.ReservationsComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/owner-dashboard/profile/profile').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'settings',
        canActivate: [permissionGuard(['settings:manage', 'accounting:view'])],
        loadComponent: () =>
          import('./features/owner-dashboard/settings/settings.component').then(
            (m) => m.OwnerSettingsComponent
          ),
      },
      {
        path: 'team',
        canActivate: [permissionGuard('team:manage')],
        loadComponent: () =>
          import('./features/owner-dashboard/team/team.component').then(
            (m) => m.OwnerTeamComponent
          ),
      },
    ],
  },

  // Admin space (protected: only authenticated 'admin' can access)
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['admin'])],
    loadComponent: () =>
      import('./features/admin/layout/layout').then((m) => m.LayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/admin/dashboard/dashboard').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'statistics',
        loadComponent: () =>
          import('./features/admin/statistics/statistics').then(
            (m) => m.Statistics
          ),
      },
      {
        path: 'billing',
        loadComponent: () =>
          import('./features/admin/billing/billing').then((m) => m.Billing),
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./features/admin/settings/settings').then((m) => m.Settings),
      },
    ],
  },

  // Compatibility / Redirect shortcuts
  { path: 'admin-dashboard', redirectTo: '/admin/dashboard', pathMatch: 'full' },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // 404 Wildcard route
  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
];
