export type FieldType = 'football' | 'basketball' | 'tennis' | 'padel' | 'volleyball' | 'autre';
export type FieldStatus = 'available' | 'maintenance' | 'closed';

export interface TimeSlot {
  id: number;
  field_id: number;
  start_time: string;
  end_time: string;
  date?: string;
  day_of_week?: number;
  price: number;
  is_available: boolean;
  status?: 'available' | 'booked' | 'blocked' | 'reserved' | 'pending';
  promo_label?: string | null;
  promo_price?: number | null;
  block_reason?: string | null;
  reservation?: {
    id: number;
    player_name?: string;
    player_phone?: string;
    status: string;
  };
}

export interface Field {
  id: number;
  name: string;
  description?: string;
  type?: string;
  location?: string;
  address?: string;
  city?: string;
  surface_type?: string;
  price_per_hour: number;
  hourly_rate?: number;
  photo?: string;
  photo_url?: string;
  image_url?: string;
  images?: string[];
  is_active?: boolean;
  features?: string[];
  owner_id?: number;
  created_at?: string;
  updated_at?: string;
  time_slots?: TimeSlot[];
}
