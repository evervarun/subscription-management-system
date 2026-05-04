import mongoose from 'mongoose';
import { statusService } from '../services/status.service';
import { subscriptionService } from '../services/subscription.service';

const orgId = new mongoose.Types.ObjectId().toHexString();
const changedBy = { name: 'System', email: 'system@app.com' };

const makeSubscription = (overrides: Record<string, unknown> = {}) => ({
  toolName: 'TestTool',
  vendor: 'TestVendor',
  expiryDate: new Date(Date.now() + 90 * 86400000),
  status: 'active' as const,
  owner: { name: 'Admin', email: 'admin@nebulaworks.com' },
  departments: ['Engineering'],
  teams: [],
  renewalReminderDays: [30, 7, 1],
  organizationId: orgId,
  ...overrides,
});

describe('statusService.syncExpiredStatuses', () => {
  it('marks expired subscriptions when expiryDate is past', async () => {
    await subscriptionService.createSubscription(
      makeSubscription({ expiryDate: new Date(Date.now() - 2 * 86400000) }),
      changedBy
    );
    const count = await statusService.syncExpiredStatuses();
    expect(count).toBe(1);

    const result = await subscriptionService.getSubscriptions(orgId, { status: 'expired' });
    expect(result.data).toHaveLength(1);
  });

  it('does not touch subscriptions that are not yet expired', async () => {
    await subscriptionService.createSubscription(
      makeSubscription({ expiryDate: new Date(Date.now() + 10 * 86400000) }),
      changedBy
    );
    const count = await statusService.syncExpiredStatuses();
    expect(count).toBe(0);
  });

  it('skips already-expired subscriptions', async () => {
    await subscriptionService.createSubscription(
      makeSubscription({ expiryDate: new Date(Date.now() - 2 * 86400000), status: 'expired' }),
      changedBy
    );
    const count = await statusService.syncExpiredStatuses();
    expect(count).toBe(0);
  });

  it('skips soft-deleted subscriptions', async () => {
    const sub = await subscriptionService.createSubscription(
      makeSubscription({ expiryDate: new Date(Date.now() - 2 * 86400000) }),
      changedBy
    );
    await subscriptionService.deleteSubscription(String(sub._id), orgId, changedBy);
    const count = await statusService.syncExpiredStatuses();
    expect(count).toBe(0);
  });

  it('handles multiple expired subscriptions', async () => {
    await subscriptionService.createSubscription(
      makeSubscription({ toolName: 'A', expiryDate: new Date(Date.now() - 1 * 86400000) }),
      changedBy
    );
    await subscriptionService.createSubscription(
      makeSubscription({ toolName: 'B', vendor: 'V2', expiryDate: new Date(Date.now() - 3 * 86400000) }),
      changedBy
    );
    const count = await statusService.syncExpiredStatuses();
    expect(count).toBe(2);
  });
});
