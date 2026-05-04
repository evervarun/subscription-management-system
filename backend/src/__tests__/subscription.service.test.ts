import { subscriptionService, AppError } from '../../services/subscription.service';
import { Subscription } from '../../models/subscription.model';

const baseData = {
  toolName: 'Jira',
  vendor: 'Atlassian',
  plan: 'Standard',
  expiryDate: new Date(Date.now() + 90 * 86400000),
  paymentCycle: 'annual' as const,
  status: 'active' as const,
  licenses: 25,
  departments: ['Engineering'],
  teams: ['Backend'],
  owner: { name: 'Alice', email: 'alice@nebulaworks.com' },
  renewalReminderDays: [30, 7, 1],
};

const changedBy = { name: 'Admin', email: 'admin@nebulaworks.com' };

describe('subscriptionService.createSubscription', () => {
  it('creates a subscription successfully', async () => {
    const sub = await subscriptionService.createSubscription(baseData, changedBy);
    expect(sub.toolName).toBe('Jira');
    expect(sub.vendor).toBe('Atlassian');
    expect(sub.status).toBe('active');
  });

  it('throws 409 on duplicate toolName+vendor', async () => {
    await subscriptionService.createSubscription(baseData, changedBy);
    await expect(subscriptionService.createSubscription(baseData, changedBy)).rejects.toThrow(AppError);
    await expect(subscriptionService.createSubscription(baseData, changedBy)).rejects.toMatchObject({ statusCode: 409 });
  });

  it('allows same tool with different vendor', async () => {
    await subscriptionService.createSubscription(baseData, changedBy);
    const sub2 = await subscriptionService.createSubscription({ ...baseData, vendor: 'Other Corp' }, changedBy);
    expect(sub2.vendor).toBe('Other Corp');
  });
});

describe('subscriptionService.getSubscriptions', () => {
  beforeEach(async () => {
    await subscriptionService.createSubscription(baseData, changedBy);
    await subscriptionService.createSubscription({ ...baseData, toolName: 'Figma', vendor: 'Figma Inc.', status: 'expired' }, changedBy);
  });

  it('returns all subscriptions without filter', async () => {
    const result = await subscriptionService.getSubscriptions();
    expect(result.total).toBe(2);
  });

  it('filters by status=active', async () => {
    const result = await subscriptionService.getSubscriptions({ status: 'active' });
    expect(result.data.every(s => s.status === 'active')).toBe(true);
  });

  it('filters by status=expired', async () => {
    const result = await subscriptionService.getSubscriptions({ status: 'expired' });
    expect(result.data.every(s => s.status === 'expired')).toBe(true);
  });

  it('filters by department', async () => {
    await subscriptionService.createSubscription(
      { ...baseData, toolName: 'Darwin', vendor: 'Darwin HR', departments: ['HR'] },
      changedBy
    );
    const result = await subscriptionService.getSubscriptions({ department: 'HR' });
    expect(result.data.every(s => s.departments.includes('HR'))).toBe(true);
  });

  it('supports pagination', async () => {
    const result = await subscriptionService.getSubscriptions({}, 1, 1);
    expect(result.data).toHaveLength(1);
    expect(result.total).toBe(2);
  });
});

describe('subscriptionService.getById', () => {
  it('returns a subscription by id', async () => {
    const created = await subscriptionService.createSubscription(baseData, changedBy);
    const found = await subscriptionService.getById(String(created._id));
    expect(found.toolName).toBe('Jira');
  });

  it('throws 404 for non-existent id', async () => {
    await expect(subscriptionService.getById('000000000000000000000000')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('subscriptionService.updateSubscription', () => {
  it('updates fields correctly', async () => {
    const created = await subscriptionService.createSubscription(baseData, changedBy);
    const updated = await subscriptionService.updateSubscription(String(created._id), { plan: 'Premium' }, changedBy);
    expect(updated!.plan).toBe('Premium');
  });

  it('throws 404 for missing subscription', async () => {
    await expect(
      subscriptionService.updateSubscription('000000000000000000000000', { plan: 'x' }, changedBy)
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('subscriptionService.deleteSubscription', () => {
  it('soft-deletes a subscription', async () => {
    const created = await subscriptionService.createSubscription(baseData, changedBy);
    await subscriptionService.deleteSubscription(String(created._id), changedBy);
    const raw = await Subscription.findById(created._id);
    expect(raw?.isDeleted).toBe(true);
  });

  it('disappears from list after soft delete', async () => {
    const created = await subscriptionService.createSubscription(baseData, changedBy);
    await subscriptionService.deleteSubscription(String(created._id), changedBy);
    const result = await subscriptionService.getSubscriptions();
    expect(result.total).toBe(0);
  });

  it('throws 404 for already deleted subscription', async () => {
    const created = await subscriptionService.createSubscription(baseData, changedBy);
    await subscriptionService.deleteSubscription(String(created._id), changedBy);
    await expect(subscriptionService.deleteSubscription(String(created._id), changedBy)).rejects.toMatchObject({ statusCode: 404 });
  });
});
