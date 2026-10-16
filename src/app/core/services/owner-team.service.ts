import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TeamResponse,
  PermissionsMatrixResponse,
  MyPermissionsResponse,
  TeamMember
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
}
