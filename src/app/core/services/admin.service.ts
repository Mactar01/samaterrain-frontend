import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = `${environment.apiUrl}/admin`;
  private publicApiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }

  getOwners(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/owners`);
  }

  createOwner(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/owners`, data);
  }

  updateOwner(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/owners/${id}`, data);
  }

  toggleOwnerStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/owners/${id}/toggle-status`, {});
  }

  deleteOwner(ownerId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/owners/${ownerId}`);
  }

  getDetailedStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/detailed-stats`);
  }

  getBilling(): Observable<any> {
    return this.http.get(`${this.apiUrl}/billing`);
  }

  // ---- Invitations ----
  inviteOwner(data: { email?: string; business_name?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/owners/invite`, data);
  }

  validateInviteToken(token: string): Observable<any> {
    return this.http.get(`${this.publicApiUrl}/owners/invite-check?token=${token}`);
  }

  registerFromInvitation(data: any): Observable<any> {
    return this.http.post(`${this.publicApiUrl}/owners/register-from-invite`, data);
  }

  // ---- Platform Roles & Permissions ----
  getPlatformRoles(): Observable<{ roles: any[]; available_permissions: any[] }> {
    return this.http.get<{ roles: any[]; available_permissions: any[] }>(`${this.apiUrl}/platform-roles`);
  }

  createPlatformRole(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/platform-roles`, data);
  }

  updatePlatformRole(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/platform-roles/${id}`, data);
  }

  deletePlatformRole(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/platform-roles/${id}`);
  }

  // ---- Super Admins ----
  getSuperAdmins(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/super-admins`);
  }

  createSuperAdmin(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/super-admins`, data);
  }

  updateSuperAdmin(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/super-admins/${id}`, data);
  }

  deleteSuperAdmin(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/super-admins/${id}`);
  }

  toggleSuperAdminStatus(id: number): Observable<any> {
    return this.http.patch(`${this.apiUrl}/super-admins/${id}/toggle-status`, {});
  }
}

