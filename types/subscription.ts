export type PaymentCycle = 'monthly' | 'quarterly' | 'annual' | 'one-time';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'pending' | 'trial' | 'paused';

export interface SubscriptionOwner {
  name: string;
  email: string;
  userId?: string;
}

export interface Subscription {
  _id: string;
  toolName: string;
  vendor: string;
  plan?: string;
  startDate?: string;
  expiryDate: string;
  paymentCycle?: PaymentCycle;
  status: SubscriptionStatus;
  licenses?: number;
  cost?: number;
  currency?: string;
  departments: string[];
  teams: string[];
  owner: SubscriptionOwner;
  renewalReminderDays: number[];
  isDeleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionFilters {
  status?: SubscriptionStatus | '';
  department?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}
