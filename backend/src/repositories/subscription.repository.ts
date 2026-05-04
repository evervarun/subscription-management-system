import { Subscription, ISubscription } from '../models/subscription.model';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterQuery = Record<string, any>;

export interface SubscriptionFilters {
  status?: string;
  department?: string;
}

export const subscriptionRepository = {
  async findAll(organizationId: string, filters: SubscriptionFilters = {}, page = 1, limit = 10) {
    const query: FilterQuery = { isDeleted: false, organizationId };
    if (filters.status) query.status = filters.status;
    if (filters.department) query.departments = filters.department;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Subscription.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Subscription.countDocuments(query),
    ]);
    return { data, total };
  },

  async findById(id: string, organizationId: string) {
    return Subscription.findOne({ _id: id, isDeleted: false, organizationId }).lean();
  },

  async findByToolAndVendor(toolName: string, vendor: string, organizationId: string) {
    return Subscription.findOne({ toolName, vendor, organizationId, isDeleted: false }).lean();
  },

  async create(data: Partial<ISubscription>) {
    return Subscription.create(data);
  },

  async update(id: string, organizationId: string, data: Partial<ISubscription>) {
    return Subscription.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: data },
      { new: true, runValidators: true }
    ).lean();
  },

  async softDelete(id: string, organizationId: string) {
    return Subscription.findOneAndUpdate(
      { _id: id, organizationId },
      { $set: { isDeleted: true } },
      { new: true }
    ).lean();
  },

  // Global (cron) — no org filter intentional
  async findExpiredActive() {
    return Subscription.find({
      isDeleted: false,
      status: 'active',
      expiryDate: { $lt: new Date() },
    }).lean();
  },

  async findActiveWithReminderDays(daysUntilExpiry: number) {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysUntilExpiry);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    return Subscription.find({
      isDeleted: false,
      status: 'active',
      expiryDate: { $gte: startOfDay, $lte: endOfDay },
      renewalReminderDays: daysUntilExpiry,
    }).lean();
  },
};
