import { AuditLog, AuditAction } from '../models/audit.model';
import { Subscription } from '../models/subscription.model';
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

  async findRecentByOrg(organizationId: string, limit = 20) {
    // Get all subscription IDs for the org
    const subs = await Subscription.find({ organizationId }, { _id: 1, toolName: 1, vendor: 1 }).lean();
    const subIds = subs.map((s) => s._id);
    const subMap = new Map(subs.map((s) => [String(s._id), s]));

    const logs = await AuditLog.find({ subscriptionId: { $in: subIds } })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return logs.map((log) => ({
      ...log,
      subscription: subMap.get(String(log.subscriptionId)) ?? null,
    }));
  },
};
