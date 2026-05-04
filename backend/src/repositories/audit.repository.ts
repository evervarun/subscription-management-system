import { AuditLog, AuditAction } from '../models/audit.model';
import { Types } from 'mongoose';

export const auditRepository = {
  async create(entry: {
    subscriptionId: Types.ObjectId | string;
    action: AuditAction;
    changedBy: { name: string; email: string; userId?: string };
    changes?: { before?: Record<string, unknown>; after?: Record<string, unknown> };
  }) {
    return AuditLog.create(entry);
  },

  async findBySubscriptionId(subscriptionId: string) {
    return AuditLog.find({ subscriptionId })
      .sort({ timestamp: -1 })
      .lean();
  },
};
