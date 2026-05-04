import { Types } from 'mongoose';
import { auditRepository } from '../repositories/audit.repository';
import { AuditAction } from '../models/audit.model';

const SYSTEM_USER = { name: 'System', email: 'system@app.com' };

export const auditService = {
  async log(
    subscriptionId: Types.ObjectId | string,
    action: AuditAction,
    changedBy: { name: string; email: string; userId?: string } = SYSTEM_USER,
    changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> }
  ) {
    return auditRepository.create({ subscriptionId, action, changedBy, changes });
  },

  async getBySubscriptionId(subscriptionId: string) {
    return auditRepository.findBySubscriptionId(subscriptionId);
  },

  async getRecentByOrg(organizationId: string, limit = 20) {
    return auditRepository.findRecentByOrg(organizationId, limit);
  },
};
