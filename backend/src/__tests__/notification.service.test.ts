import mongoose from 'mongoose';
import { notificationService } from '../services/notification.service';
import { subscriptionService } from '../services/subscription.service';

const orgId = new mongoose.Types.ObjectId().toHexString();
const changedBy = { name: 'System', email: 'system@app.com' };

const makeSubscription = (daysFromNow: number, reminderDays: number[], overrides: Record<string, unknown> = {}) => ({
  toolName: `Tool-${Math.random()}`,
  vendor: `Vendor-${Math.random()}`,
  expiryDate: new Date(Date.now() + daysFromNow * 86400000),
  status: 'active' as const,
  owner: { name: 'Admin', email: 'admin@nebulaworks.com' },
  departments: ['Engineering'],
  teams: [],
  renewalReminderDays: reminderDays,
  organizationId: orgId,
  ...overrides,
});

describe('notificationService.checkRenewals', () => {
  it('returns 0 alerts when no subscriptions match reminder days', async () => {
    await subscriptionService.createSubscription(makeSubscription(100, [7]), changedBy);
    const count = await notificationService.checkRenewals();
    expect(count).toBe(0);
  });

  it('returns 0 for expired subscriptions', async () => {
    await subscriptionService.createSubscription(
      makeSubscription(-5, [7], { status: 'expired' }),
      changedBy
    );
    const count = await notificationService.checkRenewals();
    expect(count).toBe(0);
  });

  it('returns 0 for soft-deleted subscriptions', async () => {
    const sub = await subscriptionService.createSubscription(makeSubscription(7, [7]), changedBy);
    await subscriptionService.deleteSubscription(String(sub._id), orgId, changedBy);
    const count = await notificationService.checkRenewals();
    expect(count).toBe(0);
  });
});
