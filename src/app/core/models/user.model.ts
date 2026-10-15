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
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}
