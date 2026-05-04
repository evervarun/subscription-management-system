import { apiFetch } from '@/lib/api';
import { AuditLog } from '@/types/audit';
import { PaginatedResponse } from '@/types/subscription';

export interface NotificationLog extends AuditLog {
  subscription: { _id: string; toolName: string; vendor: string } | null;
}

export const auditService = {
  async getBySubscriptionId(subscriptionId: string) {
    return apiFetch<PaginatedResponse<AuditLog>>(`/audit/${subscriptionId}`);
  },

  async getRecent(): Promise<NotificationLog[]> {
    const res = await apiFetch<{ success: boolean; data: NotificationLog[] }>('/audit');
    return res.data;
  },
};
