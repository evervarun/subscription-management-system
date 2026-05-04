import { apiFetch } from '@/lib/api';
import { AuditLog } from '@/types/audit';
import { PaginatedResponse } from '@/types/subscription';

export const auditService = {
  async getBySubscriptionId(subscriptionId: string) {
    return apiFetch<PaginatedResponse<AuditLog>>(`/audit/${subscriptionId}`);
  },
};
