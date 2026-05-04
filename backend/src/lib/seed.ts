import 'dotenv/config';
import { connectDB } from './db';
import { Subscription } from '../models/subscription.model';
import { AuditLog } from '../models/audit.model';
import { logger } from './logger';

const now = Date.now();
const days = (n: number) => new Date(now + n * 86400000);
const system = { name: 'System', email: 'system@nebulaworks.com' };

const seedData = [
  {
    toolName: 'Jira',
    vendor: 'Atlassian',
    plan: 'Standard',
    startDate: days(-365),
    expiryDate: days(25),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 80,
    departments: ['Engineering', 'QA', 'Product'],
    teams: ['Backend', 'Frontend', 'QA'],
    owner: { name: 'Ravi Shankar', email: 'ravi.shankar@nebulaworks.com', userId: 'usr_001' },
    renewalReminderDays: [60, 30, 7, 1],
  },
  {
    toolName: 'Darwin Box',
    vendor: 'DarwinBox',
    plan: 'Enterprise',
    startDate: days(-180),
    expiryDate: days(180),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 200,
    departments: ['HR', 'Finance', 'Operations'],
    teams: ['All Teams'],
    owner: { name: 'Priya Mehta', email: 'priya.mehta@nebulaworks.com', userId: 'usr_002' },
    renewalReminderDays: [90, 30, 7],
  },
  {
    toolName: 'Slack',
    vendor: 'Salesforce',
    plan: 'Pro',
    startDate: days(-300),
    expiryDate: days(7),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 150,
    departments: ['Engineering', 'HR', 'Product', 'Sales'],
    teams: ['All Teams'],
    owner: { name: 'Arun Kumar', email: 'arun.kumar@nebulaworks.com', userId: 'usr_003' },
    renewalReminderDays: [30, 7, 1],
  },
  {
    toolName: 'GitHub',
    vendor: 'Microsoft',
    plan: 'Enterprise',
    startDate: days(-200),
    expiryDate: days(90),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 100,
    departments: ['Engineering', 'DevOps'],
    teams: ['Backend', 'Frontend', 'DevOps', 'SRE'],
    owner: { name: 'Deepak Nair', email: 'deepak.nair@nebulaworks.com', userId: 'usr_004' },
    renewalReminderDays: [60, 30, 7],
  },
  {
    toolName: 'Figma',
    vendor: 'Figma Inc.',
    plan: 'Organization',
    startDate: days(-120),
    expiryDate: days(240),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 20,
    departments: ['Design', 'Product'],
    teams: ['Design', 'Product'],
    owner: { name: 'Sneha Patil', email: 'sneha.patil@nebulaworks.com', userId: 'usr_005' },
    renewalReminderDays: [30, 7],
  },
  {
    toolName: 'Zoom',
    vendor: 'Zoom Video Communications',
    plan: 'Business Plus',
    startDate: days(-400),
    expiryDate: days(-10),
    paymentCycle: 'annual',
    status: 'expired',
    licenses: 50,
    departments: ['HR', 'Sales', 'Operations'],
    teams: ['Sales', 'HR'],
    owner: { name: 'Kavitha Rao', email: 'kavitha.rao@nebulaworks.com', userId: 'usr_006' },
    renewalReminderDays: [30, 7, 1],
  },
  {
    toolName: 'Notion',
    vendor: 'Notion Labs',
    plan: 'Team',
    startDate: days(-60),
    expiryDate: days(300),
    paymentCycle: 'monthly',
    status: 'trial',
    licenses: 30,
    departments: ['Product', 'HR', 'Operations'],
    teams: ['Product', 'Operations'],
    owner: { name: 'Suresh Iyer', email: 'suresh.iyer@nebulaworks.com', userId: 'usr_007' },
    renewalReminderDays: [30, 7],
  },
  {
    toolName: 'AWS',
    vendor: 'Amazon Web Services',
    plan: 'Business Support',
    startDate: days(-500),
    expiryDate: days(60),
    paymentCycle: 'monthly',
    status: 'active',
    licenses: 10,
    departments: ['Engineering', 'DevOps'],
    teams: ['DevOps', 'SRE'],
    owner: { name: 'Deepak Nair', email: 'deepak.nair@nebulaworks.com', userId: 'usr_004' },
    renewalReminderDays: [30, 14, 7],
  },
  {
    toolName: 'Confluence',
    vendor: 'Atlassian',
    plan: 'Standard',
    startDate: days(-365),
    expiryDate: days(25),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 80,
    departments: ['Engineering', 'Product', 'HR'],
    teams: ['Backend', 'Frontend', 'Product'],
    owner: { name: 'Ravi Shankar', email: 'ravi.shankar@nebulaworks.com', userId: 'usr_001' },
    renewalReminderDays: [30, 7, 1],
  },
  {
    toolName: 'HubSpot CRM',
    vendor: 'HubSpot',
    plan: 'Professional',
    startDate: days(-90),
    expiryDate: days(-3),
    paymentCycle: 'monthly',
    status: 'expired',
    licenses: 15,
    departments: ['Sales', 'Marketing'],
    teams: ['Sales', 'Marketing'],
    owner: { name: 'Meena Srinivasan', email: 'meena.srinivasan@nebulaworks.com', userId: 'usr_008' },
    renewalReminderDays: [30, 7],
  },
  {
    toolName: 'Postman',
    vendor: 'Postman Inc.',
    plan: 'Team',
    startDate: days(-150),
    expiryDate: days(120),
    paymentCycle: 'annual',
    status: 'active',
    licenses: 25,
    departments: ['Engineering', 'QA'],
    teams: ['Backend', 'QA'],
    owner: { name: 'Arjun Reddy', email: 'arjun.reddy@nebulaworks.com', userId: 'usr_009' },
    renewalReminderDays: [30, 7],
  },
  {
    toolName: 'Datadog',
    vendor: 'Datadog Inc.',
    plan: 'Pro',
    startDate: days(-200),
    expiryDate: days(160),
    paymentCycle: 'annual',
    status: 'paused',
    licenses: 5,
    departments: ['DevOps', 'Engineering'],
    teams: ['SRE', 'DevOps'],
    owner: { name: 'Deepak Nair', email: 'deepak.nair@nebulaworks.com', userId: 'usr_004' },
    renewalReminderDays: [30, 14],
  },
];

async function seed() {
  await connectDB();

  // Clear existing data
  await Subscription.deleteMany({});
  await AuditLog.deleteMany({});
  logger.info('[Seed] Cleared existing subscriptions and audit logs');

  for (const data of seedData) {
    const sub = await Subscription.create(data);
    await AuditLog.create({
      subscriptionId: sub._id,
      action: 'created',
      changedBy: system,
      changes: { after: sub.toObject() },
    });
    logger.info(`[Seed] Created: ${data.toolName} (${data.vendor}) — ${data.status}`);
  }

  logger.info(`[Seed] Done — ${seedData.length} subscriptions seeded for NebulaWorks Technologies`);
  process.exit(0);
}

seed().catch((err) => {
  logger.error('[Seed] Failed:', err);
  process.exit(1);
});
