import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from './db';
import { Organization } from '../models/org.model';
import { User } from '../models/user.model';
import { Subscription } from '../models/subscription.model';
import { Audit } from '../models/audit.model';

dotenv.config();

async function seed() {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    Subscription.deleteMany({}),
    Audit.deleteMany({}),
    User.deleteMany({}),
    Organization.deleteMany({}),
  ]);

  console.log('Creating organization...');
  const org = await Organization.create({
    name: 'NebulaWorks Technologies',
    planType: 'professional',
  });

  console.log('Creating demo users...');
  const passwordHash = await bcrypt.hash('password123', 10);
  await User.insertMany([
    { name: 'Admin User', email: 'admin@nebulaworks.com', passwordHash, role: 'admin', organizationId: org._id, status: 'active' },
    { name: 'Member User', email: 'member@nebulaworks.com', passwordHash, role: 'member', organizationId: org._id, status: 'active' },
  ]);

  console.log('Seeding subscriptions...');
  const today = new Date();
  const d = (days: number) => { const dt = new Date(today); dt.setDate(dt.getDate() + days); return dt; };

  const subscriptions = [
    { toolName: 'GitHub', vendor: 'GitHub Inc.', status: 'active', cost: 21, currency: 'USD', startDate: d(-365), expiryDate: d(60), paymentCycle: 'monthly', departments: ['Engineering'], owner: { name: 'Alice Chen', email: 'alice@nebulaworks.com' }, renewalReminderDays: 30 },
    { toolName: 'Slack', vendor: 'Salesforce', status: 'active', cost: 12.50, currency: 'USD', startDate: d(-180), expiryDate: d(14), paymentCycle: 'monthly', departments: ['Engineering', 'Product'], owner: { name: 'Bob Smith', email: 'bob@nebulaworks.com' }, renewalReminderDays: 30 },
    { toolName: 'Figma', vendor: 'Figma Inc.', status: 'active', cost: 45, currency: 'USD', startDate: d(-90), expiryDate: d(275), paymentCycle: 'annual', departments: ['Design'], owner: { name: 'Carol Zhang', email: 'carol@nebulaworks.com' }, renewalReminderDays: 60 },
    { toolName: 'AWS', vendor: 'Amazon', status: 'active', cost: 3200, currency: 'USD', startDate: d(-730), expiryDate: d(365), paymentCycle: 'monthly', departments: ['Engineering', 'DevOps'], owner: { name: 'Dave Patel', email: 'dave@nebulaworks.com' }, renewalReminderDays: 30 },
    { toolName: 'Jira', vendor: 'Atlassian', status: 'active', cost: 8.15, currency: 'USD', startDate: d(-200), expiryDate: d(7), paymentCycle: 'monthly', departments: ['Product', 'Engineering'], owner: { name: 'Eve Johnson', email: 'eve@nebulaworks.com' }, renewalReminderDays: 14 },
    { toolName: 'Notion', vendor: 'Notion Labs', status: 'trial', cost: 0, currency: 'USD', startDate: d(-15), expiryDate: d(15), paymentCycle: 'monthly', departments: ['All'], owner: { name: 'Frank Lee', email: 'frank@nebulaworks.com' }, renewalReminderDays: 7 },
    { toolName: 'Salesforce', vendor: 'Salesforce', status: 'paused', cost: 150, currency: 'USD', startDate: d(-365), expiryDate: d(180), paymentCycle: 'annual', departments: ['Sales'], owner: { name: 'Grace Kim', email: 'grace@nebulaworks.com' }, renewalReminderDays: 30 },
    { toolName: 'Datadog', vendor: 'Datadog Inc.', status: 'expired', cost: 234, currency: 'USD', startDate: d(-400), expiryDate: d(-30), paymentCycle: 'monthly', departments: ['DevOps'], owner: { name: 'Hank Brown', email: 'hank@nebulaworks.com' }, renewalReminderDays: 14 },
    { toolName: 'Zoom', vendor: 'Zoom Video Comms', status: 'cancelled', cost: 14.99, currency: 'USD', startDate: d(-500), expiryDate: d(-90), paymentCycle: 'monthly', departments: ['All'], owner: { name: 'Iris White', email: 'iris@nebulaworks.com' }, renewalReminderDays: 30 },
    { toolName: 'Linear', vendor: 'Linear Inc.', status: 'pending', cost: 8, currency: 'USD', startDate: d(5), expiryDate: d(370), paymentCycle: 'annual', departments: ['Engineering', 'Product'], owner: { name: 'Jack Martinez', email: 'jack@nebulaworks.com' }, renewalReminderDays: 30 },
    { toolName: 'Vercel', vendor: 'Vercel Inc.', status: 'active', cost: 20, currency: 'USD', startDate: d(-60), expiryDate: d(305), paymentCycle: 'monthly', departments: ['Engineering'], owner: { name: 'Karen Liu', email: 'karen@nebulaworks.com' }, renewalReminderDays: 14 },
    { toolName: 'Loom', vendor: 'Loom Inc.', status: 'active', cost: 12.50, currency: 'USD', startDate: d(-120), expiryDate: d(245), paymentCycle: 'monthly', departments: ['Product', 'Design'], owner: { name: 'Leo Wang', email: 'leo@nebulaworks.com' }, renewalReminderDays: 30 },
  ].map(s => ({ ...s, organizationId: org._id, isDeleted: false }));

  await Subscription.insertMany(subscriptions);
  console.log(`✓ Seeded ${subscriptions.length} subscriptions`);
  console.log('');
  console.log('Demo credentials:');
  console.log('  Admin:  admin@nebulaworks.com  / password123');
  console.log('  Member: member@nebulaworks.com / password123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
