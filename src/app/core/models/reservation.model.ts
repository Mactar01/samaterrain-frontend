import { Field, TimeSlot } from './field.model';
import { User } from './user.model';

export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id?: number;
  amount: number;
  status: PaymentStatus | string;
  payment_method?: string;
  transaction_id?: string;
  created_at?: string;
}

export interface Reservation {
  id: number;
  field_id: number;
  field?: Field;
  user_id?: number;
  user?: User;
  time_slot_id: number;
  time_slot?: TimeSlot;
  start_time: string;
  end_time: string;
  reservation_date?: string;
  date?: string;
  total_price: number;
  status: ReservationStatus;
  payment_status?: PaymentStatus;
  payment_method?: string;
  payment?: Payment;
  player_name?: string;
  player_phone?: string;
  guest_name?: string;
  guest_phone?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}
