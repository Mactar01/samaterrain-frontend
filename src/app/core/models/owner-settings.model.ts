export interface WhatsAppSmsSettings {
  whatsapp_enabled: boolean;
  sms_enabled: boolean;
  phone_number: string;
  notify_on_new_booking: boolean;
  notify_reminder_hours: number;
  custom_welcome_message: string;
}

export interface SubscriptionsSettings {
  enabled: boolean;
  discount_quarterly: number;
  discount_semiannual: number;
  discount_annual: number;
  allow_priority_booking: boolean;
  corporate_billing: boolean;
  billing_frequency?: string;
}

export interface MatchmakingSettings {
  enabled: boolean;
  min_players_required: number;
  max_players_allowed: number;
  auto_split_cost: boolean;
  auto_cancel_hours: number;
  allow_guest_join?: boolean;
}

export interface LoyaltySettings {
  loyalty_enabled: boolean;
  bookings_required: number;
  reward_discount_fcfa: number;
  referral_enabled: boolean;
  referral_reward_fcfa: number;
  custom_referral_code: string;
}

export interface AccountingSettings {
  default_export_format: 'csv' | 'excel';
  include_customer_phone: boolean;
  fiscal_year_start_month?: number;
}

export interface OwnerSettings {
  whatsapp_sms: WhatsAppSmsSettings;
  subscriptions: SubscriptionsSettings;
  matchmaking: MatchmakingSettings;
  loyalty: LoyaltySettings;
  accounting: AccountingSettings;
}

export interface AccountingReport {
  year: number;
  month: number | null;
  commission_rate: number;
  total_bookings: number;
  confirmed_bookings: number;
  cancelled_bookings: number;
  total_gross_revenue: number;
  total_commission: number;
  net_payout: number;
  fields_summary: Array<{
    field_id: number;
    name: string;
    count: number;
    revenue: number;
  }>;
  monthly_revenue: number[];
  recent_reservations: Array<{
    id: number;
    client_name: string;
    client_phone: string;
    field_name: string;
    date: string;
    time_slot: string;
    total_price: number;
    commission: number;
    net_amount: number;
    status: string;
    created_at: string;
  }>;
}

export const DEFAULT_OWNER_SETTINGS: OwnerSettings = {
  whatsapp_sms: {
    whatsapp_enabled: true,
    sms_enabled: true,
    phone_number: '',
    notify_on_new_booking: true,
    notify_reminder_hours: 2,
    custom_welcome_message: 'Bonjour {client_name}, votre réservation pour le terrain {field_name} le {date} à {time} est confirmée ! À très bientôt chez {business_name}.',
  },
  subscriptions: {
    enabled: true,
    discount_quarterly: 10,
    discount_semiannual: 15,
    discount_annual: 20,
    allow_priority_booking: true,
    corporate_billing: true,
    billing_frequency: 'monthly',
  },
  matchmaking: {
    enabled: true,
    min_players_required: 10,
    max_players_allowed: 14,
    auto_split_cost: true,
    auto_cancel_hours: 3,
    allow_guest_join: true,
  },
  loyalty: {
    loyalty_enabled: true,
    bookings_required: 5,
    reward_discount_fcfa: 5000,
    referral_enabled: true,
    referral_reward_fcfa: 2000,
    custom_referral_code: '',
  },
  accounting: {
    default_export_format: 'csv',
    include_customer_phone: true,
    fiscal_year_start_month: 1,
  },
};
