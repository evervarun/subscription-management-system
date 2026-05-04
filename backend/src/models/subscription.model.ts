import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscriptionOwner {
  name: string;
  email: string;
  userId?: string;
}

export interface ISubscription extends Document {
  toolName: string;
  vendor: string;
  plan?: string;
  startDate?: Date;
  expiryDate: Date;
  paymentCycle?: 'monthly' | 'quarterly' | 'annual' | 'one-time';
  status: 'active' | 'expired' | 'cancelled' | 'pending';
  licenses?: number;
  departments: string[];
  teams: string[];
  owner: ISubscriptionOwner;
  renewalReminderDays: number[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema = new Schema<ISubscription>(
  {
    toolName: { type: String, required: true, trim: true },
    vendor: { type: String, required: true, trim: true },
    plan: { type: String, trim: true },
    startDate: { type: Date },
    expiryDate: { type: Date, required: true },
    paymentCycle: {
      type: String,
      enum: ['monthly', 'quarterly', 'annual', 'one-time'],
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'pending'],
      default: 'active',
    },
    licenses: { type: Number, min: 0 },
    departments: { type: [String], default: [] },
    teams: { type: [String], default: [] },
    owner: {
      name: { type: String, required: true },
      email: { type: String, required: true },
      userId: { type: String },
    },
    renewalReminderDays: { type: [Number], default: [30, 7, 1] },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SubscriptionSchema.index({ toolName: 1, vendor: 1 }, { unique: true });
SubscriptionSchema.index({ status: 1 });
SubscriptionSchema.index({ expiryDate: 1 });
SubscriptionSchema.index({ 'owner.email': 1 });
SubscriptionSchema.index({ departments: 1 });
SubscriptionSchema.index({ isDeleted: 1 });

export const Subscription = mongoose.model<ISubscription>('Subscription', SubscriptionSchema);
