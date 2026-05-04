import { apiFetch } from '@/lib/api';
import { Subscription, SubscriptionFilters, PaginatedResponse, ApiResponse } from '@/types/subscription';

export const subscriptionService = {
  async getAll(filters: SubscriptionFilters = {}) {
    const params = new URLSearchParams();
    if (filters.status) params.set('status', filters.status);
    if (filters.department) params.set('department', filters.department);
    if (filters.page) params.set('page', String(filters.page));
    if (filters.limit) params.set('limit', String(filters.limit));
    const qs = params.toString();
    return apiFetch<PaginatedResponse<Subscription>>(`/subscriptions${qs ? `?${qs}` : ''}`);
  },

  async getById(id: string) {
    return apiFetch<ApiResponse<Subscription>>(`/subscriptions/${id}`);
  },

  async create(data: Partial<Subscription>) {
    return apiFetch<ApiResponse<Subscription>>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async update(id: string, data: Partial<Subscription>) {
    return apiFetch<ApiResponse<Subscription>>(`/subscriptions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async remove(id: string) {
    return apiFetch<ApiResponse<null>>(`/subscriptions/${id}`, { method: 'DELETE' });
  },
};
