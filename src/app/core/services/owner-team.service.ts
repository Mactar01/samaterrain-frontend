import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TeamResponse,
  PermissionsMatrixResponse,
  MyPermissionsResponse,
  TeamMember,
  CollaboratorAdditionalInfo
} from '../models/owner-team.model';

@Injectable({
  providedIn: 'root'
})
export class OwnerTeamService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère tous les membres de l'équipe du complexe
   */
  getTeamMembers(): Observable<TeamResponse> {
    return this.http.get<TeamResponse>(`${this.apiUrl}/owner/team`);
  }

  /**
   * Récupère la matrice des rôles et permissions disponibles
   */
  getPermissionsMatrix(): Observable<PermissionsMatrixResponse> {
    return this.http.get<PermissionsMatrixResponse>(`${this.apiUrl}/owner/team/permissions-matrix`);
  }

  /**
   * Récupère les permissions de l'utilisateur actuellement connecté
   */
  getMyPermissions(): Observable<MyPermissionsResponse> {
    return this.http.get<MyPermissionsResponse>(`${this.apiUrl}/owner/me/permissions`);
  }

  /**
   * Ajoute un collaborateur avec un rôle ou des permissions spécifiques
   */
  addCollaborator(data: {
    name: string;
    email: string;
    phone?: string;
    role: string;
    permissions?: string[];
    password?: string;
    additional_info?: CollaboratorAdditionalInfo;
  }): Observable<{ message: string; collaborator: TeamMember }> {
    return this.http.post<{ message: string; collaborator: TeamMember }>(
      `${this.apiUrl}/owner/team`,
      data
    );
  }

  /**
   * Met à jour le rôle, les permissions ou le statut actif d'un collaborateur
   */
  updateCollaborator(
    id: number,
    data: {
      role?: string;
      permissions?: string[];
      is_active?: boolean;
    }
  ): Observable<{ message: string; collaborator: TeamMember }> {
    return this.http.put<{ message: string; collaborator: TeamMember }>(
      `${this.apiUrl}/owner/team/${id}`,
      data
    );
  }

  /**
   * Retire un collaborateur de l'équipe du complexe
   */
  removeCollaborator(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/owner/team/${id}`);
  }

  /**
   * Assigne des droits à un rôle (Inspiré d'eyassur assignOrganismRights)
   */
  assignRoleRights(payload: { role_id: string; permissions: string[] }): Observable<{ message: string; role_id: string; permissions: string[] }> {
    return this.http.post<{ message: string; role_id: string; permissions: string[] }>(
      `${this.apiUrl}/owner/team/assign-role-rights`,
      payload
    );
  }

  /**
   * Crée un nouveau rôle personnalisé pour le complexe
   */
  createCustomRole(payload: { name: string; description?: string; permissions: string[] }): Observable<{ message: string; role: any; roles: any[] }> {
    return this.http.post<{ message: string; role: any; roles: any[] }>(
      `${this.apiUrl}/owner/team/custom-roles`,
      payload
    );
  }

  /**
   * Met à jour un rôle personnalisé pour le complexe
   */
  updateCustomRole(roleId: string, payload: { name?: string; description?: string; permissions?: string[] }): Observable<{ message: string; role: any; roles: any[] }> {
    return this.http.put<{ message: string; role: any; roles: any[] }>(
      `${this.apiUrl}/owner/team/custom-roles/${roleId}`,
      payload
    );
  }

  /**
   * Supprime un rôle personnalisé
   */
  deleteCustomRole(roleId: string): Observable<{ message: string; roles: any[] }> {
    return this.http.delete<{ message: string; roles: any[] }>(
      `${this.apiUrl}/owner/team/custom-roles/${roleId}`
    );
  }

  /**
   * Mettre à jour les informations complémentaires d'un collaborateur (par le gérant)
   */
  updateAdditionalInfo(
    id: number,
    additional_info: CollaboratorAdditionalInfo
  ): Observable<{ message: string; additional_info: CollaboratorAdditionalInfo }> {
    return this.http.put<{ message: string; additional_info: CollaboratorAdditionalInfo }>(
      `${this.apiUrl}/owner/team/${id}/additional-info`,
      { additional_info }
    );
  }

  /**
   * Consulter ses propres informations complémentaires (par le collaborateur connecté)
   */
  getMyCollaboratorProfile(): Observable<{
    user: { id: number; name: string; email: string; phone: string };
    additional_info: CollaboratorAdditionalInfo | null;
    role: string;
    role_label: string;
  }> {
    return this.http.get<{
      user: { id: number; name: string; email: string; phone: string };
      additional_info: CollaboratorAdditionalInfo | null;
      role: string;
      role_label: string;
    }>(`${this.apiUrl}/owner/me/collaborator-profile`);
  }

  /**
   * Mettre à jour ses propres informations complémentaires (par le collaborateur connecté)
   */
  updateMyCollaboratorProfile(
    additional_info: CollaboratorAdditionalInfo
  ): Observable<{ message: string; additional_info: CollaboratorAdditionalInfo }> {
    return this.http.put<{ message: string; additional_info: CollaboratorAdditionalInfo }>(
      `${this.apiUrl}/owner/me/collaborator-profile`,
      { additional_info }
    );
  }
}
