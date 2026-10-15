export interface Owner {
  id: number;
  name: string;
  email: string;
  phone?: string;
  is_active?: boolean;
  fields_count?: number;
  reservations_count?: number;
  total_revenue?: number;
  created_at?: string;
  updated_at?: string;
}

export interface OwnerDashboardStats {
  total_revenue: number;
  total_reservations: number;
  active_fields: number;
  occupancy_rate: number;
}
