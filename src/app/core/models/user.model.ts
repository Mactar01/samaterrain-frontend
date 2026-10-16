export type UserRole = 'admin' | 'owner' | 'player';

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  is_active?: boolean;
  must_change_password?: boolean;
  created_at?: string;
  updated_at?: string;
  owner?: {
    id: number;
    business_name: string;
    is_verified?: boolean;
    is_primary?: boolean;
    role?: string;
    role_label?: string;
    permissions?: string[];
  };
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
