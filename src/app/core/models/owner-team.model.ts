export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  group: string;
}

export interface RoleDefinition {
  role: string;
  label: string;
  description: string;
  permissions: string[];
  is_system?: boolean;
  is_custom?: boolean;
}

export interface CustomRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_system?: boolean;
  created_at?: string;
}

export interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  role_label: string;
  permissions: string[];
  is_active: boolean;
  is_primary: boolean;
  created_at: string;
}

export interface TeamResponse {
  owner: {
    id: number;
    business_name: string;
  };
  members: TeamMember[];
  total_members: number;
}

export interface PermissionsMatrixResponse {
  available_permissions: PermissionDefinition[];
  default_roles: RoleDefinition[];
  custom_roles?: CustomRole[];
}

export interface AssignRoleRightsPayload {
  role_id: string;
  permissions: string[];
}

export interface CreateCustomRolePayload {
  name: string;
  description?: string;
  permissions: string[];
}

export interface MyPermissionsResponse {
  is_super_admin: boolean;
  is_owner: boolean;
  role: string;
  role_label: string;
  permissions: string[];
}
