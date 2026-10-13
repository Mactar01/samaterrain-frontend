import { DashboardComponent as AdminDashboardComponent } from './features/admin/dashboard/dashboard';
import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/owner-dashboard/dashboard/dashboard.component';
import { CreateFieldComponent } from './features/owner-dashboard/create-field/create-field';
import { ManageSlotsComponent } from './features/owner-dashboard/manage-slots/manage-slots';
import { ReservationsComponent } from './features/owner-dashboard/reservations/reservations.component';
import { ProfileComponent } from './features/owner-dashboard/profile/profile';
import { OwnerRegisterComponent } from './features/owner-register/owner-register';

import { LayoutComponent } from './features/admin/layout/layout';
import { Statistics } from './features/admin/statistics/statistics';
import { Billing } from './features/admin/billing/billing';
import { Settings } from './features/admin/settings/settings';

export const routes: Routes = [
  { 
    path: 'admin', 
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'statistics', component: Statistics },
      { path: 'billing', component: Billing },
      { path: 'settings', component: Settings }
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'dashboard/fields/new', component: CreateFieldComponent },
  { path: 'dashboard/fields/:id/slots', component: ManageSlotsComponent },
  { path: 'dashboard/reservations', component: ReservationsComponent },
  { path: 'dashboard/profile', component: ProfileComponent },
  { path: 'register-owner', component: OwnerRegisterComponent },
  { path: 'admin-dashboard', redirectTo: '/admin/dashboard', pathMatch: 'full' }
];

