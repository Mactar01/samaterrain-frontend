import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  // Public auth routes (guest guarded so logged-in users are redirected to their dashboard)
  {
    path: 'login',
    canActivate: [guestGuard],
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
        loadComponent: () =>
          import('./features/owner-dashboard/create-field/create-field').then(
            (m) => m.CreateFieldComponent
          ),
      },
      {
        path: 'fields/:id/slots',
        loadComponent: () =>
          import('./features/owner-dashboard/manage-slots/manage-slots').then(
            (m) => m.ManageSlotsComponent
          ),
      },
      {
        path: 'reservations',
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
