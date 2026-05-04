import mongoose from 'mongoose';
import { ISubscription } from '../models/subscription.model';
import { subscriptionRepository, SubscriptionFilters } from '../repositories/subscription.repository';
import { auditService } from './audit.service';

type OrgId = string | mongoose.Types.ObjectId;
type CreateInput = Omit<Partial<ISubscription>, 'organizationId'> & { organizationId: OrgId };

interface ChangedBy {
  name: string;
  email: string;
  userId?: string;
}

const SYSTEM_USER: ChangedBy = { name: 'System', email: 'system@app.com' };

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = 'AppError';
  }
}

export const subscriptionService = {
  async createSubscription(
    data: CreateInput,
    changedBy: ChangedBy = SYSTEM_USER
  ) {
    const existing = await subscriptionRepository.findByToolAndVendor(
      data.toolName!,
      data.vendor!,
      String(data.organizationId)
    );
    if (existing) {
      throw new AppError(409, `Subscription for "${data.toolName}" by "${data.vendor}" already exists`);
    }
    const subscription = await subscriptionRepository.create(data as Partial<ISubscription>);
    await auditService.log(String(subscription._id), 'created', changedBy, {
      after: subscription.toObject() as unknown as Record<string, unknown>,
    });
    return subscription;
  },

  async getSubscriptions(organizationId: string, filters: SubscriptionFilters = {}, page = 1, limit = 10) {
    return subscriptionRepository.findAll(organizationId, filters, page, limit);
  },

  async getById(id: string, organizationId: string) {
    const subscription = await subscriptionRepository.findById(id, organizationId);
    if (!subscription) throw new AppError(404, 'Subscription not found');
    return subscription;
  },

  async updateSubscription(
    id: string,
    organizationId: string,
    data: Partial<ISubscription>,
    changedBy: ChangedBy = SYSTEM_USER
  ) {
    const before = await subscriptionRepository.findById(id, organizationId);
    if (!before) throw new AppError(404, 'Subscription not found');

    const action =
      data.status && data.status !== before.status
        ? 'status_changed'
        : data.owner && data.owner.email !== before.owner.email
          ? 'ownership_changed'
          : 'updated';

    const updated = await subscriptionRepository.update(id, organizationId, data);
    await auditService.log(id, action, changedBy, {
      before: before as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });
    return updated;
  },

  async deleteSubscription(id: string, organizationId: string, changedBy: ChangedBy = SYSTEM_USER) {
    const existing = await subscriptionRepository.findById(id, organizationId);
    if (!existing) throw new AppError(404, 'Subscription not found');

    const deleted = await subscriptionRepository.softDelete(id, organizationId);
    await auditService.log(id, 'deleted', changedBy, {
      before: existing as unknown as Record<string, unknown>,
    });
    return deleted;
  },
};
