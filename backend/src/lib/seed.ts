import 'dotenv/config';
import { connectDB } from './db';
import { Subscription } from '../models/subscription.model';
import { logger } from './logger';

const seedData = [
  {
    toolName: 'Slack',
    vendor: 'Salesforce',
    plan: 'Pro',
    expiryDate: new Date(Date.now() + 30 * 86400000),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 50,
    departments: ['Engineering', 'Product'],
    teams: ['Frontend', 'Backend'],
    owner: { name: 'Alice Johnson', email: 'alice@company.com' },
    renewalReminderDays: [30, 7, 1],
  },
  {
    toolName: 'Jira',
    vendor: 'Atlassian',
    plan: 'Standard',
    expiryDate: new Date(Date.now() - 5 * 86400000),
    paymentCycle: 'monthly',
    status: 'expired',
    licenses: 25,
    departments: ['Engineering'],
    teams: ['Backend', 'QA'],
    owner: { name: 'Bob Smith', email: 'bob@company.com' },
    renewalReminderDays: [30, 7],
  },
  {
    toolName: 'Figma',
    vendor: 'Figma Inc.',
    plan: 'Organization',
    expiryDate: new Date(Date.now() + 7 * 86400000),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 10,
    departments: ['Design', 'Product'],
    teams: ['Design'],
    owner: { name: 'Carol White', email: 'carol@company.com' },
    renewalReminderDays: [30, 7, 1],
  },
  {
    toolName: 'GitHub',
    vendor: 'Microsoft',
    plan: 'Enterprise',
    expiryDate: new Date(Date.now() + 90 * 86400000),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 100,
    departments: ['Engineering'],
    teams: ['Frontend', 'Backend', 'DevOps'],
    owner: { name: 'Dan Lee', email: 'dan@company.com' },
    renewalReminderDays: [60, 30, 7],
  },
  {
    toolName: 'Zoom',
    vendor: 'Zoom Video Communications',
    plan: 'Business',
    expiryDate: new Date(Date.now() + 1 * 86400000),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 30,
    departments: ['HR', 'Sales', 'Engineering'],
    teams: ['All Teams'],
    owner: { name: 'Eve Martinez', email: 'eve@company.com' },
    renewalReminderDays: [30, 7, 1],
  },
  {
    toolName: 'Notion',
    vendor: 'Notion Labs',
    plan: 'Team',
    expiryDate: new Date(Date.now() + 60 * 86400000),
    paymentCycle: 'monthly',
    status: 'active',
    licenses: 20,
    departments: ['Product', 'HR'],
    teams: ['Product', 'Operations'],
    owner: { name: 'Frank Chen', email: 'frank@company.com' },
    renewalReminderDays: [30, 7],
  },
];

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    logger.error('[Seed] Seed script cannot run in production');
    process.exit(1);
  }

  await connectDB();
  await Subscription.deleteMany({});
  logger.info('[Seed] Cleared existing subscriptions');

  await Subscription.insertMany(seedData);
  logger.info(`[Seed] Inserted ${seedData.length} subscriptions`);
  process.exit(0);
}

seed().catch((err) => {
  logger.error('[Seed] Failed:', err);
  process.exit(1);
});
