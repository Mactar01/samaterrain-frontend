export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  group: string;
}

export interface RoleDefinition {
  role: 'manager' | 'receptionist' | 'field_staff' | 'accountant' | 'custom';
  label: string;
  description: string;
  permissions: string[];
}

export interface TeamMember {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone: string;
  role: 'owner_master' | 'manager' | 'receptionist' | 'field_staff' | 'accountant' | 'custom';
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
}

export interface MyPermissionsResponse {
  is_super_admin: boolean;
  is_owner: boolean;
  role: string;
  role_label: string;
  permissions: string[];
}
